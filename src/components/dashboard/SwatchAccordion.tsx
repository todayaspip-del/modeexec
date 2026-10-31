import React, { useRef, useState, useEffect, useCallback, useId } from 'react';

export interface SwatchItem {
  id?: string;
  title: string;
  description?: string;
  tags?: string | string[];
  color?: string;
  colorOpen?: string;
  focus?: number;
  button?: string;
  link?: string;
  newTab?: boolean;
  onButtonClick?: () => void;
  // Custom slot for interactive content if desired
  content?: React.ReactNode;
}

export interface SwatchAccordionProps {
  items?: SwatchItem[];
  openItem?: number; // 1-based index (e.g., 1 opens item 0)
  trigger?: 'hover' | 'click';
  stripLink?: boolean;
  autoplay?: boolean;
  interval?: number;
  direction?: 'auto' | 'horizontal' | 'vertical';
  stripWidth?: number;
  barHeight?: number;
  numbers?: boolean;
  titleTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  padding?: string;
  gap?: string;
  radius?: string;
  transition?: {
    type?: string;
    duration?: number;
    bounce?: number;
    delay?: number;
    stiffness?: number;
    damping?: number;
    mass?: number;
    ease?: string;
  };
  style?: React.CSSProperties;
  className?: string;
  onSelect?: (index: number) => void;
}

/* ------------------------------------------------------------------ icons */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function graphemes(text: string): string[] {
  const Seg = typeof Intl !== 'undefined' ? (Intl as any).Segmenter : undefined;
  if (Seg) {
    return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (s: any) => s.segment);
  }
  return Array.from(text);
}

/**
 * Splits a title into words (they rise) and letters (they sharpen one after another).
 * Letters stay inline, so the font keeps its kerning.
 */
function SplitTitle({ text }: { text: string }) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let c = 0;
  return (
    <span aria-hidden="true">
      {words.map((word, wi) => (
        <React.Fragment key={wi}>
          <span className="swa-w" style={{ '--wi': String(wi) } as React.CSSProperties}>
            {graphemes(word).map((ch, k) => (
              <span key={k} className="swa-c" style={{ '--c': String(c++) } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </span>
  );
}

function countChars(text: string): number {
  return Math.max(1, String(text || '').replace(/\s+/g, '').length);
}

function pad2(n: number): string {
  return n < 9 ? `0${n + 1}` : `${n + 1}`;
}

function parseBox(value: string | undefined, fallback: string) {
  const parts = String(value || fallback).trim().split(/\s+/).filter(Boolean);
  const [t, r = t, b = t, l = r] = parts.length ? parts : [fallback];
  return { t, r, b, l };
}

const NAMED_EASE: Record<string, string> = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  circIn: 'cubic-bezier(0.55, 0, 1, 0.45)',
  circOut: 'cubic-bezier(0, 0.55, 0.45, 1)',
  circInOut: 'cubic-bezier(0.85, 0, 0.15, 1)',
  backIn: 'cubic-bezier(0.31, 0.01, 0.66, -0.59)',
  backOut: 'cubic-bezier(0.33, 1.53, 0.69, 0.99)',
  backInOut: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
};
const FALLBACK_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function toCssTransition(t?: SwatchAccordionProps['transition']) {
  const delay = Math.max(0, Number(t?.delay) || 0);
  if (t && t.type && t.type !== 'spring') {
    const ease = NAMED_EASE[t.ease || ''] || FALLBACK_EASE;
    return { ease, fallback: ease, duration: Math.max(0.05, Number(t.duration) || 0.6), delay };
  }
  let omega: number;
  let zeta: number;
  if (t && Number.isFinite(t.stiffness) && Number.isFinite(t.damping)) {
    const mass = Number(t.mass) || 1;
    omega = Math.sqrt(Math.max(1, t.stiffness!) / mass);
    zeta = Math.max(0.05, t.damping! / (2 * Math.sqrt(Math.max(1, t.stiffness!) * mass)));
  } else {
    const d = Math.max(0.1, Number(t?.duration) || 0.7);
    zeta = Math.min(1, Math.max(0.05, 1 - (Number.isFinite(t?.bounce) ? t!.bounce! : 0.12)));
    omega = zeta >= 1 ? 6.64 / d : Math.log(100 / Math.sqrt(1 - zeta * zeta)) / (zeta * d);
  }
  const x = (time: number) => {
    if (zeta >= 1) return 1 - (1 + omega * time) * Math.exp(-omega * time);
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * time) * (Math.cos(wd * time) + (zeta * omega / wd) * Math.sin(wd * time));
  };
  let total = 0.05;
  while (total < 4) {
    let settled = true;
    for (let k = 0; k <= 10; k++) {
      if (Math.abs(1 - x(total + k * 0.02)) > 0.001) {
        settled = false;
        break;
      }
    }
    if (settled) break;
    total += 0.02;
  }
  const steps = 40;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = i === steps ? 1 : x((total * i) / steps);
    pts.push(String(Math.round(v * 1e4) / 1e4));
  }
  return { ease: `linear(${pts.join(', ')})`, fallback: FALLBACK_EASE, duration: total, delay };
}

/* ------------------------------------------------------------------ CSS stylesheet from Framer */
/* Note: Excluding full photo backgrounds and heavy gradients as explicitly requested ("excluding the background styles", clean look) while keeping ALL functional animations, physics, compression, stagger, hover fill, and layout */
const CSS = `
.swa {
  container-type: inline-size;
  container-name: swa;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  -webkit-font-smoothing: antialiased;
  --swa-out: cubic-bezier(.22, 1, .36, 1);
  --swa-pop: cubic-bezier(.34, 1.45, .64, 1);
  --swa-reveal: calc(var(--swa-delay) + var(--swa-dur) * .26);
  --swa-return: calc(var(--swa-delay) + var(--swa-dur) * .34);
}
.swa *, .swa *::before, .swa *::after {
  box-sizing: border-box;
}
.swa[data-auto-height] {
  height: auto;
}
.swa-track {
  display: flex;
  flex-direction: row;
  row-gap: var(--swa-gap-row);
  column-gap: var(--swa-gap);
  width: 100%;
  height: 100%;
}
.swa[data-auto-height] .swa-track {
  height: auto;
  min-height: 320px;
}
.swa-strip {
  --swa-open-w: calc(100cqw - (var(--swa-n) - 1) * (var(--swa-closed) + var(--swa-gap)));
  position: relative;
  flex: 0 0 var(--swa-closed);
  min-width: 0;
  min-height: 0;
  border-radius: var(--swa-radius);
  overflow: hidden;
  isolation: isolate;
  background-color: var(--swa-color, #13190E);
  border: 1px solid rgba(215, 255, 63, 0.22);
  transition-property: flex-grow, flex-basis, height, border-color, background-color, box-shadow;
  transition-duration: var(--swa-dur);
  transition-delay: var(--swa-delay);
  transition-timing-function: var(--swa-ease-fallback);
  -webkit-tap-highlight-color: transparent;
}
@supports (transition-timing-function: linear(0, 1)) {
  .swa-strip {
    transition-timing-function: var(--swa-ease);
  }
}
.swa-strip[data-open] {
  flex-grow: 1;
  border-color: #D7FF3F;
  background-color: var(--swa-color-open, #D7FF3F);
  box-shadow: 0 16px 40px -10px rgba(215, 255, 63, 0.35);
}
.swa-strip::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 6;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 0 rgba(255,255,255,.15);
}
.swa-trigger {
  appearance: none;
  -webkit-appearance: none;
  position: absolute;
  inset: 0;
  z-index: 2;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: inherit;
  cursor: pointer;
  outline: none;
}
.swa-strip[data-open] .swa-trigger {
  cursor: default;
}
.swa-trigger:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.95), inset 0 0 0 4px var(--swa-text);
}
.swa-strip-link {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: pointer;
  border-radius: inherit;
}
/* closed strip: number, title and plus leave at once and return one after another */
.swa-closed {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: min(100%, calc(var(--swa-closed) + 14px));
  z-index: 4;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: var(--swa-pt) 0 calc(var(--swa-pb) + 3px);
}
.swa-num {
  display: inline-flex;
  align-items: center;
  height: 30px;
  font-size: var(--swa-label-size);
  color: #D7FF3F;
  opacity: .85;
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.swa-closed .swa-num {
  transition: opacity .5s ease var(--swa-return), transform .7s var(--swa-out) var(--swa-return);
}
.swa-strip[data-open] .swa-closed .swa-num {
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity .14s ease, transform .3s ease;
}
.swa-strip[data-open] .swa-num {
  color: #101114 !important;
  opacity: 1 !important;
  font-weight: 800;
}
.swa-vt {
  display: flex;
  margin-top: auto;
  margin-bottom: 18px;
  transition: opacity .55s ease calc(var(--swa-return) + 60ms), transform .9s var(--swa-out) calc(var(--swa-return) + 60ms), filter .55s ease calc(var(--swa-return) + 60ms);
}
.swa-strip[data-open] .swa-vt {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(6px);
  transition: opacity .18s ease, transform .32s cubic-bezier(.4, 0, 1, 1), filter .18s ease;
}
.swa-vtitle {
  font-size: var(--swa-strip-size);
  color: #D7FF3F;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  transition: transform .5s var(--swa-out), color .3s ease;
}
.swa-plw {
  display: grid;
  transition: transform .8s var(--swa-pop) calc(var(--swa-return) + 120ms);
}
.swa-strip[data-open] .swa-plw {
  transform: scale(.55) rotate(45deg);
  transition: transform .34s cubic-bezier(.4, 0, .2, 1);
}
.swa-plus {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  color: #D7FF3F;
  background: rgba(215, 255, 63, .12);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  backdrop-filter: blur(14px) saturate(1.4);
  border: 1px solid rgba(215, 255, 63, .35);
  box-shadow: 0 1px 1px rgba(215, 255, 63, .15) inset, 0 6px 18px -10px rgba(0, 0, 0, .5);
  transition: opacity .4s ease calc(var(--swa-return) + 120ms), transform .45s var(--swa-out);
}
.swa-strip[data-open] .swa-plus {
  opacity: 0;
  transition: opacity .2s ease .08s, transform .45s var(--swa-out);
}
/* hover fill: a layer rises from the bottom and carries its own icon */
.swa-pf {
  position: absolute;
  inset: -1px;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: #D7FF3F;
  color: #101114;
  clip-path: inset(100% 0 0 0);
  -webkit-clip-path: inset(100% 0 0 0);
  transition: clip-path .45s var(--swa-out), -webkit-clip-path .45s var(--swa-out);
}
.swa-strip[data-open] .swa-pf {
  clip-path: inset(0 0 0 0);
  -webkit-clip-path: inset(0 0 0 0);
  transition: clip-path .3s var(--swa-out), -webkit-clip-path .3s var(--swa-out);
}
.swa-pi {
  display: block;
  transition: transform .6s var(--swa-out);
}
/* open panel: laid out at its final width so nothing re-wraps while the strip moves */
.swa-open {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--swa-open-w);
  z-index: 5;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--swa-pt) var(--swa-pr) var(--swa-pb) var(--swa-pl);
  visibility: hidden;
  transform: translateY(-8px);
  transition: transform .36s ease, visibility 0s linear .36s;
}
.swa-strip[data-open] .swa-open {
  visibility: visible;
  transform: none;
  transition: none;
  pointer-events: auto;
}
/* pin text and labels to the edge of the strip that does not move */
.swa:not([data-dir="vertical"]) .swa-strip[data-pin="end"] .swa-open,
.swa:not([data-dir="vertical"]) .swa-strip[data-pin="end"] .swa-closed {
  left: auto;
  right: 0;
}
/* reveal: number, tags, title words, text, button and arrow arrive one after another */
.swa-rv {
  display: block;
  opacity: 0;
  transform: translateY(14px);
  filter: blur(6px);
  transition: opacity .2s ease, filter .2s ease, transform 0s linear .36s;
}
.swa-strip[data-open] .swa-rv {
  opacity: 1;
  transform: none;
  filter: none;
  transition: opacity .6s ease, transform .9s var(--swa-out), filter .6s ease;
  transition-delay: calc(var(--swa-reveal) + var(--d, 0ms));
}
.swa-rv-num {
  --d: 0ms;
  display: inline-flex;
}
.swa-rv-desc {
  --d: calc(120ms + min(var(--cn, 8) * 20ms, 260ms));
}
.swa-rc {
  opacity: 0;
  transform: translateY(10px) scale(.97);
  transform-origin: 0 50%;
  transition: opacity .2s ease, transform 0s linear .36s;
}
.swa-strip[data-open] .swa-rc {
  opacity: 1;
  transform: none;
  transition: opacity .55s ease, transform .9s var(--swa-out);
  transition-delay: calc(var(--swa-reveal) + 200ms + min(var(--cn, 8) * 20ms, 260ms));
}
.swa-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
}
.swa-tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  margin: 0;
  padding: 0;
  max-width: 70%;
}
.swa-tag {
  display: inline-flex;
  align-items: center;
  height: 28px;
  font-size: var(--swa-label-size);
  line-height: 1;
  color: var(--swa-text);
  padding: 0 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: rgba(255, 255, 255, .08);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  backdrop-filter: blur(14px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, .15);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .2s ease, transform 0s linear .36s;
}
.swa-strip[data-open] .swa-tag {
  opacity: 1;
  transform: none;
  color: #101114 !important;
  background: rgba(16, 17, 20, 0.12) !important;
  border: 1px solid rgba(16, 17, 20, 0.25) !important;
  font-weight: 700;
  transition: opacity .55s ease, transform .85s var(--swa-out);
  transition-delay: calc(var(--swa-reveal) + 70ms + var(--i, 0) * 60ms);
}
.swa-content {
  width: min(540px, 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.swa-title {
  margin: 0 0 12px;
  font-size: var(--swa-title-size);
  color: var(--swa-text);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-wrap: balance;
}
.swa-strip[data-open] .swa-title {
  color: #101114 !important;
}
.swa-w {
  display: inline-block;
  white-space: nowrap;
  transform: translateY(.3em);
  transition: transform 0s linear .36s;
}
.swa-strip[data-open] .swa-w {
  transform: none;
  color: #101114 !important;
  transition: transform 1.1s var(--swa-out) calc(var(--swa-reveal) + var(--wi, 0) * 60ms);
}
.swa-c {
  opacity: 0;
  filter: blur(10px);
  transition: opacity .2s ease, filter .2s ease;
}
.swa-strip[data-open] .swa-c {
  opacity: 1;
  filter: none;
  color: #101114 !important;
  transition: opacity .5s ease, filter .65s ease;
  transition-delay: calc(var(--swa-reveal) + var(--c, 0) * 22ms);
}
.swa-desc {
  margin: 0 0 16px;
  font-size: var(--swa-body-size);
  color: var(--swa-text);
  opacity: .85;
  max-width: 44ch;
  line-height: 1.5;
  text-wrap: pretty;
}
.swa-strip[data-open] .swa-desc {
  color: #101114 !important;
  opacity: 0.92 !important;
  font-weight: 500;
}
.swa-custom-slot {
  width: 100%;
  margin-top: 10px;
}
.swa-cta {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 0 18px 0 20px;
  border-radius: 999px;
  background: var(--swa-btn);
  color: var(--swa-btn-text);
  text-decoration: none;
  font-size: calc(var(--swa-body-size) * .9);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: transform .2s ease, filter .2s ease, background-color .2s ease, color .2s ease;
  box-shadow: 0 8px 20px -8px rgba(0, 0, 0, .4);
  cursor: pointer;
  border: none;
}
.swa-strip[data-open] .swa-cta {
  background: #101114 !important;
  color: #D7FF3F !important;
  border: none !important;
  box-shadow: 0 8px 24px -6px rgba(16, 17, 20, 0.45) !important;
}
.swa-strip[data-open] .swa-cta:hover {
  background: #16181D !important;
  color: #ffffff !important;
}
.swa-strip[data-open] .swa-cta svg {
  color: #D7FF3F !important;
}
.swa-strip[data-open] .swa-cta:hover svg {
  color: #ffffff !important;
}
.swa-cta:hover {
  filter: brightness(1.08);
}
.swa-cta svg {
  flex: none;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity .2s ease, transform 0s linear .36s;
}
.swa-strip[data-open] .swa-cta svg {
  opacity: 1;
  transform: none;
  transition: opacity .45s ease, transform .8s var(--swa-out);
  transition-delay: calc(var(--swa-reveal) + 380ms + min(var(--cn, 8) * 20ms, 260ms));
}
.swa-cta-static {
  pointer-events: auto;
}
.swa-cta:focus-visible {
  outline: 2px solid #101114;
  outline-offset: 3px;
}
a.swa-cta:active, button.swa-cta:active {
  transform: scale(.97);
}
.swa-progress {
  position: absolute;
  left: var(--swa-pl);
  right: var(--swa-pr);
  bottom: 12px;
  z-index: 6;
  height: 2px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .1);
  overflow: hidden;
  pointer-events: none;
  animation: swa-fade .6s ease both;
  animation-delay: calc(var(--swa-reveal) + 300ms);
}
@keyframes swa-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.swa-progress i {
  display: block;
  height: 100%;
  width: 100%;
  background: #D7FF3F;
  transform-origin: left center;
  transform: scaleX(0);
  animation-name: swa-progress;
  animation-timing-function: linear;
  animation-fill-mode: both;
  animation-delay: calc(var(--swa-reveal) + 300ms);
}
.swa-strip[data-open] .swa-progress {
  background: rgba(16, 17, 20, 0.18) !important;
}
.swa-strip[data-open] .swa-progress i {
  background: #101114 !important;
}
@keyframes swa-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.swa-trigger:active ~ .swa-closed .swa-plus {
  transform: scale(.9);
}

@media (hover: hover) and (pointer: fine) {
  .swa-strip:not([data-open]):hover {
    flex-basis: calc(var(--swa-closed) + 14px);
    border-color: rgba(215, 255, 63, 0.6);
    background-color: #182212;
  }
  .swa-strip:not([data-open]):hover .swa-pf {
    clip-path: inset(0 0 0 0);
    -webkit-clip-path: inset(0 0 0 0);
  }
  .swa-strip:not([data-open]):hover .swa-pi {
    transform: rotate(90deg);
  }
  .swa-strip:not([data-open]):hover .swa-vtitle {
    transform: rotate(180deg) translateX(4px);
    color: #ffffff;
  }
}

/* vertical: stacked bars (forced, or automatically on narrow containers) */
.swa[data-dir="vertical"] .swa-track {
  flex-direction: column;
}
.swa[data-dir="vertical"] .swa-strip {
  flex: 0 0 var(--swa-bar);
}
.swa[data-dir="vertical"] .swa-strip[data-open] {
  flex-grow: 1;
}
.swa[data-dir="vertical"] .swa-closed {
  width: auto;
  right: 0;
  flex-direction: row;
  justify-content: flex-start;
  gap: 14px;
  padding: 0 14px 0 20px;
}
.swa[data-dir="vertical"] .swa-vt {
  margin: 0 auto 0 0;
}
.swa[data-dir="vertical"] .swa-vtitle {
  writing-mode: horizontal-tb;
  transform: none;
}
.swa[data-dir="vertical"] .swa-strip[data-open] .swa-vt {
  transform: translateY(8px);
}
.swa[data-dir="vertical"] .swa-strip {
  --swa-reveal: calc(var(--swa-delay) + var(--swa-dur) * .42);
}
.swa[data-dir="vertical"] .swa-open {
  width: auto;
  right: 0;
}
.swa[data-dir="vertical"] .swa-num {
  min-width: 22px;
}
.swa[data-dir="vertical"][data-auto-height] .swa-track {
  aspect-ratio: auto;
}
.swa[data-dir="vertical"][data-auto-height] .swa-strip {
  flex: none;
  height: var(--swa-bar);
  transition-property: height, border-color, background-color;
}
.swa[data-dir="vertical"][data-auto-height] .swa-strip[data-open] {
  height: auto;
  min-height: 280px;
}

@container swa (max-width: 920px) {
  .swa:not([data-dir="vertical"]) .swa-title {
    font-size: calc(var(--swa-title-size) * .82);
    margin-bottom: 10px;
  }
  .swa:not([data-dir="vertical"]) .swa-desc {
    margin-bottom: 14px;
  }
  .swa:not([data-dir="vertical"]) .swa-content {
    width: 100%;
  }
}

@container swa (max-width: 800px) {
  .swa-tags {
    display: none;
  }
}

@container swa (max-width: 640px) {
  .swa[data-dir="auto"] .swa-track {
    flex-direction: column;
  }
  .swa[data-dir="auto"] .swa-strip {
    flex: 0 0 var(--swa-bar);
  }
  .swa[data-dir="auto"] .swa-strip[data-open] {
    flex-grow: 1;
  }
  .swa[data-dir="auto"] .swa-closed {
    width: auto;
    right: 0;
    flex-direction: row;
    justify-content: flex-start;
    gap: 14px;
    padding: 0 14px 0 20px;
  }
  .swa[data-dir="auto"] .swa-vt {
    margin: 0 auto 0 0;
  }
  .swa[data-dir="auto"] .swa-vtitle {
    writing-mode: horizontal-tb;
    transform: none;
  }
  .swa[data-dir="auto"] .swa-strip[data-open] .swa-vt {
    transform: translateY(8px);
  }
  .swa[data-dir="auto"] .swa-strip {
    --swa-reveal: calc(var(--swa-delay) + var(--swa-dur) * .42);
  }
  .swa[data-dir="auto"] .swa-open {
    width: auto;
    right: 0;
  }
  .swa[data-dir="auto"] .swa-strip[data-pin="end"] .swa-open,
  .swa[data-dir="auto"] .swa-strip[data-pin="end"] .swa-closed {
    left: 0;
    right: 0;
  }
  .swa[data-dir="auto"] .swa-num {
    min-width: 22px;
  }
  .swa[data-dir="auto"][data-auto-height] .swa-track {
    aspect-ratio: auto;
  }
  .swa[data-dir="auto"][data-auto-height] .swa-strip {
    flex: none;
    height: var(--swa-bar);
    transition-property: height, border-color, background-color;
  }
  .swa[data-dir="auto"][data-auto-height] .swa-strip[data-open] {
    height: auto;
    min-height: 280px;
  }
  .swa-title {
    font-size: calc(var(--swa-title-size) * .7);
    margin-bottom: 10px;
  }
  .swa-desc {
    margin-bottom: 14px;
  }
  .swa-open {
    padding: calc(var(--swa-pt) * .75) calc(var(--swa-pr) * .75) calc(var(--swa-pb) * .75) calc(var(--swa-pl) * .75);
  }
  .swa-tags {
    display: none;
  }
  .swa-progress {
    left: calc(var(--swa-pl) * .75);
    right: calc(var(--swa-pr) * .75);
  }
}

@media (hover: hover) and (pointer: fine) {
  .swa[data-dir="vertical"] .swa-strip:not([data-open]):hover {
    flex-basis: calc(var(--swa-bar) + 8px);
  }
  .swa[data-dir="vertical"] .swa-strip:not([data-open]):hover .swa-vtitle {
    transform: translateX(4px);
  }
}
@container swa (max-width: 640px) {
  @media (hover: hover) and (pointer: fine) {
    .swa[data-dir="auto"] .swa-strip:not([data-open]):hover {
      flex-basis: calc(var(--swa-bar) + 8px);
    }
    .swa[data-dir="auto"] .swa-strip:not([data-open]):hover .swa-vtitle {
      transform: translateX(4px);
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .swa *, .swa *::before, .swa *::after {
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
  }
}
`;

/**
 * SwatchAccordion - Complete clone of Framer component:
 * https://framer.com/m/SwatchAccordion-NZuH6I.js@4miBrmfbWBnqRQwPirzU
 *
 * All animations, physics, spring curves, compression, hover timers,
 * keyboard accessibility, vertical categories, and staggered word reveals preserved.
 */
export const SwatchAccordion: React.FC<SwatchAccordionProps> = ({
  items = [],
  openItem = 1,
  trigger = 'hover',
  stripLink = false,
  autoplay = false,
  interval = 5,
  direction = 'auto',
  stripWidth = 84,
  barHeight = 56,
  numbers = true,
  titleTag: Heading = 'h3',
  textColor = '#101114',
  buttonColor = '#101114',
  buttonTextColor = '#D7FF3F',
  padding = '24px',
  gap = '8px',
  radius = '20px',
  transition = { type: 'spring', duration: 0.75, bounce: 0.1, delay: 0 },
  style,
  className = '',
  onSelect,
}) => {
  const count = items.length;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hoverTimer = useRef<number | null>(null);

  const initial = Math.min(Math.max(Math.round(openItem) - 1, 0), count - 1);
  const [{ active, prev }, setOpenState] = useState({ active: initial, prev: initial });

  const setActive = useCallback(
    (next: number | ((prevVal: number) => number)) => {
      setOpenState((s) => {
        const value = typeof next === 'function' ? next(s.active) : next;
        if (value === s.active) return s;
        if (onSelect) onSelect(value);
        return { active: value, prev: s.active };
      });
    },
    [onSelect]
  );

  const [hoverPause, setHoverPause] = useState(false);
  const [focusPause, setFocusPause] = useState(false);
  const paused = hoverPause || focusPause;
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setOpenState({ active: initial, prev: initial });
  }, [initial]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const open = useCallback(
    (index: number) => {
      setCycle((c) => c + 1);
      setActive(index);
    },
    [setActive]
  );

  const advance = useCallback(() => {
    setCycle((c) => c + 1);
    setActive((a) => (a + 1) % count);
  }, [count, setActive]);

  const onStripEnter = (e: React.PointerEvent, index: number) => {
    if (trigger !== 'hover' || e.pointerType !== 'mouse') return;
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null;
      open(index);
    }, 110);
  };

  const onStripLeave = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % count;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next >= 0) {
      e.preventDefault();
      triggerRefs.current[next]?.focus();
    }
  };

  const t = toCssTransition(transition);
  const pad = parseBox(padding, '24px');
  const gapParts = String(gap || '8px').trim().split(/\s+/).filter(Boolean);
  const rowGap = gapParts[0] || '8px';
  const colGap = gapParts[1] || rowGap;

  const autoHeight = !(style && (style.height === '100%' || typeof style.height === 'number'));

  const rootStyle: React.CSSProperties = {
    ...style,
    position: 'relative',
    color: textColor,
    ['--swa-n' as any]: String(count),
    ['--swa-closed' as any]: `${Math.max(40, stripWidth)}px`,
    ['--swa-bar' as any]: `${Math.max(40, barHeight)}px`,
    ['--swa-gap' as any]: colGap,
    ['--swa-gap-row' as any]: rowGap,
    ['--swa-radius' as any]: radius,
    ['--swa-pt' as any]: pad.t,
    ['--swa-pr' as any]: pad.r,
    ['--swa-pb' as any]: pad.b,
    ['--swa-pl' as any]: pad.l,
    ['--swa-text' as any]: textColor,
    ['--swa-btn' as any]: buttonColor,
    ['--swa-btn-text' as any]: buttonTextColor,
    ['--swa-title-size' as any]: '24px',
    ['--swa-strip-size' as any]: '13px',
    ['--swa-body-size' as any]: '14px',
    ['--swa-label-size' as any]: '11px',
    ['--swa-dur' as any]: `${t.duration}s`,
    ['--swa-delay' as any]: `${t.delay}s`,
    ['--swa-ease' as any]: t.ease,
    ['--swa-ease-fallback' as any]: t.fallback,
  };

  const autoplayOn = autoplay && count > 1;

  return (
    <div
      ref={rootRef}
      className={`swa ${className}`}
      data-dir={direction}
      data-auto-height={autoHeight ? '' : undefined}
      style={rootStyle}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverPause(true)}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setHoverPause(false);
        onStripLeave();
      }}
      onFocus={(e) => {
        let keyboard = true;
        try {
          keyboard = (e.target as any).matches(':focus-visible');
        } catch (err) {}
        setFocusPause(keyboard);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusPause(false);
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="swa-track">
        {items.map((item, index) => {
          const isOpen = index === active;
          const pinEnd =
            (isOpen && index > prev) || (index === prev && !isOpen && index > active);
          const tags = Array.isArray(item.tags)
            ? item.tags
            : String(item.tags || '').split(',').map((s) => s.trim()).filter(Boolean);
          const linked = Boolean(item.link && item.link.trim().length > 0);
          const triggerId = `swa-${uid}-t${index}`;
          const panelId = `swa-${uid}-p${index}`;
          const headingId = `swa-${uid}-h${index}`;
          const stripStyle: React.CSSProperties = {
            ['--swa-color' as any]: item.color || '#13190E',
            ['--swa-color-open' as any]: item.colorOpen || '#D7FF3F',
          };

          return (
            <div
              key={item.id || index}
              className="swa-strip"
              data-open={isOpen ? '' : undefined}
              data-pin={pinEnd ? 'end' : undefined}
              style={stripStyle}
              onPointerEnter={(e) => onStripEnter(e, index)}
              onPointerLeave={onStripLeave}
            >
              {/* Invisible clickable trigger */}
              <button
                ref={(el) => {
                  triggerRefs.current[index] = el;
                }}
                id={triggerId}
                type="button"
                className="swa-trigger"
                aria-label={item.title || `Item ${index + 1}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => open(index)}
                onKeyDown={(e) => onKeyDown(e, index)}
              />

              {isOpen && stripLink && linked ? (
                <a
                  className="swa-strip-link"
                  href={item.link}
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.newTab ? 'noopener noreferrer' : undefined}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              ) : null}

              {/* Closed strip: Number, Vertical title, Glass Plus button */}
              <div className="swa-closed" aria-hidden="true">
                {numbers ? <span className="swa-num">{pad2(index)}</span> : <span />}

                <span className="swa-vt">
                  <span className="swa-vtitle">{item.title}</span>
                </span>

                <span className="swa-plw">
                  <span className="swa-plus">
                    <PlusIcon className="swa-pi" />
                    <span className="swa-pf">
                      <PlusIcon className="swa-pi" />
                    </span>
                  </span>
                </span>
              </div>

              {/* Open panel */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                className="swa-open"
                style={{ ['--cn' as any]: String(countChars(item.title)) }}
                {...(isOpen ? {} : ({ inert: '', 'aria-hidden': true } as any))}
              >
                {/* Top bar: Number + Tags */}
                <div className="swa-top">
                  {numbers ? (
                    <span className="swa-rv swa-rv-num" aria-hidden="true">
                      <span className="swa-num">{pad2(index)}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  {tags.length > 0 && (
                    <ul className="swa-tags" aria-label="Tags">
                      {tags.map((tag, i) => (
                        <li
                          key={i}
                          className="swa-tag"
                          style={{ ['--i' as any]: String(i) }}
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Content: Title, Description, Custom action/content */}
                <div className="swa-content">
                  <Heading
                    id={headingId}
                    className="swa-title"
                    aria-label={item.title || undefined}
                  >
                    <SplitTitle text={item.title} />
                  </Heading>

                  {item.description ? (
                    <div className="swa-rv swa-rv-desc">
                      <p className="swa-desc">{item.description}</p>
                    </div>
                  ) : null}

                  {item.content ? (
                    <div className="swa-custom-slot">
                      {item.content}
                    </div>
                  ) : null}

                  {item.button && item.button.trim() ? (
                    <div className="swa-rc">
                      {linked ? (
                        <a
                          className="swa-cta"
                          href={item.link}
                          target={item.newTab ? '_blank' : undefined}
                          rel={item.newTab ? 'noopener noreferrer' : undefined}
                          onClick={item.onButtonClick}
                        >
                          <span>{item.button}</span>
                          <ArrowIcon />
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="swa-cta swa-cta-static"
                          onClick={item.onButtonClick}
                        >
                          <span>{item.button}</span>
                          <ArrowIcon />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Autoplay progress bar */}
                {autoplayOn && isOpen ? (
                  <div className="swa-progress" aria-hidden="true">
                    <i
                      style={{
                        animationDuration: `${Math.max(1, interval)}s`,
                        animationPlayState: paused ? 'paused' : 'running',
                      }}
                      onAnimationEnd={advance}
                      key={`${index}-${cycle}`}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
