'use client';

import type { PublicQuizView, PublicResult } from '@ai-quiz/contracts';
import { Badge, Button, Card, CardContent, cn } from '@ai-quiz/ui';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  Plus,
  Sprout,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getQuiz, getResult, isQuizApiError } from '../api/api-client';
import { loadSitting } from '../session/attempt-session';
import { learnerMessageForCode } from '../errors/error-copy';
import { isFullyCorrectQuestion } from './question-outcome';
import { QuizErrorState, QuizLoading } from '../layout/quiz-screen';

function messageFromUnknown(error: unknown): string {
  if (isQuizApiError(error)) {
    return learnerMessageForCode(error.code);
  }
  return learnerMessageForCode('INTERNAL_ERROR');
}

export function QuizResults({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<PublicQuizView | null>(null);
  const [result, setResult] = useState<PublicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sitting = loadSitting(quizId);
    if (!sitting) {
      setError(learnerMessageForCode('UNAUTHORIZED_ATTEMPT'));
      return;
    }
    const currentSitting = sitting;

    async function load(): Promise<void> {
      try {
        const [loadedQuiz, loadedResult] = await Promise.all([
          getQuiz(quizId),
          getResult(currentSitting.attemptId, currentSitting.token),
        ]);
        if (!cancelled) {
          setQuiz(loadedQuiz);
          setResult(loadedResult);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(messageFromUnknown(cause));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  if (error) {
    return <QuizErrorState message={error} />;
  }

  if (!quiz || !result) {
    return <QuizLoading result />;
  }

  const scoreLabel = `${result.weightedScoreDisplay.toFixed(2)} out of 4`;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10 py-2 sm:gap-12 sm:py-4">
      <section
        aria-labelledby="result-title"
        className="rounded-3xl border border-border bg-cream px-5 py-8 text-center sm:p-10"
      >
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-mint text-primary">
          <CheckCheck className="size-6" aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Quiz complete
        </p>
        <h1
          id="result-title"
          className="mt-3 font-display text-[32px] font-normal leading-tight tracking-tight sm:text-[40px]"
        >
          Nice work. Here&apos;s your result.
        </h1>
        <p className="mt-3 break-words text-base text-muted-foreground">{quiz.topic}</p>
        <p
          className="mt-6 text-[60px] font-semibold leading-none tracking-tight tabular-nums text-primary sm:text-[76px]"
          aria-label={scoreLabel}
        >
          {result.weightedScoreDisplay.toFixed(2)}{' '}
          <span className="text-2xl font-normal tracking-normal text-muted-foreground sm:text-3xl">
            / 4.00
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <p>Weighted quiz score</p>
          <p className="rounded-full border border-border bg-card px-2.5 py-1 tabular-nums">
            ({result.percentageDisplay.toFixed(2)}%)
          </p>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your score is a weighted average on a 0–4 scale. Later questions carry a little more
          weight.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <Button href="/" className="min-h-12 w-full gap-2 sm:w-auto">
            <Plus className="size-4" aria-hidden="true" />
            Create another quiz
          </Button>
          <button
            type="button"
            aria-expanded={showAnswers}
            aria-controls="answer-review"
            onClick={() => setShowAnswers((shown) => !shown)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-base font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {showAnswers ? 'Hide answers' : 'Show answers'}
            {showAnswers ? (
              <ArrowUp className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </section>
      <section
        id="answer-review"
        hidden={!showAnswers}
        aria-labelledby={showAnswers ? 'review-title' : undefined}
        className="scroll-mt-8 space-y-5"
      >
        {showAnswers ? (
          <>
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                A moment to reflect
              </p>
              <h2
                id="review-title"
                className="font-display text-[28px] font-normal tracking-tight sm:text-[32px]"
              >
                See what stuck. Learn what’s next.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Compare your selections with the correct answers below.
              </p>
            </div>
            {result.questions.map((item) => {
              const prompt =
                quiz.questions.find((question) => question.id === item.id)?.prompt ??
                `Question ${item.position + 1}`;
              const correct = isFullyCorrectQuestion(item);
              return (
                <Card key={item.id} className="rounded-3xl p-5 sm:p-7">
                  <CardContent className="space-y-5">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Question {item.position + 1}
                          </p>
                          <Badge
                            tone={correct ? 'success' : 'danger'}
                            className={cn('gap-1.5', !correct && 'bg-destructive/5')}
                          >
                            {correct ? (
                              <Check className="size-4" aria-hidden="true" />
                            ) : (
                              <X className="size-4" aria-hidden="true" />
                            )}
                            {correct ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.rawScore} {item.rawScore === 1 ? 'point' : 'points'}
                        </p>
                      </div>
                      <h3 className="break-words text-lg font-semibold leading-snug sm:text-xl">
                        {prompt}
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {item.options.map((option, index) => {
                        const picked = item.selectedOptionIds.includes(option.id);
                        return (
                          <li
                            key={option.id}
                            className={cn(
                              'flex items-start gap-3 rounded-2xl border p-4 text-base leading-relaxed',
                              option.isCorrect
                                ? 'border-primary/25 bg-sage'
                                : picked
                                  ? 'border-destructive/25 bg-destructive/5'
                                  : 'border-border/70 bg-background/40',
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-sm font-medium',
                                option.isCorrect
                                  ? 'bg-mint text-primary'
                                  : picked
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-sage text-muted-foreground',
                              )}
                            >
                              {option.isCorrect ? (
                                <Check className="size-4" />
                              ) : picked ? (
                                <X className="size-4" />
                              ) : (
                                ['A', 'B', 'C', 'D'][index]
                              )}
                            </span>
                            <div className="min-w-0 flex-1 break-words">
                              <p>{option.label}</p>
                              {picked || option.isCorrect ? (
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                                  {picked ? (
                                    <span className="font-medium text-foreground">Your answer</span>
                                  ) : null}
                                  {option.isCorrect ? (
                                    <span className="font-medium text-primary">Correct answer</span>
                                  ) : picked ? (
                                    <span className="text-destructive">Incorrect answer</span>
                                  ) : null}
                                  {option.isCorrect && !picked ? (
                                    <span className="text-muted-foreground">Not selected</span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </>
        ) : null}
      </section>
      <section
        aria-labelledby="source-title"
        className="flex items-start gap-4 rounded-2xl border border-border bg-sage/60 p-5 sm:p-6"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary">
          <BookOpen className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-2">
          <h2 id="source-title" className="text-base font-semibold">
            Back to the source
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Revisit your reading with a fresh perspective.
          </p>
          {quiz.sourceUrl.startsWith('https://') ? (
            <a
              href={quiz.sourceUrl}
              className="inline-block min-h-11 break-all rounded-lg py-2 text-base text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {quiz.sourceUrl}
              <ArrowUpRight className="ml-1 inline size-4" aria-hidden="true" />
            </a>
          ) : (
            <p className="break-all text-base text-muted-foreground">{quiz.sourceUrl}</p>
          )}
        </div>
      </section>
      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Sprout className="size-4 shrink-0 text-leaf" aria-hidden="true" />
        Every question is a chance to grow.
      </p>
    </div>
  );
}
