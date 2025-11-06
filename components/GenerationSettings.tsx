import React from 'react';
import { AspectRatio, ImageQuality, StoryDuration } from '../types';

interface GenerationSettingsProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  imageQuality: ImageQuality;
  setImageQuality: (quality: ImageQuality) => void;
  storyDuration: StoryDuration;
  setStoryDuration: (duration: StoryDuration) => void;
  disabled: boolean;
}

const SettingsButton: React.FC<{
  label: string;
  value: any;
  selectedValue: any;
  onClick: (value: any) => void;
  disabled: boolean;
}> = ({ label, value, selectedValue, onClick, disabled }) => (
  <button
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all duration-200 ${
      selectedValue === value
        ? 'bg-amber-600 border-amber-500 text-white shadow-md'
        : 'bg-stone-700/50 border-stone-600 text-stone-300 hover:bg-stone-600/70 hover:border-stone-500 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed'
    }`}
    aria-pressed={selectedValue === value}
  >
    {label}
  </button>
);

const GenerationSettings: React.FC<GenerationSettingsProps> = ({ 
  aspectRatio, 
  setAspectRatio, 
  imageQuality, 
  setImageQuality, 
  storyDuration,
  setStoryDuration,
  disabled 
}) => {
  const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '16:9', label: '16:9 Landscape' },
    { value: '4:3', label: '4:3 Classic' },
    { value: '1:1', label: '1:1 Square' },
    { value: '9:16', label: '9:16 Portrait' },
  ];

  const imageQualities: { value: ImageQuality; label: string }[] = [
    { value: 'Standard', label: 'Standard' },
    { value: 'HD', label: 'HD' },
    { value: 'UHD', label: 'UHD (2K)' },
    { value: '4K', label: '4K (Photo)' },
  ];
  
  const storyDurations: { value: StoryDuration; label: string }[] = [
    { value: 'Short', label: 'Short (~30s)' },
    { value: 'Medium', label: 'Medium (~1 min)' },
    { value: 'Long', label: 'Epic (10+ min)' },
  ];

  return (
    <div className="max-w-4xl mx-auto my-6 p-4 bg-stone-800/50 backdrop-blur-sm rounded-xl border border-stone-700 flex flex-col gap-6 justify-between">
      {/* Top Row: Aspect Ratio & Quality */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center w-full">
        <div className="flex flex-col items-center md:items-start gap-2 w-full">
          <h3 className="font-display text-lg text-amber-400 self-center md:self-start">Aspect Ratio</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {aspectRatios.map(ratio => (
              <SettingsButton
                key={ratio.value}
                label={ratio.label}
                value={ratio.value}
                selectedValue={aspectRatio}
                onClick={setAspectRatio}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-px h-px md:h-16 bg-stone-700"></div>

        <div className="flex flex-col items-center md:items-start gap-2 w-full">
          <h3 className="font-display text-lg text-amber-400 self-center md:self-start">Image Quality</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {imageQualities.map(quality => (
              <SettingsButton
                key={quality.value}
                label={quality.label}
                value={quality.value}
                selectedValue={imageQuality}
                onClick={setImageQuality}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-stone-700"></div>

      {/* Bottom Row: Story Length */}
      <div className="flex flex-col items-center gap-2 w-full">
        <h3 className="font-display text-lg text-amber-400">Story Length / Scene Count</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {storyDurations.map(duration => (
            <SettingsButton
              key={duration.value}
              label={duration.label}
              value={duration.value}
              selectedValue={storyDuration}
              onClick={setStoryDuration}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
// FIX: Added missing default export.
export default GenerationSettings;