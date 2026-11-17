import { route } from "@/lib/server/api";
import { getViewer } from "@/lib/server/viewer";
import { decodeDataUrl, photoForViewer } from "@/lib/services/photos";
import { getStore } from "@/lib/store";

export const GET = route<{ id: string }>(async (req, { id }) => {
  const want = new URL(req.url).searchParams.get("v") === "full" ? "full" : "blur";
  const ctx = await getViewer();
  const store = ctx?.store ?? (await getStore());
  const { mime, bytes } = decodeDataUrl(await photoForViewer(store, ctx?.user ?? null, id, want));
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": mime,
      // Private: the variant depends on who is asking.
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
});
