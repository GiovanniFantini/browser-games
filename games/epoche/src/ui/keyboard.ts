let pointerButton: Element | null = null;
const buttons = "button, [role='button']";

export function listenForShortcutFocus(): () => void {
  function point(event: PointerEvent) {
    pointerButton =
      event.target instanceof Element ? event.target.closest(buttons) : null;
  }
  function focus(event: FocusEvent) {
    if (event.target !== pointerButton) pointerButton = null;
  }
  function tab(event: KeyboardEvent) {
    if (event.key === "Tab") pointerButton = null;
  }
  window.addEventListener("pointerdown", point, true);
  window.addEventListener("focusin", focus, true);
  window.addEventListener("keydown", tab, true);
  return () => {
    window.removeEventListener("pointerdown", point, true);
    window.removeEventListener("focusin", focus, true);
    window.removeEventListener("keydown", tab, true);
    pointerButton = null;
  };
}

export function allowGameShortcut(event: KeyboardEvent): boolean {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.repeat ||
    document.querySelector("dialog:modal")
  )
    return false;

  if (!(event.target instanceof HTMLElement)) return true;
  if (
    event.target.closest(
      "input:not([type='range']), select, textarea, [contenteditable]:not([contenteditable='false'])",
    )
  )
    return false;

  const button = event.target.closest(buttons);
  return (
    event.code !== "Space" ||
    !button ||
    button === pointerButton ||
    !button.matches(":focus-visible")
  );
}
