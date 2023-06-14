import { Component } from "solid-js";
import { fields } from "../resources/fields";
import { isValidDate } from "../stores/params";
import Header from "./Header";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";
import WorkedHoursChart from "./WorkedHoursChart";

const Dashboard: Component = () => {
  return (
    <>
      {isValidDate() &&
        (() => {
          const f = fields();
          return (
            f?.success && (
              <>
                <Page>
                  <Header />
                  <Objectives data={f.data} />
                  <Members data={f.data} />
                  <div class="grid grid-cols-2">
                    <WorkedHoursChart />
                  </div>
                </Page>
                <Page>page 2</Page>
              </>
            )
          );
        })}
    </>
  );
};

export default Dashboard;
