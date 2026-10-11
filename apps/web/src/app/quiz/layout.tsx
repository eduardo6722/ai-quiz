import type { ReactNode } from 'react';
import { QuizScreen } from '../../features/quiz/layout/quiz-screen';

export default function QuizLayout({ children }: { children: ReactNode }) {
  return <QuizScreen>{children}</QuizScreen>;
}
