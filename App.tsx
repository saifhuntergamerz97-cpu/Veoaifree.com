
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoModel, AspectRatio, Resolution, GeneratedVideo, GenerationState, Asset } from './types';
import { Icons, PROGRESS_MESSAGES } from './constants';
import { GeminiVideoService } from './services/geminiService';
import AssetUploader from './components/AssetUploader';

// Removed the declare global section for Window.aistudio as it conflicts 
// with the existing global definition in the environment.

const App: React.FC = () => {
  const [activeModel, setActiveModel] = useState<VideoModel>(VideoModel.SORA_2);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);
  
  const [startImage, setStartImage] = useState<Asset | null>(null);
  const [endImage, setEndImage] = useState<Asset | null>(null);
  const [referenceImages, setReferenceImages] = useState<Asset[]>([]);
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progressMessage: '',
  });
  
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  const checkApiKey = useCallback(async () => {
    try {
      // Assuming window.aistudio is already defined globally
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setIsApiKeySelected(selected);
    } catch (e) {
      console.error("Error checking API key status", e);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setIsApiKeySelected(true); // Assume success per instructions
  };

  const addReferenceImage = (asset: Asset) => {
    if (referenceImages.length < 3) {
      setReferenceImages(prev => [...prev, asset]);
    }
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => prev.filter(a => a.id !== id));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerationState({ isGenerating: true, progressMessage: PROGRESS_MESSAGES[0] });
    
    // Cycle progress messages
    const progressInterval = setInterval(() => {
      setGenerationState(prev => ({
        ...prev,
        progressMessage: PROGRESS_MESSAGES[Math.floor(Math.random() * PROGRESS_MESSAGES.length)]
      }));
    }, 12000);

    try {
      const videoUrl = await GeminiVideoService.generateVideo({
        model: activeModel,
        prompt,
        aspectRatio,
        resolution,
        startImage: startImage || undefined,
        endImage: endImage || undefined,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        onProgress: (msg) => setGenerationState(prev => ({ ...prev, progressMessage: msg }))
      });

      const newVideo: GeneratedVideo = {
        id: Math.random().toString(36).substr(2, 9),
        url: videoUrl,
        prompt,
        model: activeModel,
        timestamp: Date.now(),
        aspectRatio,
        resolution
      };

      setHistory(prev => [newVideo, ...prev]);
      setSelectedVideo(newVideo);
      setGenerationState({ isGenerating: false, progressMessage: '' });
      setPrompt('');
      setStartImage(null);
      setEndImage(null);
      setReferenceImages([]);
    } catch (error: any) {
      if (error?.message === "API_KEY_EXPIRED") {
        setIsApiKeySelected(false);
        setGenerationState({ isGenerating: false, progressMessage: '', error: 'API Key session expired. Please re-select your key.' });
      } else {
        setGenerationState({ isGenerating: false, progressMessage: '', error: 'Generation failed. Please try again.' });
      }
    } finally {
      clearInterval(progressInterval);
    }
  };

  if (isApiKeySelected === false) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
            <Icons.Video />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-outfit font-bold tracking-tight">Astra AI Video Studio</h1>
            <p className="text-zinc-400">To unlock cinematic video generation with Sora 2 and Veo 3, please select a billing-enabled API key.</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleSelectKey}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started
              <Icons.ChevronRight />
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Learn about billing requirements
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Sidebar - Settings & Assets */}
      <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50 backdrop-blur-xl shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Icons.Sparkles />
            <span className="text-xs font-bold uppercase tracking-widest">Premium Access</span>
          </div>
          <h1 className="text-2xl font-outfit font-bold tracking-tight">Astra Studio</h1>
        </div>

        <div className="p-6 space-y-8">
          {/* Model Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Engine</label>
            <div className="grid grid-cols-1 gap-2">
              {[VideoModel.SORA_2, VideoModel.VEO_3].map(m => (
                <button
                  key={m}
                  onClick={() => setActiveModel(m)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border
                    ${activeModel === m 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.15)]' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'}
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              {activeModel === VideoModel.SORA_2 
                ? "Sora 2 optimized for 4K hyper-realism and cinematic lighting." 
                : "Veo 3 optimized for dynamic camera work and fluid character motion."}
            </p>
          </div>

          {/* Config */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Composition</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase">Ratio</span>
                <div className="flex bg-zinc-900 rounded-lg p-1">
                  {(['16:9', '9:16'] as AspectRatio[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all
                        ${aspectRatio === r ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}
                      `}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase">Res</span>
                <div className="flex bg-zinc-900 rounded-lg p-1">
                  {(['720p', '1080p'] as Resolution[]).map(res => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all
                        ${resolution === res ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}
                      `}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Asset Uploaders */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Scene Reference</label>
               <span className="text-[10px] text-zinc-600">Optional</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AssetUploader 
                label="Start Frame" 
                type="start" 
                asset={startImage} 
                onUpload={setStartImage} 
                onClear={() => setStartImage(null)} 
              />
              <AssetUploader 
                label="End Frame" 
                type="end" 
                asset={endImage} 
                onUpload={setEndImage} 
                onClear={() => setEndImage(null)} 
              />
            </div>
            
            {activeModel === VideoModel.SORA_2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Consistency Assets ({referenceImages.length}/3)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {referenceImages.map((asset) => (
                    <div key={asset.id} className="relative aspect-square rounded-lg overflow-hidden group border border-zinc-800">
                      <img src={asset.data} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeReferenceImage(asset.id)}
                        className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {referenceImages.length < 3 && (
                    <label className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800 border-dashed flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onload = () => addReferenceImage({ id: Math.random().toString(), data: r.result as string, mimeType: file.type, type: 'reference' });
                            r.readAsDataURL(file);
                          }
                        }}
                      />
                      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-zinc-800">
          <button 
            onClick={() => setIsApiKeySelected(false)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
            API Settings
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          {selectedVideo ? (
            <div className="w-full max-w-5xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className="relative group bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
                  <video 
                    src={selectedVideo.url} 
                    controls 
                    autoPlay 
                    loop 
                    className={`w-full ${selectedVideo.aspectRatio === '9:16' ? 'max-h-[70vh] aspect-[9/16]' : 'aspect-video'}`}
                  />
                  <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm font-medium text-zinc-200 line-clamp-2 italic">"{selectedVideo.prompt}"</p>
                    <div className="mt-2 flex gap-3">
                       <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30">{selectedVideo.model}</span>
                       <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">{selectedVideo.resolution}</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedVideo(null)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    New Masterpiece
                  </button>
                  <a 
                    href={selectedVideo.url} 
                    download={`astra-video-${selectedVideo.id}.mp4`}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    Download 4K
                    <Icons.Upload />
                  </a>
               </div>
            </div>
          ) : generationState.isGenerating ? (
            <div className="flex flex-col items-center text-center max-w-lg space-y-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-indigo-600/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative w-full h-full border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                  <Icons.Sparkles />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-outfit font-bold">Crafting cinematic footage...</h2>
                <p className="text-zinc-500 h-10 transition-all duration-1000">
                  {generationState.progressMessage}
                </p>
              </div>
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 animate-[loading_120s_ease-in-out_infinite]" style={{ width: '80%' }}></div>
              </div>
              <style>{`
                @keyframes loading {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(200%); }
                }
              `}</style>
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col items-center text-center gap-12">
               <div className="space-y-4">
                 <h2 className="text-4xl sm:text-5xl font-outfit font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                    Imagination to Cinema
                 </h2>
                 <p className="text-zinc-400 text-lg">Describe your vision. Let Sora and Veo handle the physics.</p>
               </div>

               <div className="w-full space-y-6">
                 <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Cinematic shot of a cybernetic tiger prowling through a neon-lit Tokyo street, heavy rain, reflections on puddles, slow motion tracking shot..."
                      className="w-full min-h-[160px] p-6 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none shadow-2xl"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button 
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || generationState.isGenerating}
                        className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Generate Video
                        <Icons.Sparkles />
                      </button>
                    </div>
                 </div>
                 
                 {generationState.error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 17c-.77 1.333.192 3 1.732 3z"/></svg>
                       {generationState.error}
                    </div>
                 )}

                 <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
                    <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">4K Output</span>
                    <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">Temporal Consistency</span>
                    <span className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">Advanced Motion</span>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Gallery / History Tray */}
        {history.length > 0 && (
          <div className="h-48 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-6 overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Icons.Play /> Recent Creations
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
              {history.map((video) => (
                <div 
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`relative flex-none aspect-video h-full rounded-xl overflow-hidden cursor-pointer group transition-all ring-offset-2 ring-offset-black
                    ${selectedVideo?.id === video.id ? 'ring-2 ring-indigo-500 scale-95' : 'hover:scale-105'}
                  `}
                >
                  <video src={video.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icons.Play />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
