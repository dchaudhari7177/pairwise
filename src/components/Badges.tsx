import { BadgeCheck, Briefcase, GraduationCap } from "lucide-react";
import type { ProfileCard } from "@/lib/services/profiles";

export function VerifiedTick({ className = "" }: { className?: string }) {
  return <BadgeCheck aria-label="Verified" className={`inline h-[1.1em] w-[1.1em] text-sage ${className}`} strokeWidth={2.4} />;
}

export function Badges({ card, compact = false }: { card: ProfileCard; compact?: boolean }) {
  const via = card.badges.via === "elitmus" ? "eLitmus" : card.badges.via === "work_email" ? "work email" : null;
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[0.7rem] font-semibold text-sage">
        <VerifiedTick /> Verified
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {card.badges.identity && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-sage" title={via ? `Identity verified via ${via}` : "Identity verified"}>
          <VerifiedTick /> Real person{via ? ` · via ${via}` : ""}
        </span>
      )}
      {card.badges.education && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1 text-xs font-semibold text-[#2c5f7c]">
          <GraduationCap className="h-3.5 w-3.5" /> Education verified
        </span>
      )}
      {card.badges.work && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber">
          <Briefcase className="h-3.5 w-3.5" /> Work verified
        </span>
      )}
    </div>
  );
}
