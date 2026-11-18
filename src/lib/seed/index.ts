import { createHash } from "node:crypto";
import { hashPassword } from "../auth/password";
import { assignArm, SPARK_NUDGE, SPARK_NUDGE_TEXT } from "../experiments";
import { evaluate } from "../safety/scam-shield";
import { getPuzzle } from "../spark/puzzles";
import type { DocStore, WriteOp } from "../store/types";
import { addDays, DAY, HOUR, istDay, istDayStart, isoWeek } from "../time";
import type { Credential, Like, Match, Message, Payment, Redemption, Report, User, VenueApplication, Vouch } from "../types";
import { getVenue } from "../venues";
import { newPerkCode } from "../services/perks";
import { answer, COLLEGES, EMPLOYERS, habits, lifePlan, PEOPLE, type Person } from "./people";

/**
 * The demo scenario. Evaluators should land in a living product, not an
 * empty shell, so each demo account opens mid-story:
 *
 *  aarav@pairwise.demo   a date proposal waiting for his answer (Ishita),
 *                        a Spark half-solved (Sneha has posted her clues),
 *                        3 people who liked him, and fresh Daily Picks.
 *  meera@pairwise.demo   10 likes delivered today plus 2 queued by the
 *                        inbound cap, a scam attempt caught by Scam Shield,
 *                        and a conversation someone closed kindly. Her
 *                        colleague Rohan is walled off by hide-from-company.
 *  kabir@pairwise.demo   a Plus member in Pune with relocation mode.
 *  admin@pairwise.demo   the founder dashboard and the moderation queue.
 *
 * Times are relative to "now", and the scenario is re-seeded nightly
 * (/api/cron/reset-demo) so it never goes stale.
 */

export const DEMO_PASSWORD = "Demo@2026";
export const DEMO_ACCOUNTS = [
  { email: "aarav@pairwise.demo", uid: "s_aarav", label: "Aarav, 26, Bengaluru", story: "Has a date proposal to answer and a Spark puzzle to finish" },
  { email: "meera@pairwise.demo", uid: "s_meera", label: "Meera, 25, Bengaluru", story: "Sees the inbound cap, Scam Shield and Close-kindly in action" },
  { email: "kabir@pairwise.demo", uid: "s_kabir", label: "Kabir, 27, Pune (Plus)", story: "Plus member: 10 picks, 5 slots, relocation mode" },
  { email: "vivek@pairwise.demo", uid: "s_vivek", label: "Vivek, 26, Hyderabad (waitlisted)", story: "Waiting for the gender balance; Aarav's vouch code lets him in" },
  { email: "admin@pairwise.demo", uid: "s_admin", label: "Founder / admin", story: "Metrics, city launch control, revenue mix and moderation" },
];

const SEED_COLLECTIONS = ["likes", "passes", "matches", "messages", "reports", "payments", "picks", "shares", "blocks", "photos", "vouches", "redemptions", "venueApplications"] as const;

/** Aarav's vouch codes. One is spare, so an evaluator can let Vivek in from the waitlist. */
export const DEMO_VOUCH = "AARAV-7K2P";
/** Tonight's date at Dice & Deck (Ananya and Imran): redeem it at /partners/redeem with PIN 4321. */
export const DEMO_PERK = "PW-7Q4M2K";

function userFrom(p: Person, now: number, i: number): User {
  const emp = EMPLOYERS[p.emp];
  // Waitlisted members signed up just before they joined the line.
  const createdAt = p.wait ? now - p.wait.days * DAY - 2 * HOUR : now - (12 + ((i * 7) % 50)) * DAY;
  return {
    id: p.id,
    email: `${p.id.slice(2)}@pairwise.demo`,
    role: "member",
    status: p.wait ? "waitlisted" : "active",
    ...(p.wait ? { waitlist: { city: p.city, reason: p.wait.reason, joinedAt: now - p.wait.days * DAY } } : {}),
    plan: p.plus ? "plus" : "free",
    plusRenewsAt: p.plus ? now + 20 * DAY : undefined,
    birthDate: p.dob,
    createdAt,
    lastActiveAt: now - (p.activeDaysAgo ?? (i % 3)) * DAY - (i % 5) * HOUR,
    // Demo members last opened Activity yesterday, so today's events show as new.
    activitySeenAt: now - 20 * HOUR,
    onboarded: true,
    profile: {
      firstName: p.name,
      birthDate: p.dob,
      gender: p.g,
      interestedIn: p.into,
      ageRange: p.range ?? [22, 31],
      city: p.city,
      area: p.area,
      hometown: p.home,
      languages: p.langs,
      heightCm: p.height,
      role: p.role,
      intent: p.intent,
      lifePlan: lifePlan(p.lp),
      habits: habits(p.hb),
      values: p.values,
      interests: p.interests,
      prompts: p.prompts.map(answer),
      bio: p.bio,
      faith: p.faith,
      avatarSeed: p.id,
    },
    verification: {
      method: p.via ?? "elitmus",
      identity: true,
      education: p.via === "work_email" ? undefined : { college: COLLEGES[p.college], year: p.year },
      work: { employer: emp.employer, domain: emp.domain },
      verifiedAt: createdAt + HOUR,
    },
    privacy: { hideFromCompany: p.hideCompany ?? i % 2 === 0, hideFromCollege: false, blurPhotos: p.blur ?? false },
    consents: { terms: true, privacy: true, sensitive: true, marketing: false, at: createdAt },
    trust: { scamFlags: 0, reportsAgainst: 0, warnings: 0 },
    exposure: { week: isoWeek(now), count: i % 6 },
    seed: true,
  };
}

/** Builds a match plus its messages from a compact script. */
class Scenario {
  ops: WriteOp[] = [];
  firstMatch = new Map<string, number>();
  /** Pairs that already interacted (matched or liked), so seeded passes never contradict them. */
  touched = new Set<string>();
  private n = 0;
  constructor(private now: number) {}

  match(a: string, b: string, createdAgo: number, extra: Partial<Match> = {}) {
    const members = [a, b].sort() as [string, string];
    const id = members.join("__");
    const m: Match = {
      id,
      members,
      createdAt: this.now - createdAgo,
      status: "active",
      messageCounts: { [a]: 0, [b]: 0 },
      unread: { [a]: 0, [b]: 0 },
      meetReady: {},
      lastMessageAt: this.now - createdAgo,
      seed: true,
      ...extra,
    };
    this.touched.add(id);
    this.firstMatch.set(a, Math.min(this.firstMatch.get(a) ?? Infinity, m.createdAt));
    this.firstMatch.set(b, Math.min(this.firstMatch.get(b) ?? Infinity, m.createdAt));
    // Every match came from two likes; record them so the like→match funnel adds up.
    for (const [from, to, lag] of [
      [b, a, 5 * HOUR],
      [a, b, 0],
    ] as const) {
      const at = m.createdAt - lag;
      const like: Like = { id: `${from}__${to}`, from, to, createdAt: at, deliverAt: at, deliverDay: istDay(at), status: "matched", seed: true };
      this.ops.push({ type: "set", col: "likes", id: like.id, data: like });
    }
    const msgs: Message[] = [];
    // Seeded matches go through the same H4 randomisation as live ones.
    if (assignArm(SPARK_NUDGE, id) === SPARK_NUDGE.treatment) {
      msgs.push({ id: `${id}_nudge`, matchId: id, from: "system", kind: "spark", text: SPARK_NUDGE_TEXT, createdAt: m.createdAt + 1, seed: true });
    }
    const api = {
      id,
      m,
      sys: (text: string, ago: number, kind: Message["kind"] = "system") => {
        msgs.push({ id: `${id}_${String(this.n++).padStart(4, "0")}`, matchId: id, from: "system", kind, text, createdAt: this.now - ago, seed: true });
        return api;
      },
      say: (from: string, text: string, ago: number) => {
        const sent = m.messageCounts[from] ?? 0;
        const v = evaluate(text, { matchAgeHours: (m.createdAt - (this.now - ago)) / -HOUR, senderMessageCount: sent });
        msgs.push({ id: `${id}_${String(this.n++).padStart(4, "0")}`, matchId: id, from, kind: "text", text, createdAt: this.now - ago, signals: v.signals.length ? v.signals : undefined, tip: v.receiverTip, seed: true });
        m.messageCounts[from] = sent + 1;
        return api;
      },
      done: (unread: Record<string, number> = {}) => {
        const last = msgs[msgs.length - 1];
        if (last) {
          m.lastMessageAt = last.createdAt;
          m.lastMessageBy = last.from;
          m.lastMessagePreview = last.text.slice(0, 80);
        }
        m.unread = { ...m.unread, ...unread };
        this.ops.push({ type: "set", col: "matches", id, data: m });
        for (const msg of msgs) this.ops.push({ type: "set", col: "messages", id: msg.id, data: msg });
        return m;
      },
    };
    return api;
  }

  like(from: string, to: string, ago: number, opts: { note?: string; promptIndex?: number; deliverDay?: string; deliverAt?: number } = {}) {
    this.touched.add([from, to].sort().join("__"));
    const at = this.now - ago;
    const l: Like = {
      id: `${from}__${to}`,
      from,
      to,
      note: opts.note,
      promptIndex: opts.promptIndex,
      createdAt: at,
      deliverAt: opts.deliverAt ?? at,
      deliverDay: opts.deliverDay ?? istDay(at),
      status: "pending",
      seed: true,
    };
    this.ops.push({ type: "set", col: "likes", id: l.id, data: l });
  }

  set(col: string, id: string, data: object) {
    this.ops.push({ type: "set", col, id, data: { ...data, seed: true } });
  }
}

const CHAT = [
  "Okay your prompt answer made me laugh out loud",
  "Haha thank you! Yours was really sweet too",
  "So how long have you been in the city?",
  "Almost three years now. Still discovering new places every weekend",
  "Same here. Any favourite spots?",
  "There's a tiny café near my place that does the best filter coffee",
  "You have to take me there sometime",
  "Deal. What are you up to this weekend?",
  "Probably a trek if the weather holds. You?",
  "Family call, laundry, and pretending to go to the gym 😅",
  "Honest answer, I respect it",
  "What's the best thing that happened to you this week?",
  "My team shipped a feature I worked on for two months!",
  "That's amazing, congrats! What does it do?",
  "Makes refunds instant. Very unglamorous, very satisfying",
  "Unglamorous and satisfying is underrated",
  "Okay important question: chai or coffee?",
  "Chai in the morning, coffee when there's a deadline",
  "Balanced. I like that",
  "Do you cook?",
  "I make a mean rajma chawal. That's the whole menu",
  "That's one more dish than me",
  "We should do a cook-off. Loser buys dessert",
  "You're on",
];

function chat(s: ReturnType<Scenario["match"]>, a: string, b: string, count: number, startAgo: number, endAgo: number) {
  for (let i = 0; i < count; i++) {
    const ago = startAgo - ((startAgo - endAgo) * i) / Math.max(1, count - 1);
    s.say(i % 2 === 0 ? a : b, CHAT[i % CHAT.length], Math.round(ago));
  }
  return s;
}

/** The next Saturday at least two days away, 5 PM IST. */
function upcomingSaturday(now: number) {
  for (let i = 2; i < 10; i++) {
    const day = addDays(istDay(now), i);
    if (new Date(`${day}T00:00:00Z`).getUTCDay() === 6) return istDayStart(day) + 17 * HOUR;
  }
  return now + 4 * DAY;
}

export function buildScenario(now: number) {
  const s = new Scenario(now);
  const users = PEOPLE.map((p, i) => userFrom(p, now, i));
  const byId = new Map(users.map((u) => [u.id, u]));

  // ---- Aarav ↔ Ishita: Spark solved, both ready, date proposed by Ishita ----
  const sat = upcomingSaturday(now);
  const cafe = getPuzzle("cafe")!;
  const ishita = s.match("s_aarav", "s_ishita", 3 * DAY, {
    spark: { puzzleId: "cafe", startedBy: "s_ishita", startedAt: now - 3 * DAY + 10 * 60000, roles: { s_ishita: "A", s_aarav: "B" }, attempts: 1, solvedAt: now - 3 * DAY + 16 * 60000, solvedBy: "s_aarav", played: ["cafe"] },
    meetReady: { s_aarav: true, s_ishita: true },
    datePlan: { venueId: "blr-dicedeck", at: sat, proposedBy: "s_ishita", status: "proposed", proposedAt: now - 3 * HOUR },
  });
  ishita
    .sys("It's mutual! Ishita's note: “Your 'send me a puzzle' line was basically a dare.”", 3 * DAY)
    .say("s_ishita", "Okay, your 'send me a puzzle' prompt was basically a dare 😄", 3 * DAY - 5 * 60000)
    .say("s_aarav", "Haha it was. Want to try a Spark?", 3 * DAY - 8 * 60000)
    .sys(`🧩 Ishita started a Spark: “${cafe.title}”. You each have half the clues. Compare notes!`, 3 * DAY - 10 * 60000, "spark")
    .say("s_ishita", "Mine: it serves filter coffee, and it's NOT in Indiranagar", 3 * DAY - 11 * 60000)
    .say("s_aarav", "Mine: opens before 9 AM and has board games. So… Brew & Banter?", 3 * DAY - 13 * 60000)
    .say("s_ishita", "It's in Indiranagar though 😂", 3 * DAY - 14 * 60000)
    .sys("🎉 Solved together in 6 mins (after 1 wrong guess)! The answer was Cloud Nine Terrace.", 3 * DAY - 16 * 60000, "spark")
    .say("s_aarav", "Cloud Nine Terrace! Okay, Indiranagar was a trap", 3 * DAY - 17 * 60000)
    .say("s_ishita", "Sadly it's not real, but I know a board-game café in Koramangala that is", 3 * DAY - 20 * 60000)
    .say("s_aarav", "Dice & Deck? I've walked past it a hundred times and never gone in", 2 * DAY + 5 * HOUR)
    .say("s_ishita", "Then it's decided. What do you play? Please don't say Monopoly", 2 * DAY + 4 * HOUR)
    .say("s_aarav", "Codenames, Splendor, and I'm dangerously competitive at Ticket to Ride", 2 * DAY + 3 * HOUR)
    .say("s_ishita", "Green flag. I give terrible one-word Codenames clues though", 2 * DAY + 2 * HOUR)
    .say("s_aarav", "Perfect, I'm a great guesser. We're unbeatable", 2 * DAY + HOUR)
    .say("s_ishita", "So how did Indore → Bengaluru happen?", DAY + 6 * HOUR)
    .say("s_aarav", "Campus placement in 2022. First month was all Maggi, now I make a decent dal", DAY + 5 * HOUR)
    .say("s_ishita", "Decent dal is underrated. Pune → Bengaluru for me, also work", DAY + 4 * HOUR)
    .say("s_aarav", "Do you miss Pune?", DAY + 3 * HOUR)
    .say("s_ishita", "Only the misal. And my mom's cooking, obviously", DAY + 2 * HOUR)
    .say("s_ishita", "Okay I tapped 'I'd like to meet' 🙈 no pressure", 20 * HOUR)
    .say("s_aarav", "Tapped it too 😊", 19 * HOUR)
    .sys("🤝 You'd both like to meet! Pick a public spot from Date Plan. Partner venues have perks for Pairwise dates.", 19 * HOUR)
    .sys("📍 Ishita suggested Dice & Deck, Koramangala for Saturday, 5 PM.", 3 * HOUR)
    .say("s_ishita", "Does Saturday evening work for you? They have a Codenames table 😄", 2 * HOUR)
    .done({ s_aarav: 2 });

  // ---- Aarav ↔ Sneha: new match, Spark started by Sneha, her clues posted ----
  const weekend = getPuzzle("weekend")!;
  s.match("s_aarav", "s_sneha", 20 * HOUR, {
    spark: { puzzleId: "weekend", startedBy: "s_sneha", startedAt: now - 6 * HOUR, roles: { s_sneha: "A", s_aarav: "B" }, attempts: 0, played: ["weekend"] },
  })
    .sys("It's mutual! Sneha's note: “A sunrise trek and a dosa? Name the trail.”", 20 * HOUR)
    .say("s_sneha", "Hi Aarav! Fellow trekker 👋", 7 * HOUR)
    .sys(`🧩 Sneha started a Spark: “${weekend.title}”. You each have half the clues. Compare notes!`, 6 * HOUR, "spark")
    .say("s_sneha", "Mine say: 'I'd love to be outdoors' and 'I'm a morning person, start before noon'. What do yours say? 😄", 5 * HOUR)
    .done({ s_aarav: 3 });

  // ---- Aarav ↔ Pooja: closed kindly by Pooja, 9 days ago ----
  s.match("s_aarav", "s_pooja", 13 * DAY, { status: "closed", closedBy: "s_pooja", closedAt: now - 9 * DAY, closeReason: "kindly" })
    .say("s_aarav", "Hi Pooja! Your gulab jamun take is correct, by the way", 13 * DAY - HOUR)
    .say("s_pooja", "Finally someone who understands 😄", 12 * DAY)
    .say("s_aarav", "Warm, always. Do you cook a lot?", 12 * DAY - HOUR)
    .say("s_pooja", "Every weekend! It's a family thing", 11 * DAY)
    .sys("Pooja closed this conversation kindly: “Thank you for the lovely conversation. I don't think we're the right match, but I hope you find your person soon.”", 9 * DAY)
    .done();

  // People who liked Aarav (delivered).
  s.like("s_diya", "s_aarav", 9 * HOUR, { note: "Narmada Institute alum too! Also: what's your dal recipe?", promptIndex: 2 });
  s.like("s_riya", "s_aarav", 26 * HOUR);
  s.like("s_harini", "s_aarav", 4 * HOUR, { note: "I'd take you up on the puzzle challenge 🧩", promptIndex: 0 });

  // ---- Meera ↔ Vikram: Scam Shield in action ----
  const vik = s.match("s_meera", "s_vikram", 2 * DAY);
  vik
    .sys("It's mutual! Start a Spark puzzle together, or say something better than “hi” 😊", 2 * DAY)
    .say("s_vikram", "Hi Meera! Love that you're into Carnatic music", 2 * DAY - 10 * 60000)
    .say("s_meera", "Hi! Thank you 😊 do you listen too?", 2 * DAY - 40 * 60000)
    .say("s_vikram", "Sometimes! Tell me, how do you invest? I'm doing really well on a crypto trading platform, guaranteed 3x returns", 2 * DAY - 50 * 60000)
    .say("s_meera", "Haha I mostly stick to mutual funds", 30 * HOUR)
    .say("s_vikram", "Let's continue on telegram, it's easier. Add me @vik_trades", 29 * HOUR)
    .say("s_vikram", "Also small favour, I'm stuck with a payment. Can you send 5000 rs to my UPI vikram.trades@ybl? Will return tomorrow", 28 * HOUR)
    .done({ s_meera: 3 });
  byId.get("s_vikram")!.trust.scamFlags = 3;
  byId.get("s_vikram")!.trust.reportsAgainst = 1;
  s.set("reports", "r_seed_vikram", {
    id: "r_seed_vikram",
    reporter: "system",
    reported: "s_vikram",
    matchId: vik.id,
    category: "scam_or_money",
    details: "Scam Shield: 3 money/crypto/UPI signals. Latest: “Can you send 5000 rs to my UPI vikram.trades@ybl? Will return tomorrow”",
    status: "open",
    createdAt: now - 28 * HOUR,
  } satisfies Report);

  // ---- Meera ↔ Aditya: closed kindly by Aditya ----
  s.match("s_meera", "s_aditya", 6 * DAY, { status: "closed", closedBy: "s_aditya", closedAt: now - 2 * DAY, closeReason: "kindly" })
    .say("s_aditya", "Hi Meera! Mysuru is my favourite weekend trip", 6 * DAY - HOUR)
    .say("s_meera", "It's the best! Palace or the zoo?", 5 * DAY)
    .say("s_aditya", "Zoo, controversially. And Mylari dosa", 5 * DAY - HOUR)
    .say("s_meera", "Mylari is elite 😄", 4 * DAY)
    .sys("Aditya closed this conversation kindly: “I'm going to focus on fewer conversations for now. It was genuinely nice getting to know you. Take care!”", 2 * DAY)
    .done();

  // Meera's inbound queue: 10 delivered today, 2 held for tomorrow by the cap.
  const today = istDay(now);
  const suitors = ["s_karthik", "s_siddharth", "s_arjun", "s_nikhil", "s_rahul", "s_varun", "s_imran", "s_pranav", "s_harsh", "s_manish"];
  const notes: Record<string, string> = {
    s_karthik: "Filter coffee evangelist here. Your Sunday sounds perfect.",
    s_imran: "Also a slow-mornings person. Which Carnatic artist should I start with?",
    s_pranav: "Idli > dosa. Finally, someone sensible.",
  };
  suitors.forEach((uid, i) => {
    const ago = Math.min(now - istDayStart(today) - 60000, (i + 1) * 35 * 60000);
    s.like(uid, "s_meera", ago, { note: notes[uid], promptIndex: notes[uid] ? (uid === "s_pranav" ? 2 : 0) : undefined, deliverDay: today });
  });
  const tomorrow = addDays(today, 1);
  for (const uid of ["s_abhishek", "s_tejas"]) {
    s.like(uid, "s_meera", 20 * 60000, { deliverDay: tomorrow, deliverAt: istDayStart(tomorrow) + 9 * HOUR });
  }

  // ---- Background activity, so the founder dashboard has real signal ----
  const bg = (a: string, b: string, createdAgo: number, msgs: number, extra: Partial<Match> = {}) => {
    const t = s.match(a, b, createdAgo, extra);
    if (msgs) chat(t, a, b, msgs, createdAgo - HOUR, Math.max(HOUR, createdAgo / 8));
    return t.done();
  };
  const past = (d: number) => now - d * DAY;
  bg("s_kavya", "s_siddharth", 9 * DAY, 24, {
    spark: { puzzleId: "lock", startedBy: "s_kavya", startedAt: past(9), roles: { s_kavya: "A", s_siddharth: "B" }, attempts: 0, solvedAt: past(9) + 9 * 60000, played: ["lock"] },
    meetReady: { s_kavya: true, s_siddharth: true },
    datePlan: { venueId: "blr-filterhouse", at: past(2), proposedBy: "s_siddharth", status: "accepted" },
    checkins: { s_kavya: { safe: true, again: "yes", at: past(2) + 4 * HOUR }, s_siddharth: { safe: true, again: "yes", at: past(2) + 5 * HOUR } },
  });
  bg("s_ananya", "s_imran", 5 * DAY, 12, {
    spark: { puzzleId: "playlist", startedBy: "s_imran", startedAt: past(5), roles: { s_imran: "A", s_ananya: "B" }, attempts: 2, solvedAt: past(5) + 14 * 60000, played: ["playlist"] },
    // Tonight at a partner venue: its perk code is in the evaluator guide, so the partner counter can be tried today.
    meetReady: { s_ananya: true, s_imran: true },
    datePlan: { venueId: "blr-dicedeck", at: istDayStart(today) + 19.5 * HOUR, proposedBy: "s_imran", status: "accepted", perkCode: DEMO_PERK },
  });
  bg("s_nandini", "s_karthik", 6 * DAY, 18, {
    meetReady: { s_nandini: true, s_karthik: true },
    datePlan: { venueId: "blr-pagesprose", at: now + 3 * DAY, proposedBy: "s_nandini", status: "accepted" },
  });
  bg("s_priyanka", "s_arjun", 5 * DAY, 1);
  bg("s_riya", "s_varun", 3 * DAY, 6);
  bg("s_tanvi", "s_harsh", 4 * DAY, 0);
  bg("s_fatima", "s_gayatri", 8 * DAY, 20, {
    spark: { puzzleId: "dinner", startedBy: "s_gayatri", startedAt: past(8), roles: { s_gayatri: "A", s_fatima: "B" }, attempts: 0, solvedAt: past(8) + 5 * 60000, played: ["dinner"] },
  });
  bg("s_akhil", "s_sai", 4 * DAY, 9);
  bg("s_ritika", "s_omkar", 12 * DAY, 22, {
    meetReady: { s_ritika: true, s_omkar: true },
    datePlan: { venueId: "pune-chaistop", at: past(4), proposedBy: "s_omkar", status: "accepted" },
    checkins: { s_ritika: { safe: true, again: "yes", at: past(4) + 3 * HOUR } },
  });
  bg("s_neha", "s_yash", 2 * DAY, 3);
  bg("s_divya", "s_kabir", 3 * DAY, 8, {
    spark: { puzzleId: "seat", startedBy: "s_kabir", startedAt: past(3), roles: { s_kabir: "A", s_divya: "B" }, attempts: 1, solvedAt: past(3) + 7 * 60000, played: ["seat"] },
  });
  bg("s_bhavana", "s_faisal", 6 * DAY, 2);
  bg("s_swathi", "s_ravi", 10 * DAY, 20, {
    meetReady: { s_swathi: true, s_ravi: true },
    datePlan: { venueId: "hyd-irani", at: past(3), proposedBy: "s_ravi", status: "accepted" },
    checkins: { s_swathi: { safe: true, again: "maybe", at: past(3) + 3 * HOUR } },
  });
  bg("s_harika", "s_akash", 4 * DAY, 10, {
    spark: { puzzleId: "cafe", startedBy: "s_harika", startedAt: past(4), roles: { s_harika: "A", s_akash: "B" }, attempts: 0, solvedAt: past(4) + 4 * 60000, played: ["cafe"] },
  });
  bg("s_sravya", "s_sandeep", 7 * DAY, 4);

  // A few more pending likes around the graph.
  s.like("s_keerthi", "s_kabir", 6 * HOUR, { note: "Nagpur oranges vs Kurnool mangoes. Let's settle this." , promptIndex: 0 });
  s.like("s_neha", "s_kabir", 30 * HOUR);
  s.like("s_shruti", "s_karthik", 2 * DAY);
  s.like("s_zoya", "s_imran", DAY);

  // ---- Moderation queue ----
  s.set("reports", "r_seed_harsh", {
    id: "r_seed_harsh",
    reporter: "s_tanvi",
    reported: "s_harsh",
    category: "harassment",
    details: "Kept sending messages on Instagram after I said I wasn't interested.",
    status: "open",
    createdAt: now - 7 * HOUR,
  } satisfies Report);
  s.set("reports", "r_seed_old", {
    id: "r_seed_old",
    reporter: "s_priyanka",
    reported: "s_arjun",
    category: "fake_profile",
    details: "Not sure his job is real?",
    status: "resolved",
    resolution: "dismissed",
    resolvedBy: "s_admin",
    resolvedAt: now - 6 * DAY + 3 * HOUR,
    createdAt: now - 6 * DAY,
  } satisfies Report);
  byId.get("s_harsh")!.trust.reportsAgainst = 1;

  // ---- Payments (Plus) ----
  const pay = (uid: string, plan: Payment["plan"], amountInr: number, ago: number) =>
    s.set("payments", `pay_seed_${uid}`, { id: `pay_seed_${uid}`, uid, plan, amountInr, provider: "demo", createdAt: now - ago } satisfies Payment);
  pay("s_kabir", "plus_quarterly", 699, 20 * DAY);
  pay("s_varun", "plus_monthly", 299, 10 * DAY);
  pay("s_ritika", "plus_monthly", 299, 3 * DAY);
  pay("s_sana", "plus_monthly", 299, 25 * DAY);

  // Sign-up dates that make sense: shortly before each member's first match.
  users.forEach((u, i) => {
    const first = s.firstMatch.get(u.id);
    const fallback = now - (4 + ((i * 3) % 16)) * DAY;
    u.createdAt = first ? first - (8 + (i % 5) * 9) * HOUR : fallback;
    if (u.id === "s_aarav" || u.id === "s_meera" || u.id === "s_kabir") u.createdAt = Math.min(u.createdAt, now - 30 * DAY);
    u.verification.verifiedAt = u.createdAt + HOUR;
    u.consents.at = u.createdAt;
  });

  // Yesterday's Daily Picks for a slice of members, with decisions, so the
  // "picks that get a decision" hypothesis (H2) has data to read.
  const yesterday = addDays(istDay(now), -1);
  const pickers = users.filter((u) => u.profile && !u.id.match(/^s_(aarav|meera|kabir)$/)).slice(0, 18);
  pickers.forEach((viewer, vi) => {
    const pool = users.filter(
      (c) => c.id !== viewer.id && c.profile!.city === viewer.profile!.city && viewer.profile!.interestedIn.includes(c.profile!.gender) && c.profile!.interestedIn.includes(viewer.profile!.gender),
    );
    const chosen = pool.slice(vi % 3, (vi % 3) + 5);
    if (!chosen.length) return;
    s.set("picks", `${viewer.id}_${yesterday}`, {
      id: `${viewer.id}_${yesterday}`,
      uid: viewer.id,
      day: yesterday,
      picks: chosen.map((c) => ({ uid: c.id, score: 60, reasons: [] })),
      createdAt: istDayStart(yesterday) + 8 * HOUR,
    });
    // About half of picks get a pass; liked ones are covered by match likes above.
    chosen.forEach((c, ci) => {
      if ((ci + vi) % 2 === 0 && !s.touched.has([viewer.id, c.id].sort().join("__"))) s.set("passes", `${viewer.id}__${c.id}`, { id: `${viewer.id}__${c.id}`, from: viewer.id, to: c.id, createdAt: istDayStart(yesterday) + 12 * HOUR });
    });
  });

  const admin: User = {
    id: "s_admin",
    email: "admin@pairwise.demo",
    role: "admin",
    status: "active",
    plan: "free",
    createdAt: now - 90 * DAY,
    lastActiveAt: now,
    onboarded: false,
    verification: { method: null, identity: true },
    privacy: { hideFromCompany: false, hideFromCollege: false, blurPhotos: false },
    consents: { terms: true, privacy: true, sensitive: false, marketing: false, at: now - 90 * DAY },
    trust: { scamFlags: 0, reportsAgainst: 0, warnings: 0 },
    exposure: { week: "", count: 0 },
    seed: true,
  };

  // ---- Partner perks: every accepted date at a partner venue has a code; past ones were redeemed ----
  for (const op of s.ops) {
    if (op.type !== "set" || op.col !== "matches") continue;
    const m = op.data as Match;
    if (m.datePlan?.status !== "accepted" || !getVenue(m.datePlan.venueId)?.partner) continue;
    const code = m.datePlan.perkCode ?? newPerkCode(createHash("sha256").update(m.id).digest().subarray(0, 6));
    m.datePlan.perkCode = code;
    const redeemedAt = m.datePlan.at + HOUR < now ? m.datePlan.at + HOUR : undefined;
    const r: Redemption = { id: code, matchId: m.id, venueId: m.datePlan.venueId, at: m.datePlan.at, createdAt: m.datePlan.at - 2 * DAY, ...(redeemedAt ? { redeemedAt } : {}), seed: true };
    s.ops.push({ type: "set", col: "redemptions", id: code, data: r });
  }

  // ---- Venue applications waiting for the city team ----
  const apps: VenueApplication[] = [
    { id: "va_seed_1", name: "Kaapi Katte", city: "bengaluru", area: "Jayanagar", kind: "Café", contactName: "Rekha S", contactEmail: "rekha@kaapikatte.test", perk: "Free Mysore pak with two coffees", checklist: { public: true, transit: true, staffBriefed: true, openLate: true }, status: "new", createdAt: now - 2 * DAY, seed: true },
    { id: "va_seed_2", name: "Marina Reads", city: "chennai", area: "Besant Nagar", kind: "Bookstore café", contactName: "Arun K", contactEmail: "arun@marinareads.test", perk: "10% off books bought together", checklist: { public: true, transit: true, staffBriefed: true, openLate: false }, status: "new", createdAt: now - 5 * DAY, seed: true },
  ];
  for (const a of apps) s.ops.push({ type: "set", col: "venueApplications", id: a.id, data: a });

  // ---- Vouches: Aarav vouched for Karthik; two codes are spare (one is in the evaluator guide) ----
  byId.get("s_karthik")!.vouchedBy = "s_aarav";
  const vouches: Vouch[] = [
    { id: "AARAV-M4QD", by: "s_aarav", createdAt: now - 20 * DAY, usedBy: "s_karthik", usedAt: now - 19 * DAY, seed: true },
    { id: DEMO_VOUCH, by: "s_aarav", createdAt: now - 20 * DAY + 1, seed: true },
    { id: "AARAV-H3XW", by: "s_aarav", createdAt: now - 20 * DAY + 2, seed: true },
  ];
  for (const v of vouches) s.ops.push({ type: "set", col: "vouches", id: v.id, data: v });

  return { users: [...users, admin], ops: s.ops };
}

/** Deletes everything touching demo accounts, then writes a fresh scenario. */
export async function seedDemo(store: DocStore, now = Date.now(), opts: { reset?: boolean } = {}) {
  const { users, ops } = buildScenario(now);
  const ids = users.map((u) => u.id);

  if (opts.reset) {
    const del: WriteOp[] = [];
    const seen = new Set<string>();
    const drop = (col: string, id: string) => {
      const key = `${col}/${id}`;
      if (!seen.has(key)) {
        seen.add(key);
        del.push({ type: "delete", col, id });
      }
    };
    // All lookups run in parallel: on Firestore this turns ~60s of round trips into a few seconds.
    const byField: [string, string][] = [
      ["likes", "from"], ["likes", "to"], ["passes", "from"], ["passes", "to"], ["reports", "reported"], ["reports", "reporter"],
      ["payments", "uid"], ["picks", "uid"], ["shares", "uid"], ["blocks", "by"], ["blocks", "target"], ["photos", "owner"],
      ["vouches", "by"], ["vouches", "usedBy"],
    ];
    const [flagged, linked, matchLists] = await Promise.all([
      Promise.all(SEED_COLLECTIONS.map(async (col) => ({ col, docs: await store.query<{ id: string }>(col, [["seed", "==", true]]) }))),
      Promise.all(byField.map(async ([col, field]) => ({ col, docs: await store.query<{ id: string }>(col, [[field, "in", ids]]) }))),
      Promise.all(ids.map((uid) => store.query<Match>("matches", [["members", "array-contains", uid]]))),
    ]);
    for (const { col, docs } of [...flagged, ...linked]) for (const d of docs) drop(col, d.id);
    const matchIds = [...new Set(matchLists.flat().map((m) => m.id))];
    for (const id of matchIds) drop("matches", id);
    if (matchIds.length) {
      for (const msg of await store.query<Message>("messages", [["matchId", "in", matchIds]])) drop("messages", msg.id);
    }
    await store.batch(del);
  }

  const hash = await hashPassword(DEMO_PASSWORD);
  const creds: WriteOp[] = DEMO_ACCOUNTS.map((a) => ({
    type: "set" as const,
    col: "credentials",
    id: a.email,
    data: { email: a.email, uid: a.uid, passwordHash: hash } satisfies Credential,
  }));
  // Demo-account emails must match their credentials.
  for (const a of DEMO_ACCOUNTS) {
    const u = users.find((x) => x.id === a.uid);
    if (u) u.email = a.email;
  }
  await store.batch([...users.map((u) => ({ type: "set" as const, col: "users", id: u.id, data: u })), ...creds, ...ops]);
  return { users: users.length, writes: ops.length + users.length + creds.length };
}
