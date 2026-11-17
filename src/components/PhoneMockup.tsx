import { BadgeCheck, Heart, MessageCircle, MessageCircleHeart, Puzzle, ShieldAlert, Sparkles, UserRound, X } from "lucide-react";
import { LogoMark } from "./Logo";
import { Avatar, Portrait } from "./Portrait";

/** A faithful miniature of the Discover screen, for the landing page. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[600px] w-[292px] rounded-[3.2rem] bg-[#141013] p-[11px] shadow-[0_40px_80px_-30px_rgba(60,20,35,0.55)] ring-1 ring-black/10">
      <div className="absolute left-1/2 top-[18px] z-20 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.6rem] bg-paper">
        <div className="flex items-center justify-between px-7 pb-1 pt-4 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="tracking-tighter">●●● ◔ ▮</span>
        </div>
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="flex items-center gap-1.5">
            <LogoMark size={20} />
            <span className="font-display text-[15px] font-semibold">pairwise</span>
          </span>
          <span className="rounded-full border border-line bg-card px-2 py-0.5 text-[9px] font-bold text-ink-2">3 of 5 left</span>
        </div>
        <p className="px-4 pt-3 font-display text-[19px] font-semibold leading-tight">
          Good evening, <span className="italic text-rose">Aarav</span>
        </p>
        <div className="flex gap-1 px-4 pt-2.5">
          <span className="h-1 flex-1 rounded-full bg-ink/20" />
          <span className="h-1 flex-1 rounded-full bg-ink/20" />
          <span className="bg-love h-1 flex-1 rounded-full" />
          <span className="h-1 flex-1 rounded-full bg-line" />
          <span className="h-1 flex-1 rounded-full bg-line" />
        </div>
        <div className="relative mx-3 mt-3 aspect-[4/5] overflow-hidden rounded-[1.6rem] shadow-lift">
          <Portrait seed="s_ishita" name="Ishita" gender="woman" rounded="rounded-[1.6rem]" className="absolute inset-0 h-full w-full" />
          <span className="glass absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold">
            <Sparkles className="h-2.5 w-2.5 text-rose" /> 91% match
          </span>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1b1015]/85 via-[#1b1015]/45 to-transparent px-3.5 pb-3 pt-12 text-white">
            <p className="flex items-center gap-1.5 font-display text-[22px] font-semibold leading-none">
              Ishita <span className="font-normal opacity-90">25</span>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white">
                <BadgeCheck className="h-3.5 w-3.5 text-sage" />
              </span>
            </p>
            <p className="mt-1 text-[10px] text-white/90">UX designer · Koramangala · from Pune</p>
            <p className="mt-1.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold">You both love board games &amp; puzzles</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3.5">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-card shadow-lift ring-1 ring-line">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-rose shadow-lift ring-1 ring-line">
            <MessageCircleHeart className="h-4 w-4" />
          </span>
          <span className="btn-love grid h-14 w-14 place-items-center rounded-full">
            <Heart className="h-6 w-6 fill-current" />
          </span>
        </div>
        <div className="glass absolute inset-x-0 bottom-0 grid grid-cols-4 border-t border-line/70 pb-4 pt-2 text-[8px] font-bold text-muted">
          {[
            [Sparkles, "Discover", true],
            [Heart, "Likes", false],
            [MessageCircle, "Chats", false],
            [UserRound, "Profile", false],
          ].map(([Icon, label, on]) => {
            const I = Icon as typeof Heart;
            return (
              <span key={label as string} className={`flex flex-col items-center gap-0.5 ${on ? "text-ink" : ""}`}>
                <span className={`grid h-6 w-10 place-items-center rounded-full ${on ? "bg-rose-soft text-rose" : ""}`}>
                  <I className="h-3.5 w-3.5" />
                </span>
                {label as string}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The phone plus floating "moments" that tell the product story at a glance. */
export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[30rem] py-6">
      <div className="bg-love absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl" />
      <div className="absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-[#ffd3a8] opacity-50 blur-3xl" />
      <div className="relative">
        <PhoneMockup />

        <div className="animate-bob absolute -left-2 top-[1%] w-52 sm:top-[14%] rounded-2xl border border-line bg-card p-3 shadow-lift sm:-left-10">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-2">
            <Puzzle className="h-3.5 w-3.5" /> Spark · The Café Riddle
          </p>
          <p className="mt-1.5 text-xs text-ink-2">
            <strong className="text-ink">Your clues:</strong> opens before 9 AM · has board games
          </p>
          <p className="mt-1 text-[10px] text-muted">Ishita holds the other half…</p>
        </div>

        <div className="animate-bob absolute -right-1 top-[42%] flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3.5 shadow-lift ring-1 ring-line [animation-delay:1.5s] sm:-right-12">
          <span className="flex -space-x-2.5">
            <Avatar seed="s_aarav" name="Aarav" gender="man" size={30} />
            <Avatar seed="s_ishita" name="Ishita" gender="woman" size={30} />
          </span>
          <span className="text-xs font-bold">
            It&apos;s mutual! <span className="text-love">♥</span>
          </span>
        </div>

        <div className="animate-bob absolute -left-1 bottom-[16%] hidden w-56 rounded-2xl border border-amber/30 bg-amber-soft p-3 shadow-lift [animation-delay:3s] sm:-left-14 sm:block">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber">
            <ShieldAlert className="h-3.5 w-3.5" /> Scam Shield
          </p>
          <p className="mt-1 text-[11px] leading-snug text-amber">Caught a UPI money request and warned Meera before she replied.</p>
        </div>

        <div className="animate-bob absolute -right-2 top-[6%] hidden items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs font-bold text-white shadow-lift [animation-delay:2.2s] sm:-right-8 sm:flex">
          <BadgeCheck className="h-4 w-4" /> Verified with eLitmus
        </div>
      </div>
    </div>
  );
}
