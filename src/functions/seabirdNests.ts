import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  Feature,
  isVectorDatasource,
  overlapFeatures,
  getFeaturesForSketchBBoxes,
  overlapPolygonSum,
  loadCog,
  loadFgb,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { bbox } from "@turf/turf";

/**
 * seabirdNests: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function seabirdNests(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const featuresByDatasource: Record<
    string,
    Feature<Polygon | MultiPolygon>[]
  > = {};

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("seabirdNests");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch, if not already fetched
        const features =
          featuresByDatasource[ds.datasourceId] ||
          (await loadFgb(url, sketch.bbox || bbox(sketch)));
        console.log(sketch.properties.name, curClass.classId, features.length);
        featuresByDatasource[ds.datasourceId] = features;

        // Get classKey for current data class
        const classKey = project.getMetricGroupClassKey(metricGroup, {
          classId: curClass.classId,
        });

        let finalFeatures: Feature<Polygon | MultiPolygon>[] = [];
        if (classKey === undefined)
          // Use all features
          finalFeatures = features;
        else {
          // Filter to features that are a member of this class
          finalFeatures = features.filter(
            (feat) =>
              feat.geometry &&
              feat.properties &&
              feat.properties[classKey] === curClass.classId,
          );
        }
        console.log(
          sketch.properties.name,
          curClass.classId,
          finalFeatures.length,
        );

        // Calculate overlap metrics
        const overlapResult = await overlapPolygonSum(
          metricGroup.metricId,
          finalFeatures,
          sketch,
        );

        console.log(sketch.properties.name, curClass.classId, overlapResult);

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
