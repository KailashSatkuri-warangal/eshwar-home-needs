'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, RefreshCw, Smartphone } from 'lucide-react';

interface Interactive360ViewerProps {
  views: string[]; // Array of 24 frame URLs
  productName: string;
}

export default function Interactive360Viewer({ views, productName }: Interactive360ViewerProps) {
  const [activeFrame, setActiveFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFrames, setLoadedFrames] = useState<Record<number, boolean>>({ 0: true });
  const [preloading, setPreloading] = useState(false);
  
  const startX = useRef(0);
  const startFrame = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalFrames = views.length;

  // Preload other frames in background after mount to optimize bandwidth
  useEffect(() => {
    if (totalFrames <= 1) return;
    
    // Start preloading after a short delay
    const timer = setTimeout(() => {
      setPreloading(true);
      
      // Load remaining frames sequentially
      views.forEach((url, index) => {
        if (index === 0) return;
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setLoadedFrames(prev => ({ ...prev, [index]: true }));
        };
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [views, totalFrames]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    startFrame.current = activeFrame;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startX.current;
    
    // Sensitivity: Dragging 10px changes 1 frame
    const sensitivity = 8;
    const frameChange = Math.floor(deltaX / sensitivity);
    
    // Calculate new frame with wrapping (e.g. 23 wraps to 0, 0 wraps to 23)
    let newFrame = (startFrame.current - frameChange) % totalFrames;
    if (newFrame < 0) {
      newFrame += totalFrames;
    }
    
    setActiveFrame(newFrame);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // Reset to front (Frame 0)
  const resetViewer = () => {
    setActiveFrame(0);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* 360 Viewer Card */}
      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        className="relative w-full aspect-square max-w-[420px] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex items-center justify-center cursor-ew-resize select-none"
      >
        {/* Main Render Image */}
        {views && views.length > 0 ? (
          // Display active frame
          <img
            src={views[activeFrame]}
            alt={`${productName} 360 view frame ${activeFrame}`}
            className="w-full h-full object-contain p-6 transition-opacity duration-150"
            draggable={false}
          />
        ) : (
          <div className="text-center p-6 text-stone-400">
            <RotateCw className="w-10 h-10 animate-spin mx-auto mb-2 opacity-50" />
            <p className="text-sm">Generating 3D model angles...</p>
          </div>
        )}

        {/* Drag Hint Overlay */}
        <div className="absolute bottom-3 left-3 bg-stone-900/75 backdrop-blur-xs text-[10px] text-white px-2 py-1 rounded-full flex items-center gap-1.5 font-medium pointer-events-none">
          <Smartphone className="w-3 h-3" />
          <span>Swipe or Drag to Rotate</span>
        </div>

        {/* AI Estimation Disclaimer Badge */}
        <div className="absolute top-3 left-3 bg-amber-600/80 backdrop-blur-xs text-[9px] text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider pointer-events-none">
          AI Reconstructed 3D
        </div>

        {/* Action Controls */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {activeFrame !== 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetViewer();
              }}
              title="Reset to Front"
              className="p-2 bg-white/90 backdrop-blur-xs hover:bg-white text-stone-700 rounded-full border border-stone-200 shadow-xs hover:text-copper transition-all pointer-events-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Visual Rotation Track Indicator */}
      <div className="w-full max-w-[320px] mt-4 flex items-center gap-2">
        <span className="text-xs text-stone-400 font-medium">0°</span>
        <div className="flex-1 h-1 bg-stone-200 rounded-full relative">
          <div 
            className="h-1 bg-copper rounded-full transition-all duration-75"
            style={{ width: `${(activeFrame / (totalFrames - 1)) * 100}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-copper rounded-full shadow-xs transition-all duration-75"
            style={{ left: `calc(${(activeFrame / (totalFrames - 1)) * 100}% - 6px)` }}
          />
        </div>
        <span className="text-xs text-stone-400 font-medium">360°</span>
      </div>
      
      <p className="text-[10px] text-stone-400 text-center mt-2 max-w-[340px]">
        Note: The 360° view is reconstructed using AI from the primary photo to estimate depth and unseen textures. Actual physical details may vary slightly.
      </p>
    </div>
  );
}
