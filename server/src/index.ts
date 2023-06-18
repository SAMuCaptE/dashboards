import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import "./env";
import { appRouter } from "./trpc";

const port = 16987 || process.env.PORT;

const server = createHTTPServer({ router: appRouter, middleware: cors() });
const response = server.listen(port);
console.log(`Server is running on port ${response.port}`);
