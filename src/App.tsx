import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Wand2, Loader2, AlertCircle, Key, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { editImage } from './services/geminiService';

// Extend Window interface for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const LOADING_MESSAGES = [
  "Analyzing your image...",
  "Applying AI magic...",
  "Crafting the perfect edit...",
  "Almost there...",
  "Polishing the details..."
];

export default function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      setHasApiKey(true);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setEditedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!sourceImage || !prompt) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const result = await editImage(sourceImage, prompt);
      if (result) {
        setEditedImage(result);
      } else {
        setError("The AI didn't return an image. Try a different prompt.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key issue. Please re-select your API key.");
      } else {
        setError("Something went wrong while processing your image. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">API Key Required</h1>
          <p className="text-slate-600 mb-8">
            To use the advanced image editing model, you need to select a paid Gemini API key.
            <br />
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Learn about billing
            </a>
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            Select API Key
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wand2 className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VisionCraft</h1>
          </div>
          <button 
            onClick={() => {
              setSourceImage(null);
              setEditedImage(null);
              setPrompt('');
              setError(null);
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            title="Reset"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">1. Upload Photo</h2>
            <div 
              className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 flex flex-col items-center justify-center p-8 text-center
                ${sourceImage ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {sourceImage ? (
                <div className="space-y-2">
                  <ImageIcon className="w-8 h-8 text-blue-500 mx-auto" />
                  <p className="text-sm font-medium text-blue-600">Image Selected</p>
                  <p className="text-xs text-slate-400">Click to change</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Drop image here or click</p>
                  <p className="text-xs text-slate-400">Supports PNG, JPG</p>
                </div>
              )}
              <input 
                id="file-upload"
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={onFileChange}
              />
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">2. Describe Changes</h2>
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Change the person's clothes to a red suit, make them look happy, and set them in a futuristic city."
                className="w-full h-32 p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {['Change clothes', 'Change emotion', 'Add environment'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setPrompt(prev => prev + (prev ? ' ' : '') + tag)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium text-slate-600 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <button
            onClick={handleEdit}
            disabled={!sourceImage || !prompt || isProcessing}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
              ${!sourceImage || !prompt || isProcessing 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-95'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Apply AI Edits
              </>
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-semibold text-slate-500">Preview</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
              </div>
            </div>
            
            <div className="flex-1 relative p-8 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                      <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
                    </div>
                    <motion.p 
                      key={loadingMessageIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-medium text-slate-600"
                    >
                      {LOADING_MESSAGES[loadingMessageIndex]}
                    </motion.p>
                  </motion.div>
                ) : editedImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group max-w-full"
                  >
                    <img 
                      src={editedImage} 
                      alt="Edited" 
                      className="rounded-2xl shadow-2xl max-h-[600px] object-contain border border-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = editedImage;
                          link.download = 'edited-visioncraft.png';
                          link.click();
                        }}
                        className="px-4 py-2 bg-white/90 backdrop-blur rounded-xl text-sm font-bold shadow-lg hover:bg-white transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </motion.div>
                ) : sourceImage ? (
                  <motion.div 
                    key="source"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative max-w-full"
                  >
                    <img 
                      src={sourceImage} 
                      alt="Source" 
                      className="rounded-2xl shadow-xl max-h-[600px] object-contain border border-white opacity-60 grayscale-[0.5]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/50">
                        <p className="text-sm font-bold text-slate-700">Original Photo Loaded</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">No image to preview</p>
                      <p className="text-slate-400 text-sm">Upload a photo to start editing</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {editedImage && sourceImage && (
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                  <img src={sourceImage} className="w-full h-full object-cover" alt="Original thumb" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Original</p>
                  <p className="text-sm font-medium text-slate-600">Base photo</p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex-1 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-blue-200">
                  <img src={editedImage} className="w-full h-full object-cover" alt="Edited thumb" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-400 uppercase">AI Edited</p>
                  <p className="text-sm font-medium text-slate-600">VisionCraft result</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-slate-400 text-xs">
          Powered by Gemini 3.1 Flash Image Preview • Built with VisionCraft AI
        </p>
      </footer>
    </div>
  );
}
