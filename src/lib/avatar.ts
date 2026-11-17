import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";
import type { Gender } from "./types";

/**
 * Illustrated portraits for members without a photo (every demo member).
 *
 * Using real faces for fictional people would be dishonest, so we use the
 * "Lorelei" illustration set by Lisa Wischofsky (CC0 1.0) through DiceBear
 * (MIT). It's tinted with a range of South Asian skin tones and dark hair,
 * with hairstyles chosen to suit the member's gender. It's deterministic per
 * seed, so the same person always looks the same.
 */

const pad = (n: number) => `variant${String(n).padStart(2, "0")}`;
const HAIR: Record<Gender, string[]> = {
  man: [1, 2, 3, 4, 5, 6, 8, 9, 12, 20, 22, 28, 30, 47].map(pad),
  woman: [13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 26, 29, 31, 32, 33, 35, 36, 37, 38, 40, 41, 42, 44, 45, 46, 48].map(pad),
  nonbinary: [7, 11, 17, 30, 43, 41, 10].map(pad),
};
const SKIN = ["f1c7a5", "e3ac85", "d29a73", "c4875f", "b07455", "9c6346", "86533a", "6f4430"];
const HAIR_COLOR = ["1d1714", "231a15", "2d1f17", "3a271c", "4b3022"];
// Open, friendly eyes only. Winks and closed eyes read oddly on a dating card.
const EYES = [2, 4, 6, 10, 12, 13, 14, 16, 20, 21, 24].map(pad);
const HAPPY = ["happy01", "happy02", "happy03", "happy04", "happy05", "happy06", "happy07", "happy08", "happy09", "happy10", "happy11", "happy12", "happy13", "happy14", "happy15", "happy16", "happy17", "happy18"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function avatarSvg(seed: string, gender: Gender = "nonbinary"): string {
  const h = hash(seed);
  const pick = <T>(arr: T[], salt: number) => arr[(h >>> salt) % arr.length];
  return createAvatar(lorelei, {
    seed,
    hair: [pick(HAIR[gender], 3)] as never,
    skinColor: [pick(SKIN, 7)],
    hairColor: [pick(HAIR_COLOR, 11)],
    mouth: [pick(HAPPY, 5)] as never,
    eyes: [pick(EYES, 9)] as never,
    beardProbability: gender === "man" ? 22 : 0,
    earringsProbability: gender === "woman" ? 45 : gender === "nonbinary" ? 25 : 0,
    hairAccessoriesProbability: gender === "woman" ? 12 : 0,
    glassesProbability: 14,
    frecklesProbability: 6,
    scale: 108,
    translateY: 4,
  }).toString();
}
