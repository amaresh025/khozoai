import { createServerFn } from "@tanstack/react-start";

export const classifyExistingTools = createServerFn({ method: "POST" }).handler(async () => {
  return {
    total: 0,
    classified: 0,
    skipped: 0,
    results: [],
  };
});
