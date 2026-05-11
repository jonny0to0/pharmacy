import api from '../api/axios';

export interface UploadResult {
  url: string;
  key: string;
}

class UploadService {
  async uploadFile(file: File, type: string, onProgress?: (progress: number) => void): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(`/upload?type=${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return res.data;
  }
}

export default new UploadService();
