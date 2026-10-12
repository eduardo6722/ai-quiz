import { randomUUID } from "node:crypto";
import type { Option, Question } from "@ai-quiz/domain";

export const MAX_SNAPSHOT_BYTES = 512 * 1024;

export const FIXTURE_TITLE = "Hexagonal architecture";

export const FIXTURE_SNAPSHOT = `# Hexagonal architecture

Ports are interfaces the core depends on. Adapters implement those ports.
A quiz has 5 to 8 questions. Scoring is deterministic and never decided by a model.
The application core stays free of HTTP clients, databases, and provider SDKs.
This fixture snapshot is long enough to pass the usable-length policy for tests.
Ready quizzes never expose answer keys before the learner submits.
Each question must offer exactly four distinct option labels.
Weighted scoring uses geometric weights in quiz order.
Attempt tokens stay hashed on the server and are issued once.
`;

export const FIXTURE_EXCERPT = "Ports are interfaces the core depends on";

/** For each question position, which of the four option positions are correct. */
export const FIXTURE_CORRECT: boolean[][] = [
  [true, false, false, false],
  [true, true, false, false],
  [false, true, false, false],
  [true, false, true, false],
  [false, false, false, true],
  [true, true, true, false],
  [true, false, false, false],
  [false, true, false, true],
];

const PROMPTS: { type: "single" | "multiple"; prompt: string; labels: [string, string, string, string] }[] = [
  {
    type: "single",
    prompt: "What is a port in hexagonal architecture?",
    labels: [
      "An interface the core depends on",
      "A database table",
      "A React hook",
      "An inbound HTTP verb",
    ],
  },
  {
    type: "multiple",
    prompt: "Which statements about adapters are true?",
    labels: [
      "They implement ports",
      "They sit at the edges of the system",
      "They own scoring policy",
      "They replace domain invariants",
    ],
  },
  {
    type: "single",
    prompt: "Who computes the quiz score?",
    labels: [
      "The language model",
      "Deterministic domain code",
      "The browser",
      "The Markdown source",
    ],
  },
  {
    type: "multiple",
    prompt: "Which constraints apply to a playable quiz?",
    labels: [
      "5 to 8 questions",
      "Exactly two options per question",
      "Exactly four options per question",
      "An unbounded question count",
    ],
  },
  {
    type: "single",
    prompt: "When may answer keys appear in a public quiz view?",
    labels: ["Before the learner starts", "In page props", "In HTML comments", "Never before submission"],
  },
  {
    type: "multiple",
    prompt: "Which values are persisted for a scored attempt?",
    labels: [
      "Selected options",
      "Per-question scores",
      "The weighted score",
      "The OpenAI API key",
    ],
  },
  {
    type: "single",
    prompt: "What weight applies to question index 0?",
    labels: ["1.0", "1.1", "0", "4"],
  },
  {
    type: "multiple",
    prompt: "Which are server-only before submission?",
    labels: ["Option labels", "Correctness flags", "The topic", "Answer keys"],
  },
];

export function isFixtureOptionCorrect(questionPosition: number, label: string): boolean {
  const item = PROMPTS[questionPosition];
  if (item === undefined) {
    return false;
  }
  const optionIndex = item.labels.indexOf(label);
  if (optionIndex < 0) {
    return false;
  }
  return FIXTURE_CORRECT[questionPosition]?.[optionIndex] === true;
}

function optionsFor(index: number, labels: [string, string, string, string]): Option[] {
  return labels.map((label, position) => ({
    id: randomUUID(),
    position,
    label,
    isCorrect: FIXTURE_CORRECT[index]?.[position] === true,
  }));
}

export function buildFixtureQuestions(count: number): Question[] {
  return PROMPTS.slice(0, count).map((item, position) => ({
    id: randomUUID(),
    position,
    prompt: item.prompt,
    type: item.type,
    sourceExcerpt: FIXTURE_EXCERPT,
    options: optionsFor(position, item.labels),
  }));
}
