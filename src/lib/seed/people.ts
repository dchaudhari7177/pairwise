import { PROMPTS } from "../options";
import type { CityId, Gender, Habits, Intent, LifePlan, PromptAnswer } from "../types";

// Fictional demo members. Every person, college and employer here is made up.

export const EMPLOYERS = {
  kaveri: { employer: "Kaveri Systems", domain: "kaverisystems.test" },
  tessellate: { employer: "Tessellate Labs", domain: "tessellate.test" },
  monsoon: { employer: "Monsoon Payments", domain: "monsoonpay.test" },
  bluepine: { employer: "Bluepine Software", domain: "bluepine.test" },
  ledgerline: { employer: "Ledgerline Fintech", domain: "ledgerline.test" },
  saffron: { employer: "Saffron Health Tech", domain: "saffronhealth.test" },
  quarry: { employer: "Quarry Data", domain: "quarrydata.test" },
  nimbus: { employer: "Nimbus Retail Tech", domain: "nimbusretail.test" },
  deccan: { employer: "Deccan Cloud", domain: "deccancloud.test" },
  orbit: { employer: "Orbit Mobility", domain: "orbitmobility.test" },
} as const;

export const COLLEGES = [
  "Kaveri Institute of Technology",
  "Narmada Institute of Engineering",
  "Vindhya College of Engineering",
  "Tungabhadra Engineering College",
  "Godavari Institute of Science & Technology",
  "Coromandel College of Engineering",
  "Western Ghats Institute of Technology",
  "Sahyadri Engineering College",
  "Aravalli Institute of Technology",
] as const;

/** Prompt answers, indexed into PROMPTS. */
const A: [number, string][] = [
  [0, "Filter coffee at a darshini, a long walk in Cubbon Park, then pretending I'll read the book I brought."],
  [0, "Sleeping in, a big breakfast, and a board-game café with people who take Catan way too seriously."],
  [0, "Farmers' market at 8, cooking something ambitious, and a nap I'll call 'recharging'."],
  [0, "A sunrise trek, a dosa the size of my arm, and zero meetings in sight."],
  [1, "Remember the small things I mention. Bonus points for good chai recommendations."],
  [1, "Make me laugh at something stupid, then have a serious conversation about it."],
  [1, "Be kind to waiters and patient with my terrible sense of direction."],
  [1, "Send me a puzzle. If you solve mine faster, I'll buy dinner."],
  [2, "Guessing the ending of any movie in the first 20 minutes. I'm told it's annoying."],
  [2, "Packing for a week-long trip in a single backpack."],
  [2, "Finding the cheapest flight. My friends call me before booking anything."],
  [2, "Remembering birthdays. I have never once used a reminder."],
  [2, "Mental maths. Splitting the bill is my love language."],
  [3, "Pineapple on pizza is fine. Raisins in biryani are not."],
  [3, "Idli is better than dosa. I will die on this hill."],
  [3, "Maggi tastes better at 2 AM than at any other time."],
  [3, "Gulab jamun should be served warm, always. Cold gulab jamun is a crime."],
  [4, "That 'I'll do it tomorrow' is how a 2-day project becomes a 2-month one."],
  [4, "Moving cities alone taught me to ask for help early."],
  [4, "That my parents were right about saving money. Don't tell them."],
  [5, "Someone who says sorry first, even when it's 50-50."],
  [5, "You have friends from school you still talk to every week."],
  [5, "You're curious about things that have nothing to do with your job."],
  [6, "A job offer and a promise to myself that I'd learn to cook. One out of two."],
  [6, "Work, initially. Now it's the weather and the food."],
  [6, "I got placed here through campus and somehow it's home now."],
  [7, "Responsible, stubborn, and the one who organises every family trip."],
  [7, "The calm one, until someone touches the TV remote."],
  [7, "Always on the phone with someone. Usually my mother."],
  [8, "I've been to 9 states, I can solve a Rubik's cube, I've never had coffee."],
  [8, "I once won a state-level quiz, I hate mangoes, I can dance bhangra."],
  [8, "I've run a half marathon, I speak 4 languages, I can't swim."],
  [9, "Spiti on a shoestring budget. Freezing, broke, and absolutely worth it."],
  [9, "Gokarna with college friends. We missed the last bus and slept on the beach."],
  [9, "A solo trip to Hampi. I went to see temples and came back with a bouldering habit."],
  [10, "When we've stopped checking the time and the café starts stacking chairs."],
  [10, "When you send me a meme at 11 PM because it reminded you of me."],
  [11, "Why do I always lose at Sudoku on the train but win at home? Asking for a friend."],
  [11, "The 'two doors, one guard lies' riddle. I've solved it, but I still think about it."],
];

export const answer = (i: number): PromptAnswer => ({ q: PROMPTS[A[i][0]], a: A[i][1] });

const LP: Record<string, LifePlan["relocate"]> = { y: "yes", m: "maybe", n: "no" };
const LT: Record<string, LifePlan["timeline"]> = { "2": "within_2y", "4": "2_4y", u: "not_sure" };
const LK: Record<string, LifePlan["kids"]> = { w: "want", o: "open", d: "dont_want", u: "not_sure" };
const LF: Record<string, LifePlan["family"]> = { n: "nuclear", j: "joint", o: "open" };
const HD: Record<string, Habits["diet"]> = { v: "veg", n: "nonveg", e: "eggetarian", g: "vegan", j: "jain" };
const HX: Record<string, Habits["drinks"]> = { n: "never", s: "socially", o: "often" };

export const lifePlan = (c: string): LifePlan => ({ relocate: LP[c[0]], timeline: LT[c[1]], kids: LK[c[2]], family: LF[c[3]] });
export const habits = (c: string): Habits => ({ diet: HD[c[0]], drinks: HX[c[1]], smokes: HX[c[2]] });

export interface Person {
  id: string;
  name: string;
  g: Gender;
  into: Gender[];
  dob: string;
  city: CityId;
  area: string;
  home: string;
  role: string;
  emp: keyof typeof EMPLOYERS;
  college: number;
  year: number;
  langs: string[];
  intent: Intent;
  lp: string;
  hb: string;
  values: string[];
  interests: string[];
  prompts: [number, number, number];
  bio: string;
  range?: [number, number];
  height?: number;
  faith?: string;
  plus?: boolean;
  via?: "elitmus" | "work_email";
  activeDaysAgo?: number;
  hideCompany?: boolean;
  blur?: boolean;
}

const W: Gender[] = ["woman"];
const M: Gender[] = ["man"];

export const PEOPLE: Person[] = [
  // ---------------- Demo accounts ----------------
  { id: "s_aarav", name: "Aarav", g: "man", into: W, dob: "2000-03-14", city: "bengaluru", area: "HSR Layout", home: "Indore", role: "Backend engineer", emp: "tessellate", college: 1, year: 2022, langs: ["English", "Hindi"], intent: "long_term", lp: "m4wn", hb: "nsn", values: ["Honesty", "Curiosity", "Kindness", "Growth"], interests: ["Trekking", "Board games", "Cooking", "Puzzles", "Indie music"], prompts: [1, 7, 18], bio: "Moved from Indore for work in 2022. I write Go by day and burn dal by night. Looking for someone to explore the city with.", range: [22, 30], height: 176, hideCompany: true },
  { id: "s_meera", name: "Meera", g: "woman", into: M, dob: "2001-07-22", city: "bengaluru", area: "Jayanagar", home: "Mysuru", role: "Product analyst", emp: "kaveri", college: 0, year: 2022, langs: ["English", "Kannada", "Hindi"], intent: "long_term", lp: "n4on", hb: "vsn", values: ["Honesty", "Family", "Kindness", "Ambition"], interests: ["Reading", "Classical music", "Café hopping", "Yoga", "Travel"], prompts: [0, 20, 14], bio: "Mysuru girl in Bengaluru. Spreadsheets at work, Carnatic music at home. Slow mornings > late nights.", range: [24, 32], height: 162, hideCompany: true, blur: true },
  { id: "s_kabir", name: "Kabir", g: "man", into: W, dob: "1999-11-02", city: "pune", area: "Baner", home: "Nagpur", role: "Data engineer", emp: "ledgerline", college: 8, year: 2021, langs: ["English", "Hindi", "Marathi"], intent: "marriage", lp: "y2wn", hb: "nsn", values: ["Family", "Stability", "Honesty", "Humour"], interests: ["Cricket", "Cooking", "Travel", "Podcasts"], prompts: [11, 19, 32], bio: "Pune for now, open to moving. Big family, bigger appetite. On Plus because relocation mode is genuinely useful.", range: [23, 30], plus: true },

  // ---------------- Bengaluru women ----------------
  { id: "s_ishita", name: "Ishita", g: "woman", into: M, dob: "2001-02-09", city: "bengaluru", area: "Koramangala", home: "Pune", role: "UX designer", emp: "monsoon", college: 7, year: 2022, langs: ["English", "Hindi", "Marathi"], intent: "long_term", lp: "m4wn", hb: "nsn", values: ["Curiosity", "Kindness", "Humour", "Growth"], interests: ["Board games", "Painting", "Café hopping", "Puzzles", "Indie music"], prompts: [1, 5, 13], bio: "I design payment screens so your UPI never fails (mostly). Will challenge you to Codenames.", range: [24, 30] },
  { id: "s_sneha", name: "Sneha", g: "woman", into: M, dob: "2002-05-30", city: "bengaluru", area: "Malleshwaram", home: "Mangaluru", role: "Data analyst", emp: "quarry", college: 6, year: 2023, langs: ["English", "Kannada"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Adventure", "Honesty", "Curiosity"], interests: ["Trekking", "Photography", "Running", "Puzzles"], prompts: [3, 9, 33], bio: "Coastal girl, mountain heart. Weekdays are SQL, weekends are trails.", range: [23, 29] },
  { id: "s_pooja", name: "Pooja", g: "woman", into: M, dob: "2000-09-12", city: "bengaluru", area: "Whitefield", home: "Hubballi", role: "QA engineer", emp: "nimbus", college: 3, year: 2021, langs: ["English", "Kannada"], intent: "marriage", lp: "n2wj", hb: "vnn", values: ["Family", "Faith", "Loyalty"], interests: ["Cooking", "Bollywood", "Dancing"], prompts: [26, 16, 21], bio: "Family-first, foodie second.", range: [25, 31] },
  { id: "s_kavya", name: "Kavya", g: "woman", into: M, dob: "2000-12-01", city: "bengaluru", area: "Indiranagar", home: "Chennai", role: "Frontend developer", emp: "deccan", college: 5, year: 2022, langs: ["English", "Tamil"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Curiosity", "Humour", "Independence", "Growth"], interests: ["Board games", "Anime", "Puzzles", "Stand-up comedy"], prompts: [7, 8, 37], bio: "React by day, Ghibli by night. I'll lose to you at chess and then demand a rematch.", range: [24, 30] },
  { id: "s_diya", name: "Diya", g: "woman", into: M, dob: "2001-04-18", city: "bengaluru", area: "BTM Layout", home: "Bhopal", role: "Business analyst", emp: "ledgerline", college: 1, year: 2023, langs: ["English", "Hindi"], intent: "long_term", lp: "m4wn", hb: "esn", values: ["Kindness", "Honesty", "Family"], interests: ["Trekking", "Cooking", "Reading"], prompts: [2, 22, 34], bio: "From Bhopal, also via Narmada Institute. Making Bengaluru home one bakery at a time.", range: [24, 30] },
  { id: "s_nandini", name: "Nandini", g: "woman", into: M, dob: "1999-08-08", city: "bengaluru", area: "Basavanagudi", home: "Davanagere", role: "Cloud engineer", emp: "deccan", college: 3, year: 2021, langs: ["English", "Kannada", "Hindi"], intent: "marriage", lp: "m2wn", hb: "vnn", values: ["Honesty", "Stability", "Kindness"], interests: ["Cooking", "Classical music", "Trekking", "Gardening"], prompts: [27, 4, 15], bio: "AWS certs, a balcony garden and strong opinions about idli.", range: [25, 31] },
  { id: "s_riya", name: "Riya", g: "woman", into: M, dob: "2002-01-25", city: "bengaluru", area: "Electronic City", home: "Jaipur", role: "Associate software engineer", emp: "orbit", college: 8, year: 2023, langs: ["English", "Hindi"], intent: "figuring_out", lp: "y4ou", hb: "nsn", values: ["Adventure", "Independence", "Humour"], interests: ["Dancing", "Travel", "Gym", "Bollywood"], prompts: [30, 6, 10], bio: "New-ish in town. Will drag you to a dance class.", range: [22, 28] },
  { id: "s_ananya", name: "Ananya", g: "woman", into: M, dob: "2000-06-06", city: "bengaluru", area: "Hebbal", home: "Kochi", role: "ML engineer", emp: "saffron", college: 5, year: 2022, langs: ["English", "Malayalam", "Hindi"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Curiosity", "Growth", "Honesty", "Empathy"], interests: ["Reading", "Podcasts", "Running", "Puzzles", "Side projects"], prompts: [22, 12, 38], bio: "Training models to read X-rays. Training myself to run 10K.", range: [24, 30] },
  { id: "s_priyanka", name: "Priyanka", g: "woman", into: M, dob: "1999-10-15", city: "bengaluru", area: "Marathahalli", home: "Patna", role: "Scrum master", emp: "bluepine", college: 2, year: 2021, langs: ["English", "Hindi", "Bengali"], intent: "marriage", lp: "m2wn", hb: "nsn", values: ["Family", "Loyalty", "Ambition"], interests: ["Cooking", "Travel", "Bollywood", "Volunteering"], prompts: [28, 19, 11], bio: "I run stand-ups for a living, so let's skip the small talk.", range: [25, 32] },
  { id: "s_aditi", name: "Aditi", g: "woman", into: M, dob: "2001-11-11", city: "bengaluru", area: "JP Nagar", home: "Nashik", role: "Security analyst", emp: "tessellate", college: 7, year: 2022, langs: ["English", "Marathi", "Hindi"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Honesty", "Independence", "Curiosity"], interests: ["Chess", "Puzzles", "Cycling", "Reading"], prompts: [7, 29, 17], bio: "I break things professionally (ethically). Chess rating: respectable.", range: [24, 30] },
  { id: "s_shruti", name: "Shruti", g: "woman", into: M, dob: "2000-02-28", city: "bengaluru", area: "Rajajinagar", home: "Belagavi", role: "Product designer", emp: "nimbus", college: 6, year: 2021, langs: ["English", "Kannada", "Marathi"], intent: "long_term", lp: "n4wn", hb: "vnn", values: ["Kindness", "Simplicity", "Family"], interests: ["Painting", "Gardening", "Classical music", "Café hopping"], prompts: [0, 21, 35], bio: "Watercolours, Sunday markets, and a cat named Chutney.", range: [25, 31] },
  { id: "s_tanvi", name: "Tanvi", g: "woman", into: M, dob: "2002-08-19", city: "bengaluru", area: "Koramangala", home: "Surat", role: "Software engineer", emp: "monsoon", college: 4, year: 2023, langs: ["English", "Gujarati", "Hindi"], intent: "figuring_out", lp: "y4ou", hb: "jnn", values: ["Humour", "Adventure", "Growth"], interests: ["Stand-up comedy", "Travel", "Badminton", "Gaming"], prompts: [5, 31, 36], bio: "Gujju who can't cook dhokla. I can do a mean impression of my manager though.", range: [22, 28] },
  { id: "s_zoya", name: "Zoya", g: "woman", into: M, dob: "2000-04-04", city: "bengaluru", area: "Frazer Town", home: "Lucknow", role: "Content strategist", emp: "saffron", college: 2, year: 2021, langs: ["English", "Hindi"], intent: "long_term", lp: "m4on", hb: "nnn", values: ["Empathy", "Curiosity", "Family"], interests: ["Reading", "Theatre", "Podcasts", "Café hopping"], prompts: [20, 9, 35], bio: "Lucknowi tehzeeb, Bengaluru traffic. I write health content that people actually read.", range: [24, 31], faith: "Muslim" },
  { id: "s_lakshmi", name: "Lakshmi", g: "woman", into: M, dob: "1999-05-20", city: "bengaluru", area: "Banashankari", home: "Madurai", role: "DevOps engineer", emp: "orbit", college: 5, year: 2021, langs: ["English", "Tamil", "Kannada"], intent: "marriage", lp: "m2wj", hb: "vnn", values: ["Family", "Faith", "Honesty", "Stability"], interests: ["Classical music", "Cooking", "Yoga"], prompts: [26, 14, 4], bio: "Bharatanatyam since I was six. Kubernetes since I was twenty-two.", range: [26, 32] },
  { id: "s_harini", name: "Harini", g: "woman", into: M, dob: "2001-09-03", city: "bengaluru", area: "Yelahanka", home: "Vijayawada", role: "Mobile developer", emp: "quarry", college: 4, year: 2022, langs: ["English", "Telugu", "Hindi"], intent: "long_term", lp: "y4wn", hb: "nsn", values: ["Ambition", "Kindness", "Adventure"], interests: ["Travel", "Photography", "Badminton", "Cooking"], prompts: [32, 10, 18], bio: "Building apps, collecting passport stamps (3 so far, ambitious plans).", range: [24, 30] },
  { id: "s_fatima", name: "Fatima", g: "woman", into: W, dob: "2000-01-19", city: "bengaluru", area: "Indiranagar", home: "Hyderabad", role: "Data scientist", emp: "bluepine", college: 6, year: 2022, langs: ["English", "Hindi", "Telugu"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Honesty", "Curiosity", "Independence"], interests: ["Reading", "Board games", "Running"], prompts: [22, 36, 13], bio: "Looking for a girl who'll argue with me about books.", range: [23, 31] },
  { id: "s_gayatri", name: "Gayatri", g: "woman", into: ["woman", "nonbinary"], dob: "2001-03-03", city: "bengaluru", area: "Domlur", home: "Thrissur", role: "Technical writer", emp: "deccan", college: 0, year: 2022, langs: ["English", "Malayalam"], intent: "long_term", lp: "m4un", hb: "vsn", values: ["Empathy", "Kindness", "Curiosity"], interests: ["Theatre", "Reading", "Painting", "Café hopping"], prompts: [20, 9, 16], bio: "Words for work, words for fun. Queer, kind, chronically early.", range: [23, 31] },

  // ---------------- Bengaluru men ----------------
  { id: "s_rohan", name: "Rohan", g: "man", into: W, dob: "2000-10-10", city: "bengaluru", area: "Jayanagar", home: "Mysuru", role: "Software engineer", emp: "kaveri", college: 0, year: 2022, langs: ["English", "Kannada"], intent: "long_term", lp: "n4on", hb: "nsn", values: ["Honesty", "Kindness", "Family"], interests: ["Cricket", "Reading", "Café hopping"], prompts: [0, 27, 15], bio: "Mysuru to Jayanagar, the shortest relocation in history. Quiet, curious, cricket-obsessed.", range: [23, 30] },
  { id: "s_vikram", name: "Vikram", g: "man", into: W, dob: "1998-12-24", city: "bengaluru", area: "MG Road", home: "Delhi", role: "Investment consultant", emp: "bluepine", college: 2, year: 2020, langs: ["English", "Hindi"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Ambition", "Growth", "Independence"], interests: ["Travel", "Gym", "Podcasts"], prompts: [2, 10, 32], bio: "Living my best life. Ask me about financial freedom.", range: [22, 32], via: "work_email" },
  { id: "s_aditya", name: "Aditya", g: "man", into: W, dob: "1999-07-07", city: "bengaluru", area: "Indiranagar", home: "Kolkata", role: "Product manager", emp: "monsoon", college: 4, year: 2021, langs: ["English", "Bengali", "Hindi"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Ambition", "Humour", "Curiosity"], interests: ["Football", "Podcasts", "Café hopping"], prompts: [5, 25, 13], bio: "Kolkata boy. Mishti doi is non-negotiable.", range: [23, 29] },
  { id: "s_karthik", name: "Karthik", g: "man", into: W, dob: "2000-01-30", city: "bengaluru", area: "Malleshwaram", home: "Coimbatore", role: "Embedded engineer", emp: "orbit", college: 5, year: 2022, langs: ["English", "Tamil", "Kannada"], intent: "long_term", lp: "m4wn", hb: "vnn", values: ["Honesty", "Family", "Kindness"], interests: ["Classical music", "Cycling", "Cooking", "Reading"], prompts: [3, 21, 14], bio: "I make electric scooters smarter. Weekend cyclist, weekday filter-coffee evangelist.", range: [23, 29] },
  { id: "s_siddharth", name: "Siddharth", g: "man", into: W, dob: "1999-03-21", city: "bengaluru", area: "Koramangala", home: "Pune", role: "Full-stack developer", emp: "nimbus", college: 7, year: 2021, langs: ["English", "Marathi", "Hindi"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Curiosity", "Growth", "Humour"], interests: ["Side projects", "Board games", "Trekking"], prompts: [1, 8, 33], bio: "Shipping side projects nobody asked for since 2019.", range: [23, 29] },
  { id: "s_arjun", name: "Arjun", g: "man", into: W, dob: "1998-09-09", city: "bengaluru", area: "HSR Layout", home: "Thiruvananthapuram", role: "Site reliability engineer", emp: "deccan", college: 6, year: 2020, langs: ["English", "Malayalam"], intent: "marriage", lp: "m2wn", hb: "nsn", values: ["Stability", "Loyalty", "Family"], interests: ["Football", "Cooking", "Travel"], prompts: [26, 4, 34], bio: "On-call for servers, never late for you.", range: [24, 30] },
  { id: "s_nikhil", name: "Nikhil", g: "man", into: W, dob: "2001-06-16", city: "bengaluru", area: "Marathahalli", home: "Hyderabad", role: "Software engineer", emp: "bluepine", college: 4, year: 2023, langs: ["English", "Telugu", "Hindi"], intent: "long_term", lp: "y4wn", hb: "nsn", values: ["Kindness", "Humour", "Adventure"], interests: ["Badminton", "Gaming", "Travel"], prompts: [31, 6, 15], bio: "Biryani snob. Badminton at 7 AM, yes really.", range: [22, 28] },
  { id: "s_rahul", name: "Rahul", g: "man", into: W, dob: "1999-12-12", city: "bengaluru", area: "Whitefield", home: "Kanpur", role: "Analytics engineer", emp: "quarry", college: 8, year: 2021, langs: ["English", "Hindi"], intent: "marriage", lp: "m2wj", hb: "vnn", values: ["Family", "Honesty", "Faith"], interests: ["Cricket", "Bollywood", "Cooking"], prompts: [28, 19, 16], bio: "Simple guy, big heart, bigger family WhatsApp group.", range: [23, 29] },
  { id: "s_varun", name: "Varun", g: "man", into: W, dob: "2000-08-25", city: "bengaluru", area: "Indiranagar", home: "Chandigarh", role: "iOS developer", emp: "monsoon", college: 2, year: 2022, langs: ["English", "Hindi", "Punjabi"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Ambition", "Humour", "Loyalty"], interests: ["Gym", "Stand-up comedy", "Travel", "Football"], prompts: [30, 5, 10], bio: "Punjabi in Bengaluru, which means I'm always cold.", range: [23, 29], plus: true },
  { id: "s_imran", name: "Imran", g: "man", into: W, dob: "1999-02-14", city: "bengaluru", area: "Frazer Town", home: "Bhopal", role: "Backend engineer", emp: "saffron", college: 1, year: 2021, langs: ["English", "Hindi"], intent: "long_term", lp: "m4wn", hb: "nnn", values: ["Kindness", "Family", "Honesty", "Empathy"], interests: ["Reading", "Cricket", "Cooking", "Volunteering"], prompts: [20, 23, 29], bio: "I teach kids to code on Saturdays. The rest of the week they teach me patience.", range: [23, 30], faith: "Muslim" },
  { id: "s_pranav", name: "Pranav", g: "man", into: W, dob: "2001-10-05", city: "bengaluru", area: "JP Nagar", home: "Udupi", role: "Data engineer", emp: "ledgerline", college: 6, year: 2023, langs: ["English", "Kannada", "Hindi"], intent: "long_term", lp: "n4on", hb: "vnn", values: ["Simplicity", "Kindness", "Curiosity"], interests: ["Trekking", "Photography", "Reading"], prompts: [3, 11, 34], bio: "Udupi boy. I'll judge every dosa you take me to.", range: [22, 28] },
  { id: "s_harsh", name: "Harsh", g: "man", into: W, dob: "2000-05-05", city: "bengaluru", area: "BTM Layout", home: "Ahmedabad", role: "Software engineer", emp: "orbit", college: 4, year: 2022, langs: ["English", "Gujarati", "Hindi"], intent: "figuring_out", lp: "y4ou", hb: "jnn", values: ["Humour", "Adventure", "Growth"], interests: ["Gaming", "Travel", "Stand-up comedy"], prompts: [5, 30, 36], bio: "Navratri dancer, startup dreamer.", range: [22, 28] },
  { id: "s_manish", name: "Manish", g: "man", into: W, dob: "1998-11-19", city: "bengaluru", area: "Hebbal", home: "Ranchi", role: "Engineering manager", emp: "tessellate", college: 2, year: 2020, langs: ["English", "Hindi"], intent: "marriage", lp: "m2wn", hb: "nsn", values: ["Stability", "Ambition", "Family"], interests: ["Running", "Podcasts", "Travel"], prompts: [19, 27, 35], bio: "Marathon runner. Ranchi to Bengaluru, still adjusting to the idli-to-thekua ratio.", range: [24, 30] },
  { id: "s_abhishek", name: "Abhishek", g: "man", into: W, dob: "2000-04-12", city: "bengaluru", area: "Banashankari", home: "Varanasi", role: "Test engineer", emp: "nimbus", college: 8, year: 2022, langs: ["English", "Hindi"], intent: "long_term", lp: "m4wj", hb: "vnn", values: ["Faith", "Family", "Kindness"], interests: ["Classical music", "Cooking", "Chess"], prompts: [26, 21, 11], bio: "Banarasi at heart. Tabla on weekends.", range: [23, 29] },
  { id: "s_tejas", name: "Tejas", g: "man", into: W, dob: "2001-01-08", city: "bengaluru", area: "Electronic City", home: "Kolhapur", role: "Cloud engineer", emp: "deccan", college: 7, year: 2023, langs: ["English", "Marathi", "Hindi"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Adventure", "Honesty", "Growth"], interests: ["Trekking", "Cycling", "Photography"], prompts: [3, 9, 33], bio: "Sahyadri trekker, now exploring Nandi Hills on weekends.", range: [22, 28] },
  { id: "s_akhil", name: "Akhil", g: "man", into: M, dob: "2000-07-29", city: "bengaluru", area: "Domlur", home: "Kozhikode", role: "Designer", emp: "saffron", college: 5, year: 2022, langs: ["English", "Malayalam"], intent: "long_term", lp: "m4un", hb: "nsn", values: ["Empathy", "Curiosity", "Humour"], interests: ["Theatre", "Painting", "Café hopping"], prompts: [5, 22, 13], bio: "Here for real conversations, and a guy who reads.", range: [23, 31] },
  { id: "s_sai", name: "Sai", g: "man", into: M, dob: "1999-06-02", city: "bengaluru", area: "HSR Layout", home: "Warangal", role: "QA lead", emp: "quarry", college: 4, year: 2021, langs: ["English", "Telugu"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Honesty", "Loyalty", "Kindness"], interests: ["Running", "Cooking", "Bollywood"], prompts: [20, 18, 15], bio: "Gym in the morning, Bollywood at night, honest always.", range: [24, 32] },

  // ---------------- Pune ----------------
  { id: "s_ritika", name: "Ritika", g: "woman", into: M, dob: "2000-03-03", city: "pune", area: "Kothrud", home: "Pune", role: "Data analyst", emp: "ledgerline", college: 7, year: 2022, langs: ["English", "Marathi", "Hindi"], intent: "marriage", lp: "m2wn", hb: "vnn", values: ["Family", "Honesty", "Ambition"], interests: ["Cooking", "Travel", "Dancing"], prompts: [27, 4, 16], bio: "Born and raised in Pune. Will show you the real misal spots.", range: [23, 30], plus: true },
  { id: "s_neha", name: "Neha", g: "woman", into: M, dob: "2001-08-14", city: "pune", area: "Viman Nagar", home: "Indore", role: "Frontend developer", emp: "orbit", college: 1, year: 2023, langs: ["English", "Hindi"], intent: "long_term", lp: "y4wn", hb: "nsn", values: ["Kindness", "Curiosity", "Humour"], interests: ["Board games", "Bollywood", "Café hopping"], prompts: [1, 8, 37], bio: "Indori in Pune. Poha loyalist.", range: [23, 30] },
  { id: "s_sana", name: "Sana", g: "woman", into: M, dob: "1999-12-30", city: "pune", area: "Koregaon Park", home: "Aurangabad", role: "HR tech consultant", emp: "nimbus", college: 8, year: 2021, langs: ["English", "Hindi", "Marathi"], intent: "marriage", lp: "m2wj", hb: "nnn", values: ["Family", "Faith", "Empathy"], interests: ["Reading", "Cooking", "Volunteering"], prompts: [28, 20, 12], bio: "I help people find jobs; maybe you'll help me find a person.", range: [24, 31], plus: true },
  { id: "s_bhavana", name: "Bhavana", g: "woman", into: M, dob: "2002-02-02", city: "pune", area: "Hinjewadi", home: "Solapur", role: "Software engineer", emp: "bluepine", college: 3, year: 2023, langs: ["English", "Marathi", "Kannada"], intent: "long_term", lp: "m4on", hb: "vnn", values: ["Simplicity", "Kindness", "Growth"], interests: ["Yoga", "Reading", "Gardening"], prompts: [2, 21, 15], bio: "Hinjewadi traffic survivor. Plant mom.", range: [22, 29] },
  { id: "s_divya", name: "Divya", g: "woman", into: M, dob: "2000-10-21", city: "pune", area: "Baner", home: "Nagpur", role: "Product manager", emp: "saffron", college: 2, year: 2021, langs: ["English", "Hindi", "Marathi"], intent: "long_term", lp: "y4wn", hb: "nsn", values: ["Ambition", "Curiosity", "Humour"], interests: ["Running", "Podcasts", "Travel", "Puzzles"], prompts: [7, 31, 38], bio: "PM who actually reads the PRD. Also from Nagpur, so we can argue about oranges.", range: [24, 31] },
  { id: "s_keerthi", name: "Keerthi", g: "woman", into: M, dob: "2001-05-05", city: "pune", area: "Wakad", home: "Kurnool", role: "ML engineer", emp: "deccan", college: 4, year: 2022, langs: ["English", "Telugu", "Hindi"], intent: "long_term", lp: "m4wn", hb: "nsn", values: ["Honesty", "Family", "Curiosity"], interests: ["Badminton", "Cooking", "Anime"], prompts: [3, 22, 14], bio: "Telugu, technical, and terrible at goodbyes.", range: [23, 30] },
  { id: "s_omkar", name: "Omkar", g: "man", into: W, dob: "2000-09-09", city: "pune", area: "Kothrud", home: "Satara", role: "Software engineer", emp: "ledgerline", college: 7, year: 2022, langs: ["English", "Marathi"], intent: "marriage", lp: "n2wj", hb: "vnn", values: ["Family", "Faith", "Loyalty"], interests: ["Cricket", "Trekking", "Classical music"], prompts: [26, 4, 33], bio: "Weekend forts, weekday code.", range: [22, 28] },
  { id: "s_yash", name: "Yash", g: "man", into: W, dob: "2001-03-27", city: "pune", area: "Viman Nagar", home: "Raipur", role: "DevOps engineer", emp: "orbit", college: 1, year: 2023, langs: ["English", "Hindi"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Humour", "Adventure", "Growth"], interests: ["Gaming", "Football", "Travel"], prompts: [30, 6, 10], bio: "I automate everything except my laundry.", range: [22, 28] },
  { id: "s_faisal", name: "Faisal", g: "man", into: W, dob: "1999-04-04", city: "pune", area: "Camp", home: "Pune", role: "Backend engineer", emp: "bluepine", college: 2, year: 2021, langs: ["English", "Hindi", "Marathi"], intent: "long_term", lp: "m4wn", hb: "nnn", values: ["Kindness", "Honesty", "Family"], interests: ["Cooking", "Reading", "Football"], prompts: [16, 20, 35], bio: "Camp-area foodie. My biryani has a fan club (my mom).", range: [23, 30] },

  // ---------------- Hyderabad ----------------
  { id: "s_swathi", name: "Swathi", g: "woman", into: M, dob: "2000-11-23", city: "hyderabad", area: "Gachibowli", home: "Guntur", role: "Software engineer", emp: "deccan", college: 4, year: 2022, langs: ["English", "Telugu", "Hindi"], intent: "marriage", lp: "m2wj", hb: "nsn", values: ["Family", "Honesty", "Ambition"], interests: ["Cooking", "Dancing", "Travel"], prompts: [27, 4, 16], bio: "Guntur spice level: extreme. Kuchipudi on weekends.", range: [24, 30] },
  { id: "s_harika", name: "Harika", g: "woman", into: M, dob: "2001-07-07", city: "hyderabad", area: "Madhapur", home: "Hyderabad", role: "Data scientist", emp: "quarry", college: 6, year: 2023, langs: ["English", "Telugu"], intent: "long_term", lp: "y4wn", hb: "nsn", values: ["Curiosity", "Humour", "Growth"], interests: ["Board games", "Anime", "Puzzles"], prompts: [7, 8, 37], bio: "Local guide to the best Irani chai in the city.", range: [23, 29] },
  { id: "s_sravya", name: "Sravya", g: "woman", into: M, dob: "1999-09-19", city: "hyderabad", area: "Kondapur", home: "Visakhapatnam", role: "Cloud architect", emp: "orbit", college: 5, year: 2021, langs: ["English", "Telugu", "Hindi"], intent: "long_term", lp: "m4on", hb: "nsn", values: ["Independence", "Ambition", "Kindness"], interests: ["Travel", "Photography", "Running"], prompts: [32, 22, 18], bio: "Vizag beaches > everything. Will plan the itinerary.", range: [24, 31] },
  { id: "s_ravi", name: "Ravi", g: "man", into: W, dob: "1999-01-15", city: "hyderabad", area: "Gachibowli", home: "Nellore", role: "Backend engineer", emp: "deccan", college: 4, year: 2021, langs: ["English", "Telugu"], intent: "marriage", lp: "m2wj", hb: "nsn", values: ["Family", "Honesty", "Stability"], interests: ["Cricket", "Cooking", "Bollywood"], prompts: [28, 19, 15], bio: "Nellore boy, spicy food, steady heart.", range: [23, 29] },
  { id: "s_akash", name: "Akash", g: "man", into: W, dob: "2000-06-30", city: "hyderabad", area: "Madhapur", home: "Bhubaneswar", role: "Frontend developer", emp: "quarry", college: 2, year: 2022, langs: ["English", "Odia", "Hindi"], intent: "long_term", lp: "y4on", hb: "nsn", values: ["Curiosity", "Humour", "Kindness"], interests: ["Board games", "Football", "Puzzles"], prompts: [7, 5, 38], bio: "Odia in Hyderabad. Rasagola debates welcome.", range: [22, 29] },
  { id: "s_sandeep", name: "Sandeep", g: "man", into: W, dob: "1998-08-18", city: "hyderabad", area: "Kukatpally", home: "Karimnagar", role: "Engineering lead", emp: "orbit", college: 6, year: 2020, langs: ["English", "Telugu", "Hindi"], intent: "long_term", lp: "m4wn", hb: "nsn", values: ["Ambition", "Loyalty", "Family"], interests: ["Running", "Travel", "Podcasts"], prompts: [19, 27, 34], bio: "Lead by day, chef by weekend.", range: [23, 30] },
];
