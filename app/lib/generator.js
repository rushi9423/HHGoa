/**
 * Deterministic auto-generation logic for Builder ID Cards.
 * Same name + role + timestamp → same output every time.
 */

const CLASS_WORDS = [
  'NOTORIOUS', 'RELENTLESS', 'CHAOTIC-GOOD', 'UNSTOPPABLE',
  'ROGUE', 'LEGENDARY', 'FEARLESS', 'UNDEFEATED',
  'MAVERICK', 'VICIOUS', 'PHANTOM', 'APEX'
];

const TITLE_ADJECTIVES = [
  'Chaos-Driven', 'Relentless', 'Sleep-Deprived', 'Caffeine-Fueled',
  'Late-Night', 'Sunburnt', 'Terminal-Obsessed', 'Beach-Coded',
  'Zero-Day', 'Overclocked', 'Ship-First', 'Moonlit'
];

const TITLE_NOUNS_BY_ROLE = {
  'cybersecurity': ['Security Wizard', 'Threat Hunter', 'Exploit Alchemist', 'Firewall Breaker'],
  'ai/ml': ['Model Whisperer', 'Neural Alchemist', 'Data Sorcerer', 'Tensor Tamer'],
  'full stack': ['Stack Slinger', 'Full Stack Wizard', 'Endpoint Architect', 'Deploy King'],
  'hardware': ['Circuit Bender', 'Solder Sorcerer', 'Signal Hacker', 'Board Whisperer'],
  'design': ['Pixel Perfectionist', 'UX Shaman', 'Design Architect', 'Visual Sorcerer'],
  'product': ['Ship-It Specialist', 'Roadmap Oracle', 'Feature Alchemist', 'MVP Maestro'],
  'blockchain': ['Chain Wizard', 'Smart Contract Sage', 'DeFi Architect', 'Block Breaker'],
  'devops': ['Pipeline Wizard', 'Cloud Summoner', 'Deploy Demon', 'Infra Alchemist'],
  'mobile dev': ['App Architect', 'Native Ninja', 'Screen Sorcerer', 'Touch Wizard'],
  'data science': ['Data Alchemist', 'Insight Oracle', 'Stats Sorcerer', 'Pattern Hunter'],
  'default': ['Code Wizard', 'Build Machine', 'Ship-It Specialist', 'Hack Lord'],
};

/**
 * Simple string hash → integer seed (deterministic)
 */
export function seedFromInput(name, role, timestamp = '') {
  const str = `${name.toLowerCase().trim()}|${role.toLowerCase().trim()}|${timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Pick from array using seed (deterministic)
 */
function pickFromArray(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length];
}

/**
 * Generate Builder Class (single bold word)
 */
export function generateBuilderClass(name, role) {
  const seed = seedFromInput(name, role);
  return pickFromArray(CLASS_WORDS, seed);
}

/**
 * Generate Builder Title (adjective + role-flavored noun)
 */
export function generateBuilderTitle(name, role) {
  const seed = seedFromInput(name, role);
  const roleKey = role.toLowerCase().trim();
  const nouns = TITLE_NOUNS_BY_ROLE[roleKey] || TITLE_NOUNS_BY_ROLE['default'];
  const adj = pickFromArray(TITLE_ADJECTIVES, seed, 3);
  const noun = pickFromArray(nouns, seed, 7);
  return `${adj} ${noun}`;
}

/**
 * Generate Builder ID number — NOW HANDLED SERVER-SIDE via /api/builder-id
 * These are kept as stubs for backward compatibility but should not be used.
 * The real sequential ID comes from the API.
 */
export function generateBuilderId() {
  return ''; // Server-assigned
}

export function generateShortId() {
  return ''; // Server-assigned
}

/**
 * Format today's date as DD MMM YYYY
 */
export function getIssuedDate() {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

