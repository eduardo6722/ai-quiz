'use client';

import type { PublicQuizView } from '@ai-quiz/contracts';
import { parseSubmitAnswersRequest } from '@ai-quiz/contracts';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Progress,
  RadioGroup,
  RadioGroupItem,
} from '@ai-quiz/ui';
import { ArrowLeft, ArrowRight, Check, CircleDot, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getQuiz, isQuizApiError, startAttempt, submitAttempt } from '../shared/api-client';
import {
  ensureOpenSitting,
  loadSitting,
  resultsPath,
  saveSitting,
  type AttemptSitting,
} from '../shared/attempt-session';
import { learnerMessageForCode } from '../shared/error-copy';
import { QuizErrorState, QuizLoading } from '../layout/quiz-screen';

function isLegalSelection(type: 'single' | 'multiple', ids: string[] | undefined): boolean {
  const selected = ids ?? [];
  if (type === 'single') {
    return selected.length === 1;
  }
  return selected.length >= 1 && selected.length <= 4 && new Set(selected).size === selected.length;
}

function messageFromUnknown(error: unknown): string {
  if (isQuizApiError(error)) {
    return learnerMessageForCode(error.code);
  }
  return learnerMessageForCode('INTERNAL_ERROR');
}

export function QuizPlayer({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<PublicQuizView | null>(null);
  const [sitting, setSitting] = useState<AttemptSitting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    questionHeading.current?.focus();
  }, [sitting?.currentIndex]);

  const persist = useCallback(
    (next: AttemptSitting) => {
      saveSitting(quizId, next);
      setSitting(next);
    },
    [quizId],
  );

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (loadSitting(quizId)?.status === 'scored') {
        router.replace(resultsPath(quizId));
        return;
      }
      try {
        const loaded = await getQuiz(quizId);
        const sittingNow = loadSitting(quizId);
        if (sittingNow?.status === 'scored') {
          router.replace(resultsPath(quizId));
          return;
        }
        const nextSitting =
          sittingNow ?? (await ensureOpenSitting(quizId, () => startAttempt(quizId)));
        if (!cancelled) {
          setQuiz(loaded);
          setSitting(nextSitting);
        }
      } catch (cause) {
        if (cancelled) {
          return;
        }
        const code = isQuizApiError(cause) ? cause.code : 'INTERNAL_ERROR';
        if (code === 'QUIZ_NOT_FOUND' || code === 'QUIZ_NOT_PLAYABLE') {
          setUnavailable(true);
        }
        setError(messageFromUnknown(cause));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [quizId, router]);

  if (unavailable) {
    return <QuizErrorState message={error ?? learnerMessageForCode('QUIZ_NOT_FOUND')} />;
  }

  if (error && !quiz) {
    return <QuizErrorState message={error} />;
  }

  if (!quiz || !sitting) {
    return <QuizLoading />;
  }

  const currentQuiz = quiz;
  const currentSitting = sitting;
  const total = currentQuiz.questions.length;
  const question = currentQuiz.questions[currentSitting.currentIndex];
  if (!question) {
    return <QuizErrorState message="This quiz is not available." />;
  }
  const questionId = question.id;
  const selected = currentSitting.selections[questionId] ?? [];
  const currentLegal = isLegalSelection(question.type, selected);
  const allLegal = currentQuiz.questions.every((item) =>
    isLegalSelection(item.type, currentSitting.selections[item.id]),
  );
  const isLast = currentSitting.currentIndex === total - 1;
  const stepPercent = ((currentSitting.currentIndex + 1) / total) * 100;

  function selectSingle(optionId: string): void {
    persist({
      ...currentSitting,
      selections: { ...currentSitting.selections, [questionId]: [optionId] },
    });
  }

  function toggleMultiple(optionId: string): void {
    const current = currentSitting.selections[questionId] ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    persist({
      ...currentSitting,
      selections: { ...currentSitting.selections, [questionId]: next },
    });
  }

  function goBack(): void {
    if (currentSitting.currentIndex === 0) {
      return;
    }
    persist({ ...currentSitting, currentIndex: currentSitting.currentIndex - 1 });
  }

  function goNext(): void {
    if (!currentLegal || isLast) {
      return;
    }
    persist({ ...currentSitting, currentIndex: currentSitting.currentIndex + 1 });
  }

  async function onSubmit(): Promise<void> {
    if (!allLegal || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = parseSubmitAnswersRequest({
        answers: currentQuiz.questions.map((item) => ({
          questionId: item.id,
          selectedOptionIds: currentSitting.selections[item.id] ?? [],
        })),
      });
      await submitAttempt(currentSitting.attemptId, currentSitting.token, payload);
      persist({ ...currentSitting, status: 'scored' });
      router.push(resultsPath(quizId));
    } catch (cause) {
      setError(messageFromUnknown(cause));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
      <div
        className="space-y-2"
        aria-label={`Question ${currentSitting.currentIndex + 1} of ${total}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="min-w-0 break-words font-display text-2xl font-normal leading-tight tracking-tight sm:text-[28px]">
            {quiz.topic}
          </h1>
          <p
            className="shrink-0 text-sm font-medium text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            Question {currentSitting.currentIndex + 1} of {total}
          </p>
        </div>
        <Progress value={stepPercent} aria-label="Quiz progress" className="h-1.5" />
      </div>
      <Card className="rounded-3xl p-4 shadow-sm sm:p-6">
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Badge className="gap-2">
                {question.type === 'single' ? (
                  <CircleDot className="size-4" aria-hidden="true" />
                ) : (
                  <ListChecks className="size-4" aria-hidden="true" />
                )}
                {question.type === 'single' ? 'Single answer' : 'Multiple answers'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {question.type === 'single' ? 'Select one answer.' : 'Select all that apply.'}
              </p>
            </div>
            <h2
              ref={questionHeading}
              tabIndex={-1}
              className="break-words rounded-lg text-xl font-semibold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:text-2xl"
            >
              {question.prompt}
            </h2>
          </div>
          {question.type === 'single' ? (
            <RadioGroup aria-label={question.prompt}>
              {question.options.map((option) => (
                <RadioGroupItem
                  key={option.id}
                  name={question.id}
                  value={option.id}
                  checked={selected[0] === option.id}
                  disabled={submitting}
                  onChange={() => selectSingle(option.id)}
                  className="min-h-14 py-3"
                >
                  {option.label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          ) : (
            <div className="flex flex-col gap-3">
              {question.options.map((option) => (
                <Checkbox
                  key={option.id}
                  name={question.id}
                  value={option.id}
                  checked={selected.includes(option.id)}
                  disabled={submitting}
                  onChange={() => toggleMultiple(option.id)}
                  className="min-h-14 py-3"
                >
                  {option.label}
                </Checkbox>
              ))}
            </div>
          )}
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          {submitting ? (
            <p role="status" className="text-sm text-primary">
              Submitting your answers…
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              className="min-h-12 w-12 shrink-0 gap-2 bg-sage px-3 text-foreground hover:bg-mint sm:w-auto sm:px-5"
              disabled={currentSitting.currentIndex === 0 || submitting}
              onClick={goBack}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Back</span>
            </Button>
            {isLast ? (
              <Button
                type="button"
                className="min-h-12 min-w-0 flex-1 gap-2 px-3 sm:flex-none sm:px-6"
                disabled={!allLegal || submitting}
                onClick={() => void onSubmit()}
              >
                Submit answers
                <Check className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                className="min-h-12 min-w-0 flex-1 gap-2 sm:flex-none"
                disabled={!currentLegal || submitting}
                onClick={goNext}
              >
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
