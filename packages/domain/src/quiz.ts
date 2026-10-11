import { DomainError } from "./errors.js";

export type QuestionType = "single" | "multiple";

export type Option = {
  id: string;
  position: number;
  label: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  position: number;
  prompt: string;
  type: QuestionType;
  options: Option[];
  sourceExcerpt?: string;
};

export type Quiz = {
  id: string;
  topic: string;
  sourceUrl: string;
  questions: Question[];
};

function requireNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new DomainError("QUIZ_INVALID", `${label} must be non-empty after trim`);
  }
  return trimmed;
}

function validateOptions(question: Question): void {
  if (question.options.length !== 4) {
    throw new DomainError("QUIZ_INVALID", "each question must have exactly four options");
  }

  const ids = new Set<string>();
  const labels = new Set<string>();
  const positions = new Set<number>();
  let correctCount = 0;

  for (const [index, option] of question.options.entries()) {
    if (option.id.trim().length === 0) {
      throw new DomainError("QUIZ_INVALID", "option id must be non-empty");
    }
    if (ids.has(option.id)) {
      throw new DomainError("QUIZ_INVALID", "option identities must be unique within a question");
    }
    ids.add(option.id);

    const label = option.label.trim();
    if (label.length === 0) {
      throw new DomainError("QUIZ_INVALID", "option label must be non-empty after trim");
    }
    if (labels.has(label)) {
      throw new DomainError("QUIZ_INVALID", "option labels must be unique within a question");
    }
    labels.add(label);

    if (option.position !== index || option.position < 0 || option.position > 3) {
      throw new DomainError("QUIZ_INVALID", "option positions must be unique, contiguous, and 0–3");
    }
    if (positions.has(option.position)) {
      throw new DomainError("QUIZ_INVALID", "option positions must be unique, contiguous, and 0–3");
    }
    positions.add(option.position);

    if (option.isCorrect) {
      correctCount += 1;
    }
  }

  if (question.type === "single" && correctCount !== 1) {
    throw new DomainError("QUIZ_INVALID", "single-answer questions must have exactly one correct option");
  }
  if (question.type === "multiple" && (correctCount < 1 || correctCount > 4)) {
    throw new DomainError("QUIZ_INVALID", "multiple-answer questions must have one to four correct options");
  }
}

export function validateQuiz(quiz: Quiz): void {
  if (quiz.id.trim().length === 0) {
    throw new DomainError("QUIZ_INVALID", "quiz id must be non-empty");
  }
  requireNonEmpty(quiz.topic, "topic");

  const count = quiz.questions.length;
  if (count < 5 || count > 8) {
    throw new DomainError("QUIZ_INVALID", "quiz must have 5–8 questions");
  }

  const questionIds = new Set<string>();
  for (const [index, question] of quiz.questions.entries()) {
    if (question.id.trim().length === 0) {
      throw new DomainError("QUIZ_INVALID", "question id must be non-empty");
    }
    if (questionIds.has(question.id)) {
      throw new DomainError("QUIZ_INVALID", "question identities must be unique within a quiz");
    }
    questionIds.add(question.id);

    if (question.position !== index) {
      throw new DomainError("QUIZ_INVALID", "question positions must be unique, contiguous, and zero-based");
    }

    requireNonEmpty(question.prompt, "prompt");

    if (question.type !== "single" && question.type !== "multiple") {
      throw new DomainError("QUIZ_INVALID", "question type must be single or multiple");
    }

    validateOptions(question);
  }
}
