import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  Column,
  LayerToggle,
  ReportError,
  ReportTableStyled,
  ResultsCard,
  SketchClassTable,
  Table,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  GeogProp,
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { styled } from "styled-components";

// ClassId -> scientific name
const scientificNames: Record<string, string> = {
  makrellterne: "Sterna hirundo",
  hettemaake: "Chroicocephalus ridibundus",
  graamaake: "Larus argentatus",
  fiskemaake: "Larus canus",
  storskarv: "Phalacrocorax carbo",
  svartbak: "Larus marinus",
  tjeld: "Haematopus ostralegus",
  aerfugl: "Somateria mollissima",
};

// ClassId -> Redlist status
const redListStatus: Record<string, string> = {
  makrellterne: "EN",
  hettemaake: "CR",
  graamaake: "VU",
  fiskemaake: "VU",
  storskarv: "NT",
  svartbak: "LC",
  tjeld: "NT",
  aerfugl: "VU",
};

// Function to get color for red list status
const getStatusColor = (status: string): string => {
  switch (status) {
    case "CR":
      return "#DB1C06";
    case "EN":
      return "#FC7F3F";
    case "VU":
      return "#F9E814";
    case "NT":
      return "#CCE225";
    case "LC":
      return "#60C659";
    default:
      return "#757575";
  }
};

/**
 * Seabird Nests component
 */
export const SeabirdNests: React.FunctionComponent<GeogProp> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("seabirdNests", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "count",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Seabird Nests");
  const seabirdLabel = t("Species");
  const mapLabel = t("Map");
  const withinLabel = t("# Nests");
  const percWithinLabel = t("% of Total Nests");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="seabirdNests"
      extraParams={{ geographyIds: [curGeography.geographyId] }}
    >
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

        return (
          <ReportError>
            <p>
              <Trans i18nKey="SeabirdNests 1">
                This report summarizes the number and percentage of seabird
                nests adjacent to the plan.
              </Trans>
            </p>

            <SeabirdTableStyled>
              <Table
                columns={getSeabirdColumns(
                  t,
                  seabirdLabel,
                  withinLabel,
                  percWithinLabel,
                  mapLabel,
                )}
                data={getSeabirdData(metrics, metricGroup, percMetricIdName)}
              />
            </SeabirdTableStyled>

            {isCollection && childProperties && (
              <Collapse title={t("Show by Sketch")}>
                {genSketchTable(
                  data,
                  metricGroup,
                  precalcMetrics,
                  childProperties,
                )}
              </Collapse>
            )}

            <Collapse title={t("Learn More")}>
              <Trans i18nKey="SeabirdNests - learn more">
                <p>ℹ️ Overview: </p>
                <p>🗺️ Source Data:</p>
                <p>
                  📈 Report: This report calculates the total number of nests
                  adjacent to the plan (within 200m). This value is divided by
                  the total number of nests to obtain the % adjacent to the
                  plan. If the plan includes multiple areas that overlap, the
                  overlap is only counted once.
                </p>
              </Trans>
            </Collapse>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  precalcMetrics: Metric[],
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === metricGroup.metricId),
      childSketchIds,
    ),
    precalcMetrics,
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return (
    <SketchClassTable rows={sketchRows} metricGroup={metricGroup} formatPerc />
  );
};

const SeabirdTableStyled = styled(ReportTableStyled)`
  & {
    width: 100%;
    overflow-x: scroll;
    font-size: 11px;
  }

  th,
  tr,
  td {
    text-align: center;
    padding: 6px 4px;
  }

  th {
    font-size: 10px;
    font-weight: bold;
  }

  /* Column width controls */
  th:nth-child(1),
  td:nth-child(1) {
    width: 120px;
    min-width: 120px;
    max-width: 120px;
    text-align: left;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
  }

  th:nth-child(4),
  td:nth-child(4) {
    width: 30px;
    min-width: 30px;
    max-width: 30px;
  }

  th:nth-child(5),
  td:nth-child(5) {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
  }

  th:nth-child(6),
  td:nth-child(6) {
    width: 60px;
    min-width: 60px;
    max-width: 60px;
  }
`;

const getSeabirdColumns = (
  t: any,
  seabirdLabel: string,
  withinLabel: string,
  percWithinLabel: string,
  mapLabel: string,
): Column<any>[] => [
  {
    Header: seabirdLabel,
    accessor: (row: any) => row.display,
  },
  {
    Header: t("Scientific Name"),
    accessor: (row: any) => <i>{row.scientificName}</i>,
  },
  {
    Header: t("Status"),
    accessor: (row: any) => (
      <span
        style={{
          padding: "2px 6px",
          borderRadius: "3px",
          fontSize: "0.75em",
          fontWeight: "bold",
          backgroundColor: getStatusColor(row.redListStatus),
          color: "black",
        }}
      >
        {row.redListStatus}
      </span>
    ),
  },
  {
    Header: withinLabel,
    accessor: (row: any) => row.nestCount,
  },
  {
    Header: percWithinLabel,
    accessor: (row: any) => row.percentage,
  },
  {
    Header: mapLabel,
    accessor: (row: any) => (
      <LayerToggle layerId={row.layerId} simple size="small" />
    ),
  },
];

const getSeabirdData = (
  metrics: Metric[],
  metricGroup: MetricGroup,
  percMetricIdName: string,
) => {
  return metricGroup.classes.map((classItem) => {
    const classMetrics = metrics.filter((m) => m.classId === classItem.classId);
    const valueMetric = classMetrics.find(
      (m) => m.metricId === metricGroup.metricId,
    );
    const percentMetric = classMetrics.find(
      (m) => m.metricId === percMetricIdName,
    );

    return {
      classId: classItem.classId,
      display: classItem.display,
      scientificName: scientificNames[classItem.classId] || "",
      redListStatus: redListStatus[classItem.classId] || "",
      nestCount: valueMetric ? valueMetric.value.toLocaleString() : "0",
      percentage: percentMetric
        ? `${(percentMetric.value * 100).toFixed(1)}%`
        : "0%",
      layerId: classItem.layerId,
    };
  });
};
