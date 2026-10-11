import { DomainError } from "../errors.js";
import type { QuestionType, Quiz } from "../quiz/quiz.js";
import { validateQuiz } from "../quiz/quiz.js";
import { scoreQuestion } from "../scoring/scoring-policy.js";
import {
  calculateWeightedScore,
  roundForDisplay,
  toPercentageDisplay,
} from "../scoring/weighted-score.js";

export type AnswerSelection = {
  questionId: string;
  selectedOptionIds: string[];
};

export type QuestionScore = {
  questionId: string;
  rawScore: number;
};

export type ScoredOption = {
  id: string;
  position: number;
  label: string;
  isCorrect: boolean;
};

export type ScoredQuestion = {
  questionId: string;
  position: number;
  type: QuestionType;
  rawScore: number;
  selectedOptionIds: string[];
  options: ScoredOption[];
};

export type ScoredResult = {
  questionScores: QuestionScore[];
  weightedScore: number;
  weightedScoreDisplay: number;
  percentageDisplay: number;
  selectedByQuestion: Record<string, string[]>;
  questions: ScoredQuestion[];
};

export type Attempt = {
  id: string;
  quizId: string;
  status: "open" | "scored";
  result?: ScoredResult;
};

export function assertAttemptMatchesQuiz(attempt: Attempt, quiz: Quiz): void {
  if (attempt.quizId !== quiz.id) {
    throw new DomainError("QUIZ_INVALID", "attempt does not belong to this quiz");
  }
}

export function applySelections(quiz: Quiz, answers: AnswerSelection[]): Map<string, string[]> {
  validateQuiz(quiz);

  const byQuestion = new Map<string, string[]>();
  const seen = new Set<string>();

  for (const answer of answers) {
    if (seen.has(answer.questionId)) {
      throw new DomainError("SELECTION_ILLEGAL", "duplicate question id in answers");
    }
    seen.add(answer.questionId);

    const question = quiz.questions.find((item) => item.id === answer.questionId);
    if (!question) {
      throw new DomainError("SELECTION_ILLEGAL", "unknown question id");
    }

    const ids = answer.selectedOptionIds;
    if (new Set(ids).size !== ids.length) {
      throw new DomainError("SELECTION_ILLEGAL", "duplicate option id");
    }
    for (const id of ids) {
      if (!question.options.some((option) => option.id === id)) {
        throw new DomainError("SELECTION_ILLEGAL", "option does not belong to the question");
      }
    }
    if (question.type === "single" && ids.length !== 1) {
      throw new DomainError("SELECTION_ILLEGAL", "single-answer requires exactly one selection");
    }
    if (question.type === "multiple" && ids.length < 1) {
      throw new DomainError("SELECTION_ILLEGAL", "multiple-answer requires at least one selection");
    }

    byQuestion.set(question.id, ids);
  }

  if (byQuestion.size !== quiz.questions.length) {
    throw new DomainError("ATTEMPT_INCOMPLETE", "every question must have a legal selection");
  }

  return byQuestion;
}

export function scoreAttempt(quiz: Quiz, answers: AnswerSelection[]): ScoredResult {
  const selected = applySelections(quiz, answers);
  const questions: ScoredQuestion[] = quiz.questions.map((question) => {
    const selectedOptionIds = selected.get(question.id) ?? [];
    return {
      questionId: question.id,
      position: question.position,
      type: question.type,
      rawScore: scoreQuestion(question, selectedOptionIds),
      selectedOptionIds,
      options: question.options.map((option) => ({
        id: option.id,
        position: option.position,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    };
  });
  const questionScores = questions.map((question) => ({
    questionId: question.questionId,
    rawScore: question.rawScore,
  }));
  const weightedScore = calculateWeightedScore(questionScores.map((item) => item.rawScore));
  return {
    questionScores,
    weightedScore,
    weightedScoreDisplay: roundForDisplay(weightedScore),
    percentageDisplay: toPercentageDisplay(weightedScore),
    selectedByQuestion: Object.fromEntries(selected),
    questions,
  };
}
