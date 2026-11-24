import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { BRAND } from "../../../shared/brand";
import { Button } from "./FormControls";
import { Dialog } from "./Controls";
import { classes } from "./PageElements";
import { usePreferences } from "./PreferencesProvider";
import {
  hasMicConsent,
  listen,
  recognitionMessage,
  recognitionSupported,
  setMicConsent,
  speak,
  speechSupported,
  stopSpeaking,
  type RecognitionError,
} from "../lib/speech";

const playbackRates = [0.7, 0.9, 1.1] as const;

/**
 * Plays English text with the learner's accent and voice. When audio is unavailable
 * the text is shown instead; `onUnavailable` lets callers skip scoring that question.
 */
export function ListenButton({
  text,
  label = "Listen",
  showSpeed = false,
  size = "md",
  revealFallback = true,
  onUnavailable,
}: {
  text: string;
  label?: string | null;
  showSpeed?: boolean;
  size?: "sm" | "md" | "lg";
  revealFallback?: boolean;
  onUnavailable?: () => void;
}) {
  const { prefs } = usePreferences();
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(prefs.speechRate);
  const [failed, setFailed] = useState(false);
  const unavailable = !speechSupported() || failed;
  useEffect(() => {
    if (unavailable) onUnavailable?.();
  }, [unavailable, onUnavailable]);
  useEffect(() => () => stopSpeaking(), []);
  if (unavailable)
    return revealFallback ? (
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
        <span className="text-muted">
          {"Audio is not available on this device. Text: "}
        </span>
        <strong>{text}</strong>
        {onUnavailable && (
          <span className="mt-1 block text-muted">
            You can practise with the text. This question won’t affect your
            score.
          </span>
        )}
      </p>
    ) : null;
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="soft"
        size={size}
        icon={Volume2}
        onClick={async () => {
          setPlaying(true);
          try {
            await speak(text, {
              variety: prefs.variety,
              rate,
              voiceURI: prefs.voiceURI,
            });
          } catch {
            onUnavailable?.();
            setFailed(true);
          } finally {
            setPlaying(false);
          }
        }}
        aria-label={label ? undefined : `Listen: ${text.slice(0, 80)}`}
        title={label ? undefined : "Listen"}
      >
        {label ? (playing ? "Playing…" : label) : null}
      </Button>
      {showSpeed && (
        <div
          role="radiogroup"
          aria-label="Playback speed"
          className="inline-flex rounded-lg border border-border p-0.5 text-xs"
        >
          {playbackRates.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rate === value}
              onClick={() => setRate(value)}
              className={classes(
                "rounded-md px-2 py-1 font-medium",
                rate === value
                  ? "bg-surface-3 text-text"
                  : "text-muted hover:text-text",
              )}
            >
              {value === 0.7 ? "Slow" : value === 0.9 ? "Normal" : "Fast"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MicConsentDialog({
  open,
  onAccept,
  onClose,
}: {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Use your microphone?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button
            onClick={() => {
              setMicConsent(true);
              onAccept();
            }}
          >
            Allow and continue
          </Button>
        </>
      }
    >
      <ul className="list-disc space-y-2 ps-5 text-sm">
        <li>
          Speaking practice uses your browser's built-in speech recognition.
          Your browser will ask for microphone permission.
        </li>
        <li>
          In some browsers (for example Chrome), audio is sent to the browser
          maker's servers to turn speech into text. {BRAND.name} does not record
          or store audio.
        </li>
        <li>
          The microphone is only on while the "Listening" indicator is shown.
          You can stop at any time.
        </li>
        <li>
          Results are transcription-based feedback, not a precise pronunciation
          score. Every accent is welcome.
        </li>
      </ul>
    </Dialog>
  );
}

export type RecorderState = "idle" | "listening" | "done" | "error";
export type Recorder = ReturnType<typeof useRecorder>;

/** Speech-to-text session with a one-time microphone consent step. */
export function useRecorder() {
  const { prefs } = usePreferences();
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const session = useRef<ReturnType<typeof listen> | null>(null);
  useEffect(() => () => session.current?.abort(), []);
  const begin = useCallback(() => {
    setError(null);
    setTranscript("");
    setState("listening");
    const current = listen({
      variety: prefs.variety,
      onInterim: setTranscript,
    });
    session.current = current;
    current.result
      .then((text) => {
        setTranscript(text);
        setState(text ? "done" : "error");
        if (!text) setError(recognitionMessage("no-speech"));
      })
      .catch((err: RecognitionError) => {
        if (err.code === "aborted") return setState("idle");
        setError(recognitionMessage(err.code ?? "unknown"));
        setState("error");
      })
      .finally(() => (session.current = null));
  }, [prefs.variety]);
  const start = useCallback(() => {
    if (!hasMicConsent()) return setAsking(true);
    begin();
  }, [begin]);
  const stop = useCallback(() => session.current?.stop(), []);
  const reset = useCallback(() => {
    session.current?.abort();
    setState("idle");
    setTranscript("");
    setError(null);
  }, []);
  const consent = (
    <MicConsentDialog
      open={asking}
      onClose={() => setAsking(false)}
      onAccept={() => {
        setAsking(false);
        begin();
      }}
    />
  );
  return {
    state,
    transcript,
    error,
    start,
    stop,
    reset,
    supported: recognitionSupported(),
    consent,
  };
}

/** Start/stop button with a live microphone indicator. */
export function RecorderControls({ recorder }: { recorder: Recorder }) {
  const listening = recorder.state === "listening";
  return (
    <div className="flex flex-wrap items-center gap-3">
      {listening ? (
        <Button variant="danger" icon={Square} onClick={recorder.stop}>
          Stop
        </Button>
      ) : (
        <Button icon={Mic} onClick={recorder.start}>
          {recorder.state === "idle" ? "Start speaking" : "Try again"}
        </Button>
      )}
      <span
        className="inline-flex items-center gap-2 text-sm"
        role="status"
        aria-live="polite"
      >
        <span
          className={classes(
            "size-2.5 rounded-full",
            listening ? "animate-pulse bg-danger" : "bg-border-strong",
          )}
          aria-hidden
        />
        {listening ? "Listening… microphone is on" : "Microphone is off"}
      </span>
      {recorder.consent}
    </div>
  );
}
