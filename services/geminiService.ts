import { GoogleGenAI, Type, GenerateVideosOperation, Modality } from "@google/genai";
import { StoryboardScene, AspectRatio, ImageQuality, StoryDuration } from '../types';

const getGenAIClient = (): GoogleGenAI => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getPanelCountInstruction = (duration: StoryDuration): string => {
    switch (duration) {
        case 'Short':
            return 'generate a concise storyboard with 6-8 key scenes, suitable for a ~30 second video.';
        case 'Medium':
            return 'generate a standard storyboard with 12-16 key scenes, suitable for a 1-2 minute video.';
        case 'Long':
            return 'generate an epic and detailed storyboard with 30-40 key scenes, outlining a 10-15 minute short film. Focus on major plot points, character moments, and cinematic shots.';
        default:
            return 'generate a storyboard with about 12 panels.';
    }
};


export const generateSceneDescriptions = async (prompt: string, aspectRatio: AspectRatio, duration: StoryDuration, theme: string): Promise<Omit<StoryboardScene, 'imageUrl' | 'isLoadingImage' | 'imageError'>[]> => {
    try {
        const ai = getGenAIClient();
        const panelInstruction = getPanelCountInstruction(duration);

        const sceneSchema = {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: 'A short, punchy title for the scene, like "The Discovery".'
                },
                description: {
                    type: Type.STRING,
                    description: `A detailed, vivid description of the scene. This will be used as a prompt to generate an image. Include details about camera shot, characters, environment, action, lighting and mood. Ensure it fits a ${theme} theme.`
                }
            },
            required: ['title', 'description']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Based on the following story idea, ${panelInstruction} For each panel, provide a title and a detailed description for an image generation prompt. Story idea: "${prompt}"`,
            config: {
                systemInstruction: `You are a film director creating a storyboard for an epic ${theme} adventure with a ${aspectRatio} aspect ratio. For each scene, provide a description that acts as a perfect image generation prompt. The description MUST include: 1. **Camera Shot**: (e.g., Extreme Wide Shot, Close-up, Over-the-shoulder shot). 2. **Scene Details**: Describe the environment, characters, and action. 3. **Lighting & Atmosphere**: (e.g., "dramatic morning light," "eerie torchlight," "dense, foggy atmosphere"). Ensure descriptions are vivid, cinematic, full of wonder, and specifically composed for the ${aspectRatio} frame.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: sceneSchema,
                },
            },
        });

        const jsonStr = response.text.trim();
        const scenes = JSON.parse(jsonStr);
        if (!Array.isArray(scenes) || scenes.length === 0) {
            throw new Error("API did not return a valid array of scenes.");
        }
        return scenes;

    } catch (error) {
        console.error("Error generating scene descriptions:", error);
        throw new Error("Failed to generate storyboard scenes. Please check your API key or try a different prompt.");
    }
};

const getQualityPromptModifier = (quality: ImageQuality): string => {
    switch (quality) {
        case 'HD':
            return 'HD, high quality,';
        case 'UHD':
            return 'UHD, 2K resolution, very high quality,';
        case '4K':
            return '4K resolution, ultra photorealistic, extremely detailed,';
        case 'Standard':
        default:
            return '';
    }
}

export const generateSceneImage = async (prompt: string, aspectRatio: AspectRatio, imageQuality: ImageQuality, theme: string): Promise<string> => {
    try {
        const ai = getGenAIClient();
        const qualityModifier = getQualityPromptModifier(imageQuality);
        const fullPrompt = `Film still from a ${theme} epic movie, ${qualityModifier} capturing a pivotal moment. ${prompt}. Cinematic lighting, professional color grading, shot on 70mm film. The image must have a cinematic ${aspectRatio} aspect ratio. --no text, watermark, or artifacts.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: fullPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const part = response?.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            const base64ImageBytes = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            if (!mimeType.startsWith('image/')) {
                 throw new Error(`Invalid MIME type received: ${mimeType}`);
            }
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
             throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating scene image:", error);
        throw new Error("Failed to generate image for a scene.");
    }
};


const dataUrlToGeminiPart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

export const editSceneImage = async (originalImageDataUrl: string, prompt: string): Promise<string> => {
    try {
        const ai = getGenAIClient();
        const imagePart = dataUrlToGeminiPart(originalImageDataUrl);
        const textPart = { text: `Edit the image based on this instruction: "${prompt}". Maintain the original cinematic, photorealistic style of a 70mm film still.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const part = response?.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            const base64ImageBytes = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            if (!mimeType.startsWith('image/')) {
                 throw new Error(`Invalid MIME type received: ${mimeType}`);
            }
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
             throw new Error("No edited image was generated.");
        }
    } catch (error) {
        console.error("Error editing scene image:", error);
        throw new Error("Failed to edit the image.");
    }
};

const dataUrlToVideoImage = (dataUrl: string) => {
    const [, data] = dataUrl.split(',');
    const mimeType = dataUrl.match(/:(.*?);/)?.[1] ?? 'image/png';
    return {
        imageBytes: data,
        mimeType,
    };
};

export const startVideoGeneration = async (prompt: string, aspectRatio: '16:9' | '9:16', startImageDataUrl?: string): Promise<GenerateVideosOperation> => {
    try {
        const ai = getGenAIClient();

        const videoRequest: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        };
        
        if (startImageDataUrl) {
            videoRequest.image = dataUrlToVideoImage(startImageDataUrl);
        }

        const operation = await ai.models.generateVideos(videoRequest);
        return operation;
    } catch (error) {
        console.error("Error starting video generation:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
            throw new Error("API key not found or invalid. Please select a valid API key and try again.");
        }
        throw new Error("Failed to start video generation.");
    }
};

// FIX: Replaced non-existent GetVideosOperationRequest with an inline type.
// Renamed parameter to `request` to avoid shadowing and incorrect object creation.
export const getVideosOperationStatus = async (request: { operation: GenerateVideosOperation }): Promise<GenerateVideosOperation> => {
    try {
        const ai = getGenAIClient();
        // FIX: Pass the request object directly.
        const updatedOperation = await ai.operations.getVideosOperation(request);
        return updatedOperation;
    } catch (error) {
        console.error("Error checking video operation status:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
            throw new Error("API key not found or invalid. Please select a valid API key and try again.");
        }
        throw new Error("Failed to check video generation status.");
    }
};


export const generateNarrative = async (prompt: string, scenes: Omit<StoryboardScene, 'imageUrl' | 'isLoadingImage' | 'imageError'>[], theme: string): Promise<string> => {
    try {
        const ai = getGenAIClient();
        
        const scenesText = scenes.map((scene, index) => 
            `Panel ${index + 1}: ${scene.title}\nDescription: ${scene.description}`
        ).join('\n\n');

        const fullPrompt = `Based on the following story idea and the detailed storyboard scenes, write a cohesive and compelling short story that connects them all. The story should be written in a vivid narrative style, not just a list of descriptions. Make it feel like an ancient legend being told around a campfire.\n\nOriginal Story Idea: "${prompt}"\n\nStoryboard Scenes:\n${scenesText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: fullPrompt,
            config: {
                systemInstruction: `You are a master storyteller, a bard of ancient times. Your task is to weave the following scene descriptions into a single, flowing, and epic narrative. The story should be engaging, cinematic, and fit a ${theme} theme.`,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Error generating narrative:", error);
        throw new Error("Failed to generate the story narrative.");
    }
};