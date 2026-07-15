import { access, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDirectory = resolve("dist");
const indexPage = resolve(distDirectory, "index.html");
const notFoundPage = resolve(distDirectory, "404.html");

await access(indexPage);
await copyFile(indexPage, notFoundPage);
