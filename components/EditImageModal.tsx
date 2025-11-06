import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoryboardScene } from '../types';
import Loader from './Loader';

interface EditImageModalProps {
    scene: StoryboardScene | null;
    onClose: () => void;
    onSubmit: (editPrompt: string) => Promise<void>;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ scene, onClose, onSubmit }) => {
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scene) {
            setEditPrompt('');
            setError(null);
            setIsEditing(false);
        }
    }, [scene]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (scene) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [scene, handleKeyDown, handleClickOutside]);

    if (!scene) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editPrompt.trim() || isEditing) return;

        setIsEditing(true);
        setError(null);
        try {
            await onSubmit(editPrompt);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during editing.');
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <div ref={panelRef} className="bg-stone-800 border-2 border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
                <header className="flex items-center justify-between p-4 border-b border-stone-700">
                    <h2 id="edit-modal-title" className="font-display text-2xl text-amber-400">Edit Image</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label="Close edit modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="p-6 overflow-y-auto">
                    <div className="aspect-video bg-stone-900 rounded-lg overflow-hidden mb-6">
                        {scene.imageUrl && <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-contain" />}
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="edit-prompt" className="block text-stone-300 font-semibold mb-2">Describe your edit:</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                id="edit-prompt"
                                type="text"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="e.g., add a pterodactyl in the sky"
                                className="w-full px-4 py-3 bg-stone-900 border-2 border-stone-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-stone-200 placeholder-stone-500"
                                disabled={isEditing}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isEditing || !editPrompt.trim()}
                                className="w-full sm:w-auto flex justify-center items-center px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed transition-all"
                            >
                                {isEditing ? <Loader className="w-6 h-6" /> : 'Generate'}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-center">
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditImageModal;