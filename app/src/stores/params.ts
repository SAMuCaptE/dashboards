export type Session = "s6" | "s7" | "s8";

const params = new URLSearchParams(window.location.search);
const dueDate = params.get("date")!;
const session = params.get("session")! as Session;

if (!dueDate || !session) {
  // const thursday = new Date();
  // thursday.setDate(thursday.getDate() + ((5 + 7 - thursday.getDay()) % 7));

  const monday = new Date();
  monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7));
  navigate(monday, "s7");
}

function navigate(date: string | Date, session: Session) {
  const targetDate =
    typeof date === "string" ? date : date.toLocaleDateString("fr-CA");

  const targetParams = new URLSearchParams();
  targetParams.append("date", targetDate);
  targetParams.append("session", session);
  window.location.replace("/?" + targetParams.toString());
}

// function isThursday() {
//     return dueDate().getDay() === 4;
// }

function isMonday() {
  return new Date(dueDate!).getUTCDay() === 1;
}

const isValidDate = isMonday;

let startDate = new Date(dueDate!);
startDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
startDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

let endDate = new Date(dueDate!);
endDate = new Date(endDate.getTime() + 3 * 60 * 60 * 1000);
endDate = new Date(endDate.getTime() - 1 * 1000);

export { dueDate, startDate, endDate, isValidDate, session, navigate };
