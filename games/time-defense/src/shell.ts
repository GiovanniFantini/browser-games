/** Native landing shell only. The field and game state start at task31. */
export function startShell(illustrationUrl: string): void {
  const intro = document.querySelector<HTMLElement>("#intro");
  const observation = document.querySelector<HTMLElement>("#observation");
  const backdrop = document.querySelector<HTMLImageElement>("#backdrop");
  const observe = document.querySelector<HTMLButtonElement>("#observe");
  const back = document.querySelector<HTMLButtonElement>("#back");
  const retry = document.querySelector<HTMLButtonElement>("#retry");
  const status = document.querySelector<HTMLElement>("#boot-status");
  const reload = document.querySelector<HTMLAnchorElement>(".reload");
  if (
    !intro ||
    !observation ||
    !backdrop ||
    !observe ||
    !back ||
    !retry ||
    !status ||
    !reload
  ) {
    throw new Error("The landing shell is missing a required element.");
  }
  let attempt = 0;
  let observing = false;

  function leave(): void {
    observing = false;
    document.body.classList.remove("observing");
    observation!.hidden = true;
    intro!.hidden = false;
    observe!.focus();
  }

  function loadIllustration(): void {
    const currentAttempt = ++attempt;
    const restoreFocus = document.activeElement === retry;
    retry!.disabled = true;
    document.body.dataset.illustrationState = "loading";
    observe!.disabled = true;
    status!.setAttribute("role", "status");
    status!.textContent = "Caricamento dell’ambientazione…";
    const candidate = new Image();
    const url = new URL(illustrationUrl, document.baseURI);
    if (currentAttempt > 1)
      url.searchParams.set("retry", String(currentAttempt));
    candidate.onload = () => {
      if (currentAttempt !== attempt) return;
      backdrop!.src = candidate.src;
      document.body.classList.add("illustration-ready");
      document.body.dataset.illustrationState = "ready";
      reload!.hidden = true;
      status!.textContent = "Pronto a giocare.";
      observe!.disabled = false;
      retry!.hidden = true;
      retry!.disabled = false;
      if (restoreFocus) observe!.focus();
    };
    candidate.onerror = () => {
      if (currentAttempt !== attempt) return;
      status!.setAttribute("role", "alert");
      document.body.dataset.illustrationState = "error";
      reload!.hidden = false;
      status!.textContent =
        "Non siamo riusciti a caricare l’illustrazione. Riprova il caricamento o ricarica la pagina.";
      retry!.hidden = false;
      retry!.disabled = false;
      if (restoreFocus) retry!.focus();
    };
    candidate.src = url.href;
  }

  observe.addEventListener("click", () => {
    if (observe.disabled) return;
    observing = true;
    document.body.classList.add("observing");
    intro.hidden = true;
    observation.hidden = false;
    back.focus();
  });
  back.addEventListener("click", leave);
  retry.addEventListener("click", loadIllustration);
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && observing) {
      event.preventDefault();
      leave();
    }
  });
  loadIllustration();
}
