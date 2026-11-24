import { expect, it } from "vitest";
import { dictionaries } from "../i18n";
import { loadContent } from "./index";

it("loads all required prehistory definitions", () => {
  const content = loadContent();
  expect(Object.values(content).map((entries) => entries.length)).toEqual([
    14, 9, 6, 4, 1,
  ]);
  expect(content.eras[0]?.activeAttributes).toHaveLength(7);
});

it("rejects unknown references and a missing threshold with their location", () => {
  const content = loadContent();
  expect(() =>
    loadContent({
      ...content,
      influences: [
        { from: "sustenance", to: "missing", mode: "linear", weight: 1 },
      ],
    }),
  ).toThrow(/influences\.ts.*missing/);
  expect(() =>
    loadContent({
      ...content,
      influences: [
        {
          from: "population_pressure",
          to: "environment",
          mode: "aboveThreshold",
          weight: 1,
        },
      ],
    }),
  ).toThrow(/influences\.ts.*threshold/);
});

it("requires every content key in both languages", () => {
  const en = { ...dictionaries.en };
  delete en["attribute.environment"];
  expect(() => loadContent(loadContent(), { ...dictionaries, en })).toThrow(
    /attributes\.ts.*en\.json.*attribute\.environment/,
  );
});
