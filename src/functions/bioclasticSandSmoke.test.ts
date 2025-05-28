import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bioclasticSand } from "./bioclasticSand.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof bioclasticSand).toBe("function");
  });
  test("bioclasticSand - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await bioclasticSand(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "bioclasticSand", example.properties.name);
    }
  }, 60_000);
});
