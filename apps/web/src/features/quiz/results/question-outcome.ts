type ResultOption = {
  id: string;
  label?: string;
  isCorrect: boolean;
};

type ResultQuestion = {
  type?: 'single' | 'multiple';
  selectedOptionIds: string[];
  options: ResultOption[];
};

export type OptionReviewState =
  | 'selected-correct'
  | 'selected-incorrect'
  | 'missed-correct'
  | 'unselected';

export function isFullyCorrectQuestion(question: ResultQuestion): boolean {
  const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id);
  const selectedIds = new Set(question.selectedOptionIds);
  return correctIds.length > 0 && correctIds.length === selectedIds.size && correctIds.every((id) => selectedIds.has(id));
}

export function optionReviewState(picked: boolean, isCorrect: boolean): OptionReviewState {
  if (picked) {
    return isCorrect ? 'selected-correct' : 'selected-incorrect';
  }
  return isCorrect ? 'missed-correct' : 'unselected';
}

export function joinEnglishList(items: string[]): string {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0]!;
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function describeAnswerComparison(question: ResultQuestion): string | null {
  if (isFullyCorrectQuestion(question)) {
    return null;
  }

  const selected = question.options.filter((option) => question.selectedOptionIds.includes(option.id));
  const missed = question.options.filter(
    (option) => option.isCorrect && !question.selectedOptionIds.includes(option.id),
  );
  const extra = selected.filter((option) => !option.isCorrect);
  const selectedLabels = labelsOf(selected);
  const missedLabels = labelsOf(missed);
  const extraLabels = labelsOf(extra);
  const parts: string[] = [];

  if (selectedLabels.length > 0) {
    parts.push(`You selected ${joinEnglishList(selectedLabels)}.`);
  } else {
    parts.push('You did not select an answer.');
  }

  if (question.type === 'single' && missedLabels.length === 1) {
    parts.push(`The correct answer is ${missedLabels[0]}.`);
  } else {
    if (missedLabels.length > 0) {
      parts.push(`You missed ${joinEnglishList(missedLabels)}.`);
    }
    if (extraLabels.length > 0) {
      parts.push(
        extraLabels.length === 1
          ? `${extraLabels[0]} is not a correct answer.`
          : `${joinEnglishList(extraLabels)} are not correct answers.`,
      );
    }
  }

  return parts.join(' ');
}

function labelsOf(options: ResultOption[]): string[] {
  return options.map((option, index) => option.label?.trim() || `option ${index + 1}`);
}
