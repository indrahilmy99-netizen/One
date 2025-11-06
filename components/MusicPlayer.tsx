import React, { useState, useRef } from 'react';

const MutedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
);

const UnmutedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


interface MusicPlayerProps {
    musicUrl: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ musicUrl }) => {
    const [isMuted, setIsMuted] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [hasStarted, setHasStarted] = useState(false);

    const toggleMute = () => {
        if (!audioRef.current) return;
        
        const audio = audioRef.current;

        if (!hasStarted) {
            // First interaction from the user triggers playback
            audio.play().then(() => {
                setHasStarted(true);
                audio.muted = false;
                setIsMuted(false);
            }).catch(e => {
                // Log error but don't change state if play fails
                console.error("Audio playback failed on user interaction:", e);
            });
        } else {
            // Music is already playing, just toggle mute
            const newMutedState = !audio.muted;
            audio.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    return (
        <>
            {/* Removed autoPlay; playback is now initiated by the first user click */}
            <audio ref={audioRef} src={musicUrl} loop muted playsInline />
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={toggleMute}
                    className="p-2 bg-stone-800/50 backdrop-blur-sm text-white rounded-full hover:bg-stone-700/70 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 transition-all"
                    aria-label={isMuted ? "Unmute music" : "Mute music"}
                >
                    {isMuted ? <MutedIcon /> : <UnmutedIcon />}
                </button>
            </div>
        </>
    );
};

export default MusicPlayer;