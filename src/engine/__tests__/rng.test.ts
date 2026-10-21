import { describe, expect, it } from "vitest";
import { gaussianAt, nextRandom, randomFloat } from "../rng";

describe("rng", () => {
  it("é determinístico: mesmo seed e cursor sempre dão o mesmo valor", () => {
    expect(randomFloat(42, 7)).toBe(randomFloat(42, 7));
  });

  it("gera valores diferentes para cursores diferentes", () => {
    expect(randomFloat(42, 1)).not.toBe(randomFloat(42, 2));
  });

  it("gera valores diferentes para seeds diferentes", () => {
    expect(randomFloat(1, 5)).not.toBe(randomFloat(2, 5));
  });

  it("sempre devolve um valor em [0, 1)", () => {
    for (let c = 0; c < 200; c++) {
      const v = randomFloat(123, c);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("nextRandom avança o cursor em 1", () => {
    const { cursor } = nextRandom(10, 5);
    expect(cursor).toBe(6);
  });

  it("gaussianAt é determinístico e finito", () => {
    const a = gaussianAt(99, 3);
    const b = gaussianAt(99, 3);
    expect(a).toBe(b);
    expect(Number.isFinite(a)).toBe(true);
  });
});
