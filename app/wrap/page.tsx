'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { AgentData } from '@/lib/sheets';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats large currency numbers into K/L/Cr format
 */
const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${(value / 1000).toFixed(0)}K`;
};

/**
 * Processes activity data to find weekly patterns
 */
const calculateWeeklyStats = (activityData: number[][]) => {
  const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekdayFullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let dayOfYear = 0;
  const startDayOfWeek = 2; // Jan 1, 2025 is Wednesday

  activityData.forEach((monthData, monthIdx) => {
    for (let d = 0; d < daysInMonth[monthIdx]; d++) {
      if (monthData[d] > 0) {
        const dayOfWeek = (startDayOfWeek + dayOfYear) % 7;
        weekdayCounts[dayOfWeek]++;
      }
      dayOfYear++;
    }
  });

  const maxCount = Math.max(...weekdayCounts);
  const peakDayIndex = weekdayCounts.indexOf(maxCount);

  return { weekdayNames, weekdayFullNames, weekdayCounts, maxCount, peakDayIndex };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WrapPage() {
  // --- STATE ---
  const [mobile, setMobile] = useState('');
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [error, setError] = useState('');
  const [userPhotos, setUserPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const urls = files.map(file => URL.createObjectURL(file));
      setUserPhotos(prev => [...prev, ...urls]);
    }
  };

  // --- EFFECTS ---

  // Check URL for mobile number on partial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMobile = params.get('mobile');

    if (urlMobile) {
      fetchData(urlMobile);
    } else {
      setLoading(false);
      setShowInput(true);
    }
  }, []);

  // --- DATA FETCHING ---

  const fetchData = async (mobileNumber: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/agent?mobile=${encodeURIComponent(mobileNumber)}`);
      const result = await response.json();

      if (result.found) {
        setData(result);
        setShowInput(false);
        setShowNotFound(false);

        // Update URL quietly
        window.history.pushState({}, '', `?mobile=${mobileNumber}`);

        // Initialize scroll observers
        setTimeout(initializeAnimations, 100);
      } else {
        setShowNotFound(true);
        setShowInput(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      setShowNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // --- INTERACTION HANDLERS ---

  const handleSubmit = () => {
    if (mobile.length === 10) {
      fetchData(mobile);
    } else {
      setError('Please enter a valid 10-digit mobile number');
    }
  };

  const handleRetry = () => {
    setShowNotFound(false);
    setShowInput(true);
    setMobile('');
    setError('');
  };

  const handleShare = async () => {
    if (!data) return;
    const shareText = `Check out my ACN Wrap 2025! 🎉\n\n${data.days_active} active days\n${data.total_properties} properties\n${data.total_enquiries} enquiries\n\nView yours at: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ACN Wrap 2025', text: shareText });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // --- ANIMATIONS & SCROLL LOGIC ---

  const initializeAnimations = () => {
    // 1. Intersection Observer for Fade-In Elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-section').forEach((el) => observer.observe(el));

    // 2. Scroll Progress Dots Logic
    const mainScroll = document.getElementById('main-scroll');
    const sections = document.querySelectorAll('.snap-section');
    const progressDots = document.getElementById('progress-dots');

    if (mainScroll && progressDots && sections.length > 0) {
      progressDots.innerHTML = '';

      // Create Dots
      sections.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'w-1.5 h-1.5 rounded-full bg-white/30 transition-all duration-300';
        dot.id = `dot-${index}`;
        progressDots.appendChild(dot);
      });

      // Update Dots on Scroll
      mainScroll.addEventListener('scroll', () => {
        const scrollTop = mainScroll.scrollTop;
        const sectionHeight = window.innerHeight;
        const currentSection = Math.round(scrollTop / sectionHeight);

        document.querySelectorAll('[id^="dot-"]').forEach((dot, index) => {
          if (index === currentSection) {
            dot.classList.remove('bg-white/30');
            dot.classList.add('bg-white text-[#10302d]', 'w-6');
          } else {
            dot.classList.remove('bg-white text-[#10302d]', 'w-6');
            dot.classList.add('bg-white/30');
          }
        });

        // Show/Hide Floating Share Button
        const shareBtn = document.getElementById('floating-share');
        if (shareBtn) {
          if (currentSection >= sections.length - 1) shareBtn.classList.remove('hidden');
          else shareBtn.classList.add('hidden');
        }
      });
    }
  };

  // --- MEMOIZED DATA CALCULATIONS ---

  const weeklyStats = useMemo(() => {
    if (!data?.activity_data) return null;
    return calculateWeeklyStats(data.activity_data);
  }, [data]);

  // --- RENDER: LOADING & ERROR STATES ---

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#10302d] z-[100] flex flex-col items-center justify-center">
        <div className="spinner mb-4"></div>
        <p className="text-gray-400 text-sm">Loading your wrap...</p>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#10302d] to-[#60c9c1] z-[100] flex flex-col items-center justify-center p-6">
        <Image src="/logo.svg" alt="ACN Logo" width={80} height={80} className="mb-8 animate-float" />
        <h1 className="font-m font-bold text-2xl mb-2 text-center">ACN Wrap 2025</h1>
        <p className="text-gray-400 text-sm mb-8 text-center max-w-xs">Enter your mobile number to view your year in review</p>
        <div className="w-full max-w-sm">
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center text-lg focus:outline-none focus:border-white/50 transition"
          />
          <button
            onClick={handleSubmit}
            className="w-full mt-4 py-4 bg-white text-[#10302d] hover:bg-white/90 text-[#10302d] text-white font-bold rounded-xl transition transform hover:scale-105"
          >
            View My Wrap
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    );
  }

  if (showNotFound) {
    return (
      <div className="fixed inset-0 bg-[#10302d] z-[100] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">😔</div>
        <h2 className="font-m font-bold text-2xl mb-4">No Data Found</h2>
        <p className="text-gray-400 mb-8 max-w-xs">We couldn't find any data for this mobile number. Please check and try again.</p>
        <button onClick={handleRetry} className="px-8 py-3 bg-white text-[#10302d] hover:bg-white/90 text-[#10302d] text-white font-bold rounded-xl transition">Try Again</button>
      </div>
    );
  }

  if (!data) return null;

  // --- RENDER: MAIN WRAP CONTENT ---

  return (
    <>
      {/* 1. Progress Indicator */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center gap-1.5 px-4" id="progress-dots"></div>

      {/* 2. Floating Share Button (Bottom Right) */}
      <button
        id="floating-share"
        onClick={handleShare}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white text-[#10302d] rounded-full shadow-[0_0_20px_rgba(50,175,103,0.6)] flex items-center justify-center text-white animate-bounce hidden hover:scale-110 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {/* 3. Main Scroll Container (Reel Behavior) */}
      <main className="card-scroll-container bg-black font-m" id="main-scroll">

        {/* --- SCREEN 1: HERO --- */}
        <section className="snap-section w-full h-full bg-white relative overflow-hidden flex flex-col justify-end items-center text-center">
          {/* Base Image */}
          <img
            src="/shantiniketan.jpg"
            alt=""
            className="w-full absolute bottom-0 object-cover object-bottom"
          />

          <div className="hidden">


            {/* Restored Main Content */}
            <h2 className="font-m font-bold text-5xl mb-4 tracking-wider text-white drop-shadow-lg text-center leading-tight">
              {data.agent_name || 'Agent'}
            </h2>

            {/* Views - Subtext */}
            <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-2xl border border-white/20 mb-6">
              <p className="text-white font-bold text-lg">You're a star! ⭐</p>
              <p className="text-white/80 text-sm">{(data as any).profile_views || 1240} people visited your profile</p>
            </div>

            <p className="text-white/70 text-xs font-medium max-w-[240px] leading-relaxed">
              Your 2025 story starts here.
            </p>
          </div>


        </section>

        {/* --- SCREEN 2: ACTIVE DAYS --- */}
        <section className="snap-section w-full h-full bg-[#10302d] relative overflow-hidden flex flex-col justify-center items-center p-6 text-center">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.pexels.com/photos/1010079/pexels-photo-1010079.jpeg"
              alt=""
              className="w-full h-full object-cover opacity-20 brightness-75 select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10302d] to-transparent mix-blend-overlay"></div>
          </div>
          <div className="fade-in-section w-full max-w-md relative z-10">
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-8">You were active for</p>
            <div className="relative inline-block mb-4">
              <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl animate-pulse"></div>
              <h2 className="text-[8rem] leading-none font-black text-white relative z-10 drop-shadow-2xl">{(data as any).days_active || 0}</h2>
            </div>
            <p className="text-2xl font-bold text-white mb-8">Days</p>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl mx-4 shadow-xl">
              <p className="text-white/90 italic text-lg leading-relaxed">"Consistency is the hallmark of the unimaginative... or the incredibly successful."</p>
            </div>
          </div>
        </section>

        {/* --- SCREEN 3: STREAK --- */}
        <section className="snap-section w-full h-full bg-gradient-to-t from-[#10302d] to-[#205e59] relative overflow-hidden flex flex-col justify-center items-center p-6 text-center">
          <div className="fade-in-section w-full max-w-sm">
            <div className="text-5xl mb-4">🔥</div>
            <h3 className="font-m font-bold text-2xl mb-2">Your Hottest Streak</h3>
            <div className="text-6xl font-black text-white mb-2 drop-shadow-lg">{data.longest_streak || 0}</div>
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-8">CONSECUTIVE DAYS</p>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 bg-white text-[#10302d]/10 w-full animate-pulse-slow"></div>
              <div className="flex justify-between items-center relative z-10 text-sm font-bold">
                <span className="text-gray-400">{data.streak_start_date || '-'}</span>
                <div className="h-1 flex-1 mx-4 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white text-[#10302d] w-full"></div>
                </div>
                <span className="text-white">{data.streak_end_date || '-'}</span>
              </div>
            </div>
            <p className="mt-8 text-xl font-medium text-white/90">You were unstoppable!</p>
          </div>
        </section>

        {/* --- SCREEN 4: HEATMAP --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#40beb4] to-[#f0fdfc] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md h-full flex flex-col justify-end pb-12">
            <h3 className="font-m font-bold text-2xl text-center mb-10 text-[#10302d]">📅 Your Activity Map</h3>
            <div className="w-full h-[60vh] flex flex-row gap-0.5 justify-between items-end">
              {data.activity_data && ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, monthIdx) => {
                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31][monthIdx];
                const monthData = data.activity_data![monthIdx] || [];
                return (
                  <div key={month} className="flex flex-col-reverse gap-0.5 h-full flex-1 items-center relative">
                    <span className="text-[10px] font-bold text-[#10302d]/70 absolute -top-6 w-full text-center">{month.charAt(0)}</span>
                    {Array.from({ length: 31 }).map((_, dayIdx) => {
                      if (dayIdx >= daysInMonth) return <div key={dayIdx} className="w-2.5 h-2.5 bg-transparent" />;
                      const dayValue = monthData[dayIdx] || 0;
                      let bgClass = 'bg-[#10302d]/5';
                      if (dayValue >= 6) bgClass = 'bg-[#10302d]';
                      else if (dayValue >= 3) bgClass = 'bg-[#10302d]/60';
                      else if (dayValue >= 1) bgClass = 'bg-[#10302d]/30';

                      return <div key={dayIdx} className={`w-2.5 h-2.5 rounded-full ${bgClass}`} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- SCREEN 5: WEEKLY RHYTHM --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#205e59] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md h-full flex flex-col justify-end pb-20">
            <h3 className="font-m font-bold text-2xl text-center mb-2 text-white">📊 Weekly Rhythm</h3>
            <p className="text-[#10302d]/60 text-sm text-center mb-8">Your most active day of the week</p>
            {weeklyStats && (
              <>
                <div className="flex items-end justify-between h-[50vh] gap-3 w-full max-w-[320px] mx-auto">
                  {weeklyStats.weekdayNames.map((day, idx) => {
                    const count = weeklyStats.weekdayCounts[idx];
                    const percentage = weeklyStats.maxCount > 0 ? (count / weeklyStats.maxCount) * 100 : 0;
                    const isPeak = idx === weeklyStats.peakDayIndex;
                    return (
                      <div key={day} className="flex flex-col items-center justify-end h-full flex-1 group gap-2">
                        <div className="w-full bg-[#10302d]/10 rounded-t-full h-full relative overflow-hidden flex items-end">
                          <div
                            className={`w-full rounded-t-full transition-all duration-1000 ${isPeak ? 'bg-[#10302d]' : 'bg-[#10302d]/40'}`}
                            style={{ height: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-[10px] font-bold ${isPeak ? 'text-[#10302d]' : 'text-[#10302d]/60'}`}>{day.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* --- SCREEN 6: ZONE MAP --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#205e59]/30 rounded-full blur-[100px]"></div>
          <div className="fade-in-section w-full max-w-sm text-center relative z-10">
            <h3 className="font-m font-bold text-2xl mb-2">📍 Your Territory</h3>
            <h4 className="text-white font-bold text-xl mb-6">{data.top_zone || 'North'}</h4>
            <div className="relative w-full aspect-square max-w-[300px] mx-auto mb-8 drop-shadow-2xl">
              <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M200 20 L280 120 L200 200 L120 120 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <path d="M285 125 L380 200 L285 275 L205 205 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <path d="M200 380 L120 280 L200 210 L280 280 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <path d="M115 275 L20 200 L115 125 L195 205 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle cx="200" cy="200" r="30" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/50 shadow-lg text-center">
                <div className="text-2xl font-black text-white leading-none">{data.top_zone_pct || 0}%</div>
              </div>
            </div>
            <p className="text-gray-300">This is your hunting ground!</p>
            <div className="inline-block mt-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-wide">{data.zone_deals || 0} deals closed</div>
          </div>
        </section>

        {/* --- SCREEN 7: TOP MICROMARKETS --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md">
            <h3 className="font-m font-bold text-2xl text-center mb-2">🎯 Your Hotspots</h3>
            <p className="text-gray-400 text-sm text-center mb-8">Top micromarkets you dominated</p>
            <div className="bg-gradient-to-br from-[#205e59]/40 to-[#10302d]/40 border-2 border-white/30 rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 text-8xl opacity-5">📍</div>
              <p className="text-xs text-brand-400 uppercase font-bold tracking-widest mb-2 relative z-10">#1 Micromarket</p>
              <h4 className="text-3xl font-black text-white mb-2 relative z-10">{data.top_micromarket || '-'}</h4>
              <p className="text-white font-bold text-lg relative z-10">{data.micromarket_count || 0} properties</p>
            </div>
            <div className="space-y-3">
              {data.all_micromarkets && data.all_micromarkets.slice(1, 4).map((mm, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">#{idx + 2}</p>
                    <p className="text-white font-bold">{mm.micromarket}</p>
                  </div>
                  <p className="text-white font-bold">{mm.count}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SCREEN 8: DEAL STYLE --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md flex flex-col items-center">
            <h3 className="font-m font-bold text-2xl text-center mb-2 text-white">🤝 Your Deal Style</h3>
            <p className="text-gray-400 text-sm text-center mb-8">How you work the market</p>

            {(() => {
              const sent = data.enquiries_sent || 0;
              const received = data.enquiries_received || 0;
              const total = sent + received;
              const sentPct = total > 0 ? (sent / total) * 100 : 50;
              // Labels
              let label = "Balanced Dealmaker";
              if (sentPct > 60) label = "Buyer Agent"; // Mostly sending -> Buyer side
              else if (sentPct < 40) label = "Seller Agent"; // Mostly receiving -> Seller side

              return (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="15.9155" fill="none" stroke="#205e59" strokeWidth="8" />
                      <circle cx="16" cy="16" r="15.9155" fill="none" stroke="#ffffff" strokeWidth="8" strokeDasharray={`${sentPct} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-1">
                      <span className="text-3xl font-black text-white">{Math.round(sentPct)}%</span>
                      <span className="text-[8px] uppercase tracking-widest text-white/60 font-bold">SENT</span>
                    </div>
                  </div>

                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-2xl font-black text-white">{sent}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#40beb4]">{received}</p>
                      <p className="text-xs text-[#40beb4] font-bold uppercase">Received</p>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-full px-6 py-2">
                    <p className="text-xl font-black text-white">{label}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* --- SCREEN 9: DEAL TYPE MIX --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md flex flex-col items-center">
            <h3 className="font-m font-bold text-2xl text-center mb-2 text-white">💼 Deal Type Mix</h3>
            <p className="text-gray-400 text-sm text-center mb-8">Your property portfolio split</p>

            {(() => {
              const resale = data.resale_count || 0;
              const rental = data.rental_count || 0;
              const total = resale + rental;
              const resalePct = total > 0 ? (resale / total) * 100 : 0;

              return (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                      <circle cx="16" cy="16" r="15.9155" fill="none" stroke="#205e59" strokeWidth="6" />
                      <circle cx="16" cy="16" r="15.9155" fill="none" stroke="#40beb4" strokeWidth="6" strokeDasharray={`${resalePct} 100`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-black text-white">{Math.round(resalePct)}%</span>
                      <span className="text-[8px] uppercase tracking-widest text-[#40beb4] font-bold">RESALE</span>
                    </div>
                  </div>

                  <div className="flex gap-12 text-center items-center justify-center w-full">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#40beb4] mb-2"></div>
                      <span className="text-2xl font-black text-white">{resale}</span>
                      <span className="text-xs text-gray-400 uppercase font-bold">Resale</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#205e59] mb-2"></div>
                      <span className="text-2xl font-black text-white">{rental}</span>
                      <span className="text-xs text-gray-400 uppercase font-bold">Rental</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* --- SCREEN 10: CONFIGURATION DNA --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md">
            <h3 className="font-m font-bold text-2xl text-center mb-2">🏘️ Configuration DNA</h3>
            <p className="text-gray-400 text-sm text-center mb-8">Your BHK breakdown</p>
            <div className="space-y-4 mb-8">
              {data.all_configurations && data.all_configurations.map((config, idx) => {
                const total = data.all_configurations!.reduce((sum, c) => sum + c.count, 0);
                const pct = total > 0 ? Math.round((config.count / total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-bold">{config.bedrooms} BHK</span>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white text-[#10302d] rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gradient-to-br from-[#205e59]/30 to-[#10302d]/30 border border-white/20 rounded-2xl p-6 text-center">
              <p className="text-xl font-black text-white">{data.top_configuration} Specialist!</p>
            </div>
          </div>
        </section>

        {/* --- SCREEN 11: RESALE PRICE --- */}
        {data.resale_avg_price && data.resale_avg_price > 0 && (
          <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
            <div className="fade-in-section w-full max-w-md text-center">
              <h3 className="font-m font-bold text-2xl mb-2">💰 Resale Price Range</h3>
              <p className="text-gray-400 text-sm mb-8">Your sweet spot</p>
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                <p className="text-6xl font-black text-white relative z-10">{formatCurrency(data.resale_avg_price)}</p>
              </div>
              <p className="text-lg text-gray-300 mb-6">Average Deal Value</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">Price Range</p>
                <p className="text-white font-bold">{formatCurrency(data.resale_min_price || 0)} - {formatCurrency(data.resale_max_price || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#205e59]/30 to-[#10302d]/30 border border-white/20 rounded-2xl p-4">
                <p className="text-sm text-white font-bold">Resale specialist</p>
              </div>
            </div>
          </section>
        )}

        {/* --- SCREEN 12: RENTAL PRICE --- */}
        {data.rental_avg_rent && data.rental_avg_rent > 0 && (
          <section className="snap-section w-full h-full bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
            <div className="fade-in-section w-full max-w-md text-center">
              <h3 className="font-m font-bold text-2xl mb-2">🏠 Rental Price Range</h3>
              <p className="text-gray-400 text-sm mb-8">Your rental sweet spot</p>
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                <p className="text-6xl font-black text-white relative z-10">{formatCurrency(data.rental_avg_rent)}</p>
              </div>
              <p className="text-lg text-gray-300 mb-6">Average Monthly Rent</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">Rent Range</p>
                <p className="text-white font-bold">{formatCurrency(data.rental_min_rent || 0)} - {formatCurrency(data.rental_max_rent || 0)}/mo</p>
              </div>
              <div className="bg-gradient-to-br from-[#205e59]/30 to-[#10302d]/30 border border-white/20 rounded-2xl p-4">
                <p className="text-sm text-white font-bold">Rental specialist</p>
              </div>
            </div>
          </section>
        )}

        {/* --- SCREEN 13: ACN BESTIE --- */}
        <section className="snap-section w-full h-dvh bg-gradient-to-b from-[#10302d] to-[#40beb4] relative overflow-hidden flex flex-col justify-center items-center p-6">
          <div className="fade-in-section w-full max-w-md text-center">
            <h3 className="font-m font-bold text-2xl mb-8"> Your ACN Bestie</h3>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#40beb4] to-[#359e96] flex items-center justify-center text-3xl"></div>
              <div className="text-4xl animate-pulse"></div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#205e59] to-[#40beb4] flex items-center justify-center text-3xl"></div>
            </div>
            <div className="bg-gradient-to-br from-[#205e59]/40 to-[#10302d]/40 border-2 border-white/30 rounded-2xl p-8 mb-6">
              <p className="text-3xl font-black text-white mb-4">{data.bestie_name || 'Your Bestie'}</p>
              <p className="text-gray-400 text-sm mb-2">You collaborated</p>
              <p className="text-5xl font-black text-white mb-2">{data.bestie_count || 0}</p>
              <p className="text-gray-400 text-sm">times in 2025</p>
            </div>
            <p className="text-gray-300 text-sm">Your most trusted connection on the platform!</p>
          </div>
        </section>

        {/* --- SCREEN 14: MEMORIES UPLOAD --- */}
        <section className="snap-section w-full h-full bg-gradient-to-b from-[#40beb4] to-[#10302d] relative overflow-hidden flex flex-col justify-center items-center p-6 text-center">
          <div className="w-full max-w-md flex flex-col items-center z-10">
            <h3 className="font-m font-bold text-2xl mb-2 text-white">📸 Your 2025 Memories</h3>
            <p className="text-white/80 text-sm mb-8">Add photos to your timeline</p>

            <div className="w-full grid grid-cols-3 gap-2 mb-6 max-h-[40vh] overflow-y-auto p-2 scrollbar-hide">
              {userPhotos.map((src, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-lg border border-white/20 relative group">
                  <img src={src} alt="Memory" className="w-full h-full object-cover" />
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition gap-2 group">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/80 font-bold uppercase">Add Photo</span>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {userPhotos.length > 0 && (
              <p className="text-xs text-white/60 animate-pulse">Scroll down to wrap up! 👇</p>
            )}
            {userPhotos.length === 0 && (
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-xs">
                <p className="text-sm text-white/80">"Collect moments, not just deals." Start your gallery now!</p>
              </div>
            )}
          </div>
        </section>

        {/* --- SCREEN 15: FINAL CTA --- */}
        <section className="snap-section w-full h-dvh bg-[#10302d] relative overflow-hidden flex flex-col justify-center items-center p-6 text-center">
          <div className="fade-in-section w-full max-w-sm">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="font-m font-black text-4xl mb-4 text-white">What a Year!</h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">You've made 2025 count with amazing achievements and countless connections.</p>
            <p className="text-white font-bold mb-12">See you in 2026! 🚀</p>
            <div className="space-y-4 w-full">
              <button
                onClick={handleShare}
                className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition transform hover:scale-105 shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.23-.298.347-.497.117-.198.059-.371-.03-.544-.09-.173-.816-1.966-1.118-2.693-.29-.705-.586-.61-.806-.61-.205-.01-.44-.01-.676-.01-.235 0-.616.088-.939.436-.322.348-1.233 1.206-1.233 2.942 0 1.737 1.264 3.414 1.44 3.662.176.248 2.492 3.804 6.039 5.334 2.336 1.007 2.81 1.007 3.327.943.834-.105 1.789-.731 2.042-1.437.252-.707.252-1.314.177-1.438-.076-.124-.275-.198-.574-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Share on WhatsApp
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
