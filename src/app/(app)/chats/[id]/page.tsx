import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireMember } from "@/lib/server/viewer";
import { getConversation, KIND_CLOSE_TEMPLATES } from "@/lib/services/matches";
import { venuesFor } from "@/lib/venues";
import { ChatRoom } from "./ChatRoom";

export const metadata: Metadata = { title: "Conversation" };

const TABS = new Set(["chat", "spark", "meet", "profile"]);

export default async function ChatPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const { store, user } = await requireMember();
  const convo = await getConversation(store, user, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  return (
    <ChatRoom
      key={id}
      initial={convo}
      venues={venuesFor(user.profile!.city)}
      templates={KIND_CLOSE_TEMPLATES}
      initialTab={tab && TABS.has(tab) ? (tab as "chat" | "spark" | "meet" | "profile") : undefined}
    />
  );
}
