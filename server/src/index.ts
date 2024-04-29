import cors from "cors";
import express from "express";
import "./env";

import bodyParser from "body-parser";
import { router } from "./router";

const port = process.env.PORT || 16987;

const app = express();
app.use(bodyParser.text());
app.use(bodyParser.json());
app.use(cors());
app.use(router);

app.listen(port, () => console.log(`Server is running on port ${port}`));
