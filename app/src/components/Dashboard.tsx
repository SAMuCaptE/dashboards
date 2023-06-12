import { Component } from "solid-js";
import { fields } from "../stores/fields";
import { isValidDate } from "../stores/params";
import Header from "./Header";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";

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
