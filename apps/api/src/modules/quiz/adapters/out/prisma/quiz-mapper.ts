import type { Quiz, QuizRecord, ScoredResult } from "@ai-quiz/domain";

type OptionRow = {
  id: string;
  position: number;
  label: string;
  isCorrect: boolean;
};

type QuestionRow = {
  id: string;
  position: number;
  type: "single" | "multiple";
  prompt: string;
  options: OptionRow[];
};

type QuizRow = {
  id: string;
  topic: string;
  status: "generating" | "ready" | "failed";
  strategy: string;
  sourceDocumentId: string;
  sourceDocument: { originalUrl: string };
  questions: QuestionRow[];
};

type AnswerRow = {
  questionId: string;
  rawScore: number;
  question: QuestionRow;
  selections: { optionId: string }[];
};

export function toDomainQuiz(row: QuizRow): Quiz {
  const questions = [...row.questions].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    topic: row.topic,
    sourceUrl: row.sourceDocument.originalUrl,
    questions: questions.map((question) => ({
      id: question.id,
      position: question.position,
      type: question.type,
      prompt: question.prompt,
      options: [...question.options]
        .sort((a, b) => a.position - b.position)
        .map((option) => ({
          id: option.id,
          position: option.position,
          label: option.label,
          isCorrect: option.isCorrect,
        })),
    })),
  };
}

export function toQuizRecord(row: QuizRow): QuizRecord {
  return {
    quiz: toDomainQuiz(row),
    status: row.status,
    sourceDocumentId: row.sourceDocumentId,
    strategy: row.strategy,
  };
}

export function toScoredResult(input: {
  quiz: Quiz;
  weightedScore: number;
  weightedScoreDisplay: number;
  percentageDisplay: number;
  answers: AnswerRow[];
}): ScoredResult {
  const byQuestion = new Map(input.answers.map((answer) => [answer.questionId, answer]));
  const questions = input.quiz.questions.map((question) => {
    const answer = byQuestion.get(question.id);
    const selectedOptionIds = answer?.selections.map((selection) => selection.optionId) ?? [];
    return {
      questionId: question.id,
      position: question.position,
      type: question.type,
      rawScore: answer?.rawScore ?? 0,
      selectedOptionIds,
      options: question.options.map((option) => ({
        id: option.id,
        position: option.position,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    };
  });
  return {
    questionScores: questions.map((question) => ({
      questionId: question.questionId,
      rawScore: question.rawScore,
    })),
    weightedScore: input.weightedScore,
    weightedScoreDisplay: input.weightedScoreDisplay,
    percentageDisplay: input.percentageDisplay,
    selectedByQuestion: Object.fromEntries(
      questions.map((question) => [question.questionId, question.selectedOptionIds]),
    ),
    questions,
  };
}
