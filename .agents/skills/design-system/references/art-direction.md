# Art Direction — AI Quiz Generator

> Read together with `../SKILL.md`. The skill is the single source of truth for tokens and typography. This guide owns visual composition, decorative artwork, and responsive behavior.

## 1. Creative direction

**Creative keywords:** fresh, thoughtful, botanical, optimistic, uncluttered, educational, welcoming. The experience should feel like a quiet study space with a friendly assistant, **not** a school exam timer or a dense SaaS analytics dashboard.

Adapt the Encomenda.link design principles found in the provided reference: cream and pale-green surfaces, forest-green actions, sage support panels, airy typography, large serif titles, restrained decorative details and clear visual hierarchy. Retain the spirit, not the commerce-specific motifs or Portuguese copy.

## 2. Consistent visual hierarchy

1. The **task** is visually dominant: enter a topic/source, answer a question, read a result.
2. A serif page title introduces a screen; subsequent functional text is sans serif.
3. Pale green groups information; white cards host dense interactive content.
4. One primary dark-green button advances the core workflow.
5. Icons and artwork support orientation; never compete with question content.

**Recommended desktop balance:** 65% simple task/work area + 35% illustrative/editorial breathing room on setup screens. On the quiz player, avoid competing columns: keep the reading/interaction column centered. On mobile, stack everything and omit nonessential decoration.

## 3. Page-specific direction

### A. Quiz creation / landing

Desktop composition:

```text
┌─────────────────────────────── warm near-white/green canvas ──────────────────────────────┐
│ [small wordmark / leaf + question-card mark]                                              │
│                                                                                            │
│  Generate a quiz from                              [subtle original leaf + book artwork]   │
│  anything you want to learn.                                                            │
│  1–2 sentences of supporting copy                                                       │
│                                                                                            │
│  ┌─────────────────────────────────────────────────┐                                    │
│  │ Topic                                           │                                    │
│  │ [ e.g. Node.js event loop                    ]  │                                    │
│  │ Markdown / README URL                           │                                    │
│  │ [ https://github.com/.../README.md           ]  │                                    │
│  │                            [Generate quiz →]   │                                    │
│  └─────────────────────────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- A small eyebrow such as `LEARN THROUGH QUESTIONS` may precede the title.
- Emphasize **one short italic phrase** in muted leaf-green; do not overuse italics.
- Keep the source link input readable for long URLs and protect against overflow.
- The submit action should be obvious within the form; avoid separate secondary CTAs next to it.

Mobile composition: wordmark → heading → compact supporting text → form card → optional decorative detail below. Primary action full width. No oversized artwork above the form.

### B. Quiz generation state

- Replace the form submission state with a clear progress card, skeleton question rows and an accessible status message: `Reading source…`, `Preparing your questions…` when backed by real workflow status (otherwise use one accurate generic status).
- Use pale sage for skeleton backgrounds; avoid flashing or indeterminate UI that implies precise progress.
- On recoverable errors, show a plain message and a `Try again` action. Never expose raw LLM output.

### C. Quiz player

```text
Question 3 of 6                           [████████░░░░░░] 50%

┌─────────────────────────────────────────────────────┐
│  Which operation schedules a microtask in Node.js? │
│  Select one answer.                                 │
│                                                     │
│  ( )  Choice A                                      │
│  ( )  Choice B                                      │
│  ( )  Choice C                                      │
│  ( )  Choice D                                      │
│                                                     │
│     [Back]                           [Next →]       │
└─────────────────────────────────────────────────────┘
```

- Prefer one content column (`max-w-[720px]`); do not put artwork next to answers.
- Each answer uses a complete clickable row with a radio/checkbox indicator, subtle hover and an unmistakable selected state.
- Reserve a **minimum of 44px** vertical hit height, with enough inner padding for two-line answers.
- If questions allow multiple choices, say **“Select all that apply”** explicitly and use checkbox semantics.
- Never reveal whether the choice is correct during an active attempt.
- Permit Back navigation without losing selections; the submission status should be explicit.

### D. Results and answer review

- Primary heading may be `Nice work — here's your result.` in serif.
- A single large score block shows, for example, `3.12 / 4.00` and a small optional percentage in parentheses. The score is a **weighted average**, not a count of correct questions.
- Place explanation below as readable text/cards. Show `Correct` / `Incorrect` labels with corresponding icons, not green/red alone.
- Small outlined leaf illustrations or check marks may frame the completion title without distracting from the feedback.
- If answer-level explanations are generated, label them clearly and ground them in the source text where feasible.
- A `Create another quiz` CTA returns to setup, with a quiet link back to the source.

## 4. Original artwork brief

**Illustration concept:** a curling branch with five to seven round leaves curves around a small open-book outline; two tiny rounded question-card shapes float beside it. Keep it abstract, lightweight and original.

- Stroke color: `leaf` from `SKILL.md`, stroke width roughly 2px at a 200–300px canvas, rounded caps and joins.
- Large filled leaves: `mint`; background ghost shapes: `sage`, with white/cream negative space.
- Allow no more than 2–3 botanical clusters per screen; **never** put a textured pattern beneath the question prompt.
- Corners may use simple pale-green organic blobs; no glossy 3D, stock characters, scattered confetti, gradients from purple/blue or heavily shaded surfaces.
- If creating SVG assets, include a descriptive `title` only if informative; otherwise mark decorative as `aria-hidden="true"` and non-focusable.
- Never copy Encomenda.link imagery or logo; the resemblance should come from the design language only.

## 5. Microinteractions

- Prefer transitions of 150–200ms for selected answer outlines, button hover/focus and card emphasis.
- Animate **opacity or transform minimally**, avoiding layout jumps.
- Use `motion-reduce:transition-none` or equivalent.
- Do not animate numeric scores or progress in ways that hide their true value.

## 6. Responsive and accessibility rules

| Viewport | Composition |
| --- | --- |
| 320–389px | Single column, full-width buttons, wrapped URLs and options, no side illustration |
| 390–767px | Generous card spacing; short form; progress and question count wrap safely |
| 768–1023px | Wider centered card, optional tiny editorial artwork outside the reading area |
| 1024px+ | Split hero/setup; **single-column quiz player** |

- Keep tap targets at least 44x44px.
- Do not scale preview with `zoom` or `transform: scale` to fit mobile widths.
- Verify text contrast, focus outlines, reduced motion, labels and status announcements.
- When in doubt, remove decoration and strengthen legibility.

## 7. Pre-merge visual review checklist

- [ ] Does the screen look like the same product as the other three screens?
- [ ] Is light green a quiet background presence, with dark green functional controls?
- [ ] Are large serif headings balanced by practical sans-serif forms and answers?
- [ ] Is the next action instantly visible?
- [ ] Is all decorative art original, restrained, optional and accessible?
- [ ] Are question correctness and state conveyed by text/semantics, not color alone?
- [ ] Does the UI hold at 320px, 390px and desktop without horizontal overflow?
