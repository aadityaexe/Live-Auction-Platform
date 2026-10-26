import { api } from './client';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    urls: string[];
    count: number;
  };
}

export const uploadApi = {
  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const res = await api.post<UploadResponse>('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data.urls;
  },

  uploadSingleImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post<{
      success: boolean;
      data: { url: string; publicId: string };
    }>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data.url;
  },
};
