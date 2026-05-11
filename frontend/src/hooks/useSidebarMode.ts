import { useSidebar } from '../context/SidebarContext';
import type { SidebarMode } from '../context/SidebarContext';

export const useSidebarMode = () => {
  const { mode, setMode, setUserOverride } = useSidebar();

  const switchToMode = (newMode: SidebarMode) => {
    setMode(newMode);
    setUserOverride(true);
  };

  const switchToSettings = () => switchToMode('SETTINGS');
  const switchToMain = () => switchToMode('MAIN');

  return {
    mode,
    switchToSettings,
    switchToMain,
    setMode,
  };
};
