import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";

const merged = { s6: {}, s7: {}, s8: {} };

for (const key of Object.keys(merged)) {
  const root = path.join(process.cwd(), key);
  if (!existsSync(root)) {
    continue;
  }

  const contents = readdirSync(root, { withFileTypes: true, recursive: true });
  for (const entry of contents) {
    const filepath = path.join(root, entry.name, "data.json");
    const file = readFileSync(filepath, "utf-8");
    merged[key][entry.name] = JSON.parse(file);
  }
}

writeFileSync("merged.json", JSON.stringify(merged), "utf-8");
