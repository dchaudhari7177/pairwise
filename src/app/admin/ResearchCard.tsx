import { CheckCircle2, ExternalLink, MessageSquareQuote, Microscope } from "lucide-react";
import Link from "next/link";
import { MIN_READING, type Reading, type ResearchSummary, type Share } from "@/lib/research";
import { timeAgo } from "@/lib/time";

// What real people (not the seeded demo) said in the /research survey. It is
// never seeded, so on a fresh deploy it is honestly empty.

function verdict(r: Reading) {
  if (r.holds === null) return { cls: "bg-paper-2 text-muted", text: `Too few yet (${r.all.n}/${MIN_READING})` };
  if (r.holds) return { cls: "bg-sage-soft text-sage", text: `Holds (≥ ${r.bar}%)` };
  return { cls: "bg-amber-soft text-amber", text: `Not shown (needs ≥ ${r.bar}%)` };
}

const pctOrDash = (s: Share) => (s.n ? `${s.pct}%` : "—");

export function ResearchCard({ s }: { s: ResearchSummary }) {
  const maxPain = Math.max(1, ...s.pains.map((p) => p.count));
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-4">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-1.5">
            <Microscope className="h-3.5 w-3.5" /> User research · real people, not the demo
          </p>
          <h2 className="mt-1 text-xl font-semibold">What people in the segment told us</h2>
          <p className="mt-1 text-sm text-ink-2">
            Answers to the anonymous survey at <Link href="/research" className="underline">/research</Link>, checked against the desk research
            behind each hypothesis. Self-selected and unweighted, so we read it for direction. A claim only <em>holds</em> when the low end of
            its 95% interval clears the bar with at least {MIN_READING} answers.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="font-display text-4xl font-semibold">{s.n}</p>
            <p className="text-xs text-muted">answers</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold">{s.n ? Math.round((s.byGender.woman / s.n) * 100) : 0}%</p>
            <p className="text-xs text-muted">women ({s.byGender.woman}/{s.n})</p>
          </div>
        </div>
      </div>

      {s.n === 0 ? (
        <div className="border-t border-line p-6 text-sm text-ink-2">
          No answers yet. This section is never seeded: it fills only as real people answer.{" "}
          <Link href="/research" className="inline-flex items-center gap-1 font-semibold text-rose-2 underline">
            Open the survey <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="px-6 py-2 text-left font-medium">Claim</th>
                  <th className="px-2 py-2 text-right font-medium">Everyone</th>
                  <th className="px-2 py-2 text-right font-medium">Women</th>
                  <th className="px-2 py-2 text-right font-medium">Men</th>
                  <th className="px-6 py-2 text-right font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.readings.map((r) => {
                  const v = verdict(r);
                  return (
                    <tr key={r.id}>
                      <td className="px-6 py-3">
                        <span className="text-xs font-semibold text-rose">{r.hypothesis}</span>
                        <span className="block text-ink-2">{r.claim}</span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right">
                        <strong>{pctOrDash(r.all)}</strong>
                        {r.all.n > 0 && <span className="block text-xs text-muted">CI {r.all.ci[0]}–{r.all.ci[1]}% · n={r.all.n}</span>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right">
                        {pctOrDash(r.women)}
                        {r.women.n > 0 && <span className="block text-xs text-muted">n={r.women.n}</span>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right">
                        {pctOrDash(r.men)}
                        {r.men.n > 0 && <span className="block text-xs text-muted">n={r.men.n}</span>}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${v.cls}`}>
                          {r.holds && <CheckCircle2 className="h-3 w-3" />}
                          {v.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 border-t border-line p-6 md:grid-cols-3">
            <div>
              <p className="eyebrow">What puts people off</p>
              <ul className="mt-3 space-y-2.5">
                {s.pains.slice(0, 5).map((p) => (
                  <li key={p.value}>
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-ink-2">{p.label}</span>
                      <span className="font-semibold">{p.pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-2">
                      <div className="h-full rounded-full bg-rose" style={{ width: `${(p.count / maxPain) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Up to two each, so shares add up to more than 100%.</p>
            </div>

            <div>
              <p className="eyebrow">Willingness to pay</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-2">Median monthly price</dt>
                  <dd className="font-semibold">{s.pay.median === null ? "—" : `₹${s.pay.median}`}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-2">Would pay anything</dt>
                  <dd className="font-semibold">{s.pay.anything.pct}%</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-2">Would pay Plus price (₹299)</dt>
                  <dd className="font-semibold">
                    {s.pay.atPlusPrice.pct}% <span className="font-normal text-muted">CI {s.pay.atPlusPrice.ci[0]}–{s.pay.atPlusPrice.ci[1]}%</span>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                The revenue model assumes 4% of active members take Plus and venues pay most of the bill. If few would pay ₹299, that split
                matters even more.
              </p>
            </div>

            <div>
              <p className="eyebrow">Where answers came from</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {s.channels.map((c) => (
                  <li key={c.src} className="flex justify-between gap-2">
                    <span className="text-ink-2">{c.src}</span>
                    <span className="font-semibold">{c.count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">From the ?src= tag on each shared link: a cheap test of which channel reaches the segment.</p>
            </div>
          </div>

          {s.notes.length > 0 && (
            <div className="border-t border-line p-6">
              <p className="eyebrow flex items-center gap-1.5">
                <MessageSquareQuote className="h-3.5 w-3.5" /> In their words
              </p>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {s.notes.map((n) => (
                  <li key={n.createdAt} className="rounded-2xl bg-paper-2 p-4 text-sm">
                    <p className="text-ink">“{n.text}”</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.gender === "na" ? "Anonymous" : n.gender === "nonbinary" ? "Non-binary respondent" : n.gender === "woman" ? "A woman" : "A man"} ·{" "}
                      {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
