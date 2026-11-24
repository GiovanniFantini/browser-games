import { expect, it } from "vitest";
import { attributeBand, attributeTrend, historicalYear } from "./format";

it("formats the starting year in both languages, with no year zero", () => {
  expect(historicalYear(-300000, "it")).toBe("300.000 a.C.");
  expect(historicalYear(-300000, "en")).toBe("300,000 BCE");
  expect(historicalYear(0, "en")).toBe("1 CE");
});

it("uses the visible score to set the band and follows recent samples", () => {
  expect([5, 6, 10.9, 16].map(attributeBand)).toEqual([
    "low",
    "fair",
    "good",
    "high",
  ]);
  expect(attributeTrend([4, 3, 2, 3])).toBe("falling");
  expect(attributeTrend([4, 8])).toBe("rising");
  expect(attributeTrend([])).toBe("steady");
});
