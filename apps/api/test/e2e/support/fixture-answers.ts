import type { PublicQuizView } from "@ai-quiz/contracts";
import type { Quiz } from "@ai-quiz/domain";
import { isFixtureOptionCorrect } from "../../../src/quiz/fixture/fixture-bank";

/** Map GET option ids to fixture correctness by label. Do not send keys over HTTP. */
export function correctAnswersFromPublicQuiz(view: PublicQuizView) {
  return view.questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: question.options
      .filter((option) => isFixtureOptionCorrect(question.position, option.label))
      .map((option) => option.id),
  }));
}

export function quizWithFixtureKeys(view: PublicQuizView): Quiz {
  return {
    id: view.id,
    topic: view.topic,
    sourceUrl: view.sourceUrl,
    questions: view.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({
        ...option,
        isCorrect: isFixtureOptionCorrect(question.position, option.label),
      })),
    })),
  };
}

export function answersWithWrongFirstSingle(view: PublicQuizView) {
  return view.questions.map((question) => {
    if (question.type === "single" && question.position === 0) {
      const wrong = question.options.find(
        (option) => !isFixtureOptionCorrect(question.position, option.label),
      );
      return {
        questionId: question.id,
        selectedOptionIds: [wrong?.id ?? question.options[question.options.length - 1]!.id],
      };
    }
    return {
      questionId: question.id,
      selectedOptionIds: question.options
        .filter((option) => isFixtureOptionCorrect(question.position, option.label))
        .map((option) => option.id),
    };
  });
}
