import { Component, createSignal, Show } from "solid-js";
import { users } from "../resources/users";
import Loader from "./Loader";
import NoPrint from "./NoPrint";

const USER_ID = "userId";

const TimeLogger: Component = () => {
  let formRef: HTMLFormElement;

  const [selectedUserId, setSelectedUserId] = createSignal<string>(
    localStorage.getItem(USER_ID) ?? "",
  );
  const [timerIsActive, setTimerIsActive] = createSignal(false);

  const handleUserSelect = (ev: Event & { target: HTMLSelectElement }) => {
    localStorage.setItem(USER_ID, ev.target.value);
    setSelectedUserId(ev.target.value);
  };

  const handleSubmit = (ev: Event) => {
    ev.preventDefault();
    console.log("submitted time entry");
  };

  const handleManualTimer = () => {
    const isActive = setTimerIsActive((active) => !active);
    if (isActive === false) {
      formRef.requestSubmit();
    }
  };

  return (
    <NoPrint>
      <Show when={(users() ?? []).length > 0} fallback={<Loader />}>
        <form ref={(el) => (formRef = el)} onSubmit={handleSubmit}>
          <label for={USER_ID}>
            <i>SAUM</i>atelot
          </label>
          <select
            id={USER_ID}
            name={USER_ID}
            value={selectedUserId()}
            onChange={handleUserSelect}
          >
            <option value="">Aucune sélection</option>
            {users()?.map((user) => (
              <option value={user.id}>{user.username}</option>
            ))}
          </select>

          <div>
            <input type="text" placeholder="Tâche ClickUp" />
          </div>

          <div>
            <input type="datetime-local" />
            <input type="datetime-local" />
            <input />
          </div>

          <div>
            <button onClick={handleManualTimer} type="button">
              {timerIsActive() ? "Arrêter le minuteur" : "Démarrer le minuteur"}
            </button>
          </div>

          <button type="submit">Enregistrer</button>
        </form>
      </Show>
    </NoPrint>
  );
};

export default TimeLogger;
