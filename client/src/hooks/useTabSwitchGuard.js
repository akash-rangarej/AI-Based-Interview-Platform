import { useEffect, useRef } from "react";

export const useTabSwitchGuard = ({
  enabled = true,
  maxViolations = 3,
  onWarning,
  onViolation,
}) => {
  const violationCountRef = useRef(0);
  const lastViolationAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleViolation = (reason) => {
      const now = Date.now();

      // visibilitychange and window.blur both fire for the same tab
      // switch — ignore a second trigger that lands within 500ms of
      // the first so one switch only ever counts once.
      if (now - lastViolationAtRef.current < 500) {
        return;
      }
      lastViolationAtRef.current = now;

      violationCountRef.current++;

      const count = violationCountRef.current;

      if (count < maxViolations) {
        onWarning?.({
          count,
          remaining: maxViolations - count,
          reason,
        });
        return;
      }

      onViolation?.({
        count,
        reason,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation("tab-switch");
      }
    };

    const handleWindowBlur = () => {
      setTimeout(() => {
        if (document.visibilityState === "hidden") {
          handleViolation("window-blur");
        }
      }, 100);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, maxViolations, onWarning, onViolation]);
};