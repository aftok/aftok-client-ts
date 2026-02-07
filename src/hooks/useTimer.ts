import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` milliseconds while `active` is true.
 * Mirrors the PureScript timer pattern (Timeline.purs:347-358) that fires
 * a Refresh action every 10 seconds via a forked fiber.
 */
export function useTimer(
  callback: () => void,
  intervalMs: number,
  active: boolean,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}
