/* ===== HH Goa 2026 Brand Token Reference =====
 * This file documents all brand tokens.
 * Actual CSS variables are defined in globals.css.
 * 
 * Colors:
 * --hhg-green:      #0d3b2e  (Primary background - deep forest green)
 * --hhg-green-light: #145c47
 * --hhg-green-dark:  #082a20
 * --hhg-yellow:      #f5d020  (Accent headlines, borders, numerals)
 * --hhg-yellow-dark:  #f1ab33
 * --hhg-pink:        #ec1e6b  (Hindi badge, hashtag chip, highlights)
 * --hhg-pink-light:  #f34b8c
 * --hhg-cream:       #f6efe0  (Off-white for light cards)
 * --hhg-cream-dark:  #e8dcc8
 * --hhg-cyan:        #00f0ff  (Cyber Goa neon)
 * --hhg-cyan-dark:   #00b8c4
 * --hhg-terracotta:  #c45a3c  (Old Goa heritage)
 * --hhg-terracotta-light: #d4764a
 * --hhg-gold:        #d4a84b  (Arambol sunset)
 * 
 * Typography:
 * Display: Anton (closest free match to HACKER HOUSE wordmark bold condensed)
 * Body/Labels: Space Mono (monospace, matches 2:47 PM STUDIO style)
 * 
 * Frame Styles:
 * 1. Goa Palms — cream/green, palm trees, beach
 * 2. Cyber Goa — dark green, neon cyan/pink circuits
 * 3. Arambol — golden sunset, warm palette
 * 4. Old Goa — heritage terracotta, azulejo tiles
 */

export const BRAND = {
  colors: {
    green: '#0d3b2e',
    greenLight: '#145c47',
    greenDark: '#082a20',
    yellow: '#f5d020',
    yellowDark: '#f1ab33',
    pink: '#ec1e6b',
    pinkLight: '#f34b8c',
    cream: '#f6efe0',
    creamDark: '#e8dcc8',
    cyan: '#00f0ff',
    cyanDark: '#00b8c4',
    terracotta: '#c45a3c',
    terracottaLight: '#d4764a',
    gold: '#d4a84b',
  },
  event: {
    name: 'HACKER HOUSE',
    location: 'GOA, INDIA',
    dates: '28–31 OCT 2026',
    studio: '2:47 PM STUDIO',
    hashtag: '#FrameInGoa',
    year: '2026',
    badge: 'HHG',
  },
};

export const FRAME_STYLES = [
  {
    id: 'goa-palms',
    name: 'Goa Palms',
    subtitle: 'Classic Paradise',
    bg: '#0d3b2e',
    accent: '#f5d020',
    secondary: '#f6efe0',
    textColor: '#f6efe0',
    frameBorder: '#f5d020',
    chipBg: '#ec1e6b',
    photoOverlayAlpha: 0,
  },
  {
    id: 'cyber-goa',
    name: 'Cyber Goa',
    subtitle: 'Neon Cyan',
    bg: '#082a20',
    accent: '#00f0ff',
    secondary: '#f34b8c',
    textColor: '#00f0ff',
    frameBorder: '#00f0ff',
    chipBg: '#f34b8c',
    photoOverlayAlpha: 0.15,
  },
  {
    id: 'arambol',
    name: 'Arambol',
    subtitle: 'Golden Sunset',
    bg: '#1a3a2a',
    accent: '#d4a84b',
    secondary: '#f5d020',
    textColor: '#f6efe0',
    frameBorder: '#d4a84b',
    chipBg: '#ec1e6b',
    photoOverlayAlpha: 0.08,
  },
  {
    id: 'old-goa',
    name: 'Old Goa',
    subtitle: 'Portuguese Heritage',
    bg: '#1a2f28',
    accent: '#c45a3c',
    secondary: '#d4a84b',
    textColor: '#f6efe0',
    frameBorder: '#c45a3c',
    chipBg: '#ec1e6b',
    photoOverlayAlpha: 0.05,
  },
];

export const ROLES = [
  'Cybersecurity',
  'AI/ML',
  'Full Stack',
  'Hardware',
  'Design',
  'Product',
  'Blockchain',
  'DevOps',
  'Mobile Dev',
  'Data Science',
];
