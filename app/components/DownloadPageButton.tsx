'use client';

import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import posthog from 'posthog-js';

interface DownloadPageButtonProps {
    pageNumber: number;
}

export default function DownloadPageButton({ pageNumber }: DownloadPageButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
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
        <button
            onClick={handleDownload}
            disabled={loading}
            className="download-page-btn absolute bottom-4 right-4 p-3 flex items-center justify-center rounded-full text-white transition-all duration-300 active:scale-95 bg-gradient-to-b from-black/20 to-black/5 backdrop-blur-sm border border-white/20 shadow-2xl z-50 h-12 w-12 hover:scale-110"
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
    );
}
