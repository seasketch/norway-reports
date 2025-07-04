import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { Size } from "../components/Size.js";
import { Eelgrass } from "../components/Eelgrass.js";
import { Kelp } from "../components/Kelp.js";
import { BioclasticSand } from "../components/BioclasticSand.js";
import { Ous } from "../components/Ous.js";
import { CodSpawningGrounds } from "../components/CodSpawningGrounds.js";
import { Depth } from "../components/Depth.js";
import { SeabirdNests } from "../components/SeabirdNests.js";

const enableAllTabs = false;
const BaseReport = () => {
  const { t } = useTranslation();
  const segments = [
    { id: "Viability", label: t("Viability") },
    { id: "Representation", label: t("Representation") },
  ];
  const [tab, setTab] = useState<string>("Viability");

  return (
    <>
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>
      <ReportPage hidden={!enableAllTabs && tab !== "Viability"}>
        <Size />
        <Ous />
        <SketchAttributesCard autoHide />
      </ReportPage>
      <ReportPage hidden={!enableAllTabs && tab !== "Representation"}>
        <Depth />
        <Eelgrass />
        <Kelp />
        <BioclasticSand />
        <CodSpawningGrounds />
        <SeabirdNests />
      </ReportPage>
    </>
  );
};

// Named export loaded by storybook
export const TabReport = () => {
  return (
    <Translator>
      <BaseReport />
    </Translator>
  );
};

// Default export lazy-loaded by production ReportApp
export default TabReport;
