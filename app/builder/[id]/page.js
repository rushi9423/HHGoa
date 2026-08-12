'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BRAND } from '../../lib/tokens';

export default function BuilderProfilePage() {
  const params = useParams();
  const id = params?.id;
  
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    async function fetchRecord() {
      try {
        const res = await fetch(`/api/builder-id/${id}`);
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setRecord(data);
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecord();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--hhg-yellow) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--hhg-pink) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <h1 className="text-2xl sm:text-3xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            HACKER HOUSE
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm shadow-xl"
            style={{ background: 'var(--hhg-pink)', fontFamily: '"Noto Sans Devanagari", sans-serif', fontWeight: 700 }}>
            गोवा
          </span>
        </div>

        {loading ? (
          <div className="card-glass p-8 flex flex-col items-center gap-4">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full" style={{ color: 'var(--hhg-yellow)' }} />
            <p className="text-sm opacity-60" style={{ fontFamily: '"Space Mono", monospace' }}>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="card-glass p-8 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-lg mb-2" style={{ fontFamily: '"Anton", sans-serif', color: '#ef4444' }}>
              Error Loading Builder
            </p>
            <p className="text-sm opacity-70" style={{ fontFamily: '"Space Mono", monospace' }}>
              {error}
            </p>
            <a href="/" className="btn-primary mt-6 inline-flex">Return Home</a>
          </div>
        ) : record ? (
          <div className="card-glass overflow-hidden relative">
            {/* Top Bar */}
            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="text-xs tracking-[2px] uppercase opacity-80"
                  style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                  Verified Builder
                </span>
              </div>
              <span className="text-xl font-bold"
                style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-pink)' }}>
                {record.formattedId}
              </span>
            </div>
            
            {/* Main Content */}
            <div className="p-6">
              <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                style={{ fontFamily: '"Space Mono", monospace' }}>
                Name
              </p>
              <h2 className="text-3xl sm:text-4xl mb-6"
                style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)', letterSpacing: '1px' }}>
                {record.name?.toUpperCase()}
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                    style={{ fontFamily: '"Space Mono", monospace' }}>
                    Class
                  </p>
                  <span className="pill-pink text-xs inline-block">
                    {record.builderClass}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                    style={{ fontFamily: '"Space Mono", monospace' }}>
                    Title
                  </p>
                  <p className="text-sm font-bold"
                    style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                    {record.builderTitle}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                    style={{ fontFamily: '"Space Mono", monospace' }}>
                    Role
                  </p>
                  <p className="text-base" style={{ fontFamily: '"Space Mono", monospace' }}>
                    {record.role}
                  </p>
                </div>
                
                {record.team && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                      style={{ fontFamily: '"Space Mono", monospace' }}>
                      Team
                    </p>
                    <p className="text-base" style={{ fontFamily: '"Space Mono", monospace' }}>
                      {record.team}
                    </p>
                  </div>
                )}
                
                {record.handle && (
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <p className="text-xs uppercase tracking-[2px] opacity-50 mb-1"
                      style={{ fontFamily: '"Space Mono", monospace' }}>
                      X Handle
                    </p>
                    <p className="text-base" style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                      @{record.handle}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black/30 px-6 py-4 mt-2 text-center border-t border-white/5">
              <p className="text-xs opacity-40 mb-1" style={{ fontFamily: '"Space Mono", monospace' }}>
                Issued: {record.issuedDate}
              </p>
              <p className="text-[10px] uppercase tracking-[3px] opacity-20"
                style={{ fontFamily: '"Space Mono", monospace' }}>
                {BRAND.event.name}
              </p>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Create your own button */}
      <a href="/" className="relative z-10 mt-8 text-xs tracking-[2px] uppercase opacity-60 hover:opacity-100 transition-opacity"
        style={{ fontFamily: '"Space Mono", monospace' }}>
        Create your own Builder ID →
      </a>
    </div>
  );
}
