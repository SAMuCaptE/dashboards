import { Component } from "solid-js";
import { isValidDate } from "../stores/params";
import Page from "./Page";
import Header from "./Header";
import Objectives from "./Objectives";
import { fields } from "../stores/fields";

const Dashboard: Component = () => {
  return (
    <>
      {isValidDate() && fields()?.success && (
        <>
          <Page>
            <Header />
            <Objectives />
          </Page>
          <Page>page 2</Page>
        </>
      )}
    </>
  );
};

export default Dashboard;
