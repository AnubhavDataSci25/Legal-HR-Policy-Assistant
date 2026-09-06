import { useEffect, useRef } from "react";

/**
 * Auto-scrolls a container to the bottom when `deps` change, but only
 * if the user is already near the bottom. This prevents yanking someone
 * downward while they're reading earlier messages in a long conversation.
 */
export function useAutoScroll(deps, threshold = 120) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom < threshold) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, bottomRef };
}