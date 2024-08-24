import { Component, createResource, Show, Suspense } from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
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

const tasksInFirstPage = 23;

const Dashboard: Component = () => {
  const [sprintId, { refetch: refetchSprintId }] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}/sprint`)
      .get(z.string())
      .catch(() => null),
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

          <Show when={sprintId()}>
            <Suspense fallback={<Loader />}>
              <BurndownChart sprintId={sprintId()!} />
            </Suspense>
          </Show>
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
          refetchSprint={refetchSprintId}
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
              refetchSprint={refetchSprintId}
            />
          </Page>
        </Show>
      </Suspense>
    </>
  );
};

export default Dashboard;
