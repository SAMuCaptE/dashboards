import { Problem, Risk, Session } from "common";
import { Router } from "express";
import { IRoute } from "express-serve-static-core";
import { z } from "zod";

import { getBurndown } from "./api/burndown";
import { getEpics } from "./api/epics";
import { getExtraData } from "./api/extraData";
import {
    Fields,
    copyPreviousFields,
    editFields,
    existsFields,
    findField,
} from "./api/fields";
import { getBudget } from "./api/money";
import { getTask, getTasks, syncTasks } from "./api/tasks";
import {
    addTimeEntry,
    completeTimeEntry,
    getOngoingTimeEntry,
    getTimeEntriesInRange,
} from "./api/time-entries";
import { getUsers } from "./api/users";
import { getWorkedHours } from "./api/worked-hours";
import { bugnet } from "./middlewares/bugnet";
import { cache, cached, clearCache } from "./middlewares/cache";

const SelectedDashboard = z.object({ session: Session, dueDate: z.string() });
type SelectedDashboard = z.infer<typeof SelectedDashboard>;

const DateRange = z.object({
  start: z.string().transform((str) => new Date(parseInt(str))),
  end: z.string().transform((str) => new Date(parseInt(str))),
});

const router = Router();

router.get("/health", function (_, res) {
  res.sendStatus(200);
});

router
  .route("/cache")
  .get(function (_, res) {
    res.json(cached).status(200);
  })
  .delete(function (_, res) {
    clearCache();
    res.sendStatus(200);
  });

router.get(
  "/users",
  bugnet(
    cache(async function (_, res) {
      res.json(await getUsers()).status(200);
    }),
  ),
);

router.get(
  "/hours",
  bugnet(
    cache(
      async function (req, res) {
        const input = DateRange.parse({
          start: req.query.start,
          end: req.query.end,
        });

        res.json(await getWorkedHours(input.start, input.end)).status(200);
      },
      { dependsOn: (req) => [req.query.start, req.query.end] },
    ),
  ),
);

router.get(
  "/budget",
  bugnet(
    cache(async function (_, res) {
      return res.json(getBudget()).status(200);
    }),
  ),
);

router.get(
  "/tasks/:id",
  bugnet(
    cache(
      async function (req, res) {
        const taskId = req.params.id;
        z.string().parse(taskId);
        res.json(await getTask(taskId)).status(200);
      },
      { dependsOn: (req) => [req.params.id] },
    ),
  ),
);

router.get(
  "/tasks",
  bugnet(
    cache(
      async function (req, res) {
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
      },
      {
        dependsOn: (req) => [
          req.query.session,
          req.query.dueDate,
          req.query.listId,
          fieldsIteration,
        ],
      },
    ),
  ),
);

router.get(
  "/epics",
  bugnet(
    cache(
      async function (req, res) {
        const session = Session.parse(req.query.session);
        res.json(await getEpics(session, null)).status(200);
      },
      { dependsOn: (req) => [req.query.session] },
    ),
  ),
);

router.get(
  "/burndown",
  bugnet(
    cache(
      async function (req, res) {
        const sprintId = z.string().parse(req.query.sprintId);
        return res.json(await getBurndown(sprintId)).status(200);
      },
      { dependsOn: (req) => [req.query.sprintId] },
    ),
  ),
);

router.get(
  "/extra",
  bugnet(
    cache(async function (_, res) {
      const data = await getExtraData();
      res.json(data.workedHours).status(200);
    }),
  ),
);

router.get(
  "/time-entries/ongoing",
  bugnet(async function (req, res) {
    const userId = z.string().parse(req.query.userId);
    res.json(await getOngoingTimeEntry(userId)).status(200);
  }),
);

router.get(
  "/time-entries",
  bugnet(
    cache(
      async function (req, res) {
        const input = DateRange.parse({
          start: req.query.start,
          end: req.query.end,
        });
        res
          .json(await getTimeEntriesInRange(input.start, input.end))
          .status(200);
      },
      { dependsOn: (req) => [req.query.start, req.query.end] },
    ),
  ),
);

router.post(
  "/time-entries",
  bugnet(async function (req, res) {
    const payload = z
      .object({
        userId: z.string(),
        taskId: z.string(),
        start: z.number().transform((num) => new Date(num)),
        end: z
          .number()
          .transform((num) => new Date(num))
          .optional(),
      })
      .parse(req.body);

    const timeEntry = await addTimeEntry(
      payload.userId,
      payload.taskId,
      payload.start,
      payload.end,
    );
    res.json(timeEntry).status(200);
  }),
);

router.put(
  "/time-entries/:ongoingId",
  bugnet(async function (req, res) {
    const payload = z
      .object({
        userId: z.string(),
        id: z.coerce.number(),
        end: z.number().transform((num) => new Date(num)),
      })
      .parse({
        id: req.params.ongoingId,
        userId: req.body.userId,
        end: req.body.end,
      });
    const timeEntry = await completeTimeEntry(
      payload.userId,
      payload.id,
      payload.end,
    );
    res.json(timeEntry).status(200);
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
    bugnet(
      cache<SelectedDashboard>(
        async function (_, res) {
          const { session, dueDate } = res.locals;
          if (await existsFields(session, dueDate)) {
            res.sendStatus(200);
          } else {
            res.status(400).send(`could not find '${session}-${dueDate}'`);
          }
        },
        {
          dependsOn: (_, res) => [
            res.locals.session,
            res.locals.dueDate,
            fieldsIteration,
          ],
        },
      ),
    ),
  )
  .post(
    bugnet(async function (_, res) {
      const { session, dueDate } = res.locals;
      await copyPreviousFields(session, dueDate);
      invalidateFields();
      res.sendStatus(200);
    }),
  );

fields
  .route("/footer")
  .get(
    bugnet(
      cache<SelectedDashboard>(
        async function (_, res) {
          const date = await findField(
            res.locals,
            (fields) => fields.meeting.date,
          );
          res.status(200).send(date);
        },
        {
          dependsOn: (_, res) => [
            res.locals.session,
            res.locals.dueDate,
            fieldsIteration,
          ],
        },
      ),
    ),
  )
  .post(
    bugnet<SelectedDashboard>(async function (req, res) {
      await editFields(res.locals, (original) => {
        original.meeting.date = z.string().parse(req.body);
        return original;
      });
      invalidateFields();
      res.sendStatus(200);
    }),
  );

fields
  .route("/sprint")
  .get(
    bugnet(
      cache<SelectedDashboard>(
        async function (_, res) {
          const id = await findField(res.locals, (fields) => fields.sprint.id);
          res.status(200).send(id);
        },
        {
          dependsOn: (_, res) => [
            res.locals.session,
            res.locals.dueDate,
            fieldsIteration,
          ],
        },
      ),
    ),
  )
  .post(
    bugnet<SelectedDashboard>(async function (req, res) {
      const id = z.string().parse(req.body);
      await editFields(res.locals, (original) => {
        original.sprint.id = id;
        return original;
      });
      invalidateFields();
      res.sendStatus(200);
    }),
  );

crud(
  fields.route("/sprint/problems"),
  Problem,
  (fields) => fields.sprint.problems,
  (a, b) => a.taskId === b.taskId && a.description === b.description,
);

fields
  .route("/members")
  .get(
    bugnet<SelectedDashboard>(async function (_, res) {
      const members = await findField(res.locals, (fields) => fields.members);
      res.status(200).send(members);
    }),
  )
  .post(
    bugnet<SelectedDashboard>(async function (req, res) {
      const input = z
        .object({
          memberIndex: z.number().int(),
          selected: z.enum(["lastWeek", "nextWeek"]),
          disponibility: z.coerce.number().int().min(1).max(6),
        })
        .parse(req.body);

      await editFields(res.locals, (original) => {
        original.members[input.memberIndex].disponibility[input.selected] =
          input.disponibility;
        return original;
      });
      res.sendStatus(200);
    }),
  );

fields
  .route("/risks")
  .get(
    bugnet<SelectedDashboard>(async function (_, res) {
      const risks = await findField(res.locals, (fields) => fields.risks);
      res.status(200).json(risks);
    }),
  )
  .put(
    bugnet<SelectedDashboard>(async function (req, res) {
      const risk = Risk.parse(req.body);
      await editFields(res.locals, (original) => {
        original.risks.push(risk);
        return original;
      });
      res.sendStatus(200);
    }),
  )
  .post(
    bugnet<SelectedDashboard>(async function (req, res) {
      const input = z.object({ original: Risk, updated: Risk }).parse(req.body);
      await editFields(res.locals, (original) => {
        const index = original.risks.findIndex(
          (r) => r.description === input.original.description,
        );
        original.risks[index] = input.updated;
        return original;
      });
      res.sendStatus(200);
    }),
  )
  .delete(
    bugnet<SelectedDashboard>(async function (req, res) {
      const risk = Risk.parse(req.body);
      await editFields(res.locals, (original) => {
        original.risks = original.risks.filter(
          (r) => r.description !== risk.description,
        );
        return original;
      });
      res.sendStatus(200);
    }),
  );

fields.route("/objectives").get(
  bugnet<SelectedDashboard>(async function (_, res) {
    const objectives = await findField(res.locals, (fields) => ({
      sprint: fields.sprint.objective,
      session:
        fields.sessions[res.locals.session]?.objective ?? "Aucun objectif",
    }));
    res.json(objectives).status(200);
  }),
);

fields.route("/objectives/sprint").post(
  bugnet<SelectedDashboard>(async function (req, res) {
    const objective = z.string().parse(req.body);
    await editFields(res.locals, (original) => {
      original.sprint.objective = objective;
      return original;
    });
    res.sendStatus(200);
  }),
);

function crud<R extends string, G>(
  route: IRoute<R>,
  schema: z.Schema,
  selector: (fields: Fields) => G[],
  comparator: (a: G, b: G) => boolean,
) {
  route
    .get(
      bugnet(
        cache<SelectedDashboard>(
          async function (_, res) {
            const selection = await findField(res.locals, selector);
            res.json(selection).status(200);
          },
          {
            dependsOn: (_, req) => [
              req.locals.session,
              req.locals.dueDate,
              fieldsIteration,
            ],
          },
        ),
      ),
    )
    .put(
      bugnet<SelectedDashboard>(async function (req, res) {
        const insertion = schema.parse(req.body);
        await editFields(res.locals, (fields) => {
          selector(fields).push(insertion);
          return fields;
        });
        invalidateFields();
        res.sendStatus(200);
      }),
    )
    .post(
      bugnet<SelectedDashboard>(async function (req, res) {
        const input = z
          .object({ original: schema, updated: schema })
          .parse(req.body);
        await editFields(res.locals, (fields) => {
          const selection = selector(fields);
          const index = selection.findIndex((element) =>
            comparator(element, input.original),
          );
          selection[index] = input.updated;
          return fields;
        });
        invalidateFields();
        res.sendStatus(200);
      }),
    )
    .delete(
      bugnet<SelectedDashboard>(async function (req, res) {
        const input = schema.parse(req.body);
        await editFields(res.locals, (fields) => {
          const selection = selector(fields);
          const index = selection.findIndex((element) =>
            comparator(element, input),
          );
          selection.splice(index, 1);
          return fields;
        });
        invalidateFields();
        res.sendStatus(200);
      }),
    );
}

crud(
  fields.route("/daily"),
  z.string(),
  (fields) => fields.meeting.agenda.items,
  (a, b) => a === b,
);
crud(
  fields.route("/technical"),
  z.string(),
  (fields) => fields.meeting.technical.items,
  (a, b) => a === b,
);

// This is used to track when to invalidate the cache
let fieldsIteration = 0;
function invalidateFields() {
  fieldsIteration++;
}

export { router };

