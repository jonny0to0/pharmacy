import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface DraftData<T> {
  data: T;
  version: string;
  timestamp: number;
}

interface UseFormDraftOptions {
  version?: string;
  autoRestore?: boolean;
  ttl?: number; // Time to live in milliseconds
  onRestore?: (data: any) => void;
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_VERSION = '1.0';

export function useFormDraft<T>(
  formId: string,
  initialData: T,
  options: UseFormDraftOptions = {}
) {
  const { user } = useAuth();
  const { 
    version = DEFAULT_VERSION, 
    autoRestore = false, 
    ttl = DEFAULT_TTL,
    onRestore 
  } = options;

  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<T | null>(null);
  
  // Storage key is scoped by user ID and form ID
  const storageKey = `draft_${user?.id || 'guest'}_${formId}`;

  // Check for existing draft on mount
  useEffect(() => {
    const rawDraft = localStorage.getItem(storageKey);
    if (rawDraft) {
      try {
        const parsed: DraftData<T> = JSON.parse(rawDraft);
        const isExpired = Date.now() - parsed.timestamp > ttl;
        const isVersionMismatch = parsed.version !== version;

        if (isExpired || isVersionMismatch) {
          localStorage.removeItem(storageKey);
          return;
        }

        setDraftData(parsed.data);
        setHasDraft(true);

        if (autoRestore) {
          restoreDraft(parsed.data);
        }
      } catch (e) {
        console.error('Failed to parse draft data', e);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey, autoRestore, ttl, version]);

  const saveDraft = useCallback((data: T) => {
    const draft: DraftData<T> = {
      data,
      version,
      timestamp: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [storageKey, version]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setDraftData(null);
  }, [storageKey]);

  const restoreDraft = useCallback((dataToRestore?: T) => {
    const data = dataToRestore || draftData;
    if (data) {
      if (onRestore) {
        onRestore(data);
      }
      if (autoRestore) {
        toast.success('Draft restored', {
          id: `restore-${formId}`,
          duration: 3000,
          icon: '🔄'
        });
      }
      setHasDraft(false); // Hide the prompt after restoration
    }
  }, [draftData, onRestore, autoRestore, formId]);

  return {
    hasDraft,
    draftData,
    saveDraft,
    clearDraft,
    restoreDraft
  };
}
