import { formatYear } from "@engine/core/time";
import { translate, type Language } from "../i18n";

const locales = { it: "it-IT", en: "en-GB" };
const formatters = new Map<string, Intl.NumberFormat>();

export function formatNumber(
  value: number,
  language: Language,
  precision = 0,
  signed = false,
): string {
  const key = [language, precision, signed].join(":");
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locales[language], {
      maximumFractionDigits: precision,
      signDisplay: signed ? "exceptZero" : "auto",
    });
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}

export function historicalYear(year: number, language: Language): string {
  const date = formatYear(year);
  return (
    formatNumber(date.value, language) +
    " " +
    translate(language, date.era === "BCE" ? "era.bce" : "era.ce")
  );
}

export function attributeBand(value: number): "low" | "fair" | "good" | "high" {
  const rounded = Math.round(value);
  if (rounded <= 5) return "low";
  if (rounded <= 10) return "fair";
  if (rounded <= 15) return "good";
  return "high";
}

export function attributeTrend(
  history: readonly number[],
): "falling" | "steady" | "rising" {
  const first = history.at(-6);
  const last = history.at(-1);
  const baseline = first ?? history[0];
  if (baseline === undefined || last === undefined) return "steady";
  if (last - baseline > 0.025) return "rising";
  if (last - baseline < -0.025) return "falling";
  return "steady";
}
