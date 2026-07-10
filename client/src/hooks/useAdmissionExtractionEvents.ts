import { useEffect, useState } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { API_BASE_URL } from "@/constants/urls";
import { useAuthStore } from "@/stores/authStore";
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
 * messages since they're just keep-alive, not state updates. Uses
 * EventSourcePolyfill instead of the native EventSource since this endpoint
 * is now behind bearer-token auth, and native EventSource cannot send custom
 * headers.
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

    const token = useAuthStore.getState().auth?.token;
    const eventSource = new EventSourcePolyfill(`${API_BASE_URL}/admissions/extract/${jobId}/events`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

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
