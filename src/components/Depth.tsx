import React from "react";
import {
  ResultsCard,
  KeySection,
  Collapse,
  ToolbarCard,
  useSketchProperties,
  LayerToggle,
  VerticalSpacer,
  SketchClassTable,
} from "@seasketch/geoprocessing/client-ui";
import { DepthResults } from "../functions/depth.js";
import { Trans, useTranslation } from "react-i18next";
import projectClient from "../../project/projectClient.js";
import { MetricGroup } from "@seasketch/geoprocessing";

const formatDepth = (val: number) => {
  if (!val || val > 0) return "0m";
  const baseVal = Math.round(Math.abs(val));
  return `-${baseVal}m`;
};

export const Depth: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const mg = projectClient.getMetricGroup("depth", t);
  const mapLabel = t("Show On Map");
  const title = t("Depth");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={title} functionName="depth" useChildCard>
        {(data: DepthResults[]) => {
          const overallStats = isCollection
            ? data.find((s) => s.isCollection)
            : data[0];

          return (
            <ToolbarCard
              title={title}
              items={[
                <LayerToggle layerId={mg.layerId} label={mapLabel} simple />,
              ]}
            >
              <VerticalSpacer />
              <KeySection
                style={{ display: "flex", justifyContent: "space-around" }}
              >
                <span>
                  {t("Min")}:{" "}
                  <b>
                    {overallStats ? formatDepth(overallStats.max) : t("N/A")}
                  </b>
                </span>
                {overallStats && overallStats?.mean ? (
                  <span>
                    {t("Avg")}: <b>{formatDepth(overallStats.mean)}</b>
                  </span>
                ) : (
                  <></>
                )}
                <span>
                  {t("Max")}:{" "}
                  <b>
                    {overallStats ? formatDepth(overallStats.min) : t("N/A")}
                  </b>
                </span>
              </KeySection>

              {isCollection && (
                <Collapse title={t("Show by MPA")}>
                  {gendepthTable(data, mg)}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Depth Card - Learn more">
                  <p>🗺️ Source Data: GEBCO 2024</p>
                  <p>
                    📈 Report: Calculates the minimum, average, and maximum
                    ocean depth within the selected MPA(s).
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};

export const gendepthTable = (data: DepthResults[], mg: MetricGroup) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);

  const rows = sketchMetrics.map((metric) => ({
    sketchName: metric.sketchName!,
    min: formatDepth(metric.max),
    mean: formatDepth(metric.mean!),
    max: formatDepth(metric.min),
  }));

  return <SketchClassTable rows={rows} metricGroup={mg} />;
};
