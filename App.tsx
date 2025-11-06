import React, { useState, useCallback } from 'react';
import { generateSceneDescriptions, generateSceneImage, editSceneImage, generateNarrative } from './services/geminiService';
import { StoryboardScene, AspectRatio, ImageQuality, StoryDuration } from './types';
import StoryboardPanel from './components/StoryboardPanel';
import Header from './components/Header';
import Loader from './components/Loader';
import ExportControls from './ExportControls';
import MusicPlayer from './components/MusicPlayer';
import EditImageModal from './components/EditImageModal';
import VideoModal from './components/VideoModal';
import NarrativeDisplay from './components/NarrativeDisplay';
import GenerationSettings from './components/GenerationSettings';

const MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/08/23/audio_8c894922f3.mp3"; // Tribal music track

// Sound effect URLs - Replaced with stable, cross-browser compatible MP3 URLs
const SOUND_GENERATE_URL = "https://cdn.pixabay.com/download/audio/2022/03/10/audio_e52230a84d.mp3"; // Magic wand sound
const SOUND_RETRY_URL = "https://cdn.pixabay.com/download/audio/2022/02/07/audio_830335e326.mp3"; // Swoosh
const SOUND_EDIT_URL = "https://cdn.pixabay.com/download/audio/2022/03/07/audio_29117a394a.mp3"; // Writing/etching sound


/**
 * Utility function to play a sound effect.
 * Creates a new Audio object and plays it.
 * @param soundUrl The URL of the sound file to play.
 */
const playSound = (soundUrl: string) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.4; // Set a reasonable volume to not overpower music
    audio.play().catch(e => {
      // This catch is important for browsers that might block unexpected audio playback
      console.error("Sound effect playback failed:", e);
    });
  } catch (error) {
    console.error("Error playing sound effect:", error);
  }
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A lone hero discovers a lost city in the jungle.');
  const [theme, setTheme] = useState<string>('Fantasy Adventure');
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState<boolean>(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Settings state
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageQuality, setImageQuality] = useState<ImageQuality>('HD');
  const [storyDuration, setStoryDuration] = useState<StoryDuration>('Medium');


  const handleGenerateStoryboard = useCallback(async () => {
    if (!prompt.trim() || !theme.trim() || isLoading) return;

    playSound(SOUND_GENERATE_URL);
    setIsLoading(true);
    setError(null);
    setStoryboardScenes([]);
    setNarrative(null);

    try {
      const sceneDescriptions = await generateSceneDescriptions(prompt, aspectRatio, storyDuration, theme);
      
      const initialScenes: StoryboardScene[] = sceneDescriptions.map(desc => ({
        ...desc,
        imageUrl: null,
        isLoadingImage: true,
        imageError: false,
      }));
      setStoryboardScenes(initialScenes);

      // Generate narrative after scenes are defined, but before images start
      setIsGeneratingNarrative(true);
      try {
        const newNarrative = await generateNarrative(prompt, sceneDescriptions, theme);
        setNarrative(newNarrative);
      } catch (narrativeError) {
        console.error("Narrative generation failed:", narrativeError);
        setNarrative("The ancient spirits were silent... we could not weave a narrative for this tale.");
      } finally {
        setIsGeneratingNarrative(false);
      }
      
      // Generate images sequentially to avoid rate limiting
      for (const [index, scene] of sceneDescriptions.entries()) {
        try {
          const imageUrl = await generateSceneImage(scene.description, aspectRatio, imageQuality, theme);
          setStoryboardScenes(prevScenes =>
            prevScenes.map((s, i) =>
              i === index ? { ...s, imageUrl, isLoadingImage: false, imageError: false } : s
            )
          );
        } catch (imgError) {
           console.error(`Error generating image for scene ${index + 1}:`, imgError);
           setStoryboardScenes(prevScenes =>
              prevScenes.map((s, i) =>
                i === index ? { ...s, isLoadingImage: false, imageUrl: null, imageError: true } : s
              )
           );
        }
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, theme, isLoading, aspectRatio, imageQuality, storyDuration]);

  const handleRetryImage = useCallback(async (index: number) => {
    playSound(SOUND_RETRY_URL); // Play sound on retry
    setStoryboardScenes(prev => prev.map((s, i) => 
        i === index ? { ...s, isLoadingImage: true, imageError: false, imageUrl: null } : s
    ));
    
    try {
        const scene = storyboardScenes[index];
        const imageUrl = await generateSceneImage(scene.description, aspectRatio, imageQuality, theme);
        setStoryboardScenes(prev => prev.map((s, i) => 
            i === index ? { ...s, imageUrl, isLoadingImage: false } : s
        ));
    } catch (imgError) {
        console.error(`Error retrying image for scene ${index + 1}:`, imgError);
        setStoryboardScenes(prev => prev.map((s, i) => 
            i === index ? { ...s, isLoadingImage: false, imageError: true } : s
        ));
    }
  }, [storyboardScenes, aspectRatio, imageQuality, theme]);

  const handleStartEdit = (index: number) => {
    setEditingSceneIndex(index);
  };

  const handleCloseEditModal = () => {
    setEditingSceneIndex(null);
  };

  const handleConfirmEdit = useCallback(async (editPrompt: string) => {
    if (editingSceneIndex === null) return;
    
    playSound(SOUND_EDIT_URL); // Play sound on confirm edit
    const originalScene = storyboardScenes[editingSceneIndex];
    if (!originalScene.imageUrl) {
        throw new Error("Cannot edit a scene with no image.");
    }
    
    setStoryboardScenes(prev => prev.map((s, i) => 
        i === editingSceneIndex ? { ...s, isLoadingImage: true } : s
    ));
    
    try {
        const newImageUrl = await editSceneImage(originalScene.imageUrl, editPrompt);
        setStoryboardScenes(prev => prev.map((s, i) => 
            i === editingSceneIndex ? { ...s, imageUrl: newImageUrl, isLoadingImage: false, imageError: false } : s
        ));
    } catch (e) {
        setStoryboardScenes(prev => prev.map((s, i) => 
            i === editingSceneIndex ? { ...s, isLoadingImage: false, imageUrl: originalScene.imageUrl } : s
        ));
        throw e;
    }
  }, [editingSceneIndex, storyboardScenes]);
  
  const handleOpenVideoModal = () => {
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
      setIsVideoModalOpen(false);
  };

  const allImagesGenerated = storyboardScenes.length > 0 && storyboardScenes.every(s => !s.isLoadingImage);
  const editingScene = editingSceneIndex !== null ? storyboardScenes[editingSceneIndex] : null;
  const firstSceneImage = storyboardScenes.find(s => s.imageUrl)?.imageUrl ?? null;

  return (
    <div className="min-h-screen bg-stone-900 text-white selection:bg-amber-500 selection:text-stone-900" style={{ backgroundImage: `radial-gradient(circle at top left, rgba(50, 40, 30, 0.4), transparent 40%), radial-gradient(circle at bottom right, rgba(30, 40, 50, 0.4), transparent 40%)`}}>
      <MusicPlayer musicUrl={MUSIC_URL} />
      <div className="container mx-auto px-4 py-8">
        <Header />

        <main>
          <div className="max-w-3xl mx-auto my-8">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-grow flex flex-col gap-4">
                 <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your story idea..."
                  aria-label="Story idea"
                  className="w-full px-4 py-3 bg-stone-800 border-2 border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-200 placeholder-stone-500"
                  disabled={isLoading}
                />
                 <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Enter theme (e.g., Sci-Fi, Western)"
                  aria-label="Story theme"
                  className="w-full px-4 py-3 bg-stone-800 border-2 border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-200 placeholder-stone-500"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleGenerateStoryboard}
                disabled={isLoading || !prompt.trim() || !theme.trim()}
                className="w-full md:w-auto flex justify-center items-center px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? <Loader className="w-6 h-6" /> : 'Generate'}
              </button>
            </div>
          </div>
          
          <GenerationSettings 
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            imageQuality={imageQuality}
            setImageQuality={setImageQuality}
            storyDuration={storyDuration}
            setStoryDuration={setStoryDuration}
            disabled={isLoading}
          />

          {error && (
            <div className="text-center my-4 p-4 bg-red-900/50 border border-red-700 rounded-lg max-w-2xl mx-auto">
              <p className="font-bold">An error occurred:</p>
              <p>{error}</p>
            </div>
          )}

          {(isGeneratingNarrative || narrative) && (
            <NarrativeDisplay narrative={narrative} isLoading={isGeneratingNarrative} />
          )}

          {allImagesGenerated && !isLoading && (
             <ExportControls 
                scenes={storyboardScenes.filter(s => s.imageUrl)} 
                storyPrompt={prompt} 
                onGenerateVideo={handleOpenVideoModal}
              />
          )}

          {storyboardScenes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {storyboardScenes.map((scene, index) => (
                <StoryboardPanel 
                    key={index} 
                    scene={scene} 
                    panelNumber={index + 1}
                    onRetry={handleRetryImage}
                    onEdit={handleStartEdit}
                    aspectRatio={aspectRatio}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      <EditImageModal 
          scene={editingScene}
          onClose={handleCloseEditModal}
          onSubmit={handleConfirmEdit}
      />
      <VideoModal
          isOpen={isVideoModalOpen}
          onClose={handleCloseVideoModal}
          storyPrompt={prompt}
          firstSceneImage={firstSceneImage}
      />
    </div>
  );
};

export default App;