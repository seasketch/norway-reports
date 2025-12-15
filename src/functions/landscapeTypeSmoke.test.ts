import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { landscapeType } from "./landscapeType.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof landscapeType).toBe("function");
  });
  test("landscapeType - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await landscapeType(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "landscapeType", example.properties.name);
    }
  }, 60_000);
});
