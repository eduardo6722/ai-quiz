import { Badge, cn } from '@ai-quiz/ui';
import { Check, X } from 'lucide-react';
import { optionReviewState } from './question-outcome';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

const rowClass = {
  'selected-correct': 'border-primary bg-mint',
  'selected-incorrect': 'border-destructive/30 bg-destructive/5',
  'missed-correct': 'border-dashed border-warning/45 bg-cream',
  unselected: 'border-border/70 bg-background/40 text-muted-foreground',
} as const;

const markClass = {
  'selected-correct': 'border-primary bg-primary text-primary-foreground',
  'selected-incorrect': 'border-destructive bg-destructive text-card',
  'missed-correct': 'border-dashed border-warning bg-card',
  unselected: 'border-border bg-sage text-muted-foreground',
} as const;

export function ResultOptionRow({
  option,
  picked,
  index,
  selectionKind,
}: {
  option: { id: string; label: string; isCorrect: boolean };
  picked: boolean;
  index: number;
  selectionKind: 'single' | 'multiple';
}) {
  const state = optionReviewState(picked, option.isCorrect);
  const status =
    state === 'selected-correct'
      ? 'You selected this. It is a correct answer.'
      : state === 'selected-incorrect'
        ? 'You selected this. It is not a correct answer.'
        : state === 'missed-correct'
          ? 'You did not select this. It is a correct answer.'
          : 'You did not select this. It is not a correct answer.';

  return (
    <li
      data-review-state={state}
      aria-label={`${option.label}. ${status}`}
      className={cn(
        'flex min-h-14 items-start gap-3 rounded-2xl border p-4 text-base leading-relaxed',
        rowClass[state],
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center border-2 text-xs font-medium',
          selectionKind === 'single' ? 'rounded-full' : 'rounded-md',
          markClass[state],
        )}
      >
        {state === 'selected-correct' ? (
          <Check className="size-3.5" />
        ) : state === 'selected-incorrect' ? (
          <X className="size-3.5" />
        ) : state === 'unselected' ? (
          OPTION_LETTERS[index]
        ) : null}
      </span>
      <div className="min-w-0 flex-1 space-y-2 break-words">
        <p className="font-medium text-foreground">{option.label}</p>
        {state === 'unselected' ? null : (
          <div className="flex flex-wrap gap-2">
            {picked ? (
              <Badge className="bg-card text-foreground ring-1 ring-border">You selected this</Badge>
            ) : (
              <Badge className="bg-card text-warning ring-1 ring-warning/25">You missed this</Badge>
            )}
            {option.isCorrect ? (
              <Badge tone="success">Correct answer</Badge>
            ) : (
              <Badge tone="danger">Incorrect answer</Badge>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
