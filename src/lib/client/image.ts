"use client";

/** Resize an image file in the browser to a JPEG data URL (longest side = max). */
export async function resizeImage(file: File, max: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** The two variants the server stores: a 640px photo and a 24px blur thumbnail. */
export async function photoVariants(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That image is over 15 MB.");
  const [full, blur] = await Promise.all([resizeImage(file, 640, 0.82), resizeImage(file, 24, 0.6)]);
  return { full, blur };
}
