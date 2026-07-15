export default {
  "**/!(package).json": "pnpm oxfmt",
  "**/*.{js,mjs,ts,tsx}": () => "pnpm run precommit",
  "package.json": () => "sort-package-json",
};
