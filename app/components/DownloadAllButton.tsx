'use client';

import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import posthog from 'posthog-js';

export default function DownloadAllButton() {
    const [loading, setLoading] = useState(false);

    const handleDownloadAll = async () => {
        posthog.capture('download_all_initiated');

        setLoading(true);

        const sections = document.querySelectorAll('main > section');
        const totalPages = sections.length - 1; // Exclude last page
        const zip = new JSZip();

        try {
            for (let i = 0; i < totalPages; i++) { // Loop until totalPages (excluding last)
                const section = sections[i] as HTMLElement;

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

                // Hide logo after capture
                if (logo) {
                    logo.style.display = 'none';
                }

                // Convert data URL to blob and add to ZIP
                const base64Data = dataUrl.split(',')[1];
                zip.file(`acn-rewind-page-${i + 1}.png`, base64Data, { base64: true });

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Generate and download ZIP file
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `acn-rewind-${Date.now()}.zip`);

            posthog.capture('download_all_success', { pages: totalPages });

        } catch (err) {
            console.error("Download all failed:", err);
            posthog.capture('download_all_error', { error: String(err) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            id="download-all-btn"
            onClick={handleDownloadAll}
            disabled={loading}
            className="px-12 py-3 flex items-center justify-center gap-4 rounded-3xl text-green-900 font-medium text-lg transition-all duration-300 active:scale-95 bg-white border-2 border-green-800 z-50 hover:bg-white/20 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-green-900/30 border-t-green-900 rounded-full animate-spin"></div>
                    <span className="font-medium text-lg">Saving...</span>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="font-medium text-lg">Download Now</span>
                </>
            )}
        </button>
    );
}
