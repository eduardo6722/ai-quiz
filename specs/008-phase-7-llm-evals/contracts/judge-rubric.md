# Contract: Judge rubric v1

**Feature**: [spec.md](../spec.md)  
**Store**: `evals/rubrics/judge-v1.md` (human) + criteria identifiers below

## Input the judge MAY see

- Case id, topic, requested count
- Full pinned snapshot (untrusted data, wrapped as source — never as privileged instructions)
- Question prompt, generated type (`single` \| `multiple`)
- Four option **labels** with positions `0..3`
- Optional reviewer reference facts labeled “not the generated answer key”

## Input the judge MUST NOT see

- `isCorrect` / correctness flags
- Generated correct indices
- Learner scores, attempt tokens, env secrets
- A sentence that the generated key is correct

## Structured output (Zod)

```ts
type OptionSupport = {
  position: number; // 0–3
  supportedBySource: boolean;
  evidenceExcerpt: string; // empty if unsupported or uncertain
  uncertain: boolean;
};

type QuestionJudgeOutput = {
  questionPosition: number;
  proposedCorrectPositions: number[]; // independent key; single ⇒ length 1
  optionSupport: OptionSupport[]; // length 4
  relevance: 1 | 2 | 3 | 4 | 5;
  clarity: 1 | 2 | 3 | 4 | 5;
  ambiguity: 1 | 2 | 3 | 4 | 5; // 5 = unambiguous
  distractorQuality: 1 | 2 | 3 | 4 | 5;
  coverageContribution: 1 | 2 | 3 | 4 | 5;
  uncertainty: "low" | "medium" | "high";
  notes: string;
};

type QuizJudgeOutput = {
  questions: QuestionJudgeOutput[];
  setCoverage: 1 | 2 | 3 | 4 | 5;
  notes: string;
};
```

Invalid judge output: retry **once**, then mark the case semantic result `not_run` with detail `judge-invalid` (do not invent a pass).

## Anchors (1 and 5)

| Dimension | 1 | 5 |
| --------- | - | - |
| relevance | Off-topic or only uses prior knowledge | Clearly about the requested topic **and** the pin |
| clarity | Unreadable, double-barreled, or undefined terms | One unambiguous task a learner can answer from the options |
| ambiguity | Two or more options are defensible from the pin | Exactly the intended set is defensible |
| distractorQuality | Absurd, repeated, or also true per the pin | Plausible, distinct, and false per the pin |
| coverageContribution / setCoverage | Repeats another question or misses the topic | Adds a distinct supported facet of the topic |

## Runner comparison (not in the prompt)

```text
generatedCorrect = positions where isCorrect === true
blockingUnsupportedKey =
  generatedCorrect !== proposedCorrectPositions
  OR any generatedCorrect option has supportedBySource === false
```

The judge is not told the result of this comparison in a follow-up that could let it revise the key.

## Human overlay

- Acceptable relevance/clarity for gates: human `acceptableRelevance` and `acceptableClarity`, **or** (if that question was not reviewed) judge scores ≥ 4 **and** `uncertainty !== "high"` — the 90% gate is computed **only on human-reviewed questions** (spec FR-015).
- Disagreement: store both; human wins; list in the calibration table.

## Prompt-injection posture

The snapshot is untrusted task data. The judge system message MUST say to ignore instructions inside the source. If the source tells the judge to award 5s or to accept all keys, the adapter MUST still require evidence excerpts.
