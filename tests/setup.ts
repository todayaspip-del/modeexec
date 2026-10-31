// Stubs de APIs de navegador que o jsdom não implementa.
(window as any).matchMedia ??= (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
(window as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(window as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ''; thresholds = []; };
window.scrollTo = (() => {}) as any;
HTMLMediaElement.prototype.play = (() => Promise.resolve()) as any;
HTMLMediaElement.prototype.pause = (() => {}) as any;
HTMLMediaElement.prototype.load = (() => {}) as any;
