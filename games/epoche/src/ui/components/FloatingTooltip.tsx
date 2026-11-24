import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const margin = 10;
const gap = 11;

export function useFloatingTooltip<T extends HTMLElement>() {
  const anchor = useRef<T>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  function entered() {
    clearTimeout(leaveTimer.current);
    setHovered(true);
  }

  function exited() {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 145);
  }

  const dismiss = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setHovered(false);
    setDismissed(true);
  }, []);

  return {
    anchor,
    open: !dismissed && (hovered || focused),
    trigger: {
      onPointerEnter() {
        setDismissed(false);
        entered();
      },
      onPointerLeave: exited,
      onFocus() {
        setDismissed(false);
        setFocused(true);
      },
      onBlur() {
        setFocused(false);
      },
    },
    content: {
      onPointerEnter: entered,
      onPointerLeave: exited,
    },
    dismiss,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function positionTooltip(
  trigger: HTMLElement,
  tip: HTMLElement,
  side: "vertical" | "right",
) {
  const viewport = window.visualViewport;
  const insetLeft = (viewport?.offsetLeft ?? 0) + margin;
  const insetTop = (viewport?.offsetTop ?? 0) + margin;
  const insetRight =
    insetLeft +
    (viewport?.width ?? document.documentElement.clientWidth) -
    margin * 2;
  const insetBottom =
    insetTop +
    (viewport?.height ?? document.documentElement.clientHeight) -
    margin * 2;
  const anchor = trigger.getBoundingClientRect();
  const viewportWidth = Math.max(0, insetRight - insetLeft);
  tip.style.maxWidth =
    (side === "vertical"
      ? Math.min(anchor.width, viewportWidth)
      : viewportWidth) + "px";
  tip.style.maxHeight = Math.max(0, insetBottom - insetTop) + "px";

  const { width, height } = tip.getBoundingClientRect();
  const left = anchor.left - width - gap;
  const right = anchor.right + gap;
  const leftFits = left >= insetLeft;
  const rightFits = right + width <= insetRight;
  let x: number;
  let y: number;
  if (side === "vertical") {
    // Keep policy previews in the policy column, clear of settlement actions.
    const above = anchor.top - gap - insetTop;
    const below = insetBottom - anchor.bottom - gap;
    const placeBelow = below >= height || below >= above;
    const available = Math.max(1, placeBelow ? below : above);
    tip.style.maxHeight = Math.min(insetBottom - insetTop, available) + "px";
    x = anchor.right - width;
    y = placeBelow
      ? anchor.bottom + gap
      : anchor.top - gap - Math.min(height, available);
  } else if (leftFits || rightFits) {
    x = rightFits ? right : left;
    y = (anchor.top + anchor.bottom - height) / 2;
  } else {
    x = (anchor.left + anchor.right - width) / 2;
    const below = insetBottom - anchor.bottom - gap;
    const above = anchor.top - insetTop - gap;
    y =
      below >= height || below >= above
        ? anchor.bottom + gap
        : anchor.top - gap - height;
  }
  tip.style.left = clamp(x, insetLeft, insetRight - width) + "px";
  tip.style.top =
    clamp(y, insetTop, insetBottom - tip.getBoundingClientRect().height) + "px";
}

export function FloatingTooltip({
  id,
  className,
  side,
  anchor,
  onPointerEnter,
  onPointerLeave,
  dismiss,
  children,
}: {
  id: string;
  className: string;
  side: "vertical" | "right";
  anchor: RefObject<HTMLElement | null>;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  dismiss: () => void;
  children: ReactNode;
}) {
  const element = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const trigger = anchor.current;
    const tip = element.current;
    if (!trigger || !tip) return;

    let frame = 0;
    let inView = false;
    const schedulePosition = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        tip.dataset.positioned = String(inView);
        if (inView) positionTooltip(trigger, tip, side);
      });
    };

    const intersection = new IntersectionObserver(([entry]) => {
      inView =
        !!entry &&
        entry.intersectionRect.width > 0 &&
        entry.intersectionRect.height > 0;
      schedulePosition();
    });
    intersection.observe(trigger);
    const resize = new ResizeObserver(schedulePosition);
    resize.observe(trigger);
    resize.observe(tip);
    window.addEventListener("scroll", schedulePosition, true);
    window.addEventListener("resize", schedulePosition);
    const viewport = window.visualViewport;
    viewport?.addEventListener("scroll", schedulePosition);
    viewport?.addEventListener("resize", schedulePosition);

    return () => {
      intersection.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedulePosition, true);
      window.removeEventListener("resize", schedulePosition);
      viewport?.removeEventListener("scroll", schedulePosition);
      viewport?.removeEventListener("resize", schedulePosition);
    };
  }, [anchor, side]);

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || document.querySelector("dialog:modal"))
        return;
      dismiss();
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [dismiss]);

  return createPortal(
    <div
      ref={element}
      className={"floating-tooltip " + className}
      id={id}
      role="tooltip"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>,
    document.body,
  );
}
