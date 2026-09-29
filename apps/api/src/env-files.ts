import { existsSync } from "node:fs";
import { join } from "node:path";

export function apiEnvFilePaths() {
  const candidates = [
    join(__dirname, "..", ".env"),
    join(process.cwd(), ".env"),
    join(process.cwd(), "apps/api/.env"),
  ];
  return [...new Set(candidates.filter((file) => existsSync(file)))];
}
