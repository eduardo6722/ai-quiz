# UI shell contract (Phase 0)

Single route: `/`. No `/quiz`, `/quiz/[id]`, or results routes.

## Purpose

Prove shared design foundations. Not a quiz product screen.

## Copy

- Language: English only.
- Must include a serif/display page title and a short supporting sentence that this is the local AI Quiz Generator workspace (status/placeholder, not “Generate quiz”).
- Primary control label example: a non-quiz action such as “View API health” (link or button to `NEXT_PUBLIC_API_URL/health`) or an inert “Continue” that does not submit a quiz.

## Visual

Tokens from `.agents/skills/design-system/SKILL.md`, installed once in `@ai-quiz/ui`:

| Token | Hex | Use on `/` |
| ----- | --- | ---------- |
| `background` | `#F7FBF7` | Page canvas |
| `card` | `#FFFFFF` | Main card |
| `primary` | `#23624B` | Primary button / focus |
| `primary-foreground` | `#FFFFFF` | Button label |
| `foreground` | `#173F32` | Title and body |
| `muted-foreground` | `#53695D` | Supporting text |
| `border` | `#D4E6D8` | Card border |

Primitives required: `PageShell`, `Card`, `Button` from `@ai-quiz/ui`. No quiz `RadioGroup`, `Checkbox` option lists, or `Progress`.

## Accessibility (this shell)

- Readable at ~320px and desktop; no horizontal scroll.
- Primary control minimum 44px height.
- Visible focus ring (`ring`).
- Decorative art optional and `aria-hidden` if present.

## Tests

Jest + React Testing Library: render `/` (or the page component), assert English heading text and presence of a button/link. Do not assert quiz fields.
