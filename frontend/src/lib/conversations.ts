// Saved chats (tutor and scenario conversations) in the "conversations" store.
import type { ChatMessage } from "./use-chat";
import { learnerDb, notifyStore } from "./database";
import { learnerDatabase } from "./storage-keys";

const { stores } = learnerDatabase;

export interface Conversation {
  id: string;
  kind: "tutor" | "scenario";
  scenarioId?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  report?: unknown;
}

/** Saved chats, newest first, optionally of one kind. */
export async function listConversations(
  kind?: Conversation["kind"],
): Promise<Conversation[]> {
  const rows: Conversation[] =
    (await (await learnerDb())?.getAll(stores.conversations)) ?? [];
  return rows
    .filter((row) => !kind || row.kind === kind)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveConversation(conversation: Conversation) {
  await (await learnerDb())?.put(stores.conversations, conversation);
  notifyStore(stores.conversations);
}
export async function deleteConversation(id: string) {
  await (await learnerDb())?.delete(stores.conversations, id);
  notifyStore(stores.conversations);
}
