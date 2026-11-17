/**
 * Spark: a two-player puzzle as the icebreaker.
 *
 * Each person holds HALF the clues. Neither half is enough on its own, so the
 * only way to solve it is to talk: "mine says it's outdoors, what does yours
 * say?" That replaces the dreaded "hi" with a reason to talk and a small shared
 * win. It also fits eLitmus: puzzles are part of the brand, and here they
 * become a playful ritual rather than a test.
 *
 * Every puzzle is checked in tests/spark.test.ts: exactly one answer with both
 * halves, and more than one answer with either half alone.
 */

type Attrs = Record<string, string | number | boolean>;

interface Clue<T> {
  text: string;
  test: (x: T) => boolean;
}

interface ChoicePuzzle {
  id: string;
  kind: "choice";
  title: string;
  intro: string;
  options: { id: string; label: string; detail: string; attrs: Attrs }[];
  clues: { A: Clue<Attrs>[]; B: Clue<Attrs>[] };
  answer: string;
}

interface NumberPuzzle {
  id: string;
  kind: "number";
  title: string;
  intro: string;
  range: [number, number];
  clues: { A: Clue<number>[]; B: Clue<number>[] };
  answer: number;
}

export type Puzzle = ChoicePuzzle | NumberPuzzle;

const digits = (n: number) => String(n).split("").map(Number);

export const PUZZLES: Puzzle[] = [
  {
    id: "cafe",
    kind: "choice",
    title: "The Café Riddle",
    intro: "You've agreed to meet for coffee, but each of you only remembers half of what the other said. Which café is it?",
    options: [
      { id: "brew", label: "Brew & Banter", detail: "Indiranagar", attrs: { area: "Indiranagar", filter: true, opens: 7, games: true } },
      { id: "thirdwave", label: "Third Wave Nook", detail: "Koramangala", attrs: { area: "Koramangala", filter: false, opens: 9, games: false } },
      { id: "mess", label: "Malleshwaram Mess Café", detail: "Malleshwaram", attrs: { area: "Malleshwaram", filter: true, opens: 6, games: false } },
      { id: "cloud", label: "Cloud Nine Terrace", detail: "HSR Layout", attrs: { area: "HSR", filter: true, opens: 8, games: true } },
      { id: "bookworm", label: "Bookworm Bean", detail: "Jayanagar", attrs: { area: "Jayanagar", filter: true, opens: 10, games: true } },
    ],
    clues: {
      A: [
        { text: "It serves filter coffee.", test: (o) => o.filter === true },
        { text: "It's not in Indiranagar.", test: (o) => o.area !== "Indiranagar" },
      ],
      B: [
        { text: "It opens before 9 AM.", test: (o) => (o.opens as number) < 9 },
        { text: "It has a shelf of board games.", test: (o) => o.games === true },
      ],
    },
    answer: "cloud",
  },
  {
    id: "lock",
    kind: "number",
    title: "The Three-Digit Lock",
    intro: "A locker at the trek base camp holds both your bags. Each of you got half the hints for the 3-digit code.",
    range: [100, 999],
    clues: {
      A: [
        { text: "The digits add up to 15.", test: (n) => digits(n).reduce((a, b) => a + b, 0) === 15 },
        { text: "The first digit is twice the last digit.", test: (n) => digits(n)[0] === 2 * digits(n)[2] },
      ],
      B: [
        { text: "The middle digit is odd.", test: (n) => digits(n)[1] % 2 === 1 },
        { text: "The code is greater than 500.", test: (n) => n > 500 },
      ],
    },
    answer: 834,
  },
  {
    id: "weekend",
    kind: "choice",
    title: "The Weekend Plan",
    intro: "You're planning a first outing. Your clues come from your own preferences. Find the plan that works for both of you.",
    options: [
      { id: "nandi", label: "Nandi Hills sunrise", detail: "5 AM start", attrs: { outdoor: true, morning: true, paid: false, car: true } },
      { id: "pottery", label: "Pottery class", detail: "11 AM", attrs: { outdoor: false, morning: true, paid: true, car: false } },
      { id: "comedy", label: "Stand-up comedy night", detail: "8 PM", attrs: { outdoor: false, morning: false, paid: true, car: false } },
      { id: "lalbagh", label: "Lalbagh flower-show walk", detail: "7 AM, ₹30 entry", attrs: { outdoor: true, morning: true, paid: true, car: false } },
      { id: "cubbon", label: "Cubbon Park picnic", detail: "4 PM", attrs: { outdoor: true, morning: false, paid: false, car: false } },
      { id: "boardgames", label: "Board-game café", detail: "6 PM", attrs: { outdoor: false, morning: false, paid: true, car: false } },
    ],
    clues: {
      A: [
        { text: "I'd love to be outdoors.", test: (o) => o.outdoor === true },
        { text: "I'm a morning person. Let's start before noon.", test: (o) => o.morning === true },
      ],
      B: [
        { text: "Neither of us has a car, so no long drives.", test: (o) => o.car === false },
        { text: "I'd like it to be a proper ticketed thing, even a cheap one.", test: (o) => o.paid === true },
      ],
    },
    answer: "lalbagh",
  },
  {
    id: "playlist",
    kind: "choice",
    title: "The Shared Playlist",
    intro: "You're picking the first track for a playlist you'll build together. Which one fits both your hints?",
    options: [
      { id: "duet", label: "A 90s Bollywood duet", detail: "Hindi · 1990s", attrs: { vocals: true, lang: "hindi", after2000: false, dance: false } },
      { id: "tamilindie", label: "A Tamil indie ballad", detail: "Tamil · 2010s", attrs: { vocals: true, lang: "tamil", after2000: true, dance: false } },
      { id: "fusion", label: "A Coke Studio-style fusion", detail: "Hindi/Urdu · 2010s", attrs: { vocals: true, lang: "hindi", after2000: true, dance: false } },
      { id: "lofi", label: "Lo-fi study beats", detail: "Instrumental · 2020s", attrs: { vocals: false, lang: "none", after2000: true, dance: false } },
      { id: "carnatic", label: "A Carnatic kriti", detail: "Telugu · classical", attrs: { vocals: true, lang: "telugu", after2000: false, dance: false } },
      { id: "bhangra", label: "A Punjabi bhangra banger", detail: "Punjabi · 2020s", attrs: { vocals: true, lang: "punjabi", after2000: true, dance: true } },
    ],
    clues: {
      A: [
        { text: "It has to have vocals. I sing along.", test: (o) => o.vocals === true },
        { text: "It's for a slow evening, not the dance floor.", test: (o) => o.dance === false },
      ],
      B: [
        { text: "It came out after 2000.", test: (o) => o.after2000 === true },
        { text: "It's not in Tamil or Punjabi.", test: (o) => o.lang !== "tamil" && o.lang !== "punjabi" },
      ],
    },
    answer: "fusion",
  },
  {
    id: "seat",
    kind: "number",
    title: "Coach S7, Seat ?",
    intro: "You're both on the same overnight train home for Diwali. Work out the two-digit seat number from your halves of the hints.",
    range: [10, 99],
    clues: {
      A: [
        { text: "It's a multiple of 7.", test: (n) => n % 7 === 0 },
        { text: "It's greater than 40.", test: (n) => n > 40 },
      ],
      B: [
        { text: "Its digits add up to 10.", test: (n) => digits(n)[0] + digits(n)[1] === 10 },
        { text: "It's odd.", test: (n) => n % 2 === 1 },
      ],
    },
    answer: 91,
  },
  {
    id: "dinner",
    kind: "choice",
    title: "The Dinner Order",
    intro: "You're ordering one big dish to share. Each of you knows two things it must be.",
    options: [
      { id: "dosa", label: "Masala dosa", detail: "South Indian", attrs: { veg: true, spicy: false, south: true, rice: true } },
      { id: "paneer", label: "Paneer butter masala", detail: "North Indian", attrs: { veg: true, spicy: false, south: false, rice: false } },
      { id: "biryani", label: "Hyderabadi chicken biryani", detail: "Deccan", attrs: { veg: false, spicy: true, south: true, rice: true } },
      { id: "thali", label: "Rajasthani veg thali", detail: "North-west", attrs: { veg: true, spicy: true, south: false, rice: true } },
      { id: "chole", label: "Chole bhature", detail: "Punjabi", attrs: { veg: true, spicy: true, south: false, rice: false } },
      { id: "fish", label: "Fish curry meals", detail: "Coastal", attrs: { veg: false, spicy: true, south: true, rice: true } },
    ],
    clues: {
      A: [
        { text: "It's vegetarian.", test: (o) => o.veg === true },
        { text: "It comes with rice.", test: (o) => o.rice === true },
      ],
      B: [
        { text: "It's properly spicy.", test: (o) => o.spicy === true },
        { text: "It's not South Indian. You've had that all week!", test: (o) => o.south === false },
      ],
    },
    answer: "thali",
  },
];

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

/** Pick a puzzle this pair hasn't played yet (deterministic for a seed). */
export function choosePuzzle(played: string[], seed: string): Puzzle | null {
  const fresh = PUZZLES.filter((p) => !played.includes(p.id));
  if (fresh.length === 0) return null;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return fresh[h % fresh.length];
}

export function checkAnswer(puzzle: Puzzle, answer: string): boolean {
  const a = answer.trim().toLowerCase();
  return puzzle.kind === "number" ? Number(a) === puzzle.answer : a === puzzle.answer;
}

/** What one player sees: their own half of the clues, never the other half. */
export function playerView(puzzle: Puzzle, role: "A" | "B") {
  return {
    id: puzzle.id,
    kind: puzzle.kind,
    title: puzzle.title,
    intro: puzzle.intro,
    clues: puzzle.clues[role].map((c) => c.text),
    options: puzzle.kind === "choice" ? puzzle.options.map(({ id, label, detail }) => ({ id, label, detail })) : undefined,
    range: puzzle.kind === "number" ? puzzle.range : undefined,
  };
}

export type PlayerView = ReturnType<typeof playerView>;

/** Solutions consistent with a set of clues. Used by tests to prove uniqueness. */
export function solutions(puzzle: Puzzle, roles: ("A" | "B")[]): (string | number)[] {
  if (puzzle.kind === "choice") {
    const clues = roles.flatMap((r) => puzzle.clues[r]);
    return puzzle.options.filter((o) => clues.every((c) => c.test(o.attrs))).map((o) => o.id);
  }
  const clues = roles.flatMap((r) => puzzle.clues[r]);
  const out: number[] = [];
  for (let n = puzzle.range[0]; n <= puzzle.range[1]; n++) if (clues.every((c) => c.test(n))) out.push(n);
  return out;
}
