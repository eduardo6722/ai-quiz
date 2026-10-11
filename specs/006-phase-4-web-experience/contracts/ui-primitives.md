# Shared UI primitives (Phase 4)

All new controls live in `@ai-quiz/ui` and use semantic Tailwind tokens. Do not add CSS Modules, a second component library, or Radix unless a primitive cannot meet accessibility with native HTML (none of the list below requires Radix).

## Already shipped (reuse)

`PageShell`, `Card` (+ header/title/description/content), `Button`, `cn`

`Button` already has `min-h-11`, primary forest green, white label, visible `ring`.

## Add this cycle

| Primitive | Role |
| --------- | ---- |
| `Input` | Topic and URL; `min-h-11 rounded-xl`; `aria-invalid` |
| `Label` | `text-sm font-medium`; `htmlFor` required in usage |
| `FormField` | Label + control + optional hint/error (`role="alert"` on error) |
| `RadioGroup` / item | Native radios for `single`; labeled option row |
| `Checkbox` | Native checkbox for `multiple`; labeled option row |
| `Progress` | `role="progressbar"`; track `sage`; value is step completeness |
| `Alert` | Error/info; `destructive` or default; not for answer keys |
| `Badge` | `Correct` / `Incorrect` text companion (with icon in the feature) |
| `Skeleton` | Generating placeholders; `sage`; no flashing |

## Option row visual states

From the design-system recipes:

- Idle: `border-border bg-card`
- Selected (pre-submit): `border-primary bg-mint` — **not** success/danger
- Disabled: `opacity-60`
- Entire row is the label; control remains in the accessibility tree

## Forbidden

- Encoding correctness by color before submit
- Hex colors in JSX (use tokens)
- `outline-none` without `focus-visible:ring-*`
- Interpolated class names like `` `bg-${tone}` ``
