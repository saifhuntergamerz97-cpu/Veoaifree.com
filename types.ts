
export enum VideoModel {
  SORA_2 = 'Sora 2 (Hyper-Realistic)',
  VEO_3 = 'Veo 3 (Smooth Motion)',
}

export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  model: VideoModel;
  timestamp: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  operationId?: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progressMessage: string;
  error?: string;
}

export interface Asset {
  id: string;
  data: string; // base64
  mimeType: string;
  type: 'start' | 'end' | 'reference';
}
