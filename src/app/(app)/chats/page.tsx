import { MessageCircleHeart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chats" };

// On laptops this fills the right-hand pane until a conversation is picked.
// On phones the list (from the layout) is shown instead.
export default function ChatsIndex() {
  return (
    <div className="grid flex-1 place-items-center p-10 text-center">
      <div className="max-w-xs">
        <span className="bg-love mx-auto grid h-16 w-16 place-items-center rounded-3xl text-white shadow-lift">
          <MessageCircleHeart className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold">Pick a conversation</h2>
        <p className="mt-2 text-sm text-ink-2">Your matches live on the left. Stuck on what to say? Every chat has a Spark puzzle ready to go.</p>
      </div>
    </div>
  );
}
