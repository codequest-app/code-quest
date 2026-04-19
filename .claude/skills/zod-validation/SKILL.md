---
name: zod-validation
description: >
  Zod v4 schema validation patterns and integration with Drizzle ORM and React Hook Form.
  Use when creating or modifying Zod schemas, adding validation logic, using zodResolver,
  or migrating from Zod v3 to v4.
---

# Zod v4 Validation Reference

## v4 vs v3 Key Differences (IMPORTANT)

| Area | v3 | v4 |
|---|---|---|
| Error params | `message`, `invalid_type_error`, `required_error` | Single `error` param |
| Native enum | `z.nativeEnum(Enum)` | `z.enum(Enum)` (absorbed) |
| Strict object | `.strict()` | `z.strictObject({})` or `.strict()` (both work) |
| Passthrough | `.passthrough()` | `z.looseObject({})` or `.passthrough()` (both work) |
| Deep partial | `.deepPartial()` | Removed — use nested `.optional()` |
| Type generics | `ZodType<O, D, I>` (3 params) | `ZodType<O, I>` (2 params) |
| Infinite numbers | Passed `z.number()` | Now rejected |
| `_def` internal | `schema._def` | `schema._zod.def` |

## Type Inference

```ts
const Schema = z.object({ name: z.string(), age: z.number().optional() });

type Input  = z.input<typeof Schema>;   // before coercion/transform
type Output = z.output<typeof Schema>;  // after coercion/transform (same as z.infer)
type T      = z.infer<typeof Schema>;   // alias for z.output
```

Use `z.input` for form data (raw), `z.output` / `z.infer` for processed data.

## Parse Patterns

```ts
// Throws ZodError on failure
const data = Schema.parse(input);

// Safe — always returns, never throws
const result = Schema.safeParse(input);
if (result.success) {
  result.data;   // typed output
} else {
  result.error;  // ZodError (NOTE: ZodError no longer extends Error in v4)
}
```

Prefer `safeParse` in request handlers and form submission paths.

## Custom Error Messages (v4 API)

```ts
// v4: use `error` param (NOT message/invalid_type_error/required_error)
z.string({ error: "Name is required" })
z.string().min(3, { error: "Too short" })

// Error map function
z.string({ error: (issue) => issue.input === undefined ? "Required" : "Invalid" })
```

## Schema Composition

```ts
// Extend / merge
const Base = z.object({ id: z.string() });
const Extended = Base.extend({ name: z.string() });

// Pick / Omit
const Partial = Extended.pick({ name: true });

// Discriminated union (preferred over z.union for objects)
const Event = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keydown"), key: z.string() }),
]);
```

## drizzle-zod Integration

Requires `drizzle-zod >= 0.8.0` which supports Zod v4.

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema";

const InsertUser = createInsertSchema(users, {
  email: z.string().email(),       // override specific fields
});
const SelectUser = createSelectSchema(users);

type NewUser = z.infer<typeof InsertUser>;
```

## React Hook Form Integration

Requires `@hookform/resolvers` with Zod v4 support (check latest release notes for type compatibility).

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm<z.infer<typeof FormSchema>>({
  resolver: zodResolver(FormSchema),
  defaultValues: { email: "", password: "" },
});
```

If type errors occur with resolver assignment, ensure `@hookform/resolvers` version supports Zod v4's updated `ZodType<O, I>` generics.

## Object Key Handling (v4)

`z.object()` **strips** unknown keys by default (same as v3). Three modes:

```ts
// Strips unknown keys (default)
z.object({ a: z.string() }).parse({ a: "x", b: "y" })
// → { a: "x" }

// Preserves unknown keys — use when parsing external data with extra fields
z.looseObject({ a: z.string() }).parse({ a: "x", b: "y" })
// → { a: "x", b: "y" }
// Equivalent: z.object({ a: z.string() }).passthrough()

// Rejects unknown keys
z.strictObject({ a: z.string() }).parse({ a: "x", b: "y" })
// → throws ZodError
// Equivalent: z.object({ a: z.string() }).strict()
```

**IMPORTANT**: `.passthrough()` is NOT a no-op in v4. Removing it changes behavior.
Nested objects need their own `.passthrough()` / `z.looseObject()` — it does not propagate.

When to use which:
- `z.object()` — internal data, form inputs, known shapes
- `z.looseObject()` / `.passthrough()` — external data (CLI output, API responses) where you validate known fields but must preserve unknown ones for downstream consumers

## Common Pitfalls

- Do NOT use `invalid_type_error` / `required_error` — these are v3 only; use `error` in v4.
- Do NOT use `.deepPartial()` — removed in v4; apply `.optional()` per field.
- Do NOT use `z.nativeEnum()` — use `z.enum()` instead.
- `ZodError` no longer extends `Error` — avoid `instanceof Error` checks on ZodError.
- Infinite numbers (`Infinity`) now fail `z.number()` — use `z.number().finite(false)` if needed.
- Internal `._def` access patterns must change to `._zod.def`.
- Do NOT remove `.passthrough()` assuming it's a no-op — `z.object()` strips unknown keys in v4.
