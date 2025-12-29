'use client';

import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import posthog from 'posthog-js';

export default function DownloadAllButton() {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [currentPage, setCurrentPage] = useState(0);

    const handleDownloadAll = async () => {
        posthog.capture('download_all_initiated');

        setLoading(true);
        setStatusMsg('Starting...');

        const sections = document.querySelectorAll('main > section');
        const totalPages = sections.length;

        try {
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i] as HTMLElement;
                setCurrentPage(i + 1);
                setStatusMsg(`Capturing ${i + 1} of ${totalPages}...`);

                // Show logo if not the first page
                const logo = section.querySelector('#capture-logo') as HTMLElement;
                if (logo && i !== 0) {
                    logo.style.display = 'flex';
                }

                await new Promise(resolve => setTimeout(resolve, 200));

                const dataUrl = await htmlToImage.toPng(section, {
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    filter: (node) => {
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('glass-btn-standalone')) return false;
                            if (node.id === 'capture-overlay') return false;
                            if (node.id === 'download-all-btn') return false;
                        }
                        return true;
                    }
                });

                // Hide logo
                if (logo) {
                    logo.style.display = 'none';
                }

                const link = document.createElement('a');
                link.download = `acn-rewind-page-${i + 1}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();

                await new Promise(resolve => setTimeout(resolve, 300));
            }

            setStatusMsg('All saved!');
            posthog.capture('download_all_success', { pages: totalPages });
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (err) {
            console.error("Download all failed:", err);
            setStatusMsg('Error occurred');
            posthog.capture('download_all_error', { error: String(err) });
            await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
            setLoading(false);
            setStatusMsg('');
            setCurrentPage(0);
        }
    };

    return (
        <>
            {/* ACN Logo for injection into screenshots */}
            <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-0 flex-col items-center pointer-events-none bg-white/30 backdrop-blur-md border border-white/50 rounded-3xl px-6 py-4 shadow-lg">
                <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
                    <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
                    <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
                </svg>
            </div>

            <button
                id="download-all-btn"
                onClick={handleDownloadAll}
                disabled={loading}
                className="px-12 py-3 flex items-center justify-center gap-4 rounded-3xl text-green-900 font-medium text-lg transition-all duration-300 active:scale-95 bg-gradient-to-b from-green-900/30 backdrop-blur-xl shadow-lg z-50 hover:bg-white/20 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-green-900/30 border-t-green-900 rounded-full animate-spin"></div>
                        <span className="font-bold text-lg">Saving...</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span className="font-bold text-lg">Download Now</span>
                    </>
                )}
            </button>

            {loading && (
                <div id="capture-overlay" className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xl border border-white/30 px-10 py-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                        {statusMsg === 'All saved!' ? (
                            <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center text-white animate-bounce">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-10 h-10 border-4 border-green-100 border-t-green-800 rounded-full animate-spin"></div>
                        )}
                        <p className="text-green-900 font-semibold text-lg tracking-wide">{statusMsg}</p>
                    </div>
                </div>
            )}
        </>
    );
}
