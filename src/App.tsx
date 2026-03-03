/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { Upload, Download, RotateCw, ZoomIn, Trash2, Camera, Image as ImageIcon, Settings2, Maximize2 } from 'lucide-react';
import useImage from 'use-image';

// --- Constants ---
const VIRTUAL_CANVAS_SIZE = 1080; // The internal resolution of the image

export default function App() {
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [imageProps, setImageProps] = useState({
    x: VIRTUAL_CANVAS_SIZE / 2,
    y: VIRTUAL_CANVAS_SIZE / 2,
    scale: 0.5,
    rotation: 0,
  });
  const [selected, setSelected] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const scale = containerWidth / VIRTUAL_CANVAS_SIZE;

  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          setUserImage(img);
          const initialScale = Math.min(VIRTUAL_CANVAS_SIZE / img.width, VIRTUAL_CANVAS_SIZE / img.height) * 0.8;
          setImageProps({
            x: VIRTUAL_CANVAS_SIZE / 2,
            y: VIRTUAL_CANVAS_SIZE / 2,
            scale: initialScale,
            rotation: 0,
          });
          setSelected(true);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => setFrameImage(img);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (stageRef.current) {
      setSelected(false);
      setTimeout(() => {
        // Export at full resolution (1080x1080) regardless of screen size
        const uri = stageRef.current.toDataURL({ pixelRatio: 1 / scale });
        const link = document.createElement('a');
        link.download = `photocard-${Date.now()}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 100);
    }
  };

  useEffect(() => {
    if (selected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selected, userImage]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-900 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <ImageIcon size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">PhotoCard BD</h1>
          </div>
          
          <label className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-all border border-emerald-100">
            <Settings2 size={14} />
            Upload Frame
            <input type="file" className="hidden" accept="image/png" onChange={handleFrameUpload} />
          </label>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Editor Section */}
        <div className="flex flex-col gap-6">
          
          {/* Canvas Container */}
          <div ref={containerRef} className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative mx-auto w-full max-w-[500px]">
            <div className="aspect-square w-full bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
              {!userImage && (
                <div className="text-center p-6 z-10">
                  <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Camera size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">আপনার ছবি দিন</h3>
                  <p className="text-slate-500 text-xs mb-6">ছবি আপলোড করে ফ্রেমের সাথে সেট করুন</p>
                  <label className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 mx-auto w-fit">
                    <Upload size={20} />
                    ছবি আপলোড করুন
                    <input type="file" className="hidden" accept="image/*" onChange={handleUserPhotoUpload} />
                  </label>
                </div>
              )}

              {/* The Responsive Canvas */}
              <div className={`${!userImage ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 w-full h-full`}>
                <Stage
                  width={containerWidth - 16} // Subtract padding
                  height={containerWidth - 16}
                  scaleX={scale}
                  scaleY={scale}
                  ref={stageRef}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) setSelected(false);
                  }}
                  onTouchStart={(e) => {
                    if (e.target === e.target.getStage()) setSelected(false);
                  }}
                >
                  <Layer>
                    {/* User Image */}
                    {userImage && (
                      <KonvaImage
                        image={userImage}
                        ref={imageRef}
                        x={imageProps.x}
                        y={imageProps.y}
                        scaleX={imageProps.scale}
                        scaleY={imageProps.scale}
                        rotation={imageProps.rotation}
                        draggable
                        onDragEnd={(e) => {
                          setImageProps({ ...imageProps, x: e.target.x(), y: e.target.y() });
                        }}
                        onTransformEnd={() => {
                          const node = imageRef.current;
                          setImageProps({
                            ...imageProps,
                            x: node.x(),
                            y: node.y(),
                            scale: node.scaleX(),
                            rotation: node.rotation(),
                          });
                        }}
                        onClick={() => setSelected(true)}
                        onTap={() => setSelected(true)}
                        offsetX={userImage.width / 2}
                        offsetY={userImage.height / 2}
                      />
                    )}

                    {/* Frame Image */}
                    {frameImage && (
                      <KonvaImage
                        image={frameImage}
                        width={VIRTUAL_CANVAS_SIZE}
                        height={VIRTUAL_CANVAS_SIZE}
                        listening={false}
                      />
                    )}

                    {/* Transformer */}
                    {selected && (
                      <Transformer
                        ref={transformerRef}
                        rotateEnabled={true}
                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                        anchorSize={20}
                        borderStroke="#10b981"
                        anchorStroke="#10b981"
                        anchorFill="#fff"
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>

          {/* Mobile-Friendly Controls */}
          {userImage && (
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Maximize2 size={18} className="text-emerald-600" />
                  ছবি অ্যাডজাস্ট করুন
                </h2>
                <button 
                  onClick={() => { setUserImage(null); setSelected(false); }}
                  className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                >
                  <Trash2 size={14} /> রিসেট
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zoom */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>জুম (Zoom)</span>
                    <span className="text-emerald-600">{Math.round(imageProps.scale * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="3" step="0.01"
                    value={imageProps.scale}
                    onChange={(e) => setImageProps({ ...imageProps, scale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ঘুরানো (Rotate)</span>
                    <span className="text-emerald-600">{Math.round(imageProps.rotation)}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="360"
                    value={imageProps.rotation}
                    onChange={(e) => setImageProps({ ...imageProps, rotation: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setImageProps({ ...imageProps, rotation: (imageProps.rotation + 90) % 360 })}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-200 active:bg-slate-100"
                >
                  <RotateCw size={18} /> ৯০° ঘুরান
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Download size={20} /> ডাউনলোড করুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-3 text-sm">কিভাবে করবেন?</h4>
          <ul className="text-xs text-slate-500 space-y-2 list-decimal list-inside">
            <li>প্রথমে <b>"Upload Frame"</b> বাটনে ক্লিক করে আপনার ফ্রেমটি দিন।</li>
            <li>এরপর <b>"ছবি আপলোড করুন"</b> বাটনে ক্লিক করে আপনার ছবি দিন।</li>
            <li>আঙুল দিয়ে টেনে বা স্লাইডার ব্যবহার করে ছবি সেট করুন।</li>
            <li>সবশেষে <b>"ডাউনলোড"</b> বাটনে ক্লিক করে সেভ করুন।</li>
          </ul>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 text-center py-6">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} PhotoCard BD Studio
        </p>
      </footer>
    </div>
  );
}
