import { apiClient } from './apiClient';
import { RequestItem, City, RequestTypeEntity, Ministry } from '../types';

export interface PublicFormDataResponse {
  ministries: Ministry[];
  cities: City[];
  requestTypes: RequestTypeEntity[];
}

export interface PublicSubmissionResult {
  requestId: string;
  requestNumber: string;
  trackingToken: string;
  trackingUrl: string;
  customerNumber: string;
  status: string;
  createdAt: string;
}

export const publicService = {
  // Get active dropdown data for public submission
  getFormData: async (): Promise<PublicFormDataResponse> => {
    return apiClient.get<PublicFormDataResponse>('/public/form-data', { skipAuth: true });
  },

  // Submit public citizen request
  submitRequest: async (formData: FormData): Promise<PublicSubmissionResult> => {
    return apiClient.post<PublicSubmissionResult>('/public/submit-request', formData, {
      skipAuth: true
    });
  },

  // Track request publicly by requestNumber or trackingToken
  trackRequest: async (tokenOrNumber: string): Promise<Partial<RequestItem> & { isCompleted?: boolean; stageDocuments?: any[] }> => {
    return apiClient.get<Partial<RequestItem> & { isCompleted?: boolean; stageDocuments?: any[] }>(
      `/public/track/${encodeURIComponent(tokenOrNumber)}`,
      { skipAuth: true }
    );
  },

  downloadAttachmentUrl: (attachmentId: string): string => {
    const isBrowser = typeof window !== 'undefined';
    const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl =
      (import.meta as any).env?.VITE_API_BASE_URL ||
      (import.meta as any).env?.VITE_API_URL ||
      (isLocalhost ? 'http://localhost:5000/api' : 'https://civicflow-backend-1u3o.onrender.com/api');
    return `${baseUrl}/public/attachments/${attachmentId}/download`;
  }
};