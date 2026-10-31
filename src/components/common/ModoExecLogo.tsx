import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  markOnly?: boolean;
  color?: string;
}

/**
 * Modo eXec® Official Geometric Mark
 * Faithfully matches the brand visual guide in Acid Lime (#D7FF3F)
 */
export const ModoExecMark: React.FC<{ className?: string; color?: string; size?: number }> = ({
  className = 'w-6 h-6',
  color = '#D7FF3F',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 100 80"
      className={`${className} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      {/* Left polygon - vertical stem with diagonal chevron cut */}
      <path
        d="M 2 14 L 40 34 L 40 60 L 20 49 L 20 70 L 2 80 Z"
        fill={color}
      />
      {/* Right polygon - forward arrow facet with notch */}
      <path
        d="M 46 8 L 86 28 L 86 54 L 46 74 L 46 52 L 63 41 L 46 30 Z"
        fill={color}
      />
    </svg>
  );
};

/**
 * Modo eXec® App Icon (Squircle container with mark)
 */
export const ModoExecAppIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-9 h-9',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div
      className={`relative rounded-xl bg-[#101114] border border-white/10 flex items-center justify-center shadow-lg shadow-black/40 overflow-hidden shrink-0 ${className}`}
      style={style}
    >
      <ModoExecMark className="w-6 h-6" color="#D7FF3F" />
    </div>
  );
};

/**
 * Full Brand Lockup: Mark + "Modo eXec®"
 */
export const ModoExecLogo: React.FC<LogoProps> = ({
  className = 'h-8',
  markOnly = false,
  color = '#D7FF3F'
}) => {
  if (markOnly) {
    return <ModoExecMark className={className} color={color} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <ModoExecMark className="w-7 h-7 sm:w-8 sm:h-8" color={color} />
      <div className="flex flex-col leading-none">
        <span className="font-display font-bold tracking-tight text-white text-[15px] sm:text-[16px] flex items-center gap-0.5">
          Modo <span className="text-[#D7FF3F]">eXec</span>
          <span className="text-[9px] text-[#8D9298] font-normal align-top ml-0.5">®</span>
        </span>
        <span className="text-[10px] text-[#8D9298] font-medium tracking-wider uppercase mt-0.5 hidden xs:inline">
          Menos desculpas. Mais execução.
        </span>
      </div>
    </div>
  );
};

export default ModoExecLogo;
