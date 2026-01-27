import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Code2, 
  Eye, 
  Layers, 
  Server, 
  Monitor, 
  Cpu, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  ChevronRight, 
  Copy, 
  Check, 
  Loader2,
  Sparkles,
  Database,
  Globe
} from 'lucide-react';

// --- Configuration & Constants ---
const apiKey = import.meta.env.VITE_API_KEY;// Provided by environment
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const MODES = [
  { id: 'frontend', label: 'Frontend', icon: Monitor },
  { id: 'backend', label: 'Backend', icon: Server },
  { id: 'fullstack', label: 'Fullstack', icon: Layers },
];

const TECH_SKILLS = [
  { id: 'react', label: 'React', category: 'frontend' },
  { id: 'html', label: 'HTML/CSS', category: 'frontend' },
  { id: 'js', label: 'JavaScript', category: 'frontend' },
  { id: 'sass', label: 'Sass', category: 'frontend' },
  { id: 'next', label: 'Next.js', category: 'fullstack' },
  { id: 'node', label: 'Node.js', category: 'backend' },
  { id: 'express', label: 'Express', category: 'backend' },
  { id: 'nest', label: 'Nest.js', category: 'backend' },
  { id: 'mongodb', label: 'MongoDB', category: 'database' },
  { id: 'postgresql', label: 'PostgreSQL', category: 'database' },
];

export default function App() {
  // --- State ---
  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState('frontend');
  const [selectedTech, setSelectedTech] = useState(['react']);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeView, setActiveView] = useState('code'); // 'code' or 'preview'
  const [copyStatus, setCopyStatus] = useState(false);
  const [error, setError] = useState(null);

  // --- Refs ---
  const fileInputRef = useRef(null);

  // --- Helpers ---
  const toggleTech = (id) => {
    setSelectedTech(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setImage(base64String);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = generatedCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // --- AI Logic ---
  const generateCode = async () => {
    if (!prompt && !image) {
      setError("Please provide a prompt or an image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setActiveView('code');

    const systemPrompt = `You are codeFriendlyAI, an expert full-stack developer. 
    Task: Generate high-quality, professional and no error and runnable code based on the user's requirements.
    Mode: ${selectedMode.toUpperCase()}
    Technologies: ${selectedTech.join(', ')}
    
    Guidelines:
    1. If image is provided, recreate the visual layout, colors, and components exactly as seen.
    2. Provide code in a clean, modular structure.
    3. Include brief comments explaining key logic.
    4. For Frontend: Use Tailwind CSS for styling where possible.
    5. For Backend: Focus on API endpoints, schemas, and best practices.
    6. For Fullstack: Provide both Client and Server architecture.
    7. Output ONLY the code within appropriate markdown blocks. No conversational filler before or after.`;

    const payload = {
      contents: [{
        parts: [
          { text: `Prompt: ${prompt}` },
          ...(image ? [{ inlineData: { mimeType: "image/png", data: image } }] : [])
        ]
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    let attempts = 0;
    const maxAttempts = 5;
    const delays = [1000, 2000, 4000, 8000, 16000];

    const callApi = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          setGeneratedCode(text);
          setIsGenerating(false);
        } else {
          throw new Error("No code generated.");
        }
      } catch (err) {
        if (attempts < maxAttempts) {
          setTimeout(callApi, delays[attempts]);
          attempts++;
        } else {
          setError("Failed to generate code after multiple attempts. Please try again.");
          setIsGenerating(false);
        }
      }
    };

    callApi();
  };

  // --- Rendering Helpers ---
  const extractCodeForPreview = (markdown) => {
    const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/g;
    const matches = [...markdown.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
      // Prioritize the first block or look for specific frontend blocks
      return matches[0][1];
    }
    return markdown;
  };

  const previewContent = extractCodeForPreview(generatedCode);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">codeFriendly<span className="text-indigo-400">AI</span></h1>
          </div>
          <div className="flex gap-4">
            <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
              <Cpu className="w-3 h-3" />
              <span>Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Controls (Left) */}
        <div className="lg:col-span-4 space-y-6 overflow-y-auto">
          
          {/* Mode Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedMode === mode.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Tech Selection */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Tech Stack
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {TECH_SKILLS.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => toggleTech(tech.id)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-all border text-left ${
                    selectedTech.includes(tech.id)
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {tech.label}
                </button>
              ))}
            </div>
          </section>

          {/* Prompt & Image Input */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Describe your project</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a modern landing page for a coffee shop..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px] resize-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Screenshot Reference
              </label>
              
              {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                >
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                  <p className="text-xs text-slate-400 text-center">Upload website image</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 aspect-video group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={clearImage}
                      className="p-2 bg-red-500/80 rounded-lg text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>

            <button
              onClick={generateCode}
              disabled={isGenerating}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isGenerating 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Build {selectedMode === 'fullstack' ? 'Full Stack' : selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}
                </>
              )}
            </button>
            {error && <p className="text-xs text-red-400 text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
          </section>
        </div>

        {/* Output Area (Right) */}
        <div className="lg:col-span-8 flex flex-col min-h-[500px] h-[calc(100vh-160px)]">
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            
            {/* View Tabs */}
            <div className="flex items-center justify-between px-4 py-1 border-b border-slate-800 bg-slate-900/80">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveView('code')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-all ${
                    activeView === 'code' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Code2 className="w-4 h-4" /> Code
                </button>
                <button
                  onClick={() => setActiveView('preview')}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-all ${
                    activeView === 'preview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
              </div>
              
              {generatedCode && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  {copyStatus ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copyStatus ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            {/* Display Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-950">
              {!generatedCode && !isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 p-8">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
                    <Globe className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="text-center max-w-sm">
                    <p className="font-medium text-slate-400 text-lg">Code Editor Ready</p>
                    <p className="text-sm mt-2 text-slate-500 leading-relaxed">
                      Enter your requirements on the left to generate clean, professional code snippets.
                    </p>
                  </div>
                </div>
              ) : activeView === 'code' ? (
                <div className="h-full overflow-auto p-4 font-mono text-sm">
                  {isGenerating ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                      <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                    </div>
                  ) : (
                    <pre className="text-slate-300 whitespace-pre-wrap selection:bg-indigo-500/30">
                      {generatedCode}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="h-full w-full bg-slate-100 flex flex-col">
                  {/* Browser Mockup */}
                  <div className="h-10 bg-slate-200 border-b border-slate-300 flex items-center px-4 gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                    </div>
                    <div className="flex-1 max-w-lg h-6 bg-white rounded-md border border-slate-300 flex items-center px-3 text-[10px] text-slate-400">
                      localhost:3000
                    </div>
                  </div>
                  <div className="flex-1 bg-white overflow-auto">
                    {selectedMode === 'backend' ? (
                      <div className="p-12 flex flex-col items-center justify-center h-full text-slate-800 text-center">
                        <Database className="w-16 h-16 mb-6 text-indigo-600" />
                        <h3 className="text-xl font-bold">Backend Logic Generated</h3>
                        <p className="text-slate-500 max-w-md mt-3">
                          The server-side implementation including API routes, database schemas, and middleware is available in the Code tab.
                        </p>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Endpoint</p>
                            <p className="text-xs font-mono mt-1 text-indigo-600">GET /api/data</p>
                          </div>
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                            <p className="text-xs font-mono mt-1 text-green-600">Simulator Active</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <iframe 
                        title="Web Preview"
                        className="w-full h-full border-none"
                        srcDoc={`
                          <html>
                            <head>
                              <script src="https://cdn.tailwindcss.com"></script>
                              <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                                .preview-container { padding: 40px; }
                              </style>
                            </head>
                            <body>
                              ${generatedCode ? `
                                <div class="preview-container">
                                  <div class="animate-pulse space-y-4">
                                    <div class="h-10 bg-slate-200 rounded-lg w-1/4"></div>
                                    <div class="h-4 bg-slate-100 rounded-lg w-full"></div>
                                    <div class="h-4 bg-slate-100 rounded-lg w-5/6"></div>
                                    <div class="grid grid-cols-3 gap-4 mt-8">
                                      <div class="h-32 bg-slate-100 rounded-xl"></div>
                                      <div class="h-32 bg-slate-100 rounded-xl"></div>
                                      <div class="h-32 bg-slate-100 rounded-xl"></div>
                                    </div>
                                  </div>
                                  <div class="mt-12 text-center">
                                    <p class="text-slate-400 text-sm">Reviewing layout structure...</p>
                                    <p class="text-[10px] text-slate-300 mt-2">Check the Code tab for the full implementation.</p>
                                  </div>
                                </div>
                              ` : '<div class="h-full flex items-center justify-center text-slate-300 italic">Generate code to see layout preview</div>'}
                            </body>
                          </html>
                        `}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">© 2024 codeFriendlyAI. AI-Powered Developer Workspace.</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">made by</span>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20">
              jyoti dixit
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}