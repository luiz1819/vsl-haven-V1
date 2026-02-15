import * as React from "react";
import { cloud } from "@/lib/cloudClient";

type ResumeState = {
  seconds: number;
  updatedAt: number;
};

function storageKey(videoId: string) {
  return `vsl_resume:${videoId}`;
}

function readLocal(videoId: string): ResumeState | null {
  try {
    const raw = localStorage.getItem(storageKey(videoId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResumeState>;
    const seconds = Math.max(0, Number(parsed.seconds ?? 0));
    const updatedAt = Math.max(0, Number(parsed.updatedAt ?? 0));
    if (!Number.isFinite(seconds) || !Number.isFinite(updatedAt)) return null;
    return { seconds, updatedAt };
  } catch {
    return null;
  }
}

function writeLocal(videoId: string, state: ResumeState | null) {
  try {
    if (!state) {
      localStorage.removeItem(storageKey(videoId));
      return;
    }
    localStorage.setItem(storageKey(videoId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useVslResume({
  videoId,
  userId,
  enabled,
}: {
  videoId: string;
  userId?: string | null;
  enabled: boolean;
}) {
  const [initialSeconds, setInitialSeconds] = React.useState(0);
  const saveTimerRef = React.useRef<number | null>(null);
  const lastSavedSecondRef = React.useRef<number>(-1);

  React.useEffect(() => {
    if (!enabled || !videoId) return;
    const local = readLocal(videoId);
    setInitialSeconds(local?.seconds ?? 0);

    if (!userId) return;
    (async () => {
      try {
        const { data } = await cloud
          .from("video_resume_points")
          .select("position_seconds")
          .eq("user_id", userId)
          .eq("video_id", videoId)
          .maybeSingle();
        const remote = Math.max(0, Number((data as any)?.position_seconds ?? 0));
        const localSeconds = Math.max(0, Number(local?.seconds ?? 0));
        setInitialSeconds(Math.max(remote, localSeconds));
      } catch {
        // ignore
      }
    })();
  }, [enabled, videoId, userId]);

  const save = React.useCallback(
    (seconds: number) => {
      if (!enabled || !videoId) return;
      const s = Math.max(0, Math.floor(seconds));
      if (s === lastSavedSecondRef.current) return;
      lastSavedSecondRef.current = s;
      writeLocal(videoId, { seconds: s, updatedAt: Date.now() });

      if (!userId) return;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        (async () => {
          try {
            await cloud
              .from("video_resume_points")
              .upsert({ user_id: userId, video_id: videoId, position_seconds: s });
          } catch {
            // ignore
          }
        })();
      }, 700);
    },
    [enabled, videoId, userId],
  );

  const clear = React.useCallback(() => {
    if (!videoId) return;
    writeLocal(videoId, null);
    if (userId) {
      (async () => {
        try {
          await cloud
            .from("video_resume_points")
            .delete()
            .eq("user_id", userId)
            .eq("video_id", videoId);
        } catch {
          // ignore
        }
      })();
    }
  }, [videoId, userId]);

  return { initialSeconds, save, clear };
}
