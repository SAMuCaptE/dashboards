import { Component } from "solid-js";
import { fields } from "../resources/fields";
import { dueDate, isValidDate, session } from "../stores/params";
import BudgetChart from "./BudgetChart";
import Columns from "./Columns";
import Header from "./Header";
import Members from "./Members";
import Objectives from "./Objectives";
import Page from "./Page";
import Risks from "./Risks";
import Spacing from "./Spacing";
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
                  <Spacing size={2} />
                  <Members data={f.data} />

                  <Columns>
                    <WorkedHoursChart />
                  </Columns>

                  <div>
                    <img
                      src={`/fields/${session()}/${formattedDate()}/horaire.png`}
                      alt="Horaire manquante"
                    />
                  </div>

                  <Spacing />

                  <Columns>
                    <Risks data={f.data} />
                    <BudgetChart />
                  </Columns>
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
