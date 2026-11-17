import { Home, Languages, MapPin, Ruler, Sparkles } from "lucide-react";
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
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {card.area ? `${card.area}, ` : ""}
          {CITIES[card.city].label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /> From {card.hometown}
        </span>
      </p>
    </div>
  );
}

/**
 * A full profile, read top to bottom like a short story rather than swiped
 * past in a second. `shared` highlights what the viewer has in common.
 * `onPrompt` renders an action next to each prompt (used for "like this answer").
 */
export function ProfileView({
  card,
  shared,
  reasons,
  promptAction,
  hidePortrait = false,
}: {
  card: ProfileCard;
  shared?: { values: Set<string>; interests: Set<string> };
  reasons?: string[];
  promptAction?: (index: number) => React.ReactNode;
  hidePortrait?: boolean;
}) {
  const lp = card.lifePlan;
  return (
    <article
      className={hidePortrait ? "" : "grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] lg:grid-cols-[minmax(0,17rem)_1fr] sm:items-start"}
    >
      {!hidePortrait && (
        <div className="sm:sticky sm:top-6">
          <Portrait
            seed={card.avatarSeed}
            name={card.firstName}
            photo={card.photo}
            className="mx-auto aspect-[4/5] w-full max-w-xs sm:max-w-none"
          />
        </div>
      )}
      <div className="min-w-0 space-y-5">
        <ProfileHeadline card={card} />
        <Badges card={card} />

        {reasons && reasons.length > 0 && (
          <div className="rounded-2xl border border-rose/15 bg-rose-soft/60 p-4">
            <p className="eyebrow flex items-center gap-1.5 text-rose-2">
              <Sparkles className="h-3.5 w-3.5" /> Why you're seeing {card.firstName}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink-2">
              {reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-paper-2/70 px-4 py-3 text-sm">
          <span className="font-semibold">{INTENTS[card.intent].label}.</span>{" "}
          <span className="text-ink-2">{INTENTS[card.intent].blurb}</span>
        </div>

        {card.prompts.map((p, i) => (
          <div key={p.q} className="card relative p-5">
            <p className="text-xs font-semibold text-muted">{p.q}</p>
            <p className="mt-2 font-display text-xl leading-snug">{p.a}</p>
            {promptAction && <div className="mt-3">{promptAction(i)}</div>}
          </div>
        ))}

        {card.bio && (
          <div>
            <p className="eyebrow">About</p>
            <p className="mt-2 leading-relaxed text-ink-2">{card.bio}</p>
          </div>
        )}

        <div>
          <p className="eyebrow">Values</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.values.map((v) => (
              <span key={v} className={`chip ${shared?.values.has(v) ? "chip-shared" : ""}`}>
                {v}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">Into</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {card.interests.map((v) => (
              <span key={v} className={`chip ${shared?.interests.has(v) ? "chip-shared" : ""}`}>
                {v}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Life plan</p>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(LIFE_PLAN_LABELS) as (keyof typeof LIFE_PLAN_LABELS)[]).map((k) => (
              <div key={k} className="rounded-xl border border-line bg-card px-3 py-2">
                <dt className="text-[0.72rem] text-muted">{LIFE_PLAN_LABELS[k].question}</dt>
                <dd className="text-sm font-medium">{(LIFE_PLAN_LABELS[k].options as Record<string, string>)[lp[k]]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap gap-1.5 text-sm">
          {card.heightCm && (
            <span className="chip">
              <Ruler className="h-3.5 w-3.5" /> {card.heightCm} cm
            </span>
          )}
          <span className="chip">
            <Languages className="h-3.5 w-3.5" /> {card.languages.join(", ")}
          </span>
          <span className="chip">{HABIT_LABELS.diet.options[card.habits.diet]}</span>
          <span className="chip">Drinks: {HABIT_LABELS.drinks.options[card.habits.drinks].toLowerCase()}</span>
          <span className="chip">Smokes: {HABIT_LABELS.smokes.options[card.habits.smokes].toLowerCase()}</span>
          {card.faith && <span className="chip">{card.faith}</span>}
          {card.college && (
            <span className="chip">
              {card.college}
              {card.gradYear ? ` '${String(card.gradYear).slice(2)}` : ""}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
