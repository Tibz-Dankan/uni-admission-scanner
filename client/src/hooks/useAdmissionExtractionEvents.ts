import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/constants/urls";
import type { Admission, AdmissionSseEvent } from "@/types/admission";

export type ExtractionStage = "connecting" | "streaming" | "review_ready" | "failed";

interface UseAdmissionExtractionEventsResult {
  stage: ExtractionStage;
  messages: string[];
  result: Admission | null;
  error: string | null;
}

/**
 * Adapted from Tibz-Dankan/appcrons-web's useGetAppLiveRequest hook: opens an
 * EventSource, parses each message as JSON, and ignores "heartbeat"/"warmup"
 * messages since they're just keep-alive, not state updates. Uses the native
 * EventSource (no auth header needed here) - see frontend SKILL.md for when
 * to switch to EventSourcePolyfill instead.
 */
export function useAdmissionExtractionEvents(jobId: string | null): UseAdmissionExtractionEventsResult {
  const [stage, setStage] = useState<ExtractionStage>("connecting");
  const [messages, setMessages] = useState<string[]>([]);
  const [result, setResult] = useState<Admission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    setStage("connecting");
    setMessages([]);
    setResult(null);
    setError(null);

    const eventSource = new EventSource(`${API_BASE_URL}/admissions/extract/${jobId}/events`);

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as AdmissionSseEvent;
      if (parsed.type === "heartbeat" || parsed.type === "warmup") return;

      if (parsed.type === "status") {
        setStage("streaming");
        setMessages((prev) => [...prev, parsed.message]);
        return;
      }

      if (parsed.type === "review_ready") {
        setStage("review_ready");
        setResult(parsed.data ?? null);
        eventSource.close();
        return;
      }

      if (parsed.type === "failed") {
        setStage("failed");
        setError(parsed.message);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setError((prev) => prev ?? "Lost connection to the server");
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return { stage, messages, result, error };
}
