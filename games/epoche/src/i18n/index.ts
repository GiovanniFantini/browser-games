import it from "./it.json";
import en from "./en.json";
import campaignIt from "./campaign-it.json";
import campaignEn from "./campaign-en.json";
import dilemmaIt from "./dilemmas-it.json";
import dilemmaEn from "./dilemmas-en.json";
import reviewIt from "./review-it.json";
import reviewEn from "./review-en.json";

export type Language = "it" | "en";
export const dictionaries: Record<
  Language,
  Readonly<Record<string, string>>
> = {
  it: { ...it, ...campaignIt, ...dilemmaIt, ...reviewIt },
  en: { ...en, ...campaignEn, ...dilemmaEn, ...reviewEn },
};

export function translate(
  language: Language,
  key: string,
  values: Readonly<Record<string, string | number>> = {},
): string {
  const dictionary = dictionaries[language];
  const message = Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
  return (message ?? key).replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
