import { Accessor, Component, createResource, Show, Suspense } from "solid-js";
import { client } from "../client";

import { dueDate, session } from "../stores/params";
import BudgetChart from "./BudgetChart";
import BurndownChart from "./BurndownChart";
import Columns from "./Columns";
import Epics from "./Epics";
import Header from "./Header";
import Loader from "./Loader";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";
import Risks from "./Risks";
import SprintStatus from "./SprintStatus";
import WorkedHoursChart from "./WorkedHoursChart";

const tasksInFirstPage = 27;

const Dashboard: Component = () => {
  const [sprintId] = createResource(() =>
    client.fields.sprint.id.query({ dueDate, session }).catch(() => "Erreur"),
  );

  return (
    <>
      <Page>
        <Header />

        <Objectives />
        <div class="h-2"></div>

        <Members />
        <div class="h-2"></div>

        <Columns>
          <WorkedHoursChart />
          <Suspense fallback={<Loader />}>
            <Show when={sprintId()}>
              <BurndownChart sprintId={sprintId()!} />
            </Show>
          </Suspense>
        </Columns>

        <div class="w-[95%] mx-auto">
          <BudgetChart />
          <Risks />
        </div>
      </Page>

      <Page>
        <Epics />
        <SprintStatus sprintId={sprintId} itemCount={tasksInFirstPage} />
      </Page>

      {
        // <Show when={(sprintTasks()?.length ?? 0) > tasksInFirstPage}>
        //   <Page data={validFields()}>
        //     <SprintStatus
        //       data={validFields()}
        //       itemCount={30}
        //       offset={tasksInFirstPage}
        //     />
        //   </Page>
        // </Show>
      }
    </>
  );
};

export default Dashboard;
