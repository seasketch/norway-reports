import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { codSpawningGrounds } from "./codSpawningGrounds.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof codSpawningGrounds).toBe("function");
  });
  test("codSpawningGrounds - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await codSpawningGrounds(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "codSpawningGrounds", example.properties.name);
    }
  }, 60_000);
});
