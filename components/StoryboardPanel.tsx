import React from 'react';
import { StoryboardScene } from '../types';
import Loader from './Loader';

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);


interface StoryboardPanelProps {
  scene: StoryboardScene;
  panelNumber: number;
  onRetry: (index: number) => void;
  onEdit: (index: number) => void;
  aspectRatio: string;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ scene, panelNumber, onRetry, onEdit, aspectRatio }) => {
  const getAspectRatioStyle = (ratio: string): React.CSSProperties => {
    if (!ratio || !ratio.includes(':')) {
      return { aspectRatio: '16 / 9' }; // Default fallback
    }
    const [w, h] = ratio.split(':');
    return { aspectRatio: `${w} / ${h}` };
  };

  return (
    <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-stone-700 flex flex-col transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-2xl">
      <div 
        style={getAspectRatioStyle(aspectRatio)}
        className="bg-stone-900 flex items-center justify-center relative group"
      >
        {scene.isLoadingImage && (
            <div className="flex flex-col items-center gap-2 text-stone-400">
                <Loader />
                <p className="text-sm">Conjuring image...</p>
            </div>
        )}
        {scene.imageUrl && !scene.isLoadingImage && (
          <>
            <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button 
                    onClick={() => onEdit(panelNumber - 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-all transform hover:scale-105"
                    aria-label={`Edit image for ${scene.title}`}
                >
                    <EditIcon />
                    <span>Edit Image</span>
                </button>
            </div>
          </>
        )}
        {scene.imageError && !scene.isLoadingImage && !scene.imageUrl && (
            <div className="flex flex-col items-center gap-4 text-red-400">
                <ErrorIcon />
                <p className="text-sm font-semibold">Image Failed</p>
                <button 
                    onClick={() => onRetry(panelNumber - 1)}
                    className="px-4 py-1 bg-amber-700 text-white text-sm font-semibold rounded-md hover:bg-amber-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        )}
      </div>
      <div className="p-4 md:p-6 flex-grow flex flex-col">
        <h3 className="font-display text-xl md:text-2xl font-bold text-amber-400 mb-2">
          {panelNumber}. {scene.title}
        </h3>
        <p className="text-stone-300 text-sm md:text-base leading-relaxed flex-grow">
          {scene.description}
        </p>
      </div>
    </div>
  );
};

export default StoryboardPanel;
