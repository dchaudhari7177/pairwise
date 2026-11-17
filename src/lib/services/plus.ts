import { badRequest, conflict, forbidden } from "../errors";
import { CITIES, PRICES } from "../options";
import type { DocStore } from "../store/types";
import { DAY } from "../time";
import type { CityId, Payment, User } from "../types";
import { newId } from "./users";

/**
 * Pairwise Plus: paid convenience, never paid safety.
 *
 * Plus gets you 10 picks a day instead of 5, 5 conversation slots instead
 * of 3, and Relocation mode (browse the city you're moving to before you
 * move). It does NOT get you verification, safety tools, or the list of who
 * liked you. Those are free for everyone, forever.
 *
 * Consumer-law hygiene (CCPA dark-patterns guidelines, 2023): the price
 * includes GST, renewal is stated up front, there is no fake urgency, and
 * cancelling takes one tap and keeps Plus until the end of the paid period.
 *
 * The demo uses a simulated checkout. Production would use Razorpay
 * Subscriptions (UPI AutoPay / e-mandate with the RBI pre-debit notice).
 */

export type PlanId = keyof typeof PRICES;

export async function subscribe(store: DocStore, user: User, plan: PlanId, now = Date.now()) {
  const price = PRICES[plan];
  if (!price) throw badRequest("Unknown plan.");
  if (user.plan === "plus" && !user.plusCancelAt) throw conflict("You're already on Plus.", "already_plus");
  const renewsAt = now + price.months * 30 * DAY;
  const payment: Payment = { id: newId("pay_"), uid: user.id, plan, amountInr: price.inr, provider: "demo", createdAt: now };
  await store.batch([
    { type: "set", col: "payments", id: payment.id, data: payment },
    { type: "update", col: "users", id: user.id, patch: { plan: "plus", plusRenewsAt: renewsAt, plusCancelAt: null } },
  ]);
  return { renewsAt, payment };
}

export async function cancel(store: DocStore, user: User) {
  if (user.plan !== "plus") throw badRequest("You're not on Plus.");
  await store.update("users", user.id, { plusCancelAt: user.plusRenewsAt ?? Date.now() });
}

/** Downgrade lazily once a cancelled period has ended. */
export async function settlePlan(store: DocStore, user: User, now = Date.now()): Promise<User> {
  if (user.plan === "plus" && user.plusCancelAt && user.plusCancelAt <= now) {
    await store.update("users", user.id, { plan: "free", travelCity: null, plusCancelAt: null, plusRenewsAt: null });
    return { ...user, plan: "free", travelCity: undefined, plusCancelAt: undefined, plusRenewsAt: undefined };
  }
  return user;
}

export async function setTravelCity(store: DocStore, user: User, city: CityId | null) {
  if (user.plan !== "plus") throw forbidden("Relocation mode is part of Plus.", "plus_required");
  if (city && !CITIES[city]?.open) throw badRequest("We're not open there yet.");
  if (city === user.profile?.city) city = null;
  await store.update("users", user.id, { travelCity: city });
}
