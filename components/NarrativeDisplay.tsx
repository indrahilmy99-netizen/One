import React from 'react';
import Loader from './Loader';

interface NarrativeDisplayProps {
    narrative: string | null;
    isLoading: boolean;
}

const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ narrative, isLoading }) => {
    if (!isLoading && !narrative) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto my-8 md:my-12 p-6 md:p-8 bg-stone-800/50 backdrop-blur-sm rounded-2xl border border-stone-700 shadow-lg animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-amber-400 mb-6 text-center">
                The Saga Unfolds...
            </h2>
            {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-stone-300">
                    <Loader />
                    <p>Weaving the grand tale...</p>
                </div>
            ) : (
                <div className="text-stone-300 text-base md:text-lg leading-relaxed space-y-4 prose prose-invert max-w-none">
                    {narrative?.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            )}
             <style>{`
              @keyframes fade-in {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.5s ease-out forwards;
              }
              .prose p {
                  text-align: justify;
              }
            `}</style>
        </div>
    );
};

export default NarrativeDisplay;
