'use client';

import { useParams } from 'next/navigation';
import { QuizLoading } from '../../../../features/quiz/layout/quiz-screen';
import { QuizResults } from '../../../../features/quiz/results/quiz-results';

export default function QuizResultsPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  if (!quizId) {
    return <QuizLoading result />;
  }
  return <QuizResults quizId={quizId} />;
}
