import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StoryboardScene } from './types';
import Loader from './components/Loader';

// TypeScript declarations for CDN libraries
declare const jspdf: any;
declare const html2canvas: any;
declare const JSZip: any;

interface ExportControlsProps {
  scenes: StoryboardScene[];
  storyPrompt: string;
  onGenerateVideo: () => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({ scenes, storyPrompt, onGenerateVideo }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sanitizeFileName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9_]+/g, '_').substring(0, 50);
  };

  const handleExportPdf = useCallback(async () => {
    if (!scenes || scenes.length === 0) return;
    setIsMenuOpen(false);
    setIsExporting(true);
    setExportMessage('Generating PDF...');

    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
      });

      const printableArea = document.createElement('div');
      printableArea.style.position = 'absolute';
      printableArea.style.left = '-9999px';
      printableArea.style.width = '800px'; 
      printableArea.style.color = '#1c1917';
      printableArea.style.backgroundColor = 'white';
      printableArea.style.padding = '40px';
      
      let content = `<div style="font-family: 'Roboto', sans-serif; font-size: 16px;">
        <h1 style="font-family: 'Unkempt', cursive; font-size: 32px; margin-bottom: 16px; color: #d97706;">Storyboard: Prehistoric</h1>
        <h2 style="font-size: 20px; font-style: italic; margin-bottom: 40px; color: #44403c;">Prompt: "${storyPrompt}"</h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 30px;">`;
      
      scenes.forEach((scene, index) => {
        if(scene.imageUrl) {
          content += `<div style="border: 1px solid #e7e5e4; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
              <h3 style="font-family: 'Unkempt', cursive; font-size: 22px; font-weight: bold; margin-bottom: 12px; color: #b45309;">${index + 1}. ${scene.title}</h3>
              <img src="${scene.imageUrl}" style="width: 100%; height: auto; margin-bottom: 12px; border-radius: 4px;" />
              <p style="font-size: 15px; line-height: 1.6;">${scene.description}</p>
          </div>`;
        }
      });

      content += `</div></div>`;
      printableArea.innerHTML = content;
      document.body.appendChild(printableArea);

      const canvas = await html2canvas(printableArea, { scale: 2 });
      document.body.removeChild(printableArea);

      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pdfPageHeight = doc.internal.pageSize.getHeight();

      doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdfPageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdfPageHeight;
      }

      doc.save(`${sanitizeFileName(storyPrompt)}.pdf`);

    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  }, [scenes, storyPrompt]);

  const handleExportZip = useCallback(async () => {
    if (!scenes || scenes.length === 0) return;
    setIsMenuOpen(false);
    setIsExporting(true);
    setExportMessage('Creating ZIP...');

    try {
      const zip = new JSZip();
      
      const imagePromises = scenes.map(async (scene, index) => {
        if (scene.imageUrl) {
          const response = await fetch(scene.imageUrl);
          const blob = await response.blob();
          const fileExtension = blob.type.split('/')[1] || 'png';
          const fileName = `${index + 1}_${sanitizeFileName(scene.title)}.${fileExtension}`;
          zip.file(fileName, blob);
        }
      });

      await Promise.all(imagePromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${sanitizeFileName(storyPrompt)}_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Failed to export ZIP:', error);
      alert('Failed to generate ZIP file. Please try again.');
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  }, [scenes, storyPrompt]);

  return (
    <div className="flex justify-center items-start my-8 gap-4 flex-wrap">
        <button
            onClick={onGenerateVideo}
            disabled={isExporting}
            className="flex justify-center items-center gap-3 px-8 py-3 bg-amber-600 font-bold font-display text-lg text-white rounded-lg hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
            aria-label="Generate animated video from storyboard"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            <span>Generate Video</span>
        </button>

        <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isExporting}
              className="flex justify-center items-center gap-3 px-6 py-3 bg-stone-700 font-bold font-display text-lg text-white rounded-lg hover:bg-stone-600 disabled:bg-stone-800 disabled:cursor-wait transition-all transform hover:scale-105 disabled:scale-100"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label="More export options"
            >
              {isExporting ? (
                <>
                  <Loader className="w-6 h-6" />
                  <span>{exportMessage}</span>
                </>
              ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Options</span>
                </>
              )}
            </button>
            {isMenuOpen && (
                <div 
                    className="absolute bottom-full mb-2 w-64 bg-stone-800 border border-stone-700 rounded-lg shadow-xl overflow-hidden z-10 animate-fade-in-up"
                    role="menu"
                >
                    <ul className="text-stone-200" role="none">
                        <li role="none">
                            <button onClick={handleExportPdf} className="w-full text-left px-4 py-3 hover:bg-stone-700 transition-colors duration-200 flex items-center gap-3" role="menuitem">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export as PDF
                            </button>
                        </li>
                        <li role="none">
                            <button onClick={handleExportZip} className="w-full text-left px-4 py-3 hover:bg-stone-700 transition-colors duration-200 flex items-center gap-3" role="menuitem">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                </svg>
                               Download Images (.zip)
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>

        <style>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.2s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default ExportControls;