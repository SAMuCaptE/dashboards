import { initTRPC } from "@trpc/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { mergeDeep } from "../utils";

const RiskSchema = z.object({
  description: z.string(),
  mitigation: z.string(),
  gravity: z.number().min(1),
  ticketUrl: z.string().url().optional(),
});

const schema = z.object({
  sessions: z.record(
    z.enum(["s6", "s7", "s8"]),
    z.object({
      objective: z.array(z.string()),
    })
  ),
  members: z.array(
    z.object({
      img: z.string(),
      firstname: z.string(),
      lastname: z.string(),
      role: z.string(),
      disponibility: z.object({
        lastWeek: z.number().min(1).max(5),
        nextWeek: z.number().min(1).max(5),
      }),
    })
  ),
  meeting: z.object({
    date: z.string(),
    agenda: z.object({
      items: z.array(z.string()),
    }),
    technical: z.object({
      items: z.array(z.string()),
    }),
  }),
  risks: z.array(RiskSchema),
  sprint: z.object({
    id: z.string(),
    objective: z.string(),
    problems: z.array(
      z.object({
        taskId: z.string(),
        description: z.string(),
      })
    ),
  }),
});

export type Fields = z.infer<typeof schema>;

const SelectedDashboard = z.object({
  dueDate: z.date(),
  session: z.enum(["s6", "s7", "s8"]),
});

const getDefaults = () => {
  const response = readFileSync(
    join(process.cwd(), "..", "fields", "defaults.json"),
    "utf-8"
  );
  return JSON.parse(response);
};

const getFields = (session: string, dueDate: Date): Fields => {
  const date = dueDate.toLocaleDateString("fr-CA");
  const response = readFileSync(
    join(process.cwd(), "..", "fields", session, date, "data.json"),
    "utf-8"
  );
  return JSON.parse(response);
};

function editFields(
  { dueDate, session }: z.infer<typeof SelectedDashboard>,
  modify: (original: Fields) => Fields
) {
  const fields = getFields(session, dueDate);
  const modifiedFields = modify(fields);

  const filePath = join(
    process.cwd(),
    "..",
    "fields",
    session,
    dueDate.toLocaleDateString("fr-CA"),
    "data.json"
  );
  writeFileSync(filePath, JSON.stringify(modifiedFields), "utf-8");
}

export function makeFieldsRouter(t: ReturnType<(typeof initTRPC)["create"]>) {
  return t.router({
    get: t.procedure
      .input(
        z.object({ dueDate: z.date(), session: z.enum(["s6", "s7", "s8"]) })
      )
      .output(
        z
          .object({
            success: z.literal(true),
            data: schema,
          })
          .or(
            z.object({
              success: z.literal(false),
              error: z.string().or(z.array(z.any())),
            })
          )
      )
      .query(async ({ input }) => {
        try {
          const defaults = getDefaults();
          const data = getFields(input.session, input.dueDate);
          const result = schema.safeParse(mergeDeep(defaults, data));

          return result.success
            ? { success: true, data: result.data }
            : { success: false, error: JSON.parse(result.error.message) };
        } catch (err) {
          return {
            success: false,
            error:
              "Could not find " +
              input.session +
              "/" +
              input.dueDate.toLocaleDateString("fr-CA"),
          };
        }
      }),

    date: t.router({
      edit: t.procedure
        .input(SelectedDashboard.and(z.object({ date: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.date = input.date;
            return original;
          })
        ),
    }),

    daily: t.router({
      add: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.agenda.items.push(input.objective);
            return original;
          })
        ),
      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ target: z.string(), updated: z.string() })
          )
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            const targetIndex = original.meeting.agenda.items.findIndex(
              (item) => item === input.target
            );
            original.meeting.agenda.items[targetIndex] = input.updated;
            return original;
          })
        ),
      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.agenda.items =
              original.meeting.agenda.items.filter(
                (item) => item !== input.objective
              );
            return original;
          })
        ),
    }),

    technical: t.router({
      add: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.technical.items.push(input.objective);
            return original;
          })
        ),
      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ target: z.string(), updated: z.string() })
          )
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            const targetIndex = original.meeting.technical.items.findIndex(
              (item) => item === input.target
            );
            original.meeting.technical.items[targetIndex] = input.updated;
            return original;
          })
        ),
      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.technical.items =
              original.meeting.technical.items.filter(
                (item) => item !== input.objective
              );
            return original;
          })
        ),
    }),

    disponibilities: t.router({
      edit: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({
              selected: z.enum(["lastWeek", "nextWeek"]),
              memberIndex: z.number().int(),
              disponibility: z.number().int().min(1).max(5),
            })
          )
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.members[input.memberIndex].disponibility[input.selected] =
              input.disponibility;
            return original;
          })
        ),
    }),

    risks: t.router({
      add: t.procedure
        .input(SelectedDashboard.and(z.object({ risk: RiskSchema })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.risks.push(input.risk);
            return original;
          })
        ),

      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ originalRisk: RiskSchema, updatedRisk: RiskSchema })
          )
        )
        .mutation(async ({ input }) =>
          editFields(input, (original) => {
            const riskIndex = original.risks.findIndex(
              (risk) => risk.description === input.originalRisk.description
            );
            original.risks[riskIndex] = input.updatedRisk;
            return original;
          })
        ),

      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ risk: RiskSchema })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.risks = original.risks.filter(
              (risk) => risk.description !== input.risk.description
            );
            return original;
          })
        ),
    }),
  });
}