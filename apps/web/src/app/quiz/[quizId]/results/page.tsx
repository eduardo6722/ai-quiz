'use client';

import { useParams } from 'next/navigation';
import { QuizResults } from '../../../../features/quiz/quiz-results';
import { QuizLoading } from '../../../../features/quiz/quiz-screen';

export default function QuizResultsPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  if (!quizId) {
    return <QuizLoading result />;
  }
  return <QuizResults quizId={quizId} />;
}
