import { useCallback, useEffect, useRef, useState } from "react";
import { aiErrorMessage, streamText } from "./ai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

/**
 * A streamed AI conversation. `buildBody` turns the messages into the request body;
 * `onChange` receives the full message list whenever it changes (for saving).
 * A reply stopped part-way is kept with a trailing ellipsis.
 */
export function useChat(
  url: string,
  buildBody: (messages: ChatMessage[]) => unknown,
  initial: ChatMessage[] = [],
  onChange?: (messages: ChatMessage[]) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const body = useRef(buildBody);
  body.current = buildBody;
  const changed = useRef(onChange);
  changed.current = onChange;
  useEffect(() => () => controller.current?.abort(), []);

  const reply = useCallback(
    async (history: ChatMessage[]) => {
      setError(null);
      setStreaming("");
      controller.current = new AbortController();
      let text = "";
      try {
        const result = await streamText(
          url,
          body.current(history),
          (_chunk, sofar) => {
            text = sofar;
            setStreaming(sofar);
          },
          controller.current.signal,
        );
        text = result.text || text;
        if (!text.trim()) throw Error("empty");
        const next: ChatMessage[] = [
          ...history,
          {
            role: "assistant",
            content:
              text.trim() +
              (result.finishReason === "length"
                ? "\n\n*(Reply shortened.)*"
                : ""),
            at: new Date().toISOString(),
          },
        ];
        setMessages(next);
        changed.current?.(next);
      } catch (err) {
        const stopped = controller.current?.signal.aborted;
        if (stopped && text.trim()) {
          const next: ChatMessage[] = [
            ...history,
            {
              role: "assistant",
              content: text.trim() + " …",
              at: new Date().toISOString(),
            },
          ];
          setMessages(next);
          changed.current?.(next);
        } else if (!stopped)
          setError(
            err instanceof Error && err.message === "empty"
              ? "The AI did not return a reply. Please try again."
              : aiErrorMessage(err),
          );
      } finally {
        setStreaming(null);
        controller.current = null;
      }
    },
    [url],
  );
  const send = useCallback(
    (content: string) => {
      const next: ChatMessage[] = [
        ...messages,
        { role: "user", content, at: new Date().toISOString() },
      ];
      setMessages(next);
      changed.current?.(next);
      void reply(next);
    },
    [messages, reply],
  );
  /** Ask again for the last learner message, dropping the replies after it. */
  const regenerate = useCallback(() => {
    const last = messages.map((m) => m.role).lastIndexOf("user");
    if (last < 0) return;
    const next = messages.slice(0, last + 1);
    setMessages(next);
    void reply(next);
  }, [messages, reply]);
  const retry = useCallback(() => {
    if (messages.at(-1)?.role === "user") void reply(messages);
  }, [messages, reply]);
  const stop = useCallback(() => controller.current?.abort(), []);
  const reset = useCallback((next: ChatMessage[] = []) => {
    controller.current?.abort();
    setMessages(next);
    setError(null);
    setStreaming(null);
  }, []);
  return {
    messages,
    streaming,
    error,
    busy: streaming !== null,
    send,
    regenerate,
    retry,
    stop,
    reset,
    setMessages,
  };
}
