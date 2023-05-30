import { createServer } from "http";
import { getUsers } from "./api/get-users";
import "./env";

const port = 16987 || process.env.PORT;

async function getData(path: string) {
  switch (path) {
    case "/":
      return "Server is running";
    case "/users":
      return getUsers();
    default:
      throw new Error("Request not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json");
    const data = await getData(req.url ?? "");
    res.writeHead(200);
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(400);
    if (typeof err === "object" && err instanceof Error) {
      res.end(err.name);
    } else {
      res.end("Unknown error");
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
