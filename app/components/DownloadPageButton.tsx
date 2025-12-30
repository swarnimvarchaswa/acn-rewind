'use client';

import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import posthog from 'posthog-js';

interface DownloadPageButtonProps {
    pageNumber: number;
    showTutorial?: boolean;
}

export default function DownloadPageButton({ pageNumber, showTutorial = false }: DownloadPageButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showPulse, setShowPulse] = useState(showTutorial);
    const [showText, setShowText] = useState(showTutorial);

    useEffect(() => {
        if (showTutorial) {
            // Pulse and show text for 5 seconds
            setShowPulse(true);
            setShowText(true);
            const timer = setTimeout(() => {
                setShowPulse(false);
                setShowText(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showTutorial]);

    const handleDownload = async () => {
        setShowPulse(false); // Stop pulsing when user clicks
        setShowText(false); // Hide text when user clicks
        posthog.capture('download_single_page', { page: pageNumber });

        setLoading(true);

        try {
            const sections = document.querySelectorAll('main > section');
            const section = sections[pageNumber - 1] as HTMLElement;

            // Show logo if not the first page
            const logo = section.querySelector('#capture-logo') as HTMLElement;
            if (logo && pageNumber !== 1) {
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
                        if (node.classList.contains('download-page-btn')) return false;
                        if (node.classList.contains('download-tooltip')) return false;
                        if (node.id === 'download-all-btn') return false;
                    }
                    return true;
                }
            });

            // Hide logo after capture
            if (logo) {
                logo.style.display = 'none';
            }

            // Download the image
            const link = document.createElement('a');
            link.download = `acn-rewind-page-${pageNumber}.png`;
            link.href = dataUrl;
            link.click();

            posthog.capture('download_single_page_success', { page: pageNumber });

        } catch (err) {
            console.error("Download failed:", err);
            posthog.capture('download_single_page_error', { page: pageNumber, error: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-3 z-50">
            {/* Tooltip Text */}
            {showText && (
                <div className="download-tooltip bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl px-4 py-2 shadow-lg animate-in fade-in slide-in-from-right-2 duration-300">
                    <p className="text-green-900 font-medium text-sm whitespace-nowrap">Download this page</p>
                </div>
            )}

            {/* Download Button */}
            <button
                onClick={handleDownload}
                disabled={loading}
                className={`download-page-btn p-3 flex items-center justify-center rounded-full text-white transition-all duration-300 active:scale-95 bg-gradient-to-b from-black/20 to-black/5 backdrop-blur-sm border border-white/20 shadow-2xl h-12 w-12 hover:scale-110 ${showPulse ? 'animate-pulse' : ''}`}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}
