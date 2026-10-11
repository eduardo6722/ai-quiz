# UI screens (Phase 4)

English-only. Semantic tokens from `.agents/skills/design-system/SKILL.md`. Shared primitives from `@ai-quiz/ui`.

HTTP shapes: reuse Phase 2/3 contracts (`specs/005-phase-3-markdown-generation/contracts/` and `specs/004-phase-2-persistence-api/contracts/`). This file is the **learner-facing** contract.

## Routes

| Path | Screen | Token in URL? |
| ---- | ------ | ------------- |
| `/` | Setup | No |
| `/quiz/{quizId}` | Player | No (`quizId` only) |
| `/quiz/{quizId}/results` | Results | No |

Unknown `quizId` → English unavailable state + link back to setup. No empty option list that could be mistaken for a quiz.

## 1. Setup (`/`)

**Purpose**: Collect topic, HTTPS Markdown URL, question count; start generation.

**Copy (required)**:

- Eyebrow: `Learn through questions`
- Title (serif): includes the italic phrase `what you know`
- Supporting sentence: enter a topic and a Markdown source to generate a focused quiz
- Labels: `Topic`, `Markdown / README URL`, `Number of questions`
- Primary CTA: `Generate quiz`

**Fields**: topic (text), sourceUrl (url/text), questionCount (select 5–8, default 5). No strategy, no API key.

**Validation** (client, then server): see public create-quiz schema. Errors are English, tied to the field (`role="alert"`).

**Layout**: mobile — title, copy, form card, full-width CTA. Desktop — optional botanical artwork beside the form; form remains the task.

## 2. Generating

Shown on `/` after a valid submit until create returns.

- Status text (accessible): `Reading source…` or `Preparing your questions…` (generic if workflow steps are not known)
- Skeleton question rows (`sage` placeholders)
- Primary CTA disabled; no second generate
- Failure: `Alert` with mapped English copy ([error-copy.md](./error-copy.md)) + `Try again` restoring the form

## 3. Player (`/quiz/{quizId}`)

**Purpose**: Answer one question at a time without seeing keys.

**Copy**:

- Progress: `Question {n} of {N}` (1-based n). Optional percent is **step** completeness, not score.
- Single: `Select one answer.`
- Multiple: `Select all that apply.`
- Secondary: `Back` (hidden or disabled on question 1)
- Primary: `Next` or, on the last question when complete, `Submit answers`

**Controls**: four option rows, native radio or checkbox, entire row clickable, min 44px. Selected = border/primary + mint fill; **not** labeled correct. Focus ring visible.

**Column**: max reading width ~720px, centered. No artwork beside options.

**If sitting is `scored`**: redirect to results; do not allow edits.

## 4. Results (`/quiz/{quizId}/results`)

**Purpose**: Show the **persisted** weighted score and feedback.

**Copy**:

- Eyebrow: `Quiz complete`
- Title (serif): `Nice work. Here's your result.`
- Score: `{weightedScoreDisplay}` `/ 4.00` with accessible name `{score} out of 4`
- Caption: `Weighted quiz score`
- Secondary: percentage in parentheses using `percentageDisplay`
- Per question: `Correct` or `Incorrect` (text + icon, not color alone)
- Source: original Markdown URL as a link (`View source` or the URL)
- CTA: `Create another quiz` → `/`

**Data**: join public quiz view + public result ([data-model.md](../data-model.md)). Do not invent a count-of-correct-questions as the primary score.

**Unauthorized / not scored**: English empty state, no option correctness, link to setup or player.

## Accessibility (all screens)

- Labels on every control; errors described by `aria-describedby`
- Keyboard: fields, radios, checkboxes, Back/Next/Submit, results CTA
- Focus: `ring` token; never `outline-none` without a replacement
- Motion: `motion-reduce:transition-none`
- Touch: primary actions and option rows ≥ 44px
- 320px: no horizontal scroll; long URLs and options wrap
- Decorative art: `aria-hidden`

## Tests (Jest + RTL)

Assert English CTA/progress/result score text, validation messages, single vs multiple, preserved selections, loading/error, submit → results, and **absence** of `isCorrect` in player markup. Do not require Playwright.
