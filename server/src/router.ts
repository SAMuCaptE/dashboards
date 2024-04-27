import { Router } from "express";
import { z } from "zod";

import { getBurndown } from "./api/burndown";
import { getEpics } from "./api/epics";
import { getExtraData } from "./api/extraData";
import {
    SelectedDashboard,
    Session,
    copyPreviousFields,
    editFields,
    existsFields,
    findField,
} from "./api/fields";
import { getBudget } from "./api/money";
import { getTasks } from "./api/tasks";
import { getTimeEntriesInRange } from "./api/time-entries";
import { getUsers } from "./api/users";
import { getWorkedHours } from "./api/worked-hours";
import { handle } from "./utils";

const DateRange = z.object({
  start: z.string().transform((str) => new Date(parseInt(str))),
  end: z.string().transform((str) => new Date(parseInt(str))),
});

const router = Router();

router.get("/health", function (_, res) {
  res.sendStatus(200);
});

router.get(
  "/users",
  handle(async function (_, res) {
    res.json(await getUsers()).status(200);
  }),
);

router.get(
  "/hours",
  handle(async function (req, res) {
    const input = DateRange.parse({
      start: req.query.start,
      end: req.query.end,
    });

    res.json(await getWorkedHours(input.start, input.end)).status(200);
  }),
);

router.get(
  "/budget",
  handle(async function (_, res) {
    return res.json(getBudget()).status(200);
  }),
);

router.get(
  "/tasks",
  handle(async function (req, res) {
    const input = z
      .object({ listId: z.string() })
      .and(SelectedDashboard)
      .parse({
        session: req.query.session,
        dueDate: req.query.dueDate,
        listId: req.query.listId,
      });

    const [tasks, problems] = await Promise.all([
      getTasks([], [], [input.listId], [], null),
      findField(input, (fields) => fields.sprint.problems),
    ]);

    const tasksWithProblems = tasks.map((task) => ({
      ...task,
      problems: problems.filter((p) => p.taskId === task.id),
    }));

    res.json(tasksWithProblems).status(200);
  }),
);

router.get(
  "/epics",
  handle(async function (req, res) {
    const session = Session.parse(req.query.session);
    res.json(await getEpics(session, null)).status(200);
  }),
);

router.get(
  "/burndown",
  handle(async function (req, res) {
    const sprintId = z.string().parse(req.query.sprintId);
    return res.json(await getBurndown(sprintId)).status(200);
  }),
);

router.get(
  "/extra",
  handle(async function (_, res) {
    res.json(await getExtraData()).status(200);
  }),
);

router.get(
  "/time-entries",
  handle(async function (req, res) {
    const input = DateRange.parse({
      start: req.query.start,
      end: req.query.end,
    });
    res.json(await getTimeEntriesInRange(input.start, input.end)).status(200);
  }),
);

const fields = Router({ mergeParams: true });
router.use(
  "/fields/:session/:dueDate",
  function (req, res, next) {
    const dashboard = SelectedDashboard.parse({
      session: req.params.session,
      dueDate: req.params.dueDate,
    });
    res.locals.session = dashboard.session;
    res.locals.dueDate = dashboard.dueDate;
    next();
  },
  fields,
);

fields
  .route("/")
  .get(
    handle<SelectedDashboard>(async function (_, res) {
      const { session, dueDate } = res.locals;
      if (await existsFields(session, dueDate)) {
        res.sendStatus(200);
      } else {
        res.status(400).send(`could not find '${session}-${dueDate}'`);
      }
    }),
  )
  .post(
    handle<SelectedDashboard>(async function (_, res) {
      const { session, dueDate } = res.locals;
      await copyPreviousFields(session, dueDate);
      res.sendStatus(200);
    }),
  );

fields
  .route("/footer")
  .get(
    handle<SelectedDashboard>(async function (_, res) {
      const date = await findField(res.locals, (fields) => fields.meeting.date);
      res.status(200).send(date);
    }),
  )
  .post(
    handle<SelectedDashboard>(async function (req, res) {
      await editFields(res.locals, (original) => {
        original.meeting.date = z.string().parse(req.body);
        return original;
      });
      res.sendStatus(200);
    }),
  );

fields.route("/sprint").get(
  handle<SelectedDashboard>(async function (_, res) {
    const id = await findField(res.locals, (fields) => fields.sprint.id);
    res.status(200).send(id);
  }),
);

export { router };

