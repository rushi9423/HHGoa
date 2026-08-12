'use client';

import { useState, useEffect, useCallback } from 'react';
import { BRAND } from '../lib/tokens';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/builder-id/history?page=${page}&limit=20`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecords(data.records || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchHistory(page);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-4 py-4 sm:py-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--hhg-yellow) 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--hhg-pink) 0%, transparent 70%)' }} />
        </div>

        <a href="/" className="relative z-10 inline-flex items-center gap-1.5 mb-3 px-4 py-1.5 rounded-full text-xs tracking-[2px] uppercase transition-all hover:scale-105"
          style={{
            fontFamily: '"Space Mono", monospace',
            color: 'var(--hhg-cream)',
            background: 'rgba(246, 239, 224, 0.08)',
            border: '1px solid rgba(246, 239, 224, 0.15)',
          }}>
          ← Back to Generator
        </a>

        <div className="relative z-10 flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            BUILDER
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm"
            style={{ background: 'var(--hhg-pink)', fontFamily: '"Noto Sans Devanagari", sans-serif', fontWeight: 700 }}>
            गोवा
          </span>
          <h1 className="text-2xl sm:text-3xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            REGISTRY
          </h1>
        </div>

        <p className="text-xs tracking-[3px] opacity-50 relative z-10"
          style={{ fontFamily: '"Space Mono", monospace' }}>
          All Builder IDs Issued
        </p>
      </header>

      {/* Stats Bar */}
      <div className="px-4 max-w-4xl mx-auto w-full mb-6">
        <div className="card-glass p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <p className="text-xs tracking-[2px] uppercase opacity-40"
                style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                Total Builders
              </p>
              <p className="text-2xl font-bold"
                style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-cream)' }}>
                {loading ? '...' : pagination.total}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-xs tracking-[2px] uppercase opacity-40"
                style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-yellow)' }}>
                Page
              </p>
              <p className="text-2xl font-bold"
                style={{ fontFamily: '"Space Mono", monospace', color: 'var(--hhg-cream)' }}>
                {pagination.page}/{pagination.totalPages || 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 pb-10 max-w-4xl mx-auto w-full">
        {error && (
          <div className="card-glass p-4 mb-4 text-center"
            style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            <p style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="card-glass p-8 text-center">
            <p className="text-4xl mb-3">🏖️</p>
            <p className="text-lg mb-1"
              style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
              No Builders Yet
            </p>
            <p className="text-sm opacity-50"
              style={{ fontFamily: '"Space Mono", monospace' }}>
              Be the first to generate a Builder ID!
            </p>
            <a href="/" className="btn-primary inline-flex mt-4">
              🎫 Create Your ID
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => (
              <div
                key={record.id || index}
                className="card-glass p-4 animate-fade-in-up transition-all hover:scale-[1.01]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: ID + Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold shrink-0"
                        style={{ fontFamily: '"Space Mono", monospace', color: '#d1365a' }}>
                        {record.formattedId}
                      </span>
                      <span className="pill-pink text-xs shrink-0">
                        {record.builderClass}
                      </span>
                    </div>
                    <p className="text-base font-bold truncate"
                      style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)', letterSpacing: '0.5px' }}>
                      {record.name?.toUpperCase()}
                    </p>
                    <p className="text-xs opacity-60 truncate"
                      style={{ fontFamily: '"Space Mono", monospace' }}>
                      {record.builderTitle}
                    </p>
                  </div>

                  {/* Right: Details */}
                  <div className="text-right shrink-0">
                    <p className="text-xs px-2 py-0.5 rounded-full mb-1 inline-block"
                      style={{
                        background: 'rgba(245, 208, 32, 0.12)',
                        color: 'var(--hhg-yellow)',
                        fontFamily: '"Space Mono", monospace',
                      }}>
                      {record.role}
                    </p>
                    {record.team && (
                      <p className="text-xs opacity-40 mt-0.5"
                        style={{ fontFamily: '"Space Mono", monospace' }}>
                        Team: {record.team}
                      </p>
                    )}
                    <p className="text-xs opacity-30 mt-0.5"
                      style={{ fontFamily: '"Space Mono", monospace' }}>
                      {record.issuedDate}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="text-xs px-4 py-2 rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(246, 239, 224, 0.2)', fontFamily: '"Space Mono", monospace' }}
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className="text-xs w-8 h-8 rounded-lg border transition-all"
                  style={{
                    borderColor: pageNum === pagination.page ? 'var(--hhg-pink)' : 'rgba(246, 239, 224, 0.2)',
                    background: pageNum === pagination.page ? 'rgba(209, 54, 90, 0.2)' : 'transparent',
                    color: pageNum === pagination.page ? 'var(--hhg-pink)' : 'var(--hhg-cream)',
                    fontFamily: '"Space Mono", monospace',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="text-xs px-4 py-2 rounded-lg border transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderColor: 'rgba(246, 239, 224, 0.2)', fontFamily: '"Space Mono", monospace' }}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 opacity-30">
        <p className="text-xs" style={{ fontFamily: '"Space Mono", monospace' }}>
          {BRAND.event.name} · {BRAND.event.dates}
        </p>
      </footer>
    </div>
  );
}
