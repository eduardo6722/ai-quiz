---
name: design-system
description: Apply the AI Quiz Generator's warm, botanical, light-green UI design system when creating or changing pages, forms, quiz questions, results, illustrations, or shared components in apps/web and packages/ui. Adapted from Encomenda.link's cream-and-green art direction for an English-language educational product.
---

# AI Quiz Generator — Design System

## Mission

Make every screen feel like part of one **calm, friendly, considered learning experience**. Adapt the visual principles of Encomenda.link—warm editorial hierarchy, green actions, cream surfaces, soft sage panels and restrained leaf motifs—without copying its brand or commerce vocabulary.

**Primary mood:** light green, fresh, welcoming, quietly professional. **Primary job:** make generating and completing quizzes effortless, fast and accessible. All product copy should be in **clear English**.

Before any UI changes, read [Art direction](references/art-direction.md). For implementation patterns, read [Tailwind recipes](references/tailwind-recipes.md). This file owns visual tokens and invariant rules; the art guide owns composition and illustration decisions; recipes own code examples. Keep guidance in its owning file rather than duplicating it.

## Read the implementation first

Review the relevant source before changing visuals. After the scaffold exists, typical entry points are:

- `apps/web/src/app/globals.css` — global Tailwind v4 / shadcn theme and browser-level base rules.
- `apps/web/src/app/page.tsx` — quiz-generation landing/setup.
- `apps/web/src/app/quiz/[quizId]/page.tsx` — quiz player and progress.
- `apps/web/src/app/quiz/[quizId]/results/page.tsx` — completion state and score.
- `apps/web/src/features/quiz/{setup,player,results,layout}/` — feature composition; keep route files thin.
- `packages/ui/src/components/` — shadcn/ui primitives, variants, helper `cn`, shared tokens.

Place new UI in those feature slices (or a new `features/<feature>/` folder). See `.agents/skills/folder-architecture/SKILL.md`. Do not dump screens into `packages/ui`.

## Implementation rules (non-negotiable)

1. Use **Tailwind utility classes** in `className`; prefer semantic tokens such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-mint`.
2. Use shadcn/ui source components in `packages/ui`; improve shared variants instead of scattering per-page overrides. Reuse `Button`, `Input`, `Card`, `FormField`, `RadioGroup`, `Checkbox`, `Progress`, `Alert`, `Badge`, `Skeleton`, and `Dialog` only where they improve usability.
3. Use `cn()` for conditional classes. Build variants from **literal utility maps**, never dynamically interpolate Tailwind class names like `` `bg-${tone}` ``.
4. Do **not** introduce CSS Modules, styled-components, a second design-system library, or component-scoped `@apply` recipes. Shared CSS is for imports, tokens, browser/accessibility defaults and deliberate global foundations.
5. Install design tokens **once** and expose them to web/shadcn and shared UI. Do not duplicate values across apps or packages.
6. Keep `font-sans` for body/forms/data, and reserve `font-display` serif for editorial headings. Avoid per-page font downloads or styling dependencies.
7. Make light green the dominant personality; use dark green for focus, CTAs and strong text. **Never** use pale green buttons with low-contrast pale text.
8. The four answer options are the functional focal point; do not sacrifice clarity to decorations.
9. Never encode correctness by color alone: pair with text and icon. Before submission, options must not imply which answer is correct.
10. Prefer functional UI to visual flourishes; no auto-playing animations, unreadable gradients or excessive card shadows.

## Semantic palette

| Token | Hex | Role |
| --- | --- | --- |
| `background` | `#F7FBF7` | App canvas; an almost-white green tint |
| `card` / `surface` | `#FFFFFF` | Primary cards, quiz body, input surfaces |
| `cream` | `#FBF8F1` | Warm editorial separators and supporting panels |
| `primary` | `#23624B` | CTA, active choices, progress and keyboard focus |
| `primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `mint` | `#DFF2E4` | Light-green highlights and illustration fills |
| `sage` | `#EAF3E9` | Calm information panels and icon backgrounds |
| `foreground` / `ink` | `#173F32` | Main text and headings |
| `muted-foreground` | `#53695D` | Secondary/help text |
| `border` | `#D4E6D8` | Inputs, cards, separators |
| `leaf` | `#567D58` | Small leaf illustrations / italic emphasis |
| `success` | `#27734E` | Correct/submitted states; always with a text label |
| `danger` / `destructive` | `#A53D33` | Invalid input / wrong-answer feedback |
| `warning` | `#A66518` | Carefully used warnings, with readable labels |
| `ring` | `#388568` | Keyboard focus ring |

### Palette guidance

- Predominantly `background`, `card`, `sage`, and `mint`; use `cream` sparingly to preserve warmth.
- On text-heavy screens, use `foreground`, not pale `leaf` or decorative accent colors.
- Borders are gentle but visible; decorative shadows are shallow (`shadow-sm`) and rare.
- Avoid pure-black canvases, purple/blue SaaS gradients, slate default colors, loud yellow, and assigning a different pastel to each question.
- Status semantics must combine readable text, appropriate iconography, and sufficient contrast. Target WCAG AA: **4.5:1** normal text and **3:1** large text, with visible focus.

## Typography

Use system/local stacks; no remote font request is necessary:

- `font-sans`: `'Avenir Next', 'Segoe UI', Arial, sans-serif` — navigation, body, options, forms, buttons.
- `font-display`: `'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif` — page titles and occasional reassuring editorial headings.

| Element | Tailwind baseline |
| --- | --- |
| Page title | `font-display text-[34px] font-normal leading-[1.15] tracking-tight sm:text-[40px] lg:text-[46px]` |
| Editorial panel heading | `font-display text-[26px] font-normal leading-tight tracking-tight sm:text-[30px]` |
| Quiz question | `text-xl font-semibold leading-snug sm:text-2xl` |
| Card heading | `text-lg font-semibold leading-snug` |
| Body and supporting instructions | `text-base leading-relaxed` |
| Option label / input text | `text-base leading-relaxed` |
| Form label | `text-sm font-medium` |
| Buttons | `text-base font-medium` |
| Help/error/progress caption | `text-sm leading-relaxed text-muted-foreground` |
| Decorative eyebrow | `text-xs font-semibold uppercase tracking-[0.12em]` |

**Font floors:** 16px for body and interactive content; 14px for labels, helper/error messages; 12px only for non-interactive decorative eyebrows. Never scale quiz cards using CSS zoom. Keep the serif font out of answers, tables and data values.

## Layout, rhythm and surfaces

- Start **mobile first**: `min-h-svh bg-background font-sans text-foreground antialiased`.
- General content max width: ~1150px; **quiz reading column** ~720px for reduced cognitive load.
- Page gutters: 16px phones, 24px tablets, 32px desktop.
- 4px spacing rhythm: `gap-2/3` within groups, `gap-5/6` across fields/cards, `gap-8/10` between sections.
- Cards: `rounded-2xl border border-border bg-card p-4 sm:p-6`; prefer no default shadow.
- Icon tiles: `size-10 rounded-xl bg-sage`, a consistent 18–20px icon.
- Controls: minimum **44px** touch height; `rounded-xl`; semantic focus ring and clear disabled states.
- Main CTA: primary forest-green background, white label, generous hit area; mobile full width when appropriate.
- Quiz options: stacked cards (avoid tiny radios or cramped multi-columns); 12–16px vertical gaps; entire option row clickable by label; explicit checkbox/radio affordance.
- Progress should describe both **current question** and **total questions**, not a progress bar alone.
- Results: show score first, then clear explanatory detail; do not overwhelm the completion moment with charts.

## Botanical visual language and artwork

Use **subtle editorial botanical art** inspired by Encomenda.link but original to the quiz product:

- A simple, line-drawn branch with rounded leaves; optional study symbols (open book, small check, question-card outline).
- Two tones maximum in any illustration: `leaf` outlines and `mint` / `sage` fill; warm cream behind only where useful.
- Calm asymmetry and generous negative space, thin rounded strokes; illustrations should feel hand-crafted, not corporate stock art.
- Use leaf motifs in **hero corners**, empty states and the **quiz completion** panel, not behind answer text or form controls.
- Prefer lightweight locally maintained inline SVG/component assets (accessible `aria-hidden` for purely decorative artwork). Do not import Encomenda.link trademarks, logos or screenshots.
- If you create an illustration, follow the precise composition guidance in [Art direction](references/art-direction.md).

## Core screens

1. **Quiz setup:** serif promise/title, succinct 1–2 sentence explanation, a compact card with topic and README URL, a single primary "Generate quiz" CTA, optional mini botanical illustration beside the hero on large screens.
2. **Generating:** skeleton/progress and reassuring microcopy; show source topic; give users a recoverable error and retry path.
3. **Quiz player:** high-contrast question heading, 4 spacious options, clear single vs multiple selection instructions, question index, progress bar, and focused primary "Next" / "Submit answers" CTA.
4. **Results:** large weighted score, optional percentage, clear correct/wrong labels and per-question feedback, source attribution and a new-quiz CTA; visual accent is celebratory but restrained.

Read the art guide for responsive composition and the recipes for canonical Tailwind forms/buttons/cards.

## Accessibility and implementation acceptance

- [ ] Validate layouts at 320px, 390px, 768px, 1024px and wider; no horizontal scroll or clipped option labels.
- [ ] Keyboard navigation works for input fields, radio and checkbox choices, progression and results.
- [ ] Focus ring is visible, not hidden by border/box shadows.
- [ ] Every control has an accessible label; error messages are connected to inputs; async status is announced appropriately.
- [ ] Choice state does not rely on color; multiselect is unambiguously different from single-select.
- [ ] Honor `prefers-reduced-motion`; animation is short, optional and never required to use the app.
- [ ] Loading/empty/error/disabled/success states are cohesive and use semantic colors and labels.
- [ ] UI does not expose answer keys before submission; visual states must not leak correctness.
- [ ] Existing behavior and validation remain unchanged during a design-only refactor.
- [ ] Run repository ESLint, typecheck and relevant Jest tests after UI changes.
