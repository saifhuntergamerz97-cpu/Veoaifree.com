
import { GoogleGenAI, VideoGenerationReferenceType } from "@google/genai";
import { VideoModel, AspectRatio, Resolution, Asset } from "../types";

export class GeminiVideoService {
  private static async getAI() {
    // Creating a fresh instance to ensure the latest API key is used
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateVideo(params: {
    model: VideoModel;
    prompt: string;
    aspectRatio: AspectRatio;
    resolution: Resolution;
    startImage?: Asset;
    endImage?: Asset;
    referenceImages?: Asset[];
    onProgress: (message: string) => void;
  }): Promise<string> {
    const ai = await this.getAI();
    
    // Map UI models to available SDK models
    // Sora 2 (Hyper-realism) -> veo-3.1-generate-preview
    // Veo 3 (Fast/Smooth) -> veo-3.1-fast-generate-preview
    const modelId = params.model === VideoModel.SORA_2 
      ? 'veo-3.1-generate-preview' 
      : 'veo-3.1-fast-generate-preview';

    const referenceImagesPayload = params.referenceImages?.map(img => ({
      image: {
        imageBytes: img.data.split(',')[1],
        mimeType: img.mimeType,
      },
      referenceType: VideoGenerationReferenceType.ASSET,
    }));

    try {
      params.onProgress("Initiating generation request...");
      
      let operation = await ai.models.generateVideos({
        model: modelId,
        prompt: params.prompt,
        image: params.startImage ? {
          imageBytes: params.startImage.data.split(',')[1],
          mimeType: params.startImage.mimeType,
        } : undefined,
        config: {
          numberOfVideos: 1,
          resolution: params.resolution,
          aspectRatio: params.aspectRatio,
          lastFrame: params.endImage ? {
            imageBytes: params.endImage.data.split(',')[1],
            mimeType: params.endImage.mimeType,
          } : undefined,
          referenceImages: referenceImagesPayload && referenceImagesPayload.length > 0 
            ? referenceImagesPayload 
            : undefined,
        }
      });

      params.onProgress("Model is dreaming up your video...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("No video URI returned from the model.");
      }

      params.onProgress("Finalizing download...");
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      if (error?.message?.includes("Requested entity was not found.")) {
        throw new Error("API_KEY_EXPIRED");
      }
      throw error;
    }
  }

  static async extendVideo(params: {
    previousOperationId: string,
    prompt: string,
    aspectRatio: AspectRatio,
    onProgress: (message: string) => void
  }): Promise<string> {
     // Implementation for extending video would require the original operation object.
     // For simplicity in this demo, we use the standard generate with context.
     throw new Error("Extension feature requires specific operation tracking.");
  }
}
