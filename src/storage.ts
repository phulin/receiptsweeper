// Common English words used as human-readable storage keys
const WORDS = [
  "apple", "baker", "candy", "delta", "eagle", "fable", "grain", "haven",
  "ivory", "jolly", "knack", "lemon", "maple", "noble", "olive", "pearl",
  "quilt", "rider", "spice", "thorn", "unity", "vivid", "waltz", "yacht",
  "blaze", "charm", "drift", "ember", "frost", "gleam", "haste", "inlet",
  "jewel", "karma", "lilac", "mirth", "nexus", "orbit", "plume", "quest",
  "reign", "surge", "trail", "urban", "valor", "woven", "zesty", "amber",
  "brisk", "crest", "denim", "elbow", "flint", "grove", "heron", "index",
  "juicy", "kneel", "lunar", "mossy", "novel", "oasis", "prism", "quota",
  "roost", "slate", "tunic", "ultra", "vault", "whirl", "xenon", "yield",
  "acorn", "bloom", "coral", "dwarf", "epoch", "flora", "glyph", "humid",
  "irony", "jaunt", "kiosk", "latch", "moose", "niche", "oxide", "pixel",
  "raven", "scout", "tempo", "usher", "vibes", "witch", "azure", "brine",
  "crisp", "dusty", "elfin", "fugue", "gusto", "hippo", "icing", "jelly",
];

const STORAGE_PREFIX = "receiptsweeper:";

function pickRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function getSlugFromHash(): string | null {
  const existing = window.location.hash.replace(/^#/, "");
  return existing || null;
}

export function createSlug(): string {
  const word = pickRandomWord();
  window.location.hash = word;
  return word;
}

export function saveState(slug: string, data: unknown): void {
  localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(data));
}

export function loadState<T>(slug: string): T | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + slug);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
