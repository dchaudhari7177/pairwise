import type { CityId } from "./types";

/**
 * Date Plan venues: busy, public, well-lit places with good transport, which
 * is the standard safety advice for first dates.
 *
 * `partner` venues are part of the B2B revenue line: they pay a listing fee
 * and offer Pairwise couples a perk, so users get value and we earn money
 * without charging them. All names here are fictional demo data.
 */
export interface Venue {
  id: string;
  city: CityId;
  name: string;
  area: string;
  kind: "Café" | "Board-game café" | "Bookstore café" | "Park walk" | "Workshop" | "Dessert bar";
  why: string;
  partner: boolean;
  perk?: string;
}

export const VENUES: Venue[] = [
  { id: "blr-filterhouse", city: "bengaluru", name: "The Filter House", area: "Indiranagar", kind: "Café", why: "Busy all day, two minutes from the metro", partner: true, perk: "Second filter coffee free for Pairwise dates" },
  { id: "blr-dicedeck", city: "bengaluru", name: "Dice & Deck", area: "Koramangala", kind: "Board-game café", why: "Games break the ice; staff host every table", partner: true, perk: "Free game rental for two" },
  { id: "blr-pagesprose", city: "bengaluru", name: "Pages & Pour", area: "Church Street", kind: "Bookstore café", why: "Quiet but public, on a busy walking street", partner: true, perk: "10% off books bought together" },
  { id: "blr-cubbon", city: "bengaluru", name: "Cubbon Park morning walk", area: "Cubbon Park", kind: "Park walk", why: "Daylight, lots of people, easy to leave", partner: false },
  { id: "blr-clayday", city: "bengaluru", name: "Clay Day Studio", area: "HSR Layout", kind: "Workshop", why: "A 90-minute pottery session, side by side", partner: true, perk: "₹200 off a duo session" },
  { id: "pune-chaistop", city: "pune", name: "Chai Stop Social", area: "Koregaon Park", kind: "Café", why: "Busy lane, open late, near autos", partner: true, perk: "Free bun maska with two chais" },
  { id: "pune-meeple", city: "pune", name: "Meeple Ground", area: "Baner", kind: "Board-game café", why: "Hosted tables and a friendly crowd", partner: true, perk: "Free game rental for two" },
  { id: "pune-lakewalk", city: "pune", name: "Pashan Lake evening walk", area: "Pashan", kind: "Park walk", why: "Popular walking track, well lit till 9", partner: false },
  { id: "hyd-irani", city: "hyderabad", name: "Nayaab Irani Café", area: "Banjara Hills", kind: "Café", why: "Classic and always buzzing", partner: true, perk: "Osmania biscuits on the house" },
  { id: "hyd-sugarloaf", city: "hyderabad", name: "Sugarloaf Desserts", area: "Gachibowli", kind: "Dessert bar", why: "Near the IT corridor, open late, very public", partner: true, perk: "Shared dessert at 15% off" },
  { id: "hyd-kbr", city: "hyderabad", name: "KBR Park walk", area: "Jubilee Hills", kind: "Park walk", why: "Gated park with security and many walkers", partner: false },
];

export function getVenue(id: string): Venue | undefined {
  return VENUES.find((v) => v.id === id);
}

export function venuesFor(city: CityId): Venue[] {
  return VENUES.filter((v) => v.city === city);
}
