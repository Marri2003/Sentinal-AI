import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Code2, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';

export default function MermaidDiagram({ 
  id, 
  title, 
  subtitle, 
  chart, 
  legend = [] 
}) {
  const [viewMode, setViewMode] = useState('diagram'); // 'diagram' | 'code'
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const containerRef = useRef(null);

  // Dynamic Mermaid loader from CDN with local initialization
  useEffect(() => {
    let isMounted = true;
    async function renderChart() {
      try {
        setRenderError(null);
        let mermaidInstance = window.mermaid;
        if (!mermaidInstance) {
          const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
          mermaidInstance = mod.default;
          mermaidInstance.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, sans-serif',
            themeVariables: {
              darkMode: true,
              background: '#0c1324',
              primaryColor: '#0e7490',
              primaryTextColor: '#f8fafc',
              primaryBorderColor: '#06b6d4',
              lineColor: '#38bdf8',
              secondaryColor: '#1e3a8a',
              tertiaryColor: '#1e293b',
              mainBkg: '#0d1527',
              nodeBorder: '#334155',
              clusterBkg: '#0a0f1d',
              clusterBorder: '#1e293b',
              titleColor: '#38bdf8',
              edgeLabelBackground: '#0b1120'
            }
          });
          window.mermaid = mermaidInstance;
        }

        const uniqueId = `mermaid_${id}_${Date.now()}`;
        const { svg } = await mermaidInstance.render(uniqueId, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid rendering issue (showing interactive code fallback):', err);
        if (isMounted) {
          setRenderError(err.message || 'Diagram rendering notice');
        }
      }
    }

    renderChart();
    return () => { isMounted = false; };
  }, [chart, id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className={`rounded-3xl bg-[#0c1324] border border-slate-800 overflow-hidden shadow-2xl transition-all ${
      fullscreen ? 'fixed inset-4 z-50 flex flex-col bg-[#070b14]/98 backdrop-blur-xl border-cyan-500/40 p-4' : 'relative'
    }`}>
      {/* Header Bar */}
      <div className="p-4 md:px-6 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs">
          {/* Toggle View Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'diagram' ? 'code' : 'diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              viewMode === 'diagram'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Switch between Rendered Diagram and Mermaid Source Code"
          >
            {viewMode === 'diagram' ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Flowchart</span>
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mermaid Source</span>
              </>
            )}
          </button>

          {viewMode === 'diagram' && (
            <>
              <div className="h-4 w-px bg-slate-800 mx-1" />
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition font-mono text-[10px]"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
            </>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition font-mono text-[11px]"
            title="Copy Mermaid.js Syntax"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={fullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div 
        ref={containerRef}
        className={`relative overflow-auto p-4 md:p-8 flex items-center justify-center min-h-[380px] ${
          fullscreen ? 'flex-1' : 'max-h-[700px]'
        }`}
        style={{ backgroundColor: '#070b14' }}
      >
        {viewMode === 'diagram' ? (
          svgContent ? (
            <div 
              className="w-full flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : renderError ? (
            <div className="text-center space-y-3 p-6 max-w-lg">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 inline-flex">
                <Info className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Interactive Diagram Source Available</h4>
              <p className="text-xs text-slate-400">
                Mermaid cloud engine is connecting. You can view the full syntax below or copy the source code.
              </p>
              <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-60">
                {chart}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
              <div className="h-6 w-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Rendering Mermaid diagram...</span>
            </div>
          )
        ) : (
          <div className="w-full h-full">
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-auto max-h-[500px] leading-relaxed">
              {chart}
            </pre>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      {legend.length > 0 && (
        <div className="p-3.5 px-6 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px]">
          <span className="font-semibold text-slate-400 font-mono">LEGEND:</span>
          {legend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
