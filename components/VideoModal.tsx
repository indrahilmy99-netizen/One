import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenerateVideosOperation } from '@google/genai';
import { startVideoGeneration, getVideosOperationStatus } from '../services/geminiService';
import Loader from './Loader';

// By declaring `aistudio` as a global var, it correctly types `window.aistudio`
// while avoiding potential modifier conflicts with other global augmentations.
declare global {
    var aistudio: {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    };
}

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    storyPrompt: string;
    firstSceneImage: string | null;
}

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';
type AspectRatio = '16:9' | '9:16';

const LOADING_MESSAGES = [
    "Waking the ancient spirits...",
    "Carving your story into digital stone...",
    "This can take a few minutes, the dinosaurs are not fast.",
    "Rendering primeval pixels...",
    "Asking the mammoths for permission...",
    "Don't worry, it's working! Video generation is a lengthy process."
];

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, storyPrompt, firstSceneImage }) => {
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [operation, setOperation] = useState<GenerateVideosOperation | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const pollingIntervalRef = useRef<number | null>(null);
    const loadingMessageIntervalRef = useRef<number | null>(null);
    const [isCheckingKey, setIsCheckingKey] = useState(true);
    const [isKeySelected, setIsKeySelected] = useState(false);

    const resetState = useCallback(() => {
        setStatus('idle');
        setOperation(null);
        setVideoUrl(null);
        setError(null);
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (loadingMessageIntervalRef.current) clearInterval(loadingMessageIntervalRef.current);
        pollingIntervalRef.current = null;
        loadingMessageIntervalRef.current = null;
        setIsKeySelected(false);
        setIsCheckingKey(true);
        setAspectRatio('16:9');
    }, []);

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    useEffect(() => {
        if (isOpen) {
            setIsCheckingKey(true);
            window.aistudio.hasSelectedApiKey().then(hasKey => {
                setIsKeySelected(hasKey);
                setIsCheckingKey(false);
            });
        } else {
            resetState();
        }
    }, [isOpen, resetState]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
            setIsCheckingKey(false);
        } catch (e) {
            console.error("Could not open API key selection:", e);
            setError("There was an issue with API key selection.");
            setStatus('error');
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!storyPrompt) return;
        setError(null);
        setStatus('generating');

        loadingMessageIntervalRef.current = window.setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = LOADING_MESSAGES.indexOf(prev);
                const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                return LOADING_MESSAGES[nextIndex];
            });
        }, 4000);
        
        try {
            const op = await startVideoGeneration(storyPrompt, aspectRatio, firstSceneImage ?? undefined);
            setOperation(op);
        } catch (e) {
            if (loadingMessageIntervalRef.current) clearInterval(loadingMessageIntervalRef.current);
            // FIX: The caught error `e` is of type `unknown`. It must be converted to a string before being used.
            const errorMessage = e instanceof Error ? e.message : String(e || 'An unknown error occurred.');
            setError(errorMessage);
            setStatus('error');
            if (errorMessage.includes("API key not found")) {
                setIsKeySelected(false);
            }
        }
    }, [storyPrompt, firstSceneImage, aspectRatio]);

    useEffect(() => {
        if (status === 'generating' && operation && !operation.done) {
            pollingIntervalRef.current = window.setInterval(async () => {
                try {
                    const updatedOp = await getVideosOperationStatus({ operation });
                    setOperation(updatedOp);

                    if (updatedOp.done) {
                        if (loadingMessageIntervalRef.current) clearInterval(loadingMessageIntervalRef.current);
                        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

                        const video = updatedOp.response?.generatedVideos?.[0]?.video;
                        if (video?.uri) {
                            const apiKey = process.env.API_KEY;
                            if (!apiKey) throw new Error("API key not available to fetch video.");

                            const downloadUrl = `${video.uri}&key=${apiKey}`;
                            const videoResponse = await fetch(downloadUrl);
                            
                            if (!videoResponse.ok) {
                                throw new Error(`Failed to fetch video from generated URI. Status: ${videoResponse.status}`);
                            }
                            const videoBlob = await videoResponse.blob();
                            const objectUrl = URL.createObjectURL(videoBlob);
                            setVideoUrl(objectUrl);
                            setStatus('success');
                        } else {
                            const genError = updatedOp.error?.message || "Video generation finished, but no video URI was found.";
                            // FIX: The value passed to the Error constructor must be a string.
                            // Cast to string to prevent type errors if `genError` is not a string.
                            throw new Error(String(genError));
                        }
                    }
                } catch (e) {
                    if (loadingMessageIntervalRef.current) clearInterval(loadingMessageIntervalRef.current);
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    // FIX: The caught error `e` is of type `unknown`. It must be converted to a string before being used.
                    const errorMessage = e instanceof Error ? e.message : String(e || 'An unknown error occurred during polling.');
                    setError(errorMessage);
                    setStatus('error');
                    if (errorMessage.includes("API key not found")) {
                        setIsKeySelected(false);
                    }
                }
            }, 10000);
        }

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [status, operation]);
    
    const sanitizeFileName = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9_]+/g, '_').substring(0, 50);
    };

    const renderCheckingKey = () => (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <Loader />
            <p className="mt-4 text-stone-300">Verifying API Key...</p>
        </div>
    );
    
    const renderSelectKey = () => (
         <div className="p-6 text-center">
            <h3 className="font-display text-2xl text-amber-400 mb-4">API Key Required</h3>
            <p className="text-stone-400 mb-6">
                To generate videos with Veo, please select a Google AI API key with billing enabled for your project.
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline text-amber-500 hover:text-amber-400 block mt-2">
                    Learn more about billing
                </a>
            </p>
            <button
                onClick={handleSelectKey}
                className="w-full flex justify-center items-center gap-3 px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 transition-all"
            >
                Select API Key
            </button>
        </div>
    );

    const renderIdleContent = () => (
        <div className="p-6">
            <h3 className="font-display text-2xl text-amber-400 mb-4 text-center">Animate Your Story</h3>
            {firstSceneImage && (
                <div className="aspect-video bg-stone-900 rounded-lg overflow-hidden mb-4 border-2 border-stone-600">
                    <img src={firstSceneImage} alt="Starting frame for video" className="w-full h-full object-cover" />
                </div>
            )}
            <p className="text-stone-400 text-sm mb-6 text-center">
                This will use the first panel's image as a starting frame to generate a short video based on your original story prompt.
                <br />
                <span className="font-bold text-amber-500">Note: Video generation can take several minutes.</span>
            </p>

            <div className="mb-6">
                <label className="block text-center text-stone-300 font-semibold mb-3">Aspect Ratio</label>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setAspectRatio('16:9')}
                        className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all ${
                            aspectRatio === '16:9'
                                ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                                : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600 hover:border-stone-500'
                        }`}
                        aria-pressed={aspectRatio === '16:9'}
                    >
                        16:9 (Landscape)
                    </button>
                    <button
                        onClick={() => setAspectRatio('9:16')}
                        className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all ${
                            aspectRatio === '9:16'
                                ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                                : 'bg-stone-700 border-stone-600 text-stone-300 hover:bg-stone-600 hover:border-stone-500'
                        }`}
                        aria-pressed={aspectRatio === '9:16'}
                    >
                        9:16 (Portrait)
                    </button>
                </div>
            </div>
            
            <div className="flex justify-center items-center">
                <button
                    onClick={handleGenerate}
                    className="flex justify-center items-center gap-3 px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 transition-all transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    <span>Start Generation</span>
                </button>
            </div>
        </div>
    );

    const renderGeneratingContent = () => (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Loader className="w-16 h-16" />
            <p className="mt-6 text-xl text-stone-300 font-semibold animate-pulse">{loadingMessage}</p>
        </div>
    );

    const renderSuccessContent = () => (
        <div className="p-6">
            {videoUrl && (
                <div className={`bg-black rounded-lg overflow-hidden mb-4 ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-w-sm mx-auto'}`}>
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full" />
                </div>
            )}
             <div className="flex justify-center gap-4">
                <a 
                    href={videoUrl ?? '#'} 
                    download={`${sanitizeFileName(storyPrompt)}.mp4`}
                    className="flex justify-center items-center gap-3 px-6 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 transition-all transform hover:scale-105"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Video</span>
                </a>
                 <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-stone-700 font-bold font-display text-lg text-white rounded-lg hover:bg-stone-600 transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );

    const renderErrorContent = () => (
        <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="font-display text-2xl text-red-400 mb-4">Generation Failed</h3>
            <p className="text-stone-300 bg-red-900/30 p-3 rounded-lg mb-6 max-w-full overflow-x-auto text-left text-sm font-mono">{error}</p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleGenerate}
                    className="flex justify-center items-center gap-3 px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 transition-all"
                >
                    Retry
                </button>
                <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-stone-700 font-bold font-display text-lg text-white rounded-lg hover:bg-stone-600 transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );
    

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
            <div className="bg-stone-800 border-2 border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
                 <header className="flex items-center justify-between p-4 border-b border-stone-700">
                    <h2 id="video-modal-title" className="font-display text-2xl text-amber-400">
                        {status === 'success' ? 'Video Ready!' : 'Generate Video'}
                    </h2>
                    <button onClick={handleClose} className="text-stone-400 hover:text-white transition-colors" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                 <div className="overflow-y-auto">
                    {isCheckingKey ? renderCheckingKey() :
                     !isKeySelected ? renderSelectKey() :
                     status === 'idle' ? renderIdleContent() :
                     status === 'generating' ? renderGeneratingContent() :
                     status === 'success' ? renderSuccessContent() :
                     renderErrorContent()
                    }
                </div>
            </div>
        </div>
    );
};

export default VideoModal;