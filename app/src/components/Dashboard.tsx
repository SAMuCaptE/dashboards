import { Fields } from "dashboards-server";
import { Accessor, Component } from "solid-js";

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

const tasksInFirstPage = 27;

const Dashboard: Component<{ fields: Accessor<Fields> }> = (props) => {
  return (
    <>
      <Page data={props.fields()}>
        <Header />

        <Objectives data={props.fields()} />
        <div class="h-2"></div>

        <Members data={props.fields()} />
        <div class="h-2"></div>

        <Columns>
          <WorkedHoursChart />
          <BurndownChart data={props.fields()} />
        </Columns>

        <div class="w-[95%] mx-auto pt-10">
          <Risks data={props.fields()} />
        </div>
      </Page>

      <Page data={props.fields()}>
        <Epics data={props.fields()} />
        <SprintStatus data={props.fields()} itemCount={tasksInFirstPage} />
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
