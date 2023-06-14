import { createResource } from "solid-js";

const [users, { refetch }] = createResource(async () => {
  const response = await fetch("http://localhost:16987/users");
  return response.json();
});

export { refetch, users };
