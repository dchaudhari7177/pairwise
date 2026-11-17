# Legal & compliance: how the law shaped the product

Not legal advice. This is a product owner's map of the obligations and the
features built to meet them. A real launch would be reviewed by counsel.

| Law / rule | What it requires | How Pairwise meets it |
|---|---|---|
| **DPDP Act 2023 + DPDP Rules 2025** (notified Nov 2025; core duties from about May 2027) | Notice and specific, informed consent; purpose limitation; data minimisation; rights to access, correction and erasure; grievance redressal; breach notification; verifiable handling of children's data | Separate consent checkboxes (terms, privacy, sensitive data, marketing); no reuse of eLitmus hiring data (fresh sign-up, OAuth with narrow scopes); **Download my data** and **real account deletion**; strictly 18+; privacy notice at `/legal/privacy` |
| **Purpose limitation (eLitmus side)** | Data collected for hiring can't be repurposed without consent | A one-time opt-in invitation; nothing migrated; verification shares only identity, education and employer, **never pH scores**; nothing flows back to eLitmus or recruiters |
| **IT Act 2000 + IT (Intermediary Guidelines) Rules 2021** | Grievance officer; acknowledge complaints within 24h; resolve within 15 days; remove intimate imagery within 24h; terms banning impersonation and similar | Grievance page; report flow with a reference id; moderation queue showing the timelines; community guidelines; automatic hiding at 3 reporters, or immediately for underage reports |
| **IT Act §66C / §66D** | Identity theft and cheating by personation are offences | Verified-only membership makes impersonation hard and enforceable |
| **Bharatiya Nyaya Sanhita 2023** | Stalking, harassment, sexual harassment | Report-and-block in one tap; post-date safety check-in; Date Plan consent; guidelines on "no means no" off the app too |
| **Consumer Protection Act 2019 + E-Commerce Rules 2020 + CCPA Dark Patterns Guidelines 2023** | No false urgency, subscription traps, drip pricing or confirm-shaming | GST-inclusive prices; renewal terms shown up front; one-tap cancel that keeps Plus to the end of the period; no countdowns; "who liked you" free |
| **RBI e-mandate framework** | Pre-debit notification for recurring payments; extra authentication above limits | Plus renewals use UPI AutoPay or e-mandate through Razorpay Subscriptions, with a 24h reminder |
| **GST** | 18% on online services | Prices shown inclusive of GST; tax breakdown at checkout |
| **Age (Indian Majority Act)** | Contracts with minors are void; children's data needs special care | 18+ check at sign-up, date of birth locked, underage reports hide the profile immediately |
| **Navtej Singh Johar v. Union of India (2018)** | Consensual same-sex relationships are legal | Inclusive orientation options; privacy controls (company and college walls, blur until match) reduce the risk of being outed |
| **Data localisation (good practice)** | Not strictly mandated for this category | Firestore `asia-south1` (Mumbai) and Vercel `bom1` |

## Structural decisions

- **A separate legal entity** (an eLitmus subsidiary) ring-fences liability and
  brand, and makes the data firewall structural rather than a policy promise.
- **The intermediary posture** is preserved: we don't edit members' content,
  we act on reports, and we keep the records needed to cooperate with lawful
  requests.
- **Retention:** profiles live until deletion (and inactive accounts are
  deleted after 12 months with notice); payment records about 8 years (tax);
  reports about a member are kept with minimised identity so banned users
  can't wipe their record.
