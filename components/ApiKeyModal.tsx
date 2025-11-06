import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    currentKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
    const [apiKeyInput, setApiKeyInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setApiKeyInput('');
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        if (apiKeyInput.trim()) {
            onSave(apiKeyInput.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
            <div className="bg-stone-800 border-2 border-stone-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col m-4">
                <header className="flex items-center justify-between p-4 border-b border-stone-700">
                    <h2 id="api-key-modal-title" className="font-display text-2xl text-amber-400">API Key Settings</h2>
                    {currentKey && (
                        <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label="Close settings modal">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </header>

                <div className="p-6">
                    {!currentKey && (
                        <p className="text-stone-300 mb-4 text-center">Please enter your Gemini API key to begin.</p>
                    )}
                    {currentKey && (
                         <div className="mb-4 text-center">
                            <p className="text-stone-300">Current key is set:</p>
                            <p className="font-mono text-sm bg-stone-900 p-2 rounded-md text-green-400">{`****...${currentKey.slice(-4)}`}</p>
                         </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                        <label htmlFor="api-key-input" className="sr-only">Gemini API Key</label>
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder={currentKey ? "Enter new key to update" : "Enter your Gemini API Key"}
                            className="w-full px-4 py-3 bg-stone-900 border-2 border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-200 placeholder-stone-500"
                            autoFocus
                        />
                        <button
                            onClick={handleSave}
                            disabled={!apiKeyInput.trim()}
                            className="w-full flex justify-center items-center px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed transition-all"
                        >
                            Save Key
                        </button>
                    </div>
                     <p className="text-xs text-stone-500 mt-4 text-center">
                        Your key is stored in session storage and only used for this browser session.
                        You can get a key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-400">Google AI Studio</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
