import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'motion/react';

// Default aerodynamic arrowhead cursor matching Framer Smoothcursor
const DefaultCursorSVG: React.FC<{ invertColors?: boolean; accentGlow?: boolean }> = ({
  invertColors = false
}) => {
  const innerColor = invertColors ? '#ffffff' : '#0d1224';
  const outerColor = invertColors ? '#0d1224' : '#ffffff';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 50 54"
      fill="none"
      className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
    >
      <g filter="url(#magic_cursor_shadow)">
        {/* Aerodynamic Arrow Body */}
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill={innerColor}
        />
        {/* Contrast Outline */}
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke={outerColor}
          strokeWidth="2.2"
        />
        {/* Subtle orange-amber core dot */}
        <circle cx="25.5" cy="24" r="2.2" fill="#F4B900" />
      </g>
      <defs>
        <filter
          id="magic_cursor_shadow"
          x="0.6"
          y="0.95"
          width="49"
          height="52.4"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>
    </svg>
  );
};

interface SmoothCursorProps {
  cursorSize?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  hideSystemCursor?: boolean;
  enableClickEffect?: boolean;
}

export const SmoothCursor: React.FC<SmoothCursorProps> = ({
  cursorSize = 36,
  stiffness = 400,
  damping = 42,
  mass = 0.9,
  hideSystemCursor = true,
  enableClickEffect = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  // Springs matching Framer Smoothcursor physics
  const cursorX = useSpring(-100, { stiffness, damping, mass });
  const cursorY = useSpring(-100, { stiffness, damping, mass });
  const rotation = useSpring(0, { stiffness: 320, damping: 55 });
  const scale = useSpring(1, { stiffness: 500, damping: 32 });

  const lastMousePos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(Date.now());
  const previousAngle = useRef(0);
  const accumulatedRotation = useRef(0);
  const rafId = useRef<number | null>(null);
  const isMouseDown = useRef(false);

  // 1. Mobile & Touch Screen Detection (Disable on mobile devices & touch screens)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDevice = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isMobileWidth || isTouch) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 2. Motion, Velocity, Rotation & Click Mechanics
  useEffect(() => {
    if (typeof window === 'undefined' || !isVisible) {
      document.body.style.cursor = 'auto';
      return;
    }

    const updateVelocity = (currentPos: { x: number; y: number }) => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime.current;
      if (deltaTime > 0) {
        velocity.current = {
          x: (currentPos.x - lastMousePos.current.x) / deltaTime,
          y: (currentPos.y - lastMousePos.current.y) / deltaTime
        };
      }
      lastUpdateTime.current = currentTime;
      lastMousePos.current = currentPos;
    };

    const smoothMouseMove = (e: MouseEvent) => {
      const currentPos = { x: e.clientX, y: e.clientY };
      updateVelocity(currentPos);

      const speed = Math.sqrt(Math.pow(velocity.current.x, 2) + Math.pow(velocity.current.y, 2));

      cursorX.set(currentPos.x);
      cursorY.set(currentPos.y);

      // Check if hovering clickable element
      const target = e.target as HTMLElement | null;
      const isClickable = !!(
        target &&
        (target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('[role="button"]') ||
          target.closest('[role="tab"]') ||
          target.closest('.cursor-pointer'))
      );
      setIsHoveringClickable(isClickable);

      // Dynamic rotation following movement vector
      if (speed > 0.1) {
        const currentAngle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI) + 90;
        let angleDiff = currentAngle - previousAngle.current;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        accumulatedRotation.current += angleDiff;
        rotation.set(accumulatedRotation.current);
        previousAngle.current = currentAngle;

        // Slight speed squish when moving fast
        if (!isMouseDown.current) {
          scale.set(isClickable ? 1.15 : 0.96);
          setTimeout(() => {
            if (!isMouseDown.current) scale.set(isClickable ? 1.15 : 1);
          }, 140);
        }
      } else {
        if (!isMouseDown.current) {
          scale.set(isClickable ? 1.15 : 1);
        }
      }
    };

    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        smoothMouseMove(e);
        rafId.current = null;
      });
    };

    // Click Effects
    const handleMouseDown = () => {
      isMouseDown.current = true;
      if (enableClickEffect) scale.set(0.72);
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      if (enableClickEffect) scale.set(isHoveringClickable ? 1.15 : 1);
    };

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.cursor = 'auto';
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [cursorX, cursorY, rotation, scale, isVisible, enableClickEffect, isHoveringClickable]);

  // Synchronize native cursor hiding class cleanly on document.body
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isVisible && hideSystemCursor) {
      document.body.classList.add('hide-native-cursor');
    } else {
      document.body.classList.remove('hide-native-cursor');
    }
    return () => {
      document.body.classList.remove('hide-native-cursor');
    };
  }, [isVisible, hideSystemCursor]);

  // Don't render on mobile or touch screens
  if (!isVisible) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: cursorX,
        y: cursorY,
        rotate: rotation,
        scale: scale,
        zIndex: 9999999,
        pointerEvents: 'none',
        willChange: 'transform',
        width: cursorSize,
        height: cursorSize,
        marginLeft: -cursorSize / 2,
        marginTop: -cursorSize / 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <DefaultCursorSVG invertColors={false} />
    </motion.div>
  );
};
