'use client';

import { useParams } from 'next/navigation';
import { QuizLoading } from '../../../features/quiz/layout/quiz-screen';
import { QuizPlayer } from '../../../features/quiz/player/quiz-player';

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  if (!quizId) {
    return <QuizLoading />;
  }
  return <QuizPlayer quizId={quizId} />;
}
