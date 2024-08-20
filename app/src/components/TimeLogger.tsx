import { Component, createSignal, Show } from "solid-js";
import { users } from "../resources/users";
import NoPrint from "./NoPrint";

const USER_ID = "userId";

const TimeLogger: Component = () => {
  const [selectedUserId, setSelectedUserId] = createSignal<string>(
    localStorage.getItem(USER_ID) ?? "",
  );

  const handleUserSelect = (ev: Event & { target: HTMLSelectElement }) => {
    localStorage.setItem(USER_ID, ev.target.value);
    setSelectedUserId(ev.target.value);
  };

  return (
    <NoPrint>
      <div>
        <Show when={(users() ?? []).length > 0}>
          <select
            name={USER_ID}
            value={selectedUserId()}
            onChange={handleUserSelect}
          >
            <option>Aucune sélection</option>
            {users()?.map((user) => (
              <option value={user.id}>{user.username}</option>
            ))}
          </select>
        </Show>
      </div>
    </NoPrint>
  );
};

export default TimeLogger;
