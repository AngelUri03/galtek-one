import { useLayoutEffect } from "react";

export default function useLockBodyScroll(locked = true) {
  useLayoutEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;

    document.body.style.overflow = "hidden";     // bloquea rueda/scroll
    document.body.style.touchAction = "none";    // bloquea gesto touch en móviles

    return () => {
      document.body.style.overflow = prev;
      document.body.style.touchAction = prevTouch;
    };
  }, [locked]);
}
