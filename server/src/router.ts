import { Problem, Risk } from "common";
import { Router } from "express";
import { IRoute } from "express-serve-static-core";
import { z } from "zod";

import { getBurndown } from "./api/burndown";
import { getEpics } from "./api/epics";
import { getExtraData } from "./api/extraData";
import {
  Fields,
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
import { cache, cached, clearCache } from "./cache";
import { handle } from "./utils";

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
  handle(
    cache(async function (_, res) {
      res.json(await getUsers()).status(200);
    }),
  ),
);

router.get(
  "/hours",
  handle(
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
  handle(
    cache(async function (_, res) {
      return res.json(getBudget()).status(200);
    }),
  ),
);

router.get(
  "/tasks",
  handle(
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
  handle(
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
  handle(
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
  handle(
    cache(async function (_, res) {
      res.json(await getExtraData()).status(200);
    }),
  ),
);

router.get(
  "/time-entries",
  handle(
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
    handle(
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
    handle(async function (_, res) {
      const { session, dueDate } = res.locals;
      await copyPreviousFields(session, dueDate);
      invalidateFields();
      res.sendStatus(200);
    }),
  );

fields
  .route("/footer")
  .get(
    handle(
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
    handle<SelectedDashboard>(async function (req, res) {
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
    handle(
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
    handle<SelectedDashboard>(async function (req, res) {
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
    handle<SelectedDashboard>(async function (_, res) {
      const members = await findField(res.locals, (fields) => fields.members);
      res.status(200).send(members);
    }),
  )
  .post(
    handle<SelectedDashboard>(async function (req, res) {
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
    handle<SelectedDashboard>(async function (_, res) {
      const risks = await findField(res.locals, (fields) => fields.risks);
      res.status(200).json(risks);
    }),
  )
  .put(
    handle<SelectedDashboard>(async function (req, res) {
      const risk = Risk.parse(req.body);
      await editFields(res.locals, (original) => {
        original.risks.push(risk);
        return original;
      });
      res.sendStatus(200);
    }),
  )
  .post(
    handle<SelectedDashboard>(async function (req, res) {
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
    handle<SelectedDashboard>(async function (req, res) {
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
  handle<SelectedDashboard>(async function (_, res) {
    const objectives = await findField(res.locals, (fields) => ({
      sprint: fields.sprint.objective,
      session:
        fields.sessions[res.locals.session]?.objective ?? "Aucun objectif",
    }));
    res.json(objectives).status(200);
  }),
);

fields.route("/objectives/sprint").post(
  handle<SelectedDashboard>(async function (req, res) {
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
      handle(
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
      handle<SelectedDashboard>(async function (req, res) {
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
      handle<SelectedDashboard>(async function (req, res) {
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
      handle<SelectedDashboard>(async function (req, res) {
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

let fieldsIteration = 0; // This is used to track when to invalidate the cache
function invalidateFields() {
  fieldsIteration++;
}

export { router };
