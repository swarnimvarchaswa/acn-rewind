'use client';

import React, { useState, useEffect } from 'react';
import posthog from 'posthog-js';

interface ButtonBarProps {
    projectName?: string;
    showTutorial?: boolean;
    pageNumber?: number;
}

export default function ButtonBar({ projectName = 'Project', showTutorial = false, pageNumber }: ButtonBarProps) {
    const [showName, setShowName] = useState(showTutorial);
    const [showPulse, setShowPulse] = useState(false);
    const btnClass = `absolute bottom-4 left-4 p-3 flex items-center justify-center rounded-full text-white transition-all duration-300 active:scale-95 bg-gradient-to-b from-black/20 to-black/5 backdrop-blur-sm border border-white/20 shadow-2xl z-50 h-12`;

    useEffect(() => {
        if (showTutorial) {
            // Auto-reveal for 3 seconds
            setShowName(true);
            const timer = setTimeout(() => {
                setShowName(false);
                // Show pulse animation after closing
                setTimeout(() => setShowPulse(true), 500);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showTutorial]);

    const handleNameReveal = () => {
        const isRevealing = !showName;
        setShowName(isRevealing);
        setShowPulse(false); // Stop pulsing when user clicks
        if (isRevealing) {
            posthog.capture('project_name_reveal', {
                project: projectName,
                page: pageNumber
            });
        }
    };

    return (
        <>
            <button
                onClick={handleNameReveal}
                className={`${btnClass} glass-btn-standalone ${showName ? 'px-5 w-auto' : 'w-12'} ${showPulse ? 'animate-pulse' : ''}`}
            >
                {showName ? (
                    <span className="font-medium text-sm whitespace-nowrap animate-in fade-in duration-300">{projectName}</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                )}
            </button>
        </>
    );
}
