import type { JudgePort, JudgeQuestionInput } from "../judge/judge-port.js";
import type { QuizJudgeOutput } from "../judge/output-schema.js";

export class FixedJudgeAdapter implements JudgePort {
  constructor(private readonly override?: (input: JudgeQuestionInput[]) => QuizJudgeOutput) {}

  async evaluate(input: {
    caseId: string;
    topic: string;
    snapshot: string;
    questions: JudgeQuestionInput[];
  }): Promise<QuizJudgeOutput> {
    if (this.override) {
      return this.override(input.questions);
    }
    return {
      setCoverage: 4,
      notes: "fixed judge",
      questions: input.questions.map((question) => ({
        questionPosition: question.questionPosition,
        proposedCorrectPositions: question.type === "multiple" ? [0, 1] : [0],
        optionSupport: [0, 1, 2, 3].map((position) => ({
          position,
          supportedBySource: position === 0 || (question.type === "multiple" && position === 1),
          evidenceExcerpt: position === 0 ? input.snapshot.slice(0, 40) : "",
          uncertain: false,
        })),
        relevance: 4,
        clarity: 4,
        ambiguity: 4,
        distractorQuality: 4,
        coverageContribution: 4,
        uncertainty: "low",
        notes: "",
      })),
    };
  }
}
