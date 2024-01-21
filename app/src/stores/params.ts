import { createSignal } from "solid-js";

export type Session = "s6" | "s7" | "s8";

let defaultDate = window.location.search
  .replace("?", "")
  .split("&")
  .find((str) => /date=.*/.test(str))
  ?.replace("date=", "");

if (defaultDate === undefined) {
  // const thursday = new Date();
  // thursday.setDate(thursday.getDate() + ((5 + 7 - thursday.getDay()) % 7));
  // defaultDate = thursday.toLocaleDateString("fr-CA");

  const monday = new Date();
  monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7));
  defaultDate = monday.toLocaleDateString("fr-CA");
}

const [session, setSession] = createSignal<Session>("s7");
const [dueDate, setDueDate] = createSignal<Date>(new Date(defaultDate));

// function isThursday() {
//     return dueDate().getDay() === 4;
// }

function isMonday() {
  return dueDate().getDay() === 1;
}

const isValidDate = isMonday;

const startDate = () =>
  new Date(
    dueDate().getFullYear(),
    dueDate().getMonth(),
    dueDate().getDate() - 7,
    10,
    0,
    0,
  );

const endDate = () =>
  new Date(
    dueDate().getFullYear(),
    dueDate().getMonth(),
    dueDate().getDate(),
    9,
    59,
    59,
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
