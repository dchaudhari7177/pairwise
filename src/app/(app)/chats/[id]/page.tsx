import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireMember } from "@/lib/server/viewer";
import { getConversation, KIND_CLOSE_TEMPLATES } from "@/lib/services/matches";
import { venuesFor } from "@/lib/venues";
import { ChatRoom } from "./ChatRoom";

export const metadata: Metadata = { title: "Conversation" };

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { store, user } = await requireMember();
  const convo = await getConversation(store, user, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  return <ChatRoom initial={convo} venues={venuesFor(user.profile!.city)} templates={KIND_CLOSE_TEMPLATES} />;
}
