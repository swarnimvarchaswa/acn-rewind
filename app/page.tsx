'use client';

import { useState, useEffect, useMemo } from 'react';
import type { AgentData } from '@/lib/sheets';
import ButtonBar from './components/ButtonBar';
import DownloadAllButton from './components/DownloadAllButton';
import DownloadPageButton from './components/DownloadPageButton';
import posthog from 'posthog-js';

const formatCurrency = (value: number) => {
  if (!value) return '₹0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${(value / 1000).toFixed(0)}K`;
};

// --- LOADING SCREEN COMPONENT ---
function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "Exploring your year...",
    "Getting the numbers...",
    "Counting your enquries...",
    "Finding your agent...",
    "Analyzing zone stats...",
    "Wrapping it all up..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white text-green-900">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-green-100 border-t-green-800 rounded-full animate-spin"></div>
        <p className="font-medium text-lg tracking-wide text-green-800 animate-fade-in transition-all duration-300">
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  );
}

// --- LOGIN SCREEN COMPONENT ---
function LoginScreen({ onLogin, error }: { onLogin: (mobile: string) => void, error: string }) {
  const [mobile, setMobile] = useState('');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-900 tracking-tight">ACN Rewind 2025</h1>
          <p className="text-gray-500 font-medium">Enter your mobile number to start</p>
        </div>

        <div className="w-full flex gap-5 flex-col">
          <input
            type="tel"
            placeholder="1234567890"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-semibold text-center text-green-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent transition-all"
            maxLength={10}
          />

          {error && <p className="text-red-500 text-sm font-medium text-center mb-6">{error}</p>}

          <button
            onClick={() => {
              if (mobile.length >= 10) onLogin(mobile);
            }}
            disabled={mobile.length < 10}
            className="w-full py-4 bg-green-900 text-white rounded-2xl font-bold text-lg hover:bg-green-800 active:scale-95 transition-all shadow-lg disabled:opacity-80 disabled:cursor-not-allowed"
          >
            Reveal My Rewind
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<AgentData | null>(null);

  const activeMonth = useMemo(() => {
    if (!data?.activity_data) return 'January';
    const sums = data.activity_data.map(m => (Array.isArray(m) ? m.reduce((a, b) => a + (b || 0), 0) : 0));
    const max = Math.max(...sums);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[sums.indexOf(max)] || 'January';
  }, [data]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // TRACK PAGE VIEW AND URL
  useEffect(() => {
    if (data) {
      posthog.capture('page_view', {
        url: window.location.href,
        mobile: data.mobile,
        agent_name: data.agent_name
      });
    }
  }, [data]);

  // TRACK SCROLL DEPTH AND COMPLETION
  useEffect(() => {
    if (!data) return;

    let maxScroll = 0;
    let hasReachedEnd = false;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (scrollTop / docHeight) * 100;

      if (scrolled > maxScroll) {
        maxScroll = scrolled;
        // Check milestones
        if (maxScroll > 25 && maxScroll < 26) {
          posthog.capture('scroll_depth', {
            percentage: 25,
            mobile: data.mobile,
            agent_name: data.agent_name
          });
        }
        if (maxScroll > 50 && maxScroll < 51) {
          posthog.capture('scroll_depth', {
            percentage: 50,
            mobile: data.mobile,
            agent_name: data.agent_name
          });
        }
        if (maxScroll > 75 && maxScroll < 76) {
          posthog.capture('scroll_depth', {
            percentage: 75,
            mobile: data.mobile,
            agent_name: data.agent_name
          });
        }
        if (maxScroll > 99 && !hasReachedEnd) {
          hasReachedEnd = true;
          posthog.capture('rewind_completed', {
            percentage: 100,
            mobile: data.mobile,
            agent_name: data.agent_name,
            url: window.location.href
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data]);

  const fetchData = (mobile: string) => {
    setLoading(true);
    setError('');
    fetch(`/api/agent?mobile=${mobile}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.found) {
          setData(res);

          // IDENTIFY USER
          posthog.identify(mobile);

          // Update URL without reloading the page
          const newUrl = `${window.location.pathname}?mobile=${mobile}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        } else {
          setError('Agent not found. Try again.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Something went wrong. check connection.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mobile = params.get('mobile');
      if (mobile) {
        fetchData(mobile);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const activityFlat = useMemo(() => {
    const flat: { count: number; month: number }[] = [];
    if (data?.activity_data) {
      data.activity_data.forEach((monthData, monthIdx) => {
        monthData.forEach((count) => flat.push({ count: count || 0, month: monthIdx }));
      });
    }
    return flat;
  }, [data]);

  const validZone = useMemo(() => {
    if (!data) return null;

    if (data.all_zones && data.all_zones.length > 0) {
      const total = data.all_zones.reduce((sum, z) => sum + (z.count || 0), 0);
      const sorted = [...data.all_zones].sort((a, b) => (b.count || 0) - (a.count || 0));

      const best = sorted.find(z => {
        const name = (z.zone || '').toLowerCase();
        return (name.includes('north') || name.includes('south') || name.includes('east') || name.includes('west') || name.includes('central'))
          && !name.includes('unknown') && !name.includes('specif');
      });

      if (best) {
        return {
          ...data,
          top_zone: best.zone.trim(),
          top_zone_pct: total > 0 ? Math.round((best.count / total) * 100) : 0
        };
      }
    }
    return { ...data, top_zone: 'North', top_zone_pct: data?.top_zone_pct || 0 };
  }, [data]);

  const weeklyStats = useMemo(() => {
    if (!data?.activity_data) return null;
    const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    let dayIndex = 2; // Jan 1 2025 = Wednesday
    data.activity_data.forEach(month => {
      (month as number[]).forEach(count => {
        if (count > 0) counts[dayIndex % 7]++;
        dayIndex++;
      });
    });
    const max = Math.max(...counts);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const maxDay = days[counts.indexOf(max)];
    // SVG Points: X (0-100), Y (100-0)
    const points = counts.map((val, i) => `${i * (100 / 6)},${100 - (max > 0 ? (val / max) * 80 : 0)}`).join(' ');
    // Handle split day names for vertical bars
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return { counts, maxDay, points, dayNames };
  }, [data]);

  const agentStats = useMemo(() => {
    if (!data) return null;
    const sent = data.enquiries_sent || 0;
    const received = data.enquiries_received || 0;
    const totalEnq = sent + received;
    const sentPct = totalEnq > 0 ? Math.round((sent / totalEnq) * 100) : 0;
    const receivedPct = totalEnq > 0 ? Math.round((received / totalEnq) * 100) : 0;

    const isBuyer = sentPct >= 50;
    const displayPct = isBuyer ? sentPct : receivedPct;
    const displayAction = isBuyer ? 'enquiries sent' : 'enquiries received';
    const styleLabel = isBuyer ? 'You spent more time finding properties for your buyers' : 'You spent more time getting properties sold for your sellers';

    const resale = data.resale_count || 0;
    const rental = data.rental_count || 0;
    const totalDeals = resale + rental;
    const resalePct = totalDeals > 0 ? Math.round((resale / totalDeals) * 100) : 0;

    const isResale = resalePct >= 50;
    const dealTypePct = isResale ? resalePct : (totalDeals > 0 ? Math.round((rental / totalDeals) * 100) : 0);
    const dealTypeLabel = isResale ? 'resale' : 'rentals';

    // Price logic
    const resalePrice = data.resale_avg_price || 0;
    const rentalPrice = data.rental_avg_rent || 0;

    // Prioritize Resale Price for Market Pricing if available
    let targetPrice = resalePrice;
    let targetType = 'Resale';

    if (targetPrice === 0 && rentalPrice > 0) {
      targetPrice = rentalPrice;
      targetType = 'Rental';
    }

    // Heuristic: If price is > 50L, it's likely a Resale value mislabeled or mis-columned as Rental
    if (targetPrice > 5000000) {
      targetType = 'Resale';
    }

    const formatValue = (val: number) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace('.00', '').replace('.0', '')} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2).replace('.00', '').replace('.0', '')} L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1).replace('.0', '')} K`;
      return `₹${val.toLocaleString('en-IN')}`;
    };

    let formattedPrice = '₹0';
    if (targetPrice > 0) {
      formattedPrice = formatValue(targetPrice);
    }
    const priceSubtitle = 'The average property value you work with';

    return { sent, received, sentPct, displayPct, displayAction, styleLabel, resale, rental, resalePct, dealTypePct, dealTypeLabel, formattedPrice, priceSubtitle };
  }, [data]);

  const assetStats = useMemo(() => {
    if (!data?.all_asset_types || data.all_asset_types.length === 0) {
      return { name: data?.asset_types || 'Apartment', pct: data?.asset_types_pct || 0 };
    }

    let total = 0;
    let maxCount = 0;
    let maxName = '';

    data.all_asset_types.forEach(a => {
      const c = Number(a.count || 0);
      total += c;
      if (c > maxCount) {
        maxCount = c;
        maxName = a.assetType;
      }
    });

    const pct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
    const name = maxName ? (maxName.charAt(0).toUpperCase() + maxName.slice(1)) : (data?.asset_types || 'Apartment');

    return { name, pct };
  }, [data]);

  const micromarketStats = useMemo(() => {
    if (!data?.all_micromarkets || data.all_micromarkets.length === 0) {
      return {
        names: data?.top_micromarket || 'Hebbal',
        pct: 0
      };
    }
    const sorted = [...data.all_micromarkets].filter(m => (m.count || 0) > 0).sort((a, b) => (b.count || 0) - (a.count || 0));
    const top3 = sorted.slice(0, 3);
    const names = top3.map(m => m.micromarket).join(', ');

    const total = data.all_micromarkets.reduce((sum, m) => sum + (m.count || 0), 0);
    const top3Sum = top3.reduce((sum, m) => sum + (m.count || 0), 0);
    const pct = total > 0 ? Math.round((top3Sum / total) * 100) : 0;

    return { names, pct };
  }, [data]);

  // --- RENDER LOGIC ---
  if (loading) return <LoadingScreen />;
  if (!data) return <LoginScreen onLogin={fetchData} error={error} />;

  // --- MAIN WRAP ---
  return (
    <main className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-white no-scrollbar">
      {/* Page 1 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-100 to-transparent opacity-50 z-10"></div> */}

        <img
          src="/shantiniketan.jpg"
          alt="Shantiniketan"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center w-20">
          <svg
            viewBox="0 0 90 57"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto text-green-900 drop-shadow-xl"
          >
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
          <div className="w-full flex justify-between items-center mt-0.5">
            {"REWIND".split("").map((char, i) => (
              <span key={i} className="font-m font-semibold text-green-900 text-[16px] leading-none">{char}</span>
            ))}
          </div>
          <div className="w-full flex justify-between items-center mt-1">
            {"2025".split("").map((char, i) => (
              <span key={i} className="font-n font-medium text-green-900 text-[31px] leading-none">{char}</span>
            ))}
          </div>
        </div>

        <div className="absolute top-68 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            {/* <p className="font-n text-neutral-500 text-lg font-medium tracking-wide">Hey</p> */}
            <h1 className="font-me text-green-900 text-[45px]">{data?.agent_name?.toUpperCase() || 'AGENT'}</h1>
            <p className="font-m text-neutral-500 text-lg font-medium">
              Ready for your rewind? <br />
              Let's replay your year.
            </p>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="z-10 animate-bounce pointer-events-none mb-24 text-white">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <DownloadPageButton pageNumber={1} />
        <ButtonBar projectName="Prestige Shantiniketan" pageNumber={1} showTutorial={true} />
      </section>

      {/* Page 2 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>

        {/* <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-50 to-transparent opacity-50 z-10"></div> */}
        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-orange-500 text-[120px] leading-none mb-2">{data?.days_active || 0}</p>
            <p className="font-n text-neutral-500 text-lg font-medium tracking-wide">
              days active on the platform
            </p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              That's {Math.round(((data?.days_active || 0) / 365) * 100)}% of the year
            </p>
          </div>
        </div>
        <img
          src="/velincia.jpg"
          alt="Velincia"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={2} showTutorial={true} />
        <ButtonBar projectName="Brigade Valencia" pageNumber={2} />
      </section>

      {/* Page 3 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        {/* <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-50 to-transparent opacity-50 z-10"></div> */}
        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[120px] leading-none mb-2">{data?.longest_streak || 0}</p>
            {(data?.longest_streak || 0) > 1 ? (
              <>
                <p className="font-n text-neutral-500 text-lg font-medium tracking-wide">days in a row. You came</p>
                <p className="font-n text-neutral-500 text-lg font-medium leading-tight">
                  every day from {data?.streak_start_date || '-'} to {data?.streak_end_date || '-'}
                </p>
              </>
            ) : (
              <>
                <p className="font-n text-neutral-500 text-lg font-medium tracking-wide">day,</p>
                <p className="font-n text-neutral-500 text-lg font-medium leading-tight">
                  Your longest streak was on {data?.streak_end_date || '-'}
                </p>
              </>
            )}
          </div>
        </div>
        <img
          src="/lake%20tarrece.jpg"
          alt="Lake Terrace"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={3} />
        <ButtonBar projectName="Embassy Lake Terraces" pageNumber={3} />
      </section>

      {/* Page 4 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-40 left-0 w-full px-6 z-10 flex flex-col items-start">
          <p className="font-n text-neutral-500 text-lg font-medium w-full text-left">You were most active in</p>
          <h3 className="font-me text-orange-500 text-4xl mb-12 w-full text-left">{activeMonth}</h3>

          <div className="flex flex-col w-full ">
            {[[0, 1, 2], [3, 4, 5], [6, 7], [8, 9], [10], [11]].map((row, i) => (
              <div key={i} className="flex justify-start w-full mb-3">
                {row.map(m => {
                  const monthData = (data?.activity_data || Array.from({ length: 12 }).map(() => Array.from({ length: 31 })))[m];
                  const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];
                  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];

                  return (
                    <div key={m} className="flex flex-col px-1 mx-1 py-1 w-1/3 bg-white/30 backdrop-blur-sm rounded-lg">
                      <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-1">{monthName}</span>
                      <div className="flex flex-wrap gap-0.5">
                        {(monthData as number[]).slice(0, daysInMonth).map((count, d) => (
                          <div
                            key={d}
                            className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-orange-500' : 'bg-neutral-300'}`}
                            title={`Day: ${d + 1}, Count: ${count}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <img
          src="/exocita.jpg"
          alt="Exocita"
          className="w-full absolute pl-32 bottom-0 object-cover object-bottom pointer-events-none select-none translate-x-0"
        />
        <DownloadPageButton pageNumber={4} />
        <ButtonBar projectName="Brigade Exotica" pageNumber={4} />
      </section>

      {/* Page 5 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[45px] mb-2">{validZone?.top_zone || 'North'}</p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              {validZone?.top_zone_pct || 0}% of your activity is in this zone
            </p>
          </div>
        </div>
        <img
          src="/tata.jpg"
          alt="Tata"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={5} />
        <ButtonBar projectName="Tata Promont" pageNumber={5} />
      </section>

      {/* Page 6 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-40 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-orange-500 text-[45px] mb-2">{weeklyStats?.maxDay || 'Wednesday'}</p>
            <p className="font-n text-neutral-500 text-lg font-medium tracking-wide">Your most active day of the week</p>
          </div>
        </div>

        {/* Dynamic Bars rising behind the image */}
        <div className="absolute bottom-52 left-0 w-full h-[40%] flex items-end justify-between gap-3 px-14 z-0">
          {weeklyStats?.counts.map((count, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <div
                className="w-full z-40 bg-gradient-to-b from-orange-500/30 to-transparent border border-orange-500 rounded-t-lg transition-all duration-1000 flex flex-col items-center justify-start pt-3 gap-1 overflow-hidden"
                style={{ height: `${(count / (Math.max(...(weeklyStats?.counts || [1]))) || 0) * 100}%`, minHeight: '30px' }}
              >
                {weeklyStats?.dayNames[i].split('').map((char, ci) => (
                  <span key={ci} className="text-orange-500/90 text-[10px] font-medium leading-none">{char}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <img
          src="/crystal.png"
          alt="Crystal Medows"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none z-10"
        />
        <DownloadPageButton pageNumber={6} />
        <ButtonBar projectName="Sobha Crystal Meadows" pageNumber={6} />
      </section>

      {/* Page 7 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[38px] break-words w-full mb-2">{micromarketStats?.names}</p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              Your most active {micromarketStats?.names.includes(',') ? 'micromarkets' : 'micromarket'} with {micromarketStats?.pct}% of all activity
            </p>
          </div>
        </div>
        <img
          src="/phoenixkessaku.jpg"
          alt="Phoenix Kessaku"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={7} />
        <ButtonBar projectName="Phoenix Kessaku" pageNumber={7} />
      </section>

      {/* Page 8 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-orange-500 text-[100px] leading-none mb-2">
              {agentStats?.displayPct || 0}%
            </p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              {agentStats?.displayAction}
            </p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              {agentStats?.styleLabel}
            </p>
          </div>
        </div>
        <img
          src="/royalpav.jpg"
          alt="Royal Pavilion"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={8} />
        <ButtonBar projectName="Sobha Royal Pavilion" pageNumber={8} />
      </section>

      {/* Page 9 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[100px] leading-none mb-2">{agentStats?.dealTypePct || 0}%</p>
            <p className="font-n text-neutral-500 text-lg font-medium">
              of your work was in {agentStats?.dealTypeLabel}
            </p>
          </div>
        </div>
        <img
          src="/adarsh.jpg"
          alt="Adarsh Palm Retreat"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={9} />
        <ButtonBar projectName="Adarsh Palm Retreat" pageNumber={9} />
      </section>

      {/* Page 10 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-orange-500 text-[80px] leading-tight mb-2">{agentStats?.formattedPrice}</p>
            <p className="font-n text-neutral-500 text-lg font-medium leading-tight">
              {agentStats?.priceSubtitle}
            </p>
          </div>
        </div>
        <img
          src="/totalenv.jpg"
          alt="Total Environment"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={10} />
        <ButtonBar projectName="Pursuit of a Radical Rhapsody" pageNumber={10} />
      </section>

      {/* Page 11 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[60px] break-words w-full">{assetStats.name}</p>
            <p className="font-n text-neutral-500 text-lg font-medium mt-4">
              This was your most active asset type
            </p>
          </div>
        </div>
        <img
          src="/edenpark.jpg"
          alt="Eden Park"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={11} />
        <ButtonBar projectName="Eden park @ The Prestige City" pageNumber={11} />
      </section>

      {/* Page 12 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>


        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-orange-500 text-[50px] break-words w-full">
              {data?.bestie_name
                ? data.bestie_name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : 'Partner'}
            </p>
            <p className="font-n text-neutral-500 text-lg font-medium mt-4">
              You interacted most with them this year
            </p>
          </div>
        </div>
        <img
          src="/totalenviron.jpg"
          alt="Total Environment"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <DownloadPageButton pageNumber={12} />
        <ButtonBar projectName="In That Quiet Earth" pageNumber={12} />
      </section>

      {/* Page 13 */}
      <section className="w-full h-full snap-start relative overflow-hidden flex flex-col justify-end items-center">
        {/* ACN Logo for screenshot */}
        <div id="capture-logo" className="hidden absolute top-12 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none bg-white/20 backdrop-blur-xl border border-white/50 rounded-3xl px-6 py-4 shadow-lg">
          <svg viewBox="0 0 90 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-auto text-green-900 drop-shadow-md">
            <path d="M60.516 23.292L53.212 27.692C51.8333 25.932 50.044 24.9053 47.844 24.612V16.12C50.3667 16.296 52.7427 17.0147 54.972 18.276C57.2013 19.5373 59.0493 21.2093 60.516 23.292ZM60.516 43.268C59.0493 45.3507 57.2013 47.0227 54.972 48.284C52.7427 49.5453 50.3667 50.264 47.844 50.44V41.948C50.044 41.6547 51.8333 40.628 53.212 38.868L60.516 43.268ZM45.644 50.44C41.244 50.1467 37.46 48.3133 34.292 44.94C31.124 41.5667 29.54 37.68 29.54 33.28C29.54 28.88 31.124 24.9933 34.292 21.62C37.46 18.2467 41.244 16.4133 45.644 16.12V24.612C43.5613 24.9053 41.772 25.9027 40.276 27.604C38.78 29.3053 38.032 31.1973 38.032 33.28C38.032 35.3627 38.78 37.2547 40.276 38.956C41.772 40.6573 43.5613 41.6547 45.644 41.948V50.44ZM87.5062 35.304L79.0142 26.284V16.56H87.5062V35.304ZM87.5062 50H84.8662L64.2742 28.132V16.56H66.8702L87.5062 38.516V50ZM72.7662 50H64.2742V31.344L72.7662 40.364V50Z" fill="currentColor" />
            <path d="M29.7844 50H20.9404L19.9724 46.832H13.2404L15.9244 38.34H17.3324L11.8764 20.828L13.4604 16.56H17.6844L29.7844 50ZM14.3404 36.228L10.0724 50H1.22836L10.5124 24.304L14.3404 36.228Z" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute top-60 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center w-full px-4 gap-6">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4">
            <p className="font-me font-medium text-green-900 text-[60px] leading-tight">That's 2025!</p>
            <p className="font-n text-neutral-500 text-lg font-medium tracking-wide pt-4">See you in 2026</p>
            <p className="font-n text-neutral-500 text-lg font-medium tracking-wide px-8 leading-relaxed">
              Share your rewind on social media and don't forget to tag us
            </p>
          </div>
          <div className="flex justify-center">
            <DownloadAllButton />
          </div>
        </div>
        <img
          src="/snn.jpg"
          alt="SNN"
          className="w-full absolute bottom-0 object-cover object-bottom pointer-events-none select-none"
        />
        <ButtonBar projectName="SNN Clermont" pageNumber={13} />
      </section>
    </main>

  );
}







