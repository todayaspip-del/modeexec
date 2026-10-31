import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../../assets/images';
import {
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  Droplets,
  ShieldAlert,
  Wind,
  Thermometer,
  Clock as ClockIcon,
  Sun as SunIcon,
  MapPin,
  RefreshCw
} from 'lucide-react';

export interface CityWeatherInfo {
  id: string;
  cityName: string;
  countryName: string;
  displayLabel: string;
  timeZone: string;
  tzName: string;
  condition: 'sunny' | 'partlyCloudy' | 'cloudy' | 'rainy' | 'storm';
  conditionText: string;
  tempC: number;
  feelsLikeC: number;
  highC: number;
  lowC: number;
  humidity: number;
  windSpeed: string;
  uvIndex: string;
  airQualityScore: number;
  airQualityText: string;
  hourlyPop: number[];
}

export const CITIES_DATABASE: Record<string, CityWeatherInfo> = {
  newyork: {
    id: 'newyork',
    cityName: 'New York',
    countryName: 'USA',
    displayLabel: 'New York / USA',
    timeZone: 'America/New_York',
    tzName: 'EDT',
    condition: 'partlyCloudy',
    conditionText: 'Partly Cloudy',
    tempC: 21,
    feelsLikeC: 21,
    highC: 25,
    lowC: 16,
    humidity: 52,
    windSpeed: '4.5 m/s',
    uvIndex: 'UV 4',
    airQualityScore: 42,
    airQualityText: 'Moderate',
    hourlyPop: [15, 10, 60, 80, 20, 10]
  },
  saopaulo: {
    id: 'saopaulo',
    cityName: 'São Paulo',
    countryName: 'Brazil',
    displayLabel: 'São Paulo / Brazil',
    timeZone: 'America/Sao_Paulo',
    tzName: 'BRT',
    condition: 'partlyCloudy',
    conditionText: 'Parcialmente Nublado',
    tempC: 23,
    feelsLikeC: 23,
    highC: 26,
    lowC: 17,
    humidity: 64,
    windSpeed: '4.2 m/s',
    uvIndex: 'UV 6',
    airQualityScore: 46,
    airQualityText: 'Moderate',
    hourlyPop: [20, 25, 20, 10, 5, 0]
  },
  riodejaneiro: {
    id: 'riodejaneiro',
    cityName: 'Rio de Janeiro',
    countryName: 'Brazil',
    displayLabel: 'Rio de Janeiro / Brazil',
    timeZone: 'America/Sao_Paulo',
    tzName: 'BRT',
    condition: 'sunny',
    conditionText: 'Sunny',
    tempC: 28,
    feelsLikeC: 30,
    highC: 31,
    lowC: 22,
    humidity: 68,
    windSpeed: '5.1 m/s',
    uvIndex: 'UV 8',
    airQualityScore: 28,
    airQualityText: 'Good',
    hourlyPop: [0, 5, 10, 5, 0, 0]
  },
  london: {
    id: 'london',
    cityName: 'London',
    countryName: 'UK',
    displayLabel: 'London / UK',
    timeZone: 'Europe/London',
    tzName: 'BST',
    condition: 'rainy',
    conditionText: 'Rain Showers',
    tempC: 14,
    feelsLikeC: 13,
    highC: 16,
    lowC: 9,
    humidity: 82,
    windSpeed: '4.8 m/s',
    uvIndex: 'UV 2',
    airQualityScore: 26,
    airQualityText: 'Good',
    hourlyPop: [65, 70, 55, 40, 30, 20]
  },
  tokyo: {
    id: 'tokyo',
    cityName: 'Tokyo',
    countryName: 'Japan',
    displayLabel: 'Tokyo / Japan',
    timeZone: 'Asia/Tokyo',
    tzName: 'JST',
    condition: 'sunny',
    conditionText: 'Clear Sky',
    tempC: 19,
    feelsLikeC: 19,
    highC: 22,
    lowC: 13,
    humidity: 58,
    windSpeed: '2.8 m/s',
    uvIndex: 'UV 4',
    airQualityScore: 22,
    airQualityText: 'Good',
    hourlyPop: [0, 0, 5, 10, 5, 0]
  }
};

// High-fidelity 3D-styled glossy weather icons matching Attachment 1 & 2
export const GlossyWeatherIcon: React.FC<{
  type: CityWeatherInfo['condition'];
  isNight?: boolean;
  className?: string;
  size?: number;
}> = ({ type, isNight = false, className = '', size = 44 }) => {
  if (type === 'sunny' && isNight) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="16" fill="url(#moonGrad)" />
        <circle cx="40" cy="24" r="14" fill="#0f1422" opacity="0.9" />
        <defs>
          <linearGradient id="moonGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E2E8F0" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'sunny' && !isNight) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <circle cx="32" cy="32" r="16" fill="url(#sunGrad)" filter="drop-shadow(0px 4px 8px rgba(251, 146, 60, 0.45))" />
        <defs>
          <radialGradient id="sunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26 24) rotate(48) scale(22)">
            <stop stopColor="#FDE047" />
            <stop offset="0.55" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#EA580C" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'rainy') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        {/* Soft dark cloud */}
        <path
          d="M44 40H22a10 10 0 01-1.7-19.8A14 14 0 0147 24.2 9 9 0 0144 40z"
          fill="url(#rainCloudGrad)"
          filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.3))"
        />
        {/* Rain streaks */}
        <line x1="24" y1="44" x2="21" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="33" y1="44" x2="30" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1="44" x2="39" y2="52" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="rainCloudGrad" x1="16" y1="16" x2="48" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94A3B8" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'storm') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <path
          d="M44 38H22a10 10 0 01-1.7-19.8A14 14 0 0147 22.2 9 9 0 0144 38z"
          fill="url(#stormCloudGrad)"
        />
        <polygon points="32,38 27,47 33,47 29,56 39,44 33,44" fill="#FBBF24" />
        <defs>
          <linearGradient id="stormCloudGrad" x1="16" y1="16" x2="48" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#64748B" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Default: Partly Cloudy (Exact visual in Attachment 1 and 2: Sun sphere behind fluffy cloud)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Sun peeking out from behind */}
      <circle cx="36" cy="25" r="13" fill="url(#partlySunGrad)" />
      {/* Front fluffy glossy white/silver cloud */}
      <path
        d="M46 44H20a10 10 0 01-1.2-19.9 13.5 13.5 0 0125.7-2.6A9.5 9.5 0 0146 44z"
        fill="url(#frontCloudGrad)"
        filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.25))"
      />
      <defs>
        <radialGradient id="partlySunGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 20) rotate(50) scale(18)">
          <stop stopColor="#FDE047" />
          <stop offset="0.6" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EA580C" />
        </radialGradient>
        <linearGradient id="frontCloudGrad" x1="16" y1="18" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface WeatherClockWidgetProps {
  className?: string;
  defaultCity?: string;
}

export const WeatherClockWidget: React.FC<WeatherClockWidgetProps> = ({
  className = '',
  defaultCity = 'newyork'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(defaultCity);
  const [activeTab, setActiveTab] = useState<'weather' | 'clock'>('weather');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Real-time ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const city = CITIES_DATABASE[selectedCityId] || CITIES_DATABASE.newyork;

  // Real-world dynamic background photo reflecting weather conditions (Attachment 3)
  const bgPhoto = useMemo(() => {
    if (city.condition === 'rainy' || city.condition === 'storm') {
      return ASSETS.weatherRainStorm;
    }
    // Check night vs day
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timeZone,
        hour: 'numeric',
        hour12: false
      });
      const h = parseInt(formatter.format(now), 10);
      if (h < 6 || h >= 19) {
        return ASSETS.weatherClearNight;
      }
    } catch {
      // fallback
    }
    return ASSETS.weatherPartlyCloudy;
  }, [city, now]);

  // City time and formatted dates matching Attachment 1 & 2
  const timeInfo = useMemo(() => {
    try {
      // Time formatted like "03:59"
      const timeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const timeStr = timeFmt.format(now);

      // Date formatted like "TUE, OCT 06" (exact format from Attachment 1 & 2)
      const dateFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timeZone,
        weekday: 'short',
        month: 'short',
        day: '2-digit'
      });
      const parts = dateFmt.formatToParts(now);
      const weekday = (parts.find((p) => p.type === 'weekday')?.value || 'TUE').toUpperCase();
      const month = (parts.find((p) => p.type === 'month')?.value || 'OCT').toUpperCase();
      const day = parts.find((p) => p.type === 'day')?.value || '06';
      const dateBadge = `${weekday}, ${month} ${day}`;

      // Hour number for forecast
      const hourFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timeZone,
        hour: 'numeric',
        hour12: false
      });
      const currentHour = parseInt(hourFmt.format(now), 10);

      // Full digital clock
      const fullTimeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const fullTimeStr = fullTimeFmt.format(now);

      return {
        timeStr,
        dateBadge,
        currentHour,
        fullTimeStr,
        isNight: currentHour < 6 || currentHour >= 19
      };
    } catch {
      return {
        timeStr: '03:59',
        dateBadge: 'TUE, OCT 06',
        currentHour: 15,
        fullTimeStr: '03:59:00 PM',
        isNight: false
      };
    }
  }, [now, city.timeZone]);

  // Hourly forecast for next hours (Now, 4 PM, 5 PM, 6 PM, 7 PM, 8 PM)
  const hourlyItems = useMemo(() => {
    const startHour = timeInfo.currentHour;
    return Array.from({ length: 6 }).map((_, idx) => {
      if (idx === 0) {
        return {
          label: 'Now',
          isNow: true,
          temp: `${city.tempC}°`,
          type: city.condition,
          isNight: timeInfo.isNight
        };
      }
      const h = (startHour + idx) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const isHNight = h < 6 || h >= 19;
      const pop = city.hourlyPop[idx] ?? 10;
      const hourCondition: CityWeatherInfo['condition'] =
        pop > 60 ? 'storm' : pop > 40 ? 'rainy' : pop > 20 ? 'cloudy' : 'partlyCloudy';
      const delta = idx === 1 ? 1 : idx === 2 ? -2 : idx === 3 ? 3 : idx === 4 ? -3 : 0;

      return {
        label: `${displayH} ${ampm}`,
        isNow: false,
        temp: `${city.tempC + delta}°`,
        type: hourCondition,
        isNight: isHNight
      };
    });
  }, [timeInfo.currentHour, timeInfo.isNight, city]);

  // Calendar cells for clock view
  const calendarDays = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    const cells = Array.from({ length: totalCells }).map((_, i) => {
      const d = i - firstDayIndex + 1;
      return d >= 1 && d <= daysInMonth ? d : null;
    });
    const monthName = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { cells, today, monthName };
  }, [now]);

  return (
    <div className={`relative ${className}`}>
      {/* Main Animated Box */}
      <motion.div
        layout
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="relative overflow-hidden rounded-[26px] border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.5)] cursor-pointer select-none"
      >
        {/* ========================================================================= */}
        {/* REAL-WORLD MOODY BACKGROUND PHOTO (Reflecting Weather Conditions - Att 3) */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 z-0">
          <img
            src={bgPhoto}
            alt="Atmospheric weather sky background"
            className="w-full h-full object-cover object-center filter brightness-60 contrast-125"
          />
          {/* Subtle dark gradient overlay to ensure 100% contrast & readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#121622]/85 via-[#101420]/80 to-[#0c0f18]/92" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 text-white">
          <AnimatePresence mode="wait">
            {/* ===================================================================== */}
            {/* ATTACHMENT 1: COLLAPSED STATE (EXACT VISUAL STRUCTURE)                */}
            {/* ===================================================================== */}
            {!isExpanded ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setIsExpanded(true)}
                className="w-full max-w-[320px] p-4 sm:p-5 flex flex-col justify-between"
              >
                {/* Top Row: "New York · 03:59" on left, Date pill on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold tracking-tight">
                    <span className="text-white font-extrabold">{city.cityName}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/70 font-mono tabular-nums font-semibold">
                      {timeInfo.timeStr}
                    </span>
                  </div>

                  {/* Date Pill: Calendar icon + TUE, OCT 06 (exact Attachment 1) */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/8 text-[11px] font-bold text-[#D7FF3F] font-mono tracking-tight">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#D7FF3F]" />
                    <span>{timeInfo.dateBadge}</span>
                  </div>
                </div>

                {/* Bottom Row: Weather Icon + "21°C" + "Partly Cloudy" */}
                <div className="flex items-center gap-3.5 mt-3 sm:mt-4">
                  <div className="shrink-0 drop-shadow-md">
                    <GlossyWeatherIcon type={city.condition} isNight={timeInfo.isNight} size={46} />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-baseline font-mono tracking-tight leading-none">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        {city.tempC}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-[#D7FF3F] ml-0.5">
                        °C
                      </span>
                    </div>
                    <span className="text-xs sm:text-[13px] text-white/70 font-medium mt-1 leading-tight">
                      {city.conditionText}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ===================================================================== */
              /* ATTACHMENT 2: EXPANDED STATE (EXACT VISUAL STRUCTURE)                 */
              /* ===================================================================== */
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-[360px] p-4 sm:p-5 flex flex-col gap-3.5"
              >
                {/* Header Row: City & Date on Left, Weather/Clock Pills on Right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    {/* Live green beacon + City Name with dropdown trigger */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCityDropdownOpen(!cityDropdownOpen);
                        }}
                        className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-white hover:text-white/90 cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#D7FF3F] shadow-[0_0_8px_rgba(215,255,63,0.8)] shrink-0" />
                        <span className="font-extrabold">{city.displayLabel}</span>
                        <ChevronDown className="w-3 h-3 text-white/50" />
                      </button>

                      {/* City Dropdown Menu */}
                      <AnimatePresence>
                        {cityDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            className="absolute left-0 top-full mt-2 w-48 rounded-2xl bg-[#16181D]/98 backdrop-blur-xl border border-white/15 p-1 shadow-2xl z-50 space-y-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Object.values(CITIES_DATABASE).map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCityId(c.id);
                                  setCityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  selectedCityId === c.id
                                    ? 'bg-[#D7FF3F]/20 text-[#D7FF3F] font-bold'
                                    : 'text-white/80 hover:bg-white/10'
                                }`}
                              >
                                <span>{c.displayLabel}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Date subtitle: 📅 TUE, OCT 06 (Attachment 2) */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D7FF3F] font-mono">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#D7FF3F]" />
                      <span>{timeInfo.dateBadge}</span>
                    </div>
                  </div>

                  {/* Weather vs Clock Segmented Control (Attachment 2) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center p-0.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs shrink-0"
                  >
                    <button
                      onClick={() => setActiveTab('weather')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'weather'
                          ? 'bg-[#D7FF3F] text-[#101114] shadow-sm'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <SunIcon className="w-3 h-3 fill-current" />
                      <span>Weather</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('clock')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        activeTab === 'clock'
                          ? 'bg-[#D7FF3F] text-[#101114] shadow-sm font-bold'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <ClockIcon className="w-3 h-3" />
                      <span>Clock</span>
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT */}
                {activeTab === 'weather' ? (
                  <>
                    {/* Temperature & High/Low Block (Attachment 2) */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Left: Weather Icon + 21°C + Partly Cloudy */}
                      <div className="flex items-center gap-3">
                        <GlossyWeatherIcon type={city.condition} isNight={timeInfo.isNight} size={48} />
                        <div>
                          <div className="flex items-baseline font-mono tracking-tight leading-none">
                            <span className="text-3xl sm:text-4xl font-extrabold text-white">
                              {city.tempC}
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-[#D7FF3F] ml-0.5">
                              °C
                            </span>
                          </div>
                          <span className="text-xs text-white/70 font-medium mt-0.5 block">
                            {city.conditionText}
                          </span>
                        </div>
                      </div>

                      {/* Right: H: 25° L: 16° + Feels like 21°C */}
                      <div className="text-right font-mono text-xs">
                        <div className="space-x-1 font-bold">
                          <span className="text-rose-400">H: {city.highC}°</span>
                          <span className="text-[#D7FF3F]">L: {city.lowC}°</span>
                        </div>
                        <div className="text-[11px] text-white/60 mt-1 font-sans">
                          Feels like {city.feelsLikeC}°C
                        </div>
                      </div>
                    </div>

                    {/* 4 Metric Cards Grid (2x2) matching Attachment 2 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Card 1: Humidity with green progress bar */}
                      <div className="p-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/6 space-y-2">
                        <div className="flex items-center justify-between text-white/80">
                          <span className="flex items-center gap-1.5 font-medium text-xs">
                            <Droplets className="w-3.5 h-3.5 text-[#D7FF3F]" />
                            <span>Humidity</span>
                          </span>
                          <span className="font-mono font-bold text-white text-xs">
                            {city.humidity}%
                          </span>
                        </div>
                        {/* Green progress bar */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D7FF3F] rounded-full"
                            style={{ width: `${city.humidity}%` }}
                          />
                        </div>
                      </div>

                      {/* Card 2: Air Quality with Moderate badge */}
                      <div className="p-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/6 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-white/80 text-xs">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            <span>Air Quality</span>
                          </span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {city.airQualityScore}
                          </span>
                        </div>
                        <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 w-fit">
                          {city.airQualityText}
                        </span>
                      </div>

                      {/* Card 3: Feels Like */}
                      <div className="p-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/6 space-y-1">
                        <span className="flex items-center gap-1.5 font-medium text-white/80 text-xs">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Feels Like</span>
                        </span>
                        <div className="font-mono font-bold text-white text-sm">
                          {city.feelsLikeC}°C
                        </div>
                      </div>

                      {/* Card 4: Wind & UV */}
                      <div className="p-3 rounded-2xl bg-black/35 backdrop-blur-md border border-white/6 space-y-1">
                        <span className="flex items-center gap-1.5 font-medium text-white/80 text-xs">
                          <Wind className="w-3.5 h-3.5 text-purple-400" />
                          <span>Wind & UV</span>
                        </span>
                        <div className="font-mono font-bold text-white text-sm truncate">
                          {city.windSpeed}
                        </div>
                      </div>
                    </div>

                    {/* Hourly Forecast Section (Attachment 2) */}
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 font-bold block">
                        HOURLY FORECAST
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {hourlyItems.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col items-center justify-between p-2 rounded-xl min-w-[50px] h-[76px] text-center border shrink-0 transition-transform ${
                              item.isNow
                                ? 'bg-black/50 border-[#D7FF3F]/50 shadow-sm'
                                : 'bg-black/30 border-white/6'
                            }`}
                          >
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                item.isNow ? 'text-[#D7FF3F]' : 'text-white/60'
                              }`}
                            >
                              {item.label}
                            </span>
                            <GlossyWeatherIcon type={item.type} isNight={item.isNight} size={22} />
                            <span className="text-xs font-mono font-bold text-white">
                              {item.temp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* CLOCK & CALENDAR VIEW */
                  <div className="space-y-3 pt-1">
                    <div className="text-center p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/8">
                      <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-white tabular-nums">
                        {timeInfo.fullTimeStr}
                      </div>
                      <span className="text-[11px] text-white/60 font-medium">
                        {city.cityName} • {city.tzName}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/8 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{calendarDays.monthName}</span>
                        <span className="text-[#D7FF3F] font-mono text-[11px]">
                          Today: {calendarDays.today}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 text-center text-[10px] font-mono text-white/40 font-bold">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                          <span key={i}>{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {calendarDays.cells.map((day, i) => {
                          const isToday = day === calendarDays.today;
                          return (
                            <div
                              key={i}
                              className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[11px] font-mono ${
                                isToday
                                  ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-sm'
                                  : day === null
                                  ? 'text-transparent'
                                  : 'text-white/70'
                              }`}
                            >
                              {day ?? ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Click to collapse (Attachment 2) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="w-full py-1 text-center text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 font-medium"
                >
                  <span>Click to collapse</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
