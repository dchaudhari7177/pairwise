import { requireMember } from "@/lib/server/viewer";
import { listMatches } from "@/lib/services/matches";
import { ChatsShell } from "./ChatsShell";

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const { store, user } = await requireMember();
  const data = await listMatches(store, user);
  return <ChatsShell data={data}>{children}</ChatsShell>;
}
