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
const startDate = () => new Date(dueDate().getTime() - 6 * 24 * 3600 * 1000);

export { dueDate, isValidDate, session, setDueDate, setSession, startDate };
