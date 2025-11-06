export interface StoryboardScene {
  title: string;
  description: string;
  imageUrl: string | null;
  isLoadingImage: boolean;
  imageError: boolean;
}

export type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16';
export type ImageQuality = 'Standard' | 'HD' | 'UHD' | '4K';
export type StoryDuration = 'Short' | 'Medium' | 'Long';
