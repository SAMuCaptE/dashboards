import { Component } from "solid-js";
import { fields } from "../resources/fields";
import { isValidDate } from "../stores/params";
import BudgetChart from "./BudgetChart";
import Header from "./Header";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";
import Risks from "./Risks";
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
                <Page data={f.data}>
                  <Header />
                  <Objectives data={f.data} />
                  <Members data={f.data} />
                  <div class="grid grid-cols-2">
                    <WorkedHoursChart />
                  </div>
                  <div class="grid grid-cols-2 items-center">
                    <Risks data={f.data} />
                    <BudgetChart />
                  </div>
                </Page>
                <Page data={f.data}>page 2</Page>
              </>
            )
          );
        })}
    </>
  );
};

export default Dashboard;
