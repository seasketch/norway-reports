import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { depthClasses } from "./depthClasses.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof depthClasses).toBe("function");
  });
  test("depthClasses - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await depthClasses(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "depthClasses", example.properties.name);
    }
  }, 60_000);
});
