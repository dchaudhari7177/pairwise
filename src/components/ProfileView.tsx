import { Baby, Briefcase, Cigarette, GraduationCap, Heart, Home, Languages, MapPin, Plane, Ruler, Sparkles, Users, Utensils, Wine } from "lucide-react";
import { CITIES, HABIT_LABELS, INTENTS, LIFE_PLAN_LABELS } from "@/lib/options";
import type { ProfileCard } from "@/lib/services/profiles";
import { Badges, VerifiedTick } from "./Badges";
import { Portrait } from "./Portrait";

export function ProfileHeadline({ card }: { card: ProfileCard }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-3xl font-semibold">
        {card.firstName}, {card.age} {card.badges.identity && <VerifiedTick className="text-2xl" />}
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        {card.role}
        {card.employer ? ` at ${card.employer}` : ""}
      </p>
    </div>
  );
}

/** The photo card: portrait full-bleed, name and essentials over a soft scrim. */
export function HeroCard({
  card,
  score,
  likedYou,
  className = "",
}: {
  card: ProfileCard;
  score?: number;
  likedYou?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-lift ${className}`}>
      <Portrait seed={card.avatarSeed} name={card.firstName} gender={card.gender} photo={card.photo} rounded="rounded-[2rem]" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        {likedYou ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-love px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <Heart className="h-3.5 w-3.5 fill-current" /> Liked you
          </span>
        ) : (
          <span />
        )}
        {score !== undefined && (
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-ink shadow">
            <Sparkles className="h-3.5 w-3.5 text-rose" /> {score}% match
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1b1015]/85 via-[#1b1015]/50 via-55% to-transparent px-5 pb-5 pt-20 text-white">
        <p className="flex items-center gap-2 font-display text-[2rem] font-semibold leading-none tracking-tight">
          {card.firstName}
          <span className="font-normal opacity-90">{card.age}</span>
          {card.badges.identity && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
              <VerifiedTick className="text-[1.15rem]" />
            </span>
          )}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {card.role}
            {card.employer ? ` · ${card.employer}` : ""}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {card.area ? `${card.area}, ` : ""}
            {CITIES[card.city].label} · from {card.hometown}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">{INTENTS[card.intent].label}</span>
          {card.plus && <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">✦ Plus</span>}
        </div>
      </div>
    </div>
  );
}

function PromptCard({ q, a, action }: { q: string; a: string; action?: React.ReactNode }) {
  return (
    <div className="card relative overflow-hidden p-6 pb-7">
      <p className="text-[0.8rem] font-semibold text-muted">{q}</p>
      <p className={`mt-2 font-display text-[1.45rem] leading-snug tracking-tight ${action ? "pr-12" : ""}`}>{a}</p>
      {action && <div className="absolute bottom-4 right-4">{action}</div>}
    </div>
  );
}

function Fact({ icon: Icon, children }: { icon: typeof Ruler; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink-2">
      <Icon className="h-4 w-4 shrink-0 text-muted" /> {children}
    </span>
  );
}

/**
 * A full profile, read like a short story rather than swiped past. On wide
 * screens the photo card stays pinned on the left while the story scrolls.
 */
export function ProfileView({
  card,
  shared,
  reasons,
  score,
  likedYou,
  promptAction,
  hidePortrait = false,
}: {
  card: ProfileCard;
  shared?: { values: Set<string>; interests: Set<string> };
  reasons?: string[];
  score?: number;
  likedYou?: boolean;
  promptAction?: (index: number) => React.ReactNode;
  hidePortrait?: boolean;
}) {
  const lp = card.lifePlan;
  const [p1, p2, p3] = card.prompts;
  return (
    <article className={hidePortrait ? "" : "grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-8"}>
      {!hidePortrait && (
        <div className="mx-auto w-full max-w-md lg:sticky lg:top-6">
          <HeroCard card={card} score={score} likedYou={likedYou} />
        </div>
      )}
      <div className="min-w-0 space-y-4">
        {reasons && reasons.length > 0 && (
          <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-soft to-[#fbe9df] p-5">
            <p className="eyebrow flex items-center gap-1.5 text-rose-2">
              <Sparkles className="h-3.5 w-3.5" /> Why you&apos;re seeing {card.firstName}
            </p>
            <ul className="mt-3 space-y-2 text-[0.95rem] text-ink-2">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {p1 && <PromptCard q={p1.q} a={p1.a} action={promptAction?.(0)} />}

        <div className="card space-y-4 p-5">
          <Badges card={card} />
          {card.bio && <p className="leading-relaxed text-ink-2">{card.bio}</p>}
          <div className="flex flex-wrap gap-2">
            {card.heightCm && <Fact icon={Ruler}>{card.heightCm} cm</Fact>}
            <Fact icon={Home}>{card.hometown}</Fact>
            <Fact icon={Languages}>{card.languages.join(", ")}</Fact>
            <Fact icon={Utensils}>{HABIT_LABELS.diet.options[card.habits.diet]}</Fact>
            <Fact icon={Wine}>Drinks {HABIT_LABELS.drinks.options[card.habits.drinks].toLowerCase()}</Fact>
            <Fact icon={Cigarette}>{card.habits.smokes === "never" ? "Doesn't smoke" : `Smokes ${HABIT_LABELS.smokes.options[card.habits.smokes].toLowerCase()}`}</Fact>
            {card.college && (
              <Fact icon={GraduationCap}>
                {card.college}
                {card.gradYear ? ` '${String(card.gradYear).slice(2)}` : ""}
              </Fact>
            )}
            {card.faith && <Fact icon={Sparkles}>{card.faith}</Fact>}
          </div>
        </div>

        {p2 && <PromptCard q={p2.q} a={p2.a} action={promptAction?.(1)} />}

        <div className="card p-5">
          <p className="eyebrow">Values</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {card.values.map((v) => (
              <span key={v} className={`chip ${shared?.values.has(v) ? "chip-shared" : ""}`}>
                {shared?.values.has(v) && "♥ "}
                {v}
              </span>
            ))}
          </div>
          <p className="eyebrow mt-5">Into</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {card.interests.map((v) => (
              <span key={v} className={`chip ${shared?.interests.has(v) ? "chip-shared" : ""}`}>
                {shared?.interests.has(v) && "♥ "}
                {v}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="eyebrow">Life plan</p>
          <dl className="mt-3 grid grid-cols-2 gap-2.5">
            {(
              [
                ["relocate", Plane],
                ["timeline", Heart],
                ["kids", Baby],
                ["family", Users],
              ] as const
            ).map(([k, Icon]) => (
              <div key={k} className="rounded-2xl bg-paper-2/70 p-3">
                <dt className="flex items-start gap-1.5 text-[0.72rem] leading-tight text-muted">
                  <Icon className="h-3.5 w-3.5 shrink-0" /> {LIFE_PLAN_LABELS[k].question}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{(LIFE_PLAN_LABELS[k].options as Record<string, string>)[lp[k]]}</dd>
              </div>
            ))}
          </dl>
        </div>

        {p3 && <PromptCard q={p3.q} a={p3.a} action={promptAction?.(2)} />}
      </div>
    </article>
  );
}
