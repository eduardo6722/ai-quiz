import type { ReactNode } from 'react';
import { QuizScreen } from '../../features/quiz/quiz-screen';

export default function QuizLayout({ children }: { children: ReactNode }) {
  return <QuizScreen>{children}</QuizScreen>;
}
