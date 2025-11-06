import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="relative text-center p-4 md:p-6">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-amber-400 drop-shadow-lg">
                AI Storyboard Generator
            </h1>
            <p className="mt-2 text-stone-300 max-w-2xl mx-auto text-base md:text-lg">
                Bring your sagas to life. Enter a story idea and a theme, and watch as AI generates a complete, multi-panel storyboard with cinematic descriptions and epic imagery.
            </p>
        </header>
    );
};

export default Header;