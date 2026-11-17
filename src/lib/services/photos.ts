import { badRequest, notFound } from "../errors";
import type { DocStore } from "../store/types";
import type { Match, Photo, User } from "../types";
import { pairId } from "./discovery";
import { newId } from "./users";

/**
 * Photos are resized in the browser (640px JPEG plus a 24px "blur" thumbnail)
 * and stored as data URLs. At ~60 KB each, that sits comfortably inside a
 * Firestore document and needs no separate storage bucket for the pilot.
 * Swap in Cloud Storage or R2 when volume demands it.
 *
 * "Blur until match" is enforced HERE, on the server: a viewer who isn't
 * allowed the full photo only ever receives the 24px thumbnail. A CSS blur
 * alone could be removed with dev tools.
 */

const MAX_FULL = 400_000; // characters of base64
const MAX_BLUR = 12_000;
const JPEG = /^data:image\/(jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export async function uploadPhoto(store: DocStore, user: User, full: string, blur: string, now = Date.now()) {
  if (!JPEG.test(full) || !JPEG.test(blur)) throw badRequest("Upload a JPEG or WebP image.");
  if (full.length > MAX_FULL || blur.length > MAX_BLUR) throw badRequest("That image is too large.");
  const photo: Photo = { id: newId("p_"), owner: user.id, full, blur, createdAt: now };
  const old = user.profile?.photoId;
  await store.batch([
    { type: "set", col: "photos", id: photo.id, data: photo },
    ...(user.profile ? [{ type: "update" as const, col: "users", id: user.id, patch: { "profile.photoId": photo.id } }] : []),
    ...(old ? [{ type: "delete" as const, col: "photos", id: old }] : []),
  ]);
  return photo.id;
}

export async function removePhoto(store: DocStore, user: User) {
  const old = user.profile?.photoId;
  if (!old) return;
  await store.batch([
    { type: "delete", col: "photos", id: old },
    { type: "update", col: "users", id: user.id, patch: { "profile.photoId": null } },
  ]);
}

export async function photoForViewer(store: DocStore, viewer: User | null, photoId: string, want: "full" | "blur") {
  const photo = await store.get<Photo>("photos", photoId);
  if (!photo) throw notFound();
  if (want === "blur") return photo.blur;
  if (!viewer) return photo.blur;
  if (viewer.id === photo.owner || viewer.role === "admin") return photo.full;
  const owner = await store.get<User>("users", photo.owner);
  if (!owner) throw notFound();
  if (!owner.privacy.blurPhotos && viewer.verification.identity) return photo.full;
  const match = await store.get<Match>("matches", pairId(viewer.id, owner.id));
  return match ? photo.full : photo.blur;
}

export function decodeDataUrl(dataUrl: string): { mime: string; bytes: Buffer } {
  const [head, b64] = dataUrl.split(",");
  const mime = head.slice(5, head.indexOf(";"));
  return { mime, bytes: Buffer.from(b64, "base64") };
}
