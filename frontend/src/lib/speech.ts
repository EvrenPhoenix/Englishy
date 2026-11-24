// Browser speech synthesis and recognition adapters. Nothing is recorded or uploaded
// by Englishy; recognition runs in the browser's own engine.
import type { Variety } from "../../../shared/constants";
import { storageKeys } from "./storage-keys";

export const speechSupported = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

const localeFor = (variety: Variety) =>
  variety === "american" ? "en-US" : "en-GB";

export function englishVoices() {
  return speechSupported()
    ? window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    : [];
}

function pickVoice(lang: string, voiceURI: string | null) {
  const voices = englishVoices();
  return (
    (voiceURI
      ? voices.find((voice) => voice.voiceURI === voiceURI)
      : undefined) ??
    voices.find((voice) => voice.lang === lang && voice.localService) ??
    voices.find((voice) => voice.lang === lang) ??
    voices.find((voice) => voice.lang.startsWith(lang.slice(0, 2)))
  );
}

export function speak(
  text: string,
  options: { variety: Variety; rate?: number; voiceURI?: string | null },
) {
  return new Promise<void>((resolve, reject) => {
    if (!speechSupported()) return reject(Error("unsupported"));
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = localeFor(options.variety);
    utterance.rate = options.rate ?? 0.9;
    const voice = pickVoice(utterance.lang, options.voiceURI ?? null);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = (event) =>
      event.error === "interrupted" || event.error === "canceled"
        ? resolve()
        : reject(Error(event.error));
    synth.speak(utterance);
  });
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

interface RecognitionResultList {
  length: number;
  [index: number]: { isFinal: boolean; 0: { transcript: string } };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: (event: { results: RecognitionResultList }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
export const recognitionSupported = () => Boolean(recognitionConstructor());

export type RecognitionErrorCode =
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "aborted"
  | "unsupported"
  | "unknown";
export type RecognitionError = Error & { code: RecognitionErrorCode };

const errorCodes: Record<string, RecognitionErrorCode> = {
  "not-allowed": "not-allowed",
  "service-not-allowed": "not-allowed",
  "no-speech": "no-speech",
  "audio-capture": "audio-capture",
  network: "network",
  aborted: "aborted",
};

export function listen(options: {
  variety: Variety;
  onInterim?: (text: string) => void;
}) {
  const Constructor = recognitionConstructor();
  if (!Constructor)
    return {
      stop() {},
      abort() {},
      result: Promise.reject(
        Object.assign(Error("unsupported"), { code: "unsupported" as const }),
      ),
    };
  const recognition = new Constructor();
  recognition.lang = localeFor(options.variety);
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  let final = "",
    interim = "";
  const result = new Promise<string>((resolve, reject) => {
    recognition.onresult = (event) => {
      interim = "";
      final = "";
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) final += item[0].transcript;
        else interim += item[0].transcript;
      }
      options.onInterim?.((final + " " + interim).trim());
    };
    recognition.onerror = (event) =>
      reject(
        Object.assign(Error(event.error), {
          code: errorCodes[event.error] ?? "unknown",
        }),
      );
    recognition.onend = () => resolve((final || interim).trim());
  });
  try {
    recognition.start();
  } catch {
    // Already started; the pending result still resolves.
  }
  return {
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
    result,
  };
}

export function hasMicConsent() {
  try {
    return localStorage.getItem(storageKeys.microphoneConsent) === "yes";
  } catch {
    return false;
  }
}
export function setMicConsent(granted: boolean) {
  try {
    if (granted) localStorage.setItem(storageKeys.microphoneConsent, "yes");
    else localStorage.removeItem(storageKeys.microphoneConsent);
  } catch {
    // Storage blocked: consent is asked again next time.
  }
}

export function recognitionMessage(code: RecognitionErrorCode | string) {
  switch (code) {
    case "not-allowed":
      return "Microphone access was blocked. You can allow it in your browser settings, or skip speaking practice.";
    case "no-speech":
      return "We didn't hear anything. Check your microphone and try again.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "Speech recognition needs an internet connection in this browser.";
    case "unsupported":
      return "Speech recognition is not supported in this browser. Try Chrome, Edge or Safari, or skip speaking practice.";
    default:
      return "Speech recognition stopped unexpectedly. Please try again.";
  }
}
