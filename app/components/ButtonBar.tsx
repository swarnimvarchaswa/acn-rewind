'use client';

import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import posthog from 'posthog-js';

interface ButtonBarProps {
    projectName?: string;
}

export default function ButtonBar({ projectName = 'Project' }: ButtonBarProps) {
    const [showName, setShowName] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    const showInjectedLogo = projectName !== 'Prestige Shantiniketan';
    const btnClass = `absolute bottom-4 p-3 flex items-center justify-center rounded-full text-white transition-all duration-300 active:scale-95 bg-gradient-to-b from-black/20 to-black/5 backdrop-blur-sm border border-white/20 shadow-2xl z-50 h-12`;

    const handleNameReveal = () => {
        const isRevealing = !showName;
        setShowName(isRevealing);
        if (isRevealing) {
            posthog.capture('project_name_reveal', { project: projectName });
        }
    };

    const handleDownloadClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Track the download attempt
        posthog.capture('download_initiated', { project: projectName });

        setLoading(true);
        setStatusMsg('Capturing...');

        const button = e.currentTarget;
        const section = button.closest('section');
        const logo = section?.querySelector('#capture-logo') as HTMLElement;

        if (section) {
            if (logo) logo.style.display = 'block';

            try {
                await new Promise(resolve => setTimeout(resolve, 100));

                const dataUrl = await htmlToImage.toPng(section as HTMLElement, {
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    filter: (node) => {
                        // Filter out buttons and the loading overlay
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('glass-btn-standalone')) return false;
                            if (node.id === 'capture-overlay') return false;
                        }
                        return true;
                    }
                });

                setStatusMsg('Saving...');

                const link = document.createElement('a');
                link.download = `acn-rewind-${projectName?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();

                setStatusMsg('Saved!');

                // Track successful download
                posthog.capture('download_success', { project: projectName });

                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (err) {
                console.error("Capture failed:", err);
                setStatusMsg('Error');
                posthog.capture('download_error', { project: projectName, error: String(err) });
            } finally {
                if (logo) logo.style.display = 'none';
                setLoading(false);
                setStatusMsg('');
            }
        }
    };

    return (
        <>
            {showInjectedLogo && (
                <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-0 flex-col items-center opacity-90 pointer-events-none">
                    <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
                        <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
                        <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
                    </svg>
                </div>
            )}

            <button
                onClick={handleNameReveal}
                className={`${btnClass} glass-btn-standalone left-4 ${showName ? 'px-5 w-auto' : 'w-12'}`}
            >
                {showName ? (
                    <span className="font-medium text-sm whitespace-nowrap animate-in fade-in duration-300">{projectName}</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                )}
            </button>

            <button
                onClick={handleDownloadClick}
                className={`${btnClass} glass-btn-standalone right-4 w-12`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </button>

            {loading && (
                <div id="capture-overlay" className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/20 px-8 py-6 rounded-2xl flex flex-col items-center gap-3 shadow-2xl animate-in fade-in zoom-in duration-300">
                        {statusMsg === 'Saved!' ? (
                            <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white animate-bounce">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                        ) : (
                            <div className="w-8 h-8 border-4 border-green-100 border-t-green-800 rounded-full animate-spin"></div>
                        )}
                        <p className="text-green-900 font-semibold text-sm tracking-wide">{statusMsg}</p>
                    </div>
                </div>
            )}
        </>
    );
}
