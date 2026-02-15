import * as React from "react";
import Hls from "hls.js";

function canPlayNativeHls(video: HTMLVideoElement) {
  // Safari supports HLS natively.
  return Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
}

/**
 * Attaches hls.js to a <video> element when needed.
 * Keeps the <video src> clean (especially when feeding a Blob URL manifest).
 */
export function useHlsAttachment({
  videoRef,
  src,
  isHls,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src?: string;
  isHls: boolean;
}) {
  const hlsRef = React.useRef<Hls | null>(null);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // ignore
      }
      hlsRef.current = null;
    }

    if (!src) return;

    // HLS.js path
    if (isHls && !canPlayNativeHls(el) && Hls.isSupported()) {
      const hls = new Hls({
        // Aggressive initial buffering (aiming for "instant" start)
        // Note: "20% of video" depends on duration; we approximate by allowing a larger buffer.
        maxBufferLength: 120,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.attachMedia(el);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      return;
    }

    // Native playback
    el.src = src;
  }, [videoRef, src, isHls]);
}
