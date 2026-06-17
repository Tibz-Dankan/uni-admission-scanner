import { EventEmitter } from "events";
import type { AdmissionSseEvent } from "../types/admission";

const HISTORY_LIMIT = 50;
const JOB_TTL_MS = 5 * 60 * 1000;

interface JobChannel {
  emitter: EventEmitter;
  history: AdmissionSseEvent[];
  cleanupTimer?: NodeJS.Timeout;
}

/**
 * In-memory pub/sub for streaming background-job progress over SSE, keyed
 * by an ephemeral jobId (never a DB id - see CLAUDE.md). Adapted from
 * owiino/owino-backend's EventEmitter-based notification hub, generalized
 * from "per user" to "per job" and extended with a small history buffer so
 * a client that opens its EventSource a moment late still gets replayed the
 * steps it missed.
 */
class SseHub {
  private channels = new Map<string, JobChannel>();

  private getOrCreateChannel(jobId: string): JobChannel {
    let channel = this.channels.get(jobId);
    if (!channel) {
      channel = { emitter: new EventEmitter(), history: [] };
      this.channels.set(jobId, channel);
    }
    return channel;
  }

  emit(jobId: string, event: AdmissionSseEvent): void {
    const channel = this.getOrCreateChannel(jobId);
    channel.history.push(event);
    if (channel.history.length > HISTORY_LIMIT) {
      channel.history.shift();
    }
    channel.emitter.emit("event", event);

    if (event.type === "review_ready" || event.type === "failed") {
      this.scheduleCleanup(jobId);
    }
  }

  subscribe(
    jobId: string,
    listener: (event: AdmissionSseEvent) => void
  ): () => void {
    const channel = this.getOrCreateChannel(jobId);
    channel.emitter.on("event", listener);
    return () => channel.emitter.off("event", listener);
  }

  getHistory(jobId: string): AdmissionSseEvent[] {
    return this.channels.get(jobId)?.history ?? [];
  }

  private scheduleCleanup(jobId: string): void {
    const channel = this.channels.get(jobId);
    if (!channel) return;
    if (channel.cleanupTimer) clearTimeout(channel.cleanupTimer);
    channel.cleanupTimer = setTimeout(() => {
      this.channels.delete(jobId);
    }, JOB_TTL_MS);
    channel.cleanupTimer.unref();
  }
}

export const sseHub = new SseHub();
