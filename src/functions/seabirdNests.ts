import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  loadFgb,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  Point,
  ReportResult,
  isSketchCollection,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { bbox, buffer } from "@turf/turf";
import { overlapPoint } from "../util/overlapPoint.js";

/**
 * Overlap with adjacent seabird nests
 */
export async function seabirdNests(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const metricGroup = project.getMetricGroup("seabirdNests");

  // buffer sketch 200m
  const bufferedSketch = (() => {
    if (isSketchCollection(sketch)) {
      return {
        ...sketch,
        features: sketch.features.map((feat) => ({
          ...feat,
          geometry: buffer(feat.geometry as Polygon | MultiPolygon, 200, {
            units: "meters",
          })!.geometry,
        })),
      };
    } else {
      return {
        ...sketch,
        geometry: buffer(sketch.geometry! as Polygon | MultiPolygon, 200, {
          units: "meters",
        })!.geometry,
      };
    }
  })();

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        const features = await loadFgb<Feature<Point>>(
          url,
          bbox(bufferedSketch, { recompute: true }),
        );

        // Calculate overlap metrics
        const overlapResult = await overlapPoint(
          metricGroup.metricId,
          features,
          bufferedSketch,
        );

        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          }),
        );
      }),
    )
  ).flat();

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(seabirdNests, {
  title: "seabirdNests",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
