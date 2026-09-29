import { Injectable } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

@Injectable()
export class StorageService {
  root() {
    return join(process.cwd(), "uploads");
  }

  assertMime(mimeType: string) {
    if (!ALLOWED.has(mimeType)) {
      throw new Error("Upload a photo (JPEG, PNG, WebP) or a PDF");
    }
  }

  async save(organisationId: string, id: string, buffer: Buffer) {
    const dir = join(this.root(), organisationId);
    await mkdir(dir, { recursive: true });
    const storagePath = join(organisationId, id);
    await writeFile(join(this.root(), storagePath), buffer);
    return storagePath;
  }

  async read(storagePath: string) {
    return readFile(join(this.root(), storagePath));
  }
}
