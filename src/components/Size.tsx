import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ClassTable,
  Collapse,
  Column,
  DataDownload,
  KeySection,
  ObjectiveStatus,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  Table,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  firstMatchingMetric,
  keyBy,
  metricsWithSketchId,
  nestMetrics,
  percentWithEdge,
  roundLower,
  squareMeterToKilometer,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { CheckCircleFill, Download } from "@styled-icons/bootstrap";
import { XCircleFill } from "@styled-icons/bootstrap/XCircleFill";
import { styled } from "styled-components";

/**
 * Size component
 */
export const Size: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("size", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Size");
  const mapLabel = t("Map");
  const withinLabel = t("Within Plan");
  const percWithinLabel = t("% Within Plan");
  const unitsLabel = t("km²");

  return (
    <ResultsCard title={titleLabel} functionName="size" useChildCard>
      {(data: ReportResult) => {
        const percMetricIdName = `${metricGroup.metricId}Perc`;

        const valueMetrics = metricsWithSketchId(
          data.metrics.filter((m) => m.metricId === metricGroup.metricId),
          [id],
        );
        const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
          metricIdOverride: percMetricIdName,
        });
        const metrics = [...valueMetrics, ...percentMetrics];

        const objectives = (() => {
          const objectives = project.getMetricGroupObjectives(metricGroup, t);
          if (objectives.length) {
            return objectives;
          } else {
            return;
          }
        })();

        const areaMetric = firstMatchingMetric(
          data.metrics,
          (m) => m.sketchId === id && m.groupId === null,
        );
        const totalAreaMetric = firstMatchingMetric(
          precalcMetrics,
          (m) => m.groupId === null,
        );
        const areaDisplay = roundLower(
          squareMeterToKilometer(areaMetric.value),
        );
        const percDisplay = percentWithEdge(
          areaMetric.value / totalAreaMetric.value,
        );

        const meetsObjective = squareMeterToKilometer(areaMetric.value) > 12;

        return (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={[
                <DataDownload
                  filename={titleLabel}
                  data={metrics.map((m) => ({
                    metricId: m.metricId,
                    classId: m.classId,
                    value: m.value,
                    extra: m.extra,
                  }))}
                  titleElement={
                    <Download
                      size={18}
                      color="#999"
                      style={{ cursor: "pointer" }}
                    />
                  }
                />,
              ]}
            >
              <KeySection>
                {t("This plan is")}{" "}
                <b>
                  {areaDisplay} {unitsLabel}
                </b>
                {", "}
                {t("which is")} <b>{percDisplay}</b> {t("of Raet NP.")}
              </KeySection>

              {!isCollection && (
                <ObjectiveStatus
                  status={meetsObjective ? "yes" : "no"}
                  msg={
                    meetsObjective ? (
                      <>
                        {t(
                          "This MPA meets the 12 sq. km. minimum size objective.",
                        )}
                      </>
                    ) : (
                      <>
                        {t(
                          "This MPA does not meet the 12 sq. km. minimum size objective.",
                        )}
                      </>
                    )
                  }
                />
              )}

              <ClassTable
                rows={metrics}
                metricGroup={metricGroup}
                objective={objectives}
                columnConfig={[
                  {
                    columnLabel: " ",
                    type: "class",
                    width: 20,
                  },
                  {
                    columnLabel: withinLabel,
                    type: "metricValue",
                    metricId: metricGroup.metricId,
                    valueFormatter: (v) =>
                      roundLower(squareMeterToKilometer(Number(v))),
                    valueLabel: unitsLabel,
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 20,
                  },
                  {
                    columnLabel: percWithinLabel,
                    type: "metricChart",
                    metricId: percMetricIdName,
                    valueFormatter: "percent",
                    chartOptions: {
                      showTitle: true,
                    },
                    width: 40,
                  },
                  {
                    columnLabel: mapLabel,
                    type: "layerToggle",
                    width: 10,
                  },
                ]}
              />

              {isCollection && childProperties && (
                <Collapse title={t("Show by Sketch")}>
                  {genSketchTable(
                    data,
                    metricGroup,
                    precalcMetrics,
                    childProperties,
                    t,
                  )}
                </Collapse>
              )}

              <Collapse title={t("Learn More")}>
                <Trans i18nKey="Size - learn more">
                  <p>
                    🎯 Planning Objective: 30% of Raet National Park in No-Take
                    MPAs.
                  </p>
                  <p>
                    📈 Report: This report calculates the total area within the
                    selected MPA(s). This value is divided by the total area of
                    the planning area to obtain the % contained within the
                    selected MPA(s).
                  </p>
                </Trans>
              </Collapse>
            </ToolbarCard>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const SketchTableStyled = styled(ReportTableStyled)`
  & {
    width: 100%;
    overflow-x: scroll;
    font-size: 12px;
  }

  & th:first-child,
  & td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  tr,
  td {
    text-align: center;
  }

  td:not(:first-child),
  th {
    white-space: nowrap;
  }
`;

export const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  precalcMetrics: Metric[],
  childProperties: SketchProperties[],
  t: any,
) => {
  const sketchesById = keyBy(childProperties, (sk) => sk.id);
  const sketchIds = childProperties.map((sk) => sk.id);
  const sketchMetrics = data.metrics.filter(
    (m) => m.sketchId && sketchIds.includes(m.sketchId),
  );
  const finalMetrics = [
    ...sketchMetrics,
    ...toPercentMetric(sketchMetrics, precalcMetrics, {
      metricIdOverride: project.getMetricGroupPercId(metricGroup),
    }),
  ];

  const aggMetrics = nestMetrics(finalMetrics, ["sketchId", "metricId"]);

  const rows: {
    sketchId: string;
  }[] = Object.keys(aggMetrics).map((sketchId) => ({
    sketchId,
  }));

  const classColumns: Column<{ sketchId: string }>[] = [
    {
      Header: t("Size Objective"),
      accessor: (row: { sketchId: string }) => {
        const value = squareMeterToKilometer(
          aggMetrics[row.sketchId][metricGroup.metricId][0].value,
        );
        return value > 12 ? (
          <CheckCircleFill size={15} style={{ color: "#78c679" }} />
        ) : (
          <XCircleFill size={15} style={{ color: "#ED2C7C" }} />
        );
      },
    },
    {
      Header: t("Area"),
      accessor: (row: { sketchId: string }) => {
        const value = aggMetrics[row.sketchId][metricGroup.metricId][0].value;
        const miVal = squareMeterToKilometer(value);
        return miVal.toFixed(2) + " " + t("km²");
      },
    },
    {
      Header: t("% Area"),
      accessor: (row: { sketchId: string }) => {
        const value =
          aggMetrics[row.sketchId][project.getMetricGroupPercId(metricGroup)][0]
            .value;
        return percentWithEdge(value);
      },
    },
  ];

  const columns: Column<{ sketchId: string }>[] = [
    {
      Header: "MPA",
      accessor: (row) => sketchesById[row.sketchId].name,
    },
    ...classColumns,
  ];

  return (
    <SketchTableStyled>
      <Table columns={columns} data={rows} />
    </SketchTableStyled>
  );
};
