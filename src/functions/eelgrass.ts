import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

/**
 * Overlap with eelgrass
 */
export async function eelgrass(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("eelgrass");
  const classId = metricGroup.classes[0].classId;
  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  // Fetch features overlapping with sketch, if not already fetched
  const features = await getFeaturesForSketchBBoxes<Polygon | MultiPolygon>(
    sketch,
    url,
  );

  // Calculate overlap metrics
  const overlapResult = await overlapPolygonArea(
    metricGroup.metricId,
    features,
    sketch,
  );

  const metrics = overlapResult.map(
    (metric): Metric => ({
      ...metric,
      classId,
    }),
  );

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(eelgrass, {
  title: "eelgrass",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
