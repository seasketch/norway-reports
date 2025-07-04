import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { seabirdNests } from "./seabirdNests.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof seabirdNests).toBe("function");
  });
  test("seabirdNests - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await seabirdNests(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "seabirdNests", example.properties.name);
    }
  }, 60_000);
});
