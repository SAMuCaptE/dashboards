import { createResource } from "solid-js";
import { client } from "../client";
import { fields } from "./fields";

const [sprintTasks, { refetch }] = createResource(() => {
  const f = fields();
  if (f?.success) {
    return client.tasks.query({ listIds: [f.data.sprint.id] });
  }
  return [];
});

export { refetch, sprintTasks };
