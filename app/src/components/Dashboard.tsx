import { Component, createResource, Show, Suspense } from "solid-js";
import { client } from "../client";
import { useTasks } from "../resources/tasks";

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

  const [tasks, { refetch }] = useTasks(sprintId);

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
        <SprintStatus
          sprintId={sprintId}
          tasks={tasks}
          itemCount={tasksInFirstPage}
          refetch={refetch}
        />
      </Page>

      <Suspense>
        <Show when={(tasks()?.tasks ?? []).length > tasksInFirstPage}>
          <Page>
            <SprintStatus
              sprintId={sprintId}
              tasks={tasks}
              itemCount={30}
              offset={tasksInFirstPage}
              refetch={refetch}
            />
          </Page>
        </Show>
      </Suspense>
    </>
  );
};

export default Dashboard;
