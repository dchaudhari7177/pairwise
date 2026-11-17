import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Doc = { title: string; updated: string; body: React.ReactNode };

const DOCS: Record<string, Doc> = {
  privacy: {
    title: "Privacy notice",
    updated: "17 November 2026",
    body: (
      <>
        <p>
          This notice explains, in plain language, what personal data Pairwise collects, why, and the rights you have under India&apos;s
          Digital Personal Data Protection Act, 2023 (the &ldquo;DPDP Act&rdquo;) and the DPDP Rules, 2025. Pairwise is the data
          fiduciary. In the proposed structure, it is a separate entity from eLitmus, so your dating data and your job-search data
          never mix.
        </p>
        <h2>What we collect, and why</h2>
        <ul>
          <li><strong>Account data</strong> (email, password hash, date of birth): to run your account and confirm you are 18 or older.</li>
          <li><strong>Verification result</strong> (verified yes/no, college and year, employer name): to show badges and power the hide-from-colleagues wall. We never receive your pH scores, percentiles or job applications.</li>
          <li><strong>Profile</strong> (name, photos, prompts, values, life plan, habits, city): to show you to compatible members and explain why you were matched.</li>
          <li><strong>Activity</strong> (likes, passes, matches, messages, date plans, check-ins): to provide the service and keep it safe.</li>
          <li><strong>Safety signals</strong> (Scam Shield flags, reports): to protect members and enforce our guidelines.</li>
        </ul>
        <h2>Sensitive information</h2>
        <p>
          Who you&apos;re interested in, your faith (if you share it) and similar details are processed only with your separate, explicit
          consent, only for matching, and never for advertising. We do not collect caste.
        </p>
        <h2>Who we share with</h2>
        <p>
          We do not sell personal data. We do not share your dating activity with eLitmus, recruiters or employers. We use a small set of
          processors under contract: cloud hosting in India (Google Cloud, Mumbai region), web hosting (Vercel), and in production a
          payment processor (Razorpay) and an email provider. We disclose data to authorities only when Indian law requires it.
        </p>
        <h2>How long we keep it</h2>
        <ul>
          <li>Your profile and activity: until you delete your account. Accounts inactive for 12 months are deleted after a notice.</li>
          <li>Payment records: about 8 years, as Indian tax law requires.</li>
          <li>Reports about a member: kept after their deletion with identity minimised, so banned accounts cannot simply return.</li>
        </ul>
        <h2>Your rights</h2>
        <ul>
          <li><strong>Access:</strong> download everything we hold from Settings → Download my data.</li>
          <li><strong>Correction:</strong> edit your profile at any time.</li>
          <li><strong>Erasure:</strong> Settings → Delete account deletes your data for real.</li>
          <li><strong>Withdraw consent</strong> for sensitive data or marketing at any time. Some features may stop working.</li>
          <li><strong>Grievance redressal</strong> through our <Link href="/legal/grievance">grievance officer</Link>, and then the Data Protection Board of India.</li>
          <li><strong>Nominate</strong> someone to exercise your rights in case of death or incapacity.</li>
        </ul>
        <h2>Security and breaches</h2>
        <p>
          Passwords are hashed with scrypt. Sessions are signed, httpOnly cookies. Photos marked &ldquo;blur until match&rdquo; are
          withheld on the server. If a breach affects you, we will tell you and the Data Protection Board without delay, as the DPDP
          Rules require.
        </p>
        <h2>Children</h2>
        <p>Pairwise is strictly for adults aged 18 and over. We delete any account we find belongs to a minor.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    updated: "17 November 2026",
    body: (
      <>
        <p>By creating an account you agree to these terms. Please read them; they&apos;re short.</p>
        <h2>Who can use Pairwise</h2>
        <ul>
          <li>You must be at least 18, and legally able to enter a contract in India.</li>
          <li>One account per person, in your real name, verified as you.</li>
          <li>You must not have been removed from Pairwise before, or be prohibited by law from using it.</li>
        </ul>
        <h2>Your content and conduct</h2>
        <p>
          You are responsible for what you post and say. You must follow our <Link href="/legal/guidelines">Community guidelines</Link>.
          Impersonation and cheating by personation are offences under Sections 66C and 66D of the Information Technology Act, 2000.
          Harassment and stalking are offences under the Bharatiya Nyaya Sanhita, 2023.
        </p>
        <h2>Pairwise Plus</h2>
        <ul>
          <li>Prices include GST. Plans renew automatically. We notify you before each renewal charge, as RBI e-mandate rules require.</li>
          <li>You can cancel in one tap. Plus stays active until the end of the period you paid for.</li>
          <li>We never use countdown timers, hidden fees or other dark patterns (CCPA Guidelines, 2023).</li>
        </ul>
        <h2>Our role</h2>
        <p>
          Pairwise is an intermediary under the IT Act and follows the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules,
          2021. We don&apos;t run background checks beyond the verification described. Verification confirms identity; it does not
          guarantee anyone&apos;s behaviour. Please follow the safety advice in the app.
        </p>
        <h2>Ending things</h2>
        <p>
          You can delete your account at any time. We may suspend or remove accounts that break these terms or the guidelines, and we
          tell you why unless the law prevents us.
        </p>
        <h2>Law and disputes</h2>
        <p>These terms are governed by Indian law. Courts in Bengaluru, Karnataka have jurisdiction.</p>
      </>
    ),
  },
  guidelines: {
    title: "Community guidelines",
    updated: "17 November 2026",
    body: (
      <>
        <p>Pairwise works because people show up as themselves and treat each other well. These rules apply on the app and when you meet.</p>
        <h2>Be real</h2>
        <ul>
          <li>Use your own recent photos. No AI-generated faces, celebrities or group shots as your main photo.</li>
          <li>Be honest about your intent and your life plan. That&apos;s what the questions are for.</li>
        </ul>
        <h2>Be kind</h2>
        <ul>
          <li>If it&apos;s not a fit, close the conversation kindly. Don&apos;t ghost, and don&apos;t argue.</li>
          <li>No harassment, hate, or slurs about religion, caste, gender, sexuality, region, disability or appearance.</li>
          <li>Respect &ldquo;no&rdquo; the first time, on the app and off it. Don&apos;t contact someone on other platforms after they&apos;ve said no.</li>
        </ul>
        <h2>Keep money out of it</h2>
        <ul>
          <li>Never ask for money, loans, gifts, UPI payments, or &ldquo;investments&rdquo;. It leads to an immediate ban.</li>
          <li>No promotion, selling, MLM or recruiting.</li>
        </ul>
        <h2>Consent, always</h2>
        <ul>
          <li>No unsolicited sexual content. Sharing someone&apos;s intimate images without consent leads to a permanent ban and a report to law enforcement.</li>
          <li>Plan first dates in public, and let both people opt in. Date Plan is built for exactly this.</li>
        </ul>
        <h2>How we enforce</h2>
        <p>
          Depending on severity: a warning, a temporary hide, or permanent suspension. Scams, threats, intimate-image abuse and anything
          involving minors are removed immediately.
        </p>
      </>
    ),
  },
  grievance: {
    title: "Grievance officer",
    updated: "17 November 2026",
    body: (
      <>
        <p>
          Under the IT Rules, 2021 and the DPDP Act, 2023, you can raise a complaint about content, conduct, or how we handle your personal
          data with our grievance officer.
        </p>
        <h2>Contact</h2>
        <ul>
          <li><strong>Grievance Officer, Pairwise</strong> (demo placeholder)</li>
          <li>Email: grievance@pairwise.example</li>
          <li>Address: Bengaluru, Karnataka, India</li>
        </ul>
        <h2>Timelines</h2>
        <ul>
          <li>We acknowledge every complaint within 24 hours.</li>
          <li>We resolve complaints within 15 days.</li>
          <li>We remove content showing private areas, nudity or sexual acts, or impersonation in such content, within 24 hours of a complaint.</li>
        </ul>
        <p>
          If you&apos;re not satisfied with how we handled a data-protection complaint, you can escalate it to the Data Protection Board
          of India.
        </p>
        <p>
          In an emergency, call <strong>112</strong>. Report cyber fraud at <strong>1930</strong> or cybercrime.gov.in.
        </p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: DOCS[slug]?.title ?? "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {doc.updated}</p>
      <p className="mt-6 rounded-2xl border border-amber/30 bg-amber-soft px-4 py-3 text-sm text-amber">
        Prototype text, written for the product concept to show how the obligations shape the product. A real launch would have counsel
        review it.
      </p>
      <div className="prose-pw mt-6">{doc.body}</div>
      <nav className="mt-12 flex flex-wrap gap-3 border-t border-line pt-6 text-sm">
        {Object.entries(DOCS)
          .filter(([k]) => k !== slug)
          .map(([k, d]) => (
            <Link key={k} href={`/legal/${k}`} className="btn btn-ghost btn-sm">
              {d.title}
            </Link>
          ))}
      </nav>
    </article>
  );
}
