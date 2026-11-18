# Evaluator walkthrough (about 10 minutes)

Live app: **https://pairwise-pi.vercel.app**

All demo accounts use the password **`Demo@2026`**. You can also use the
one-click buttons in the "Step into a story" section of the home page.
Demo data resets every night at 03:00 IST, so feel free to click everything.

## 1. Aarav: the core loop (aarav@pairwise.demo)

0. **Activity** (the bell): four new things since yesterday: Ishita's date
   suggestion, two likes on specific prompts, and Sneha's Spark. Each one
   links to the screen where you act on it. The badge clears once you've looked.
1. **Today**: five Daily Picks, one at a time. Note **"Why you're seeing
   Diya"** (shared values, the same timeline) and the
   **"Diya already liked you"** tag. Tap **Like this answer** on a prompt and
   add a note.
2. **Likes**: three people who liked him, free to see. Diya liked a specific
   prompt and left a note. **Like back** for an instant match.
3. **Chats** shows the **open-slots meter** (2 of 3) and "Your turn" badges.
4. Open **Sneha**, then the **Spark** tab. Sneha posted her clues in the chat
   ("outdoors", "before noon"). Aarav's half says "no car" and "ticketed".
   Pick the one plan that fits all four.
5. Open **Ishita**, then **Meet**. Both have said "I'd like to meet", and
   Ishita proposed Dice & Deck on Saturday. **Accept**, then **Create share
   link**, and open the link in a private window to see what a trusted friend
   sees.
6. The **⋯ menu** in a chat: **Close kindly** (pre-written goodbyes),
   **Report**, **Block**.

## 2. Meera: fairness and safety (meera@pairwise.demo)

1. **Likes**: 10 delivered today, with "2 more on the way". That's the
   **inbound cap** spreading attention instead of flooding her.
2. **Chats → Vikram**: **Scam Shield** flags a crypto pitch, a push to
   Telegram and a UPI money request, with a one-tap report next to each.
3. **Chats → Aditya (closed)**: what being closed kindly looks like.
4. **Settings**: hide-from-company is on. Her colleague Rohan (same verified
   employer) will never appear in her picks, and she'll never appear in his.
   Also try **Download my data**.

## 3. Kabir: Plus (kabir@pairwise.demo)

- **Plus** shows the honest free vs Plus comparison, one-tap cancel, and
  **Relocation mode**: switch to Bengaluru, then check **Today**.

## 4. Vivek: the city launch gate (vivek@pairwise.demo)

The go-to-market plan, enforced in code.

1. Log in and you land on **the waitlist**, not Today. Hyderabad is open, but
   Vivek is **#3** in line: women are at 50%, and there's room for one more
   man before they'd drop below 40%. That place goes to the person ahead.
2. Enter Aarav's vouch code **`AARAV-7K2P`**. A verified member vouched, so
   Vivek skips the queue and lands on Today.
3. As Aarav, **Profile** shows his three vouch codes and who used each one.
4. Or sign up fresh and pick **Chennai** (not open yet): you'll see how far the
   city is from its 1,500-member launch line.

## 5. Partner venues: how the app earns without charging members

1. Open **[For venues](https://pairwise-pi.vercel.app/partners)**: pricing, the
   first-date safety bar, and an application form. Try leaving a safety box
   unticked.
2. Open the **[partner counter](https://pairwise-pi.vercel.app/partners/redeem)**.
   Pick **Dice & Deck**, PIN **`4321`**, code **`PW-7Q4M2K`** (Ananya and
   Imran's date tonight). It redeems once; try it again.
3. As Aarav, accepting Ishita's proposal issues a fresh perk code on the Date
   Plan card.

## 6. Admin: owning the outcome (admin@pairwise.demo)

- **North star**: Weekly Meaningful Conversations.
- **Funnel** from verified member to planned date; **hypotheses H2–H6**
  against their targets.
- **City launch control**: each city's progress to launch, women's share
  against the 40% line, the waitlist by gender, and **Admit next batch**
  (Hyderabad admits exactly one man, then stops).
- **Revenue mix**: partner venues (listings plus redeemed dates) against Plus,
  and the **venue pipeline** from the For venues form.
- **Live experiment (H4)**: half of new matches get a Spark suggestion,
  assigned by a hash of the match id. The observational H4 row says Spark chats
  go 3× deeper. The randomised readout shows the honest picture: a wide
  confidence interval, p ≈ 0.2, and about 370 matches per arm needed, so the
  verdict is "keep running".
- **Retention by sign-up week**: weekly cohorts, W0 to W4.
- **Moderation queue**: Vikram (auto-reported by Scam Shield) and Harsh.
  Suspend, warn or dismiss.
- **Reset demo data** restores every story.

## 7. A fresh account

Go to **Join**, then sign up (18+). On **Continue with eLitmus**, use
`demo.candidate@elitmus.test` (or any email, then enter your record, which is
marked as simulated). Alternatively, **Work email** shows the OTP on screen
in demo mode. Then the 6-step profile, and your first picks.

### What's simulated (and why)

| Simulated | Production plan |
|---|---|
| eLitmus Verify | OAuth 2.0 consent on elitmus.com with three narrow scopes |
| Work-email OTP delivery | Transactional email provider |
| Plus checkout | Razorpay Subscriptions (UPI AutoPay / e-mandate) |
| Venues and perks | Signed partner agreements |
| One shared venue PIN at the partner counter | A login per venue on a partner portal, with monthly GST invoices |

Everything else (matching, the inbound cap, slots, Spark, Scam Shield, Date
Plan, the city launch gate and vouches, perk codes and redemption, moderation,
export and deletion, metrics) is real, working code.
