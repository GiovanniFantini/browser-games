import { useEffect } from "react";
import { download } from "./download";

type Interaction = { ms: number; event: string; action: string; choice?: number; remedy?: string; offered?: string[]; target?: number; speed?: number };

function record(id: string, entry: Interaction) {
  const key = "epoche.study." + id;
  try {
    const previous: Interaction[] = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    sessionStorage.setItem(key, JSON.stringify([...previous.slice(-1999), entry]));
  } catch { /* The study can still run when browser storage is unavailable. */ }
}
export function useTrialLog(id: string | undefined, event: string | undefined, decision: string, visible: boolean, speed: number) {
  const stamp = () => Math.round(performance.timeOrigin + performance.now());
  useEffect(() => {
    if (id && event) record(id, {ms:stamp(), event, action:"arrive"});
  }, [id, event, decision]);
  useEffect(() => {
    if (id) record(id, {ms:stamp(), event:"", action:speed === 0 ? "pause" : "running", speed});
  }, [id, speed]);
  useEffect(() => {
    if (!id || !event || !visible) return;
    const add = (action: string, choice?: number) => record(id, { ms:stamp(), event, action, ...(choice !== undefined ? {choice} : {}) });
    add("open");
    const click = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const option = e.target.closest<HTMLButtonElement>(".event-option");
      if (option && !option.disabled) add("choice", Number(option.dataset.choice));
    };
    let lastScroll = -500;
    const scroll = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('dialog, [role="dialog"]') && performance.now() - lastScroll > 450) {
        lastScroll = performance.now(); add("scroll");
      }
    };
    document.addEventListener("click", click, true);
    document.addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("click", click, true); document.removeEventListener("scroll", scroll, true); add("close"); };
  }, [id, event, decision, visible]);
}
export function exportTrialLog(id: string) {
  download("epoche-studio.json", sessionStorage.getItem("epoche.study." + id) ?? "[]", "application/json");
}

export function logTrialRemedy(id: string, remedy: string, offered: string[], target: number) {
  record(id,{ms:Math.round(performance.timeOrigin+performance.now()),event:"hearing",action:"choice",remedy,offered,target});
}
