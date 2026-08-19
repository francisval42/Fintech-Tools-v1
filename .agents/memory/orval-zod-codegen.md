---
name: Orval + zod codegen quirks
description: Pitfalls when regenerating the API client/zod schemas from lib/api-spec/openapi.yaml in this monorepo
---

# Orval + zod codegen quirks

**Rule:** In `lib/api-spec/openapi.yaml`, use `type: number` (not `type: integer`) for numeric fields.

**Why:** The orval version here emits `zod.int()` for `type: integer`, which only exists in zod v4 — the workspace pins zod 3.25, so codegen output fails typecheck/runtime. `type: number` generates plain `zod.number()` and works.

**How to apply:** Any time an endpoint schema needs an integer (ids, sort orders, counts), declare it `type: number` in the OpenAPI spec and enforce integer-ness in the route handler if it matters. Also note: `artifacts/api-server` is esbuild-bundled without zod as a direct dependency — route files must use the generated schemas' `safeParse` and cannot `import { ZodError } from 'zod'`.
