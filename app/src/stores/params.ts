import { createSignal } from "solid-js";

export type Session = "s6" | "s7" | "s8";

let defaultDate = window.location.search
  .replace("?", "")
  .split("&")
  .find((str) => /date=.*/.test(str))
  ?.replace("date=", "");

if (defaultDate === undefined) {
  const thursday = new Date();
  thursday.setDate(thursday.getDate() + ((5 + 7 - thursday.getDay()) % 7));
  defaultDate = thursday.toLocaleDateString("fr-CA");
}

const [session, setSession] = createSignal<Session>("s6");
const [dueDate, setDueDate] = createSignal<Date>(new Date(defaultDate));

const isValidDate = () => dueDate().getDay() === 4;

const startDate = () =>
  new Date(
    dueDate().getFullYear(),
    dueDate().getMonth(),
    dueDate().getDate() - 7,
    0,
    0,
    0
  );

const endDate = () =>
  new Date(
    dueDate().getFullYear(),
    dueDate().getMonth(),
    dueDate().getDate() - 1,
    23,
    59,
    59
  );

export {
  dueDate,
  endDate,
  isValidDate,
  session,
  setDueDate,
  setSession,
  startDate,
};
