'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FRAME_STYLES, ROLES, BRAND } from './lib/tokens';
import { renderPFPFrame, renderBuilderCard, PFP_SIZE, CARD_WIDTH, CARD_HEIGHT, generatePfpThumbnail } from './lib/canvas-renderer';
import { processUploadedImage, calculateCoverFit } from './lib/image-utils';
import { downloadCanvasAsPNG, shareCard, generateQRCode } from './lib/share';
import { generateBuilderClass, generateBuilderTitle, getIssuedDate } from './lib/generator';

export default function Home() {
  // Track frame overlay image loading
  const [frameLoaded, setFrameLoaded] = useState(false);
  // ===== State =====
  const [activeTab, setActiveTab] = useState('pfp'); // 'pfp' | 'card'
  const [selectedStyle, setSelectedStyle] = useState('goa-palms');
  const [cardPhoto, setCardPhoto] = useState(null);
  const [cardTransform, setCardTransform] = useState({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
  const [framePhoto, setFramePhoto] = useState(null);
  const [frameTransform, setFrameTransform] = useState({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });

  const uploadedPhoto = activeTab === 'card' ? cardPhoto : framePhoto;
  const photoTransform = activeTab === 'card' ? cardTransform : frameTransform;

  const setUploadedPhoto = (val) => {
    if (activeTab === 'card') setCardPhoto(val);
    else setFramePhoto(val);
  };

  const setPhotoTransform = (updater) => {
    if (activeTab === 'card') {
      setCardTransform(updater);
    } else {
      setFrameTransform(updater);
    }
  };
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // Card fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [handle, setHandle] = useState('');

  // Refs
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastPinchDist = useRef(0);

  const [customBuilderTitle, setCustomBuilderTitle] = useState('');

  // Server-assigned sequential Builder ID
  const [serverBuilderId, setServerBuilderId] = useState('');
  const [serverBuilderRawId, setServerBuilderRawId] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [idGenerated, setIdGenerated] = useState(false);

  // Auto-generate fields based on name and role
  const builderClass = name && role ? generateBuilderClass(name, role) : '';
  const builderTitle = customBuilderTitle || (name && role ? generateBuilderTitle(name, role) : '');
  const builderId = serverBuilderId; // Now from server
  const shortId = serverBuilderId;
  const issuedDate = getIssuedDate();

  // ===== Toast helper =====
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // Generate Builder ID via API
  const handleGenerateId = useCallback(async () => {
    if (!name || !role) return;
    setIsGeneratingId(true);
    try {
      const pfpBase64 = uploadedPhoto ? generatePfpThumbnail(uploadedPhoto, photoTransform) : null;

      const res = await fetch('/api/builder-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, role, team, handle,
          builderClass, builderTitle, issuedDate,
          pfp: pfpBase64
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerBuilderId(data.formattedId);
        setServerBuilderRawId(data.id);
        setIdGenerated(true);
        showToast(`Builder ID ${data.formattedId} assigned! 🎉`);
      } else {
        showToast(data.error || 'Failed to generate ID');
      }
    } catch (err) {
      showToast('Network error. Please try again.');
    } finally {
      setIsGeneratingId(false);
    }
  }, [name, role, team, handle, builderClass, builderTitle, issuedDate, showToast]);

  // ===== Preload frame overlay image =====
  useEffect(() => {
    const img1 = new Image();
    img1.crossOrigin = 'anonymous';
    img1.onload = () => setFrameLoaded(true);
    img1.src = '/frame-goa-palms.png';

    const img2 = new Image();
    img2.crossOrigin = 'anonymous';
    img2.src = '/card-template-new.png';
  }, []);

  // ===== Canvas rendering =====
  const renderCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (activeTab === 'pfp') {
      renderPFPFrame(ctx, canvas, uploadedPhoto, selectedStyle, photoTransform);
    } else {
      renderBuilderCard(canvas, uploadedPhoto, photoTransform, {
        name, role, team, handle,
        builderClass, builderTitle, builderId,
        issuedDate, qrDataUrl,
      });
    }
  }, [activeTab, uploadedPhoto, selectedStyle, photoTransform, name, role, team, handle, builderClass, builderTitle, builderId, issuedDate, qrDataUrl, frameLoaded]);

  // Re-render on any state change
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderCanvas]);

  // Generate QR code only after Builder ID is generated
  useEffect(() => {
    if (activeTab === 'card' && serverBuilderRawId) {
      const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/builder/${serverBuilderRawId}`;
      generateQRCode(shareUrl).then(setQrDataUrl);
    } else {
      setQrDataUrl('');
    }
  }, [activeTab, serverBuilderRawId]);

  // ===== File upload handler =====
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const img = await processUploadedImage(file);
      setUploadedPhoto(img);

      // Calculate initial cover fit (PFP photo fills full 1080x1080 canvas, card photo is 800x420)
      const slotW = activeTab === 'pfp' ? 1080 : 800;
      const slotH = activeTab === 'pfp' ? 1080 : 420;
      const fit = calculateCoverFit(img.width, img.height, slotW, slotH);
      setPhotoTransform(fit);
      showToast('Photo loaded! Drag to reposition.');
    } catch (err) {
      showToast(err.message || 'Failed to load photo');
    } finally {
      setIsProcessing(false);
    }
  }, [activeTab, showToast]);

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  // ===== Drag & drop =====
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ===== Photo reposition (mouse/touch) =====
  const getEventPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const onPointerDown = (e) => {
    if (!uploadedPhoto) return;
    if (e.touches && e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      return;
    }
    const pos = getEventPos(e);
    setIsDragging(true);
    setDragStart({ x: pos.x - photoTransform.offsetX, y: pos.y - photoTransform.offsetY });
  };

  const onPointerMove = (e) => {
    if (!uploadedPhoto) return;

    // Pinch zoom
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scaleDelta = dist / lastPinchDist.current;
        setPhotoTransform(prev => ({
          ...prev,
          scale: Math.max(0.1, Math.min(5, prev.scale * scaleDelta)),
        }));
      }
      lastPinchDist.current = dist;
      return;
    }

    if (!isDragging) return;
    e.preventDefault();
    const pos = getEventPos(e);

    // Scale movement by canvas-to-display ratio for accurate repositioning
    const canvas = previewCanvasRef.current;
    const scaleRatio = canvas ? (canvas.width / canvas.getBoundingClientRect().width) : 1;

    setPhotoTransform(prev => ({
      ...prev,
      offsetX: (pos.x - dragStart.x) * scaleRatio,
      offsetY: (pos.y - dragStart.y) * scaleRatio,
    }));
  };

  const onPointerUp = () => {
    setIsDragging(false);
    lastPinchDist.current = 0;
  };

  // Mouse wheel zoom
  const onWheel = (e) => {
    if (!uploadedPhoto) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setPhotoTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * delta)),
    }));
  };

  // ===== Download =====
  const handleDownload = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Render at full resolution for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    if (activeTab === 'pfp') {
      renderPFPFrame(exportCtx, exportCanvas, uploadedPhoto, selectedStyle, photoTransform);
    } else {
      renderBuilderCard(exportCanvas, uploadedPhoto, photoTransform, {
        name, role, team, handle,
        builderClass, builderTitle, builderId,
        issuedDate, qrDataUrl,
      });
    }

    downloadCanvasAsPNG(exportCanvas, activeTab === 'pfp' ? 'pfp-frame' : 'builder-id');
    showToast('Image downloaded! 🎉');
  }, [activeTab, uploadedPhoto, selectedStyle, photoTransform, name, role, team, handle, builderClass, builderTitle, builderId, issuedDate, qrDataUrl, showToast]);

  // ===== Share =====
  const handleShare = useCallback(async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Render export canvas
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    if (activeTab === 'pfp') {
      renderPFPFrame(exportCtx, exportCanvas, uploadedPhoto, selectedStyle, photoTransform);
    } else {
      renderBuilderCard(exportCanvas, uploadedPhoto, photoTransform, {
        name, role, team, handle,
        builderClass, builderTitle, builderId,
        issuedDate, qrDataUrl,
      });
    }

    await shareCard(exportCanvas, handle, activeTab);
    showToast('Shared! 🚀');
  }, [activeTab, uploadedPhoto, selectedStyle, photoTransform, name, role, team, handle, builderClass, builderTitle, builderId, issuedDate, qrDataUrl, showToast]);

  // ===== Preview canvas size for display =====
  const previewAspect = activeTab === 'pfp' ? 1 : CARD_HEIGHT / CARD_WIDTH;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-4 sm:py-6 text-center relative overflow-hidden">
        {/* Animated background accent */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--hhg-yellow) 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--hhg-pink) 0%, transparent 70%)' }} />
        </div>

        {/* Studio credit */}
        <p className="text-xs tracking-[4px] uppercase opacity-50 mb-2 relative z-10"
          style={{ fontFamily: '"Space Mono", monospace' }}>
          {BRAND.event.studio}
        </p>

        {/* Wordmark */}
        <div className="relative z-10 flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            HACKER
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-white text-lg sm:text-xl"
            style={{ background: 'var(--hhg-pink)', fontFamily: '"Noto Sans Devanagari", sans-serif', fontWeight: 700 }}>
            गोवा
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            HOUSE
          </h1>
        </div>

        {/* Event line */}
        <p className="text-xs sm:text-sm tracking-[3px] opacity-70 relative z-10"
          style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
          {BRAND.event.location}  ·  {BRAND.event.dates}
        </p>

        {/* History link */}
        <a href="/history" className="relative z-10 inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs tracking-[2px] uppercase transition-all hover:scale-105"
          style={{
            fontFamily: '"Space Mono", monospace',
            color: 'var(--hhg-cream)',
            background: 'rgba(246, 239, 224, 0.08)',
            border: '1px solid rgba(246, 239, 224, 0.15)',
          }}>
          📋 View Builder History
        </a>

        {/* Year */}
        <p className="text-6xl sm:text-7xl font-bold opacity-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ fontFamily: '"Anton", sans-serif' }}>
          {BRAND.event.year}
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex justify-center gap-3 px-4 mb-6">
        <button
          id="tab-pfp"
          className={`tab-button ${activeTab === 'pfp' ? 'active' : ''}`}
          onClick={() => setActiveTab('pfp')}
        >
          ⚡ PFP Frame
        </button>
        <button
          id="tab-card"
          className={`tab-button ${activeTab === 'card' ? 'active' : ''}`}
          onClick={() => setActiveTab('card')}
        >
          🪪 Builder ID Card
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-40 max-w-lg mx-auto w-full">
        {/* Builder ID Card Fields (Format B only) */}
        {activeTab === 'card' && (
          <div className="space-y-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="input-label" htmlFor="field-name">Name *</label>
              <input
                id="field-name"
                type="text"
                className="input-field"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </div>
            <div>
              <label className="input-label" htmlFor="field-role">Stack / Role *</label>
              <select
                id="field-role"
                className="select-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select your stack</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label" htmlFor="field-team">Team (optional)</label>
                <input
                  id="field-team"
                  type="text"
                  className="input-field"
                  placeholder="Team name"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="input-label" htmlFor="field-handle">X Handle (optional)</label>
                <input
                  id="field-handle"
                  type="text"
                  className="input-field"
                  placeholder="@username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="input-label" htmlFor="field-title">Builder Title (Custom)</label>
              <input
                id="field-title"
                type="text"
                className="input-field"
                placeholder={name && role ? generateBuilderTitle(name, role) : "e.g. TERMINAL-OBSESSED ALCHEMIST"}
                value={customBuilderTitle}
                onChange={(e) => setCustomBuilderTitle(e.target.value)}
                maxLength={45}
              />
            </div>

            {/* Auto-generated preview + Generate ID button */}
            {name && role && (
              <div className="card-glass p-4 animate-fade-in">
                <p className="text-xs tracking-[2px] uppercase opacity-40 mb-2"
                  style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                  Auto-Generated
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="pill-pink text-xs">{builderClass}</span>
                  <span className="text-xs px-3 py-1.5 rounded-full border"
                    style={{ borderColor: 'var(--hhg-yellow)', color: 'var(--hhg-yellow)', fontFamily: '"Space Mono", monospace' }}>
                    {builderTitle}
                  </span>
                  {serverBuilderId && (
                    <span className="text-xs px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(245, 208, 32, 0.15)', color: 'var(--hhg-yellow)', fontFamily: '"Space Mono", monospace' }}>
                      {serverBuilderId}
                    </span>
                  )}
                </div>
                {!idGenerated ? (
                  <button
                    className="btn-primary w-full"
                    onClick={handleGenerateId}
                    disabled={isGeneratingId}
                    id="btn-generate-id"
                  >
                    {isGeneratingId ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Generating...
                      </span>
                    ) : (
                      '🎫 Generate Builder ID'
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ color: '#10b981', fontFamily: '"Space Mono", monospace', fontSize: '13px' }}>
                      ✅ Builder ID {serverBuilderId} locked!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview Canvas */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <p className="text-xs tracking-[3px] uppercase mb-3 opacity-60"
            style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
            Preview {uploadedPhoto && '· Drag to reposition'}
          </p>
          <div
            className={`canvas-container w-full relative cursor-grab active:cursor-grabbing ${isDragOver ? 'drag-over' : ''}`}
            style={{ aspectRatio: activeTab === 'pfp' ? '1/1' : `${CARD_WIDTH}/${CARD_HEIGHT}` }}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            onWheel={onWheel}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full rounded-xl"
              style={{ display: 'block', touchAction: 'none' }}
            />
            {!uploadedPhoto && !isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <button
                  className="btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  id="upload-cta"
                >
                  📸 Upload Photo to Start
                </button>
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="skeleton w-3/4 h-3/4 rounded-xl" />
              </div>
            )}
          </div>

          {/* Photo controls (visible when photo loaded) */}
          {uploadedPhoto && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <label className="text-xs tracking-[2px] uppercase opacity-60 w-16 shrink-0"
                  style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                  Zoom
                </label>
                <input
                  type="range"
                  id="slider-zoom"
                  min="0.1"
                  max="5"
                  step="0.05"
                  value={photoTransform.scale}
                  onChange={(e) => setPhotoTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="slider-control flex-1"
                />
                <span className="text-xs opacity-40 w-12 text-right"
                  style={{ fontFamily: '"Space Mono", monospace' }}>
                  {Math.round(photoTransform.scale * 100)}%
                </span>
              </div>

              {/* Rotate slider */}
              <div className="flex items-center gap-3">
                <label className="text-xs tracking-[2px] uppercase opacity-60 w-16 shrink-0"
                  style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                  Rotate
                </label>
                <input
                  type="range"
                  id="slider-rotate"
                  min="-180"
                  max="180"
                  step="1"
                  value={photoTransform.rotation || 0}
                  onChange={(e) => setPhotoTransform(prev => ({ ...prev, rotation: parseFloat(e.target.value) }))}
                  className="slider-control flex-1"
                />
                <span className="text-xs opacity-40 w-12 text-right"
                  style={{ fontFamily: '"Space Mono", monospace' }}>
                  {photoTransform.rotation || 0}°
                </span>
              </div>

              {/* Buttons row */}
              <div className="flex items-center gap-2">
                <button
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(246, 239, 224, 0.2)', fontFamily: '"Space Mono", monospace' }}
                  onClick={() => setPhotoTransform({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 })}
                  id="reset-position"
                >
                  ↺ Reset All
                </button>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(246, 239, 224, 0.2)', fontFamily: '"Space Mono", monospace' }}
                  onClick={() => {
                    setUploadedPhoto(null);
                    setPhotoTransform({ offsetX: 0, offsetY: 0, scale: 1, rotation: 0 });
                  }}
                  id="change-photo"
                >
                  📷 Change Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input for re-upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInputChange}
          id="photo-upload-hidden"
        />
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky-bottom-bar">
        <button
          className="btn-primary flex-1"
          onClick={handleDownload}
          disabled={!uploadedPhoto && activeTab === 'pfp'}
          id="btn-download"
        >
          ⬇️ Download PNG
        </button>
        <button
          className="btn-pink flex-1"
          onClick={handleShare}
          disabled={!uploadedPhoto && activeTab === 'pfp'}
          id="btn-share"
        >
          🐦 Share to X
        </button>
      </div>

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>
        {toast}
      </div>
    </div>
  );
}
