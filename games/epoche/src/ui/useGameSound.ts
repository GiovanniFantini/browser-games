import { useEffect, useRef, useState } from "react";
import type { CampaignView } from "@worker/campaignView";
import {
  enableSound,
  playSound,
  setSoundScene,
  setSoundVolume,
  stopSound,
} from "./sound";

function readPreference(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function useGameSound(campaign: CampaignView | undefined) {
  const [wanted, setWanted] = useState(
    () => readPreference("epoche-sound", "off") === "on",
  );
  const [active, setActive] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = Number(readPreference("epoche-volume", "55"));
    return Number.isFinite(saved) ? Math.min(100, Math.max(0, saved)) : 55;
  });
  const pendingEnable = useRef(0);
  const stage = campaign?.stage;
  const event = campaign?.event
    ? campaign.event.id + ":" + campaign.event.openedAt
    : undefined;
  const crises =
    campaign?.crises
      .map(({ family }) => family)
      .sort()
      .join(",") ?? "";
  const war = campaign?.war?.rival;
  const ending = campaign?.outcome?.kind;
  const mood = war ? "war" : crises ? "strained" : "calm";
  const previous = useRef({ stage, event, crises, war, ending });

  async function activate(level: number) {
    const request = ++pendingEnable.current;
    const ready = await enableSound();
    if (!ready || request !== pendingEnable.current) return;
    setSoundVolume(level / 100);
    playSound("enabled");
    setActive(true);
  }

  useEffect(() => {
    if (!wanted || active || stage === undefined) return;
    const unlock = () => {
      void activate(volume);
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [wanted, active, stage, volume]);

  useEffect(() => {
    try {
      localStorage.setItem("epoche-sound", wanted ? "on" : "off");
      localStorage.setItem("epoche-volume", String(volume));
    } catch {
      /* Preferences remain available during the session. */
    }
    if (active) setSoundVolume(volume / 100);
  }, [active, wanted, volume]);

  useEffect(() => {
    if (active && stage !== undefined) setSoundScene(stage, mood);
  }, [active, stage, mood]);

  useEffect(() => {
    const before = previous.current;
    previous.current = { stage, event, crises, war, ending };
    if (!active) return;
    if (event && event !== before.event) playSound("event");
    const formerCrises = new Set(before.crises.split(","));
    if (crises.split(",").some((family) => family && !formerCrises.has(family)))
      playSound("crisis");
    if (
      stage !== undefined &&
      before.stage !== undefined &&
      stage !== before.stage
    )
      playSound("era");
    if (war && war !== before.war) playSound("war");
    if (ending && ending !== before.ending) playSound("ending");
  }, [active, stage, event, crises, war, ending]);

  useEffect(
    () => () => {
      ++pendingEnable.current;
      stopSound();
    },
    [],
  );

  function toggle() {
    if (wanted) {
      ++pendingEnable.current;
      stopSound();
      setActive(false);
      setWanted(false);
    } else {
      setWanted(true);
      void activate(volume);
    }
  }

  return { wanted, active, volume, setVolume, toggle };
}
