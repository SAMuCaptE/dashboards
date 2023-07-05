import { Fields } from "dashboards-server";
import { Component, createMemo } from "solid-js";
import { fields } from "../resources/fields";
import { isValidDate } from "../stores/params";

import BurndownChart from "./BurndownChart";
import Columns from "./Columns";
import Epics from "./Epics";
import Header from "./Header";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";
import Risks from "./Risks";
import SprintStatus from "./SprintStatus";
import WorkedHoursChart from "./WorkedHoursChart";

const Dashboard: Component = () => {
  const validFields = createMemo((): Fields => {
    const f = fields();
    if (!f || !f.success) {
      return null as any;
    }
    return f.data;
  });

  return (
    <>
      {isValidDate() && validFields() && (
        <>
          <Page data={validFields()}>
            <Header />

            <Objectives data={validFields()} />
            <div class="h-2"></div>

            <Members data={validFields()} />
            <div class="h-2"></div>

            <Columns>
              <WorkedHoursChart />
              <BurndownChart data={validFields()} />
              {/* <BudgetChart /> */}
            </Columns>

            <div class="w-[95%] mx-auto pt-10">
              <Risks data={validFields()} />
            </div>
          </Page>

          <Page data={validFields()}>
            <Epics data={validFields()} />
            <SprintStatus data={validFields()} />
          </Page>
        </>
      )}
    </>
  );
};

export default Dashboard;
