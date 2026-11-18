"use client";

import { ArrowLeft, ArrowRight, Camera, Check, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Portrait } from "@/components/Portrait";
import { api } from "@/lib/client/api";
import { photoVariants } from "@/lib/client/image";
import { CITIES, GENDERS, HABIT_LABELS, INTENTS, INTERESTS, LANGUAGES, LIFE_PLAN_LABELS, PROMPTS, VALUES } from "@/lib/options";
import type { ProfileForm } from "@/lib/schemas";
import type { CityId, Gender, Habits, Intent, LifePlan } from "@/lib/types";
import { Field, FormError } from "./Field";

const STEPS = ["About you", "Who you'd like to meet", "Life plan", "Values & interests", "Your prompts", "Photo"] as const;

function Chips<T extends string>({
  options,
  value,
  onChange,
  max,
  labels,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            className="toggle-chip"
            onClick={() => {
              if (on) onChange(value.filter((x) => x !== o));
              else if (!max || value.length < max) onChange([...value, o]);
            }}
          >
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

function Choice<T extends string>({ options, value, onChange }: { options: Record<T, string>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(options) as T[]).map((k) => (
        <button key={k} type="button" aria-pressed={value === k} className="toggle-chip" onClick={() => onChange(k)}>
          {options[k]}
        </button>
      ))}
    </div>
  );
}

export interface WizardInitial extends Partial<ProfileForm> {
  photo?: { url: string; blurred: boolean } | null;
  blurPhotos?: boolean;
}

export function ProfileWizard({
  initial,
  age,
  seed,
  mode,
}: {
  initial: WizardInitial;
  age: number;
  seed: string;
  mode: "onboarding" | "edit";
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [gender, setGender] = useState<Gender>(initial.gender ?? "woman");
  const [city, setCity] = useState<CityId>(initial.city ?? "bengaluru");
  const [area, setArea] = useState(initial.area ?? "");
  const [hometown, setHometown] = useState(initial.hometown ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [heightCm, setHeightCm] = useState(initial.heightCm ? String(initial.heightCm) : "");
  const [languages, setLanguages] = useState<string[]>(initial.languages ?? ["English"]);

  const [interestedIn, setInterestedIn] = useState<Gender[]>(initial.interestedIn ?? []);
  const [minAge, setMinAge] = useState(String(initial.ageRange?.[0] ?? Math.max(18, age - 4)));
  const [maxAge, setMaxAge] = useState(String(initial.ageRange?.[1] ?? age + 4));
  const [intent, setIntent] = useState<Intent>(initial.intent ?? "long_term");

  const [lifePlan, setLifePlan] = useState<LifePlan>(initial.lifePlan ?? { relocate: "maybe", timeline: "2_4y", kids: "open", family: "open" });
  const [habits, setHabits] = useState<Habits>(initial.habits ?? { diet: "nonveg", drinks: "socially", smokes: "never" });

  const [values, setValues] = useState<string[]>(initial.values ?? []);
  const [interests, setInterests] = useState<string[]>(initial.interests ?? []);

  const [prompts, setPrompts] = useState(
    initial.prompts ?? [
      { q: PROMPTS[0], a: "" },
      { q: PROMPTS[1], a: "" },
      { q: PROMPTS[2], a: "" },
    ],
  );
  const [bio, setBio] = useState(initial.bio ?? "");
  const [faith, setFaith] = useState(initial.faith ?? "");

  const [photo, setPhoto] = useState(initial.photo ?? null);
  const [blurPhotos, setBlurPhotos] = useState(initial.blurPhotos ?? false);

  const stepError = useMemo(() => {
    if (step === 0) {
      if (!firstName.trim()) return "Add your first name.";
      if (!hometown.trim()) return "Where are you from?";
      if (!role.trim()) return "What do you do?";
      if (!languages.length) return "Pick at least one language.";
    }
    if (step === 1) {
      if (!interestedIn.length) return "Tell us who you'd like to meet.";
      if (Number(minAge) < 18 || Number(maxAge) < Number(minAge)) return "Check the age range.";
    }
    if (step === 3) {
      if (values.length < 3) return `Pick ${3 - values.length} more value${values.length === 2 ? "" : "s"}.`;
      if (interests.length < 3) return `Pick ${3 - interests.length} more interest${interests.length === 2 ? "" : "s"}.`;
    }
    if (step === 4) {
      if (prompts.some((p) => !p.a.trim())) return "Answer all three prompts.";
      if (new Set(prompts.map((p) => p.q)).size < 3) return "Choose three different prompts.";
    }
    return null;
  }, [step, firstName, hometown, role, languages, interestedIn, minAge, maxAge, values, interests, prompts]);

  async function saveProfile() {
    const body: ProfileForm = {
      firstName,
      gender,
      interestedIn,
      ageRange: [Number(minAge), Number(maxAge)],
      city,
      area: area || undefined,
      hometown,
      languages: languages as ProfileForm["languages"],
      heightCm: heightCm ? Number(heightCm) : undefined,
      role,
      intent,
      lifePlan,
      habits,
      values: values as ProfileForm["values"],
      interests: interests as ProfileForm["interests"],
      prompts: prompts as ProfileForm["prompts"],
      bio: bio || undefined,
      faith: faith || undefined,
    };
    await api("/api/profile", { method: "PUT", body });
  }

  async function next() {
    if (stepError) return setError(stepError);
    setError(null);
    if (step === 4) {
      setBusy(true);
      try {
        await saveProfile();
        setStep(5);
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(false);
      return;
    }
    setStep((s) => s + 1);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const v = await photoVariants(file);
      const { id } = await api<{ id: string }>("/api/photos", { body: v });
      setPhoto({ url: `/api/photos/${id}?v=full`, blurred: false });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function finish() {
    setBusy(true);
    try {
      await api("/api/settings/privacy", { method: "PATCH", body: { blurPhotos } });
      router.push(mode === "onboarding" ? "/today?welcome=1" : "/me");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <p className="eyebrow">{mode === "onboarding" ? "Step 3 of 3 · " : ""}{STEPS[step]}</p>
          <p className="text-muted">
            {step + 1} / {STEPS.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-rose transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div key={step} className="card animate-rise space-y-6 p-6 sm:p-8">
        {step === 0 && (
          <>
            <h1 className="text-3xl font-semibold">Let&apos;s start with you</h1>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input className="input" value={firstName} maxLength={30} onChange={(e) => setFirstName(e.target.value)} />
              </Field>
              <Field label="What you do" hint="Your role. Your verified employer is shown separately.">
                <input className="input" value={role} maxLength={50} placeholder="e.g. Backend engineer" onChange={(e) => setRole(e.target.value)} />
              </Field>
            </div>
            <div>
              <span className="label">I am a</span>
              <Choice options={GENDERS} value={gender} onChange={setGender} />
            </div>
            <div>
              <span className="label">City</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CITIES) as CityId[]).map((c) => (
                  <button key={c} type="button" aria-pressed={city === c} className="toggle-chip" onClick={() => setCity(c)}>
                    {CITIES[c].label}
                    {!CITIES[c].open && " · waitlist"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {CITIES[city].open
                  ? "We keep every open city balanced, so some men may wait a short while before they can start."
                  : `${CITIES[city].label} opens once 1,500 verified members have joined. Sign up now and you'll hold your place in line.`}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Area (optional)">
                <input className="input" value={area} maxLength={40} placeholder="e.g. HSR Layout" onChange={(e) => setArea(e.target.value)} />
              </Field>
              <Field label="Hometown">
                <input className="input" value={hometown} maxLength={40} placeholder="e.g. Indore" onChange={(e) => setHometown(e.target.value)} />
              </Field>
              <Field label="Height in cm (optional)">
                <input className="input" type="number" min={120} max={230} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </Field>
            </div>
            <div>
              <span className="label">Languages you speak</span>
              <Chips options={LANGUAGES} value={languages} onChange={setLanguages} max={6} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-3xl font-semibold">Who would you like to meet?</h1>
            <div>
              <span className="label">I&apos;m interested in</span>
              <Chips options={["woman", "man", "nonbinary"] as Gender[]} value={interestedIn} onChange={setInterestedIn} labels={{ woman: "Women", man: "Men", nonbinary: "Non-binary people" }} />
            </div>
            <div>
              <span className="label">Age range</span>
              <div className="flex items-center gap-3">
                <input className="input w-24" type="number" min={18} max={80} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                <span className="text-muted">to</span>
                <input className="input w-24" type="number" min={18} max={80} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="label">What are you looking for?</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(INTENTS) as Intent[]).map((k) => (
                  <button key={k} type="button" aria-pressed={intent === k} onClick={() => setIntent(k)} className={`rounded-2xl border p-4 text-left transition ${intent === k ? "border-ink bg-ink text-paper" : "border-line-2 bg-card hover:border-ink-2"}`}>
                    <span className="block font-semibold">{INTENTS[k].label}</span>
                    <span className={`mt-1 block text-xs ${intent === k ? "text-paper/75" : "text-muted"}`}>{INTENTS[k].blurb}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Pairwise is for people who want something real. We don&apos;t offer a &ldquo;casual&rdquo; option.</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl font-semibold">Your life plan</h1>
            <p className="-mt-3 text-ink-2">The questions people usually ask on the third date. We ask now, so you both know early.</p>
            {(Object.keys(LIFE_PLAN_LABELS) as (keyof LifePlan)[]).map((k) => (
              <div key={k}>
                <span className="label">{LIFE_PLAN_LABELS[k].question}</span>
                <Choice options={LIFE_PLAN_LABELS[k].options as Record<string, string>} value={lifePlan[k]} onChange={(v) => setLifePlan({ ...lifePlan, [k]: v })} />
              </div>
            ))}
            <hr className="border-line" />
            {(Object.keys(HABIT_LABELS) as (keyof Habits)[]).map((k) => (
              <div key={k}>
                <span className="label">{HABIT_LABELS[k].question}</span>
                <Choice options={HABIT_LABELS[k].options as Record<string, string>} value={habits[k]} onChange={(v) => setHabits({ ...habits, [k]: v })} />
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-3xl font-semibold">What matters to you</h1>
            <div>
              <span className="label">Values · pick 3 to 5 ({values.length})</span>
              <Chips options={VALUES} value={values} onChange={setValues} max={5} />
            </div>
            <div>
              <span className="label">Interests · pick 3 to 8 ({interests.length})</span>
              <Chips options={INTERESTS} value={interests} onChange={setInterests} max={8} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-3xl font-semibold">Three prompts</h1>
            <p className="-mt-3 text-ink-2">People like a specific answer, not just your face, so give them something to reply to.</p>
            {prompts.map((p, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-line p-4">
                <select
                  className="input font-semibold"
                  value={p.q}
                  onChange={(e) => setPrompts(prompts.map((x, j) => (j === i ? { ...x, q: e.target.value as (typeof PROMPTS)[number] } : x)))}
                >
                  {PROMPTS.map((q) => (
                    <option key={q} value={q} disabled={prompts.some((x, j) => j !== i && x.q === q)}>
                      {q}
                    </option>
                  ))}
                </select>
                <textarea className="input min-h-20" maxLength={200} value={p.a} placeholder="Your answer…" onChange={(e) => setPrompts(prompts.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                <p className="text-right text-xs text-muted">{p.a.length}/200</p>
              </div>
            ))}
            <Field label="A short bio (optional)">
              <textarea className="input min-h-20" maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <Field label="Faith (optional)" hint="Shown on your profile if you add it. We never build filters on faith, caste or community.">
              <input className="input" maxLength={30} value={faith} onChange={(e) => setFaith(e.target.value)} />
            </Field>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-3xl font-semibold">Add a photo</h1>
            <p className="-mt-3 text-ink-2">Optional. Until you add one, your profile shows an illustrated portrait.</p>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <Portrait seed={seed} name={firstName || "?"} photo={photo} className="aspect-[4/5] w-48 shrink-0" />
              <div className="space-y-3">
                <label className="btn btn-ghost cursor-pointer">
                  <Camera className="h-4 w-4" /> {photo ? "Change photo" : "Upload a photo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
                {photo && (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={async () => {
                      await api("/api/photos", { method: "DELETE" });
                      setPhoto(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                )}
                <label className="flex items-start gap-3 rounded-2xl bg-paper-2/70 p-3 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--rose)]" checked={blurPhotos} onChange={(e) => setBlurPhotos(e.target.checked)} />
                  <span>
                    <strong>Blur my photo until we match.</strong> Others only receive a tiny blurred version. We enforce this on
                    the server, not just with a filter.
                  </span>
                </label>
                <p className="text-xs text-muted">Photos are resized on your device before upload. No AI-generated or group photos, please.</p>
              </div>
            </div>
          </>
        )}

        <FormError message={error} />

        <div className="flex items-center justify-between pt-2">
          {step > 0 && step < 5 ? (
            <button type="button" className="btn btn-quiet" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 5 ? (
            <button type="button" className="btn btn-primary" onClick={next} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {step === 4 ? "Save profile" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" className="btn btn-love" onClick={finish} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {mode === "onboarding" ? "See my first picks" : "Done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
