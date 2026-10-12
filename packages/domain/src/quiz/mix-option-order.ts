import type { Option, Question, Quiz } from "./quiz.js";

export function mixQuizOptionOrder(quiz: Quiz): Quiz {
  const shuffled: Quiz = {
    ...quiz,
    questions: quiz.questions.map((question) => mixQuestion(quiz.id, question)),
  };
  return repairQuiz(shuffled);
}

function mixQuestion(quizId: string, question: Question): Question {
  const rng = mulberry32(hashString(quizId) ^ hashString(question.id) ^ (question.position + 1));
  let options = reindex(fisherYates(question.options.map((option) => ({ ...option })), rng));
  if (!isAllFourCorrect(options) && alwaysFirstFullCredit(question.type, options)) {
    for (let step = 0; step < 3; step += 1) {
      options = reindex(rotateLeft(options));
      if (!alwaysFirstFullCredit(question.type, options)) {
        break;
      }
    }
  }
  return { ...question, options };
}

function repairQuiz(quiz: Quiz): Quiz {
  const questions = quiz.questions.map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
  }));

  const firstNonExempt = questions.findIndex((question) => !isAllFourCorrect(question.options));
  if (correctSlots(questions).size < 2 && firstNonExempt >= 0) {
    questions[firstNonExempt] = diversifySlots(questions[firstNonExempt]!);
  }

  const twoOrThreeCorrectMultiples = questions.filter(isTwoOrThreeCorrectMultiple);
  if (
    twoOrThreeCorrectMultiples.length > 0 &&
    twoOrThreeCorrectMultiples.every((question) => hasLeadingBlock(question))
  ) {
    const index = questions.findIndex(
      (question) => isTwoOrThreeCorrectMultiple(question) && hasLeadingBlock(question),
    );
    if (index >= 0) {
      questions[index] = breakLeadingBlock(questions[index]!);
    }
  }

  return { ...quiz, questions };
}

function diversifySlots(question: Question): Question {
  const options = question.options.map((option) => ({ ...option }));
  const correctIndex = options.findIndex((option) => option.isCorrect);
  if (correctIndex < 0) {
    return question;
  }
  const swapWith = (correctIndex + 2) % options.length;
  const moving = options[correctIndex]!;
  options[correctIndex] = options[swapWith]!;
  options[swapWith] = moving;
  return { ...question, options: reindex(options) };
}

function breakLeadingBlock(question: Question): Question {
  const options = [...question.options].sort((a, b) => a.position - b.position).map((option) => ({ ...option }));
  const correctCount = options.filter((option) => option.isCorrect).length;
  const lastLeading = correctCount - 1;
  const distractor = options.findIndex((option, index) => index >= correctCount && !option.isCorrect);
  if (lastLeading < 0 || distractor < 0) {
    return question;
  }
  const moving = options[lastLeading]!;
  options[lastLeading] = options[distractor]!;
  options[distractor] = moving;
  return { ...question, options: reindex(options) };
}

function alwaysFirstFullCredit(type: Question["type"], options: Option[]): boolean {
  if (isAllFourCorrect(options)) {
    return true;
  }
  const take = type === "single" ? 1 : options.filter((option) => option.isCorrect).length;
  return options.filter((option) => option.position < take).every((option) => option.isCorrect);
}

function isAllFourCorrect(options: Option[]): boolean {
  return options.length === 4 && options.every((option) => option.isCorrect);
}

function isTwoOrThreeCorrectMultiple(question: Question): boolean {
  const count = question.options.filter((option) => option.isCorrect).length;
  return question.type === "multiple" && count >= 2 && count <= 3;
}

function hasLeadingBlock(question: Question): boolean {
  const n = question.options.filter((option) => option.isCorrect).length;
  if (n < 2 || n > 3) {
    return false;
  }
  return question.options.every((option) => (option.position < n) === option.isCorrect);
}

function correctSlots(questions: Question[]): Set<number> {
  const slots = new Set<number>();
  for (const question of questions) {
    for (const option of question.options) {
      if (option.isCorrect) {
        slots.add(option.position);
      }
    }
  }
  return slots;
}

function rotateLeft(options: Option[]): Option[] {
  if (options.length === 0) {
    return options;
  }
  return [...options.slice(1), options[0]!];
}

function reindex(options: Option[]): Option[] {
  return options.map((option, position) => ({ ...option, position }));
}

function fisherYates(items: Option[], rng: () => number): Option[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(rng() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = current;
  }
  return next;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
