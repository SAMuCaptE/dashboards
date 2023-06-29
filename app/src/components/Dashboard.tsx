import { Component } from "solid-js";
import { fields } from "../resources/fields";
import { dueDate, isValidDate, session } from "../stores/params";

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
  const formattedDate = () => dueDate().toLocaleDateString("en-CA");

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
                  <div class="h-2"></div>

                  <Members data={f.data} />
                  <div class="h-2"></div>

                  <div>
                    <img
                      src={`/fields/${session()}/${formattedDate()}/horaire.png`}
                      alt="Horaire manquante"
                    />
                  </div>

                  <Columns>
                    <WorkedHoursChart />
                    <BurndownChart data={f.data} />
                    {/* <BudgetChart /> */}
                  </Columns>

                  <div class="w-[95%] mx-auto pt-10">
                    <Risks data={f.data} />
                  </div>
                </Page>

                <Page data={f.data}>
                  <Epics data={f.data} />
                  <div class="h-2"></div>
                  <SprintStatus data={f.data} />
                </Page>
              </>
            )
          );
        })}
    </>
  );
};

export default Dashboard;
