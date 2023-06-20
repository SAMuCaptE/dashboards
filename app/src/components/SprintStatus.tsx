import { Component, createResource } from "solid-js";
import { client } from "../client";
import { Fields } from "../resources/fields";

const SprintStatus: Component<{ data: Fields }> = () => {
  const [a] = createResource(() =>
    client.tasks.query({ assigneeIds: [], tags: [] })
  );

  return (
    <>
      <pre>{JSON.stringify(a(), null, 2)}</pre>
      Une liste de tous les tickets qui:
      <ul>
        <li>- sont à faire</li>
        <li>- sont faits</li>
        <li>- sont bloqués (et les raisons du blocage)</li>
      </ul>
    </>
  );
};

export default SprintStatus;
