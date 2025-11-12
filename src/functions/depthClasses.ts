import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";

/**
 * Overlap with depthClasses classes
 */
export async function depthClasses(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const metricGroup = project.getMetricGroup("depthClasses");
  const ds = project.getMetricGroupDatasource(metricGroup);
  if (!isRasterDatasource(ds))
    throw new Error(`Expected raster datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const raster = await loadCog(url);

  const metrics: Metric[] = await rasterMetrics(raster, {
    metricId: metricGroup.metricId,
    feature: sketch,
    categorical: true,
    categoryMetricValues: metricGroup.classes.map((c) => c.classId),
  });

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(depthClasses, {
  title: "depthClasses",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
