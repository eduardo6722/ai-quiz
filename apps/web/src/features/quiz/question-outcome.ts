type ResultOption = {
  id: string;
  isCorrect: boolean;
};

type ResultQuestion = {
  selectedOptionIds: string[];
  options: ResultOption[];
};

export function isFullyCorrectQuestion(question: ResultQuestion): boolean {
  const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id);
  const selectedIds = new Set(question.selectedOptionIds);
  return correctIds.length > 0 && correctIds.length === selectedIds.size && correctIds.every((id) => selectedIds.has(id));
}
