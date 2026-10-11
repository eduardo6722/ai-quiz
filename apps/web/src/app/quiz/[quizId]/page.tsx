'use client';

import { useParams } from 'next/navigation';
import { QuizPlayer } from '../../../features/quiz/quiz-player';
import { QuizLoading } from '../../../features/quiz/quiz-screen';

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  if (!quizId) {
    return <QuizLoading />;
  }
  return <QuizPlayer quizId={quizId} />;
}
