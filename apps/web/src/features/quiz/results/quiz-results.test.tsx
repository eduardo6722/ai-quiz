import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizApiError, getQuiz, getResult } from '../shared/api-client';
import { saveSitting } from '../shared/attempt-session';
import { QuizResults } from './quiz-results';
import { makePublicQuiz, makePublicResult } from '../shared/test-fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('../shared/api-client', () => {
  const actual = jest.requireActual('../shared/api-client') as typeof import('../shared/api-client');
  return {
    ...actual,
    getQuiz: jest.fn(),
    getResult: jest.fn(),
  };
});

const mockedGetQuiz = getQuiz as jest.MockedFunction<typeof getQuiz>;
const mockedGetResult = getResult as jest.MockedFunction<typeof getResult>;

describe('QuizResults', () => {
  const quiz = makePublicQuiz(5);
  const result = makePublicResult(quiz);

  beforeEach(() => {
    sessionStorage.clear();
    mockedGetQuiz.mockReset();
    mockedGetResult.mockReset();
  });

  it('shows the stored score and source, and reveals feedback only on request', async () => {
    const user = userEvent.setup();
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'scored',
    });
    mockedGetQuiz.mockResolvedValue(quiz);
    mockedGetResult.mockResolvedValue(result);
    render(<QuizResults quizId="quiz-1" />);
    expect(await screen.findByLabelText('1.87 out of 4')).toBeInTheDocument();
    expect(screen.getByText('Weighted quiz score')).toBeInTheDocument();
    expect(screen.getByText('(46.83%)')).toBeInTheDocument();
    const showAnswers = screen.getByRole('button', { name: 'Show answers' });
    expect(showAnswers).toHaveAttribute('aria-expanded', 'false');
    expect(showAnswers).toHaveAttribute('aria-controls', 'answer-review');
    expect(document.getElementById('answer-review')).not.toBeVisible();
    expect(screen.queryByText('Prompt 1?')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument();
    expect(screen.queryByText('Your answer')).not.toBeInTheDocument();
    expect(screen.queryByText(/of 5 correct/i)).not.toBeInTheDocument();
    const source = screen.getByRole('link', { name: quiz.sourceUrl });
    expect(source).toHaveAttribute('href', 'https://example.com/README.md');
    expect(screen.getByRole('link', { name: 'Create another quiz' })).toHaveAttribute('href', '/');
    expect(window.location.search).not.toContain('token');
    await user.click(showAnswers);
    expect(screen.getByRole('button', { name: 'Hide answers' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Prompt 1?')).toBeInTheDocument();
    expect(document.getElementById('answer-review')).toBeVisible();
    expect(screen.getAllByText('Correct').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Incorrect').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Hide answers' }));
    expect(screen.queryByText('Prompt 1?')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show answers' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(mockedGetResult).toHaveBeenCalledTimes(1);
  });

  it('hides scores when the sitting token is missing', async () => {
    render(<QuizResults quizId="quiz-1" />);
    expect(
      await screen.findByText('This result cannot be shown from this browser sitting.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Weighted quiz score')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
  });

  it('does not link a non-https source URL', async () => {
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'scored',
    });
    mockedGetQuiz.mockResolvedValue({ ...quiz, sourceUrl: 'javascript:alert(1)' });
    mockedGetResult.mockResolvedValue(result);
    render(<QuizResults quizId="quiz-1" />);
    expect(await screen.findByText('javascript:alert(1)')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'javascript:alert(1)' })).not.toBeInTheDocument();
  });

  it('labels a fully correct two-option multi-select as Correct even when rawScore is 2', async () => {
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'scored',
    });
    const multi = makePublicQuiz(5);
    const scored = makePublicResult(multi);
    scored.questions[1] = {
      ...scored.questions[1]!,
      type: 'multiple',
      rawScore: 2,
      selectedOptionIds: [multi.questions[1]!.options[0]!.id, multi.questions[1]!.options[1]!.id],
      options: multi.questions[1]!.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === 0 || optionIndex === 1,
      })),
    };
    mockedGetQuiz.mockResolvedValue(multi);
    mockedGetResult.mockResolvedValue(scored);
    render(<QuizResults quizId="quiz-1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Show answers' }));
    const card = (await screen.findByText('Prompt 2?')).parentElement;
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('Correct')).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText('Incorrect')).not.toBeInTheDocument();
  });

  it('labels a partial multi-select as Incorrect', async () => {
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'scored',
    });
    const multi = makePublicQuiz(5);
    const scored = makePublicResult(multi);
    scored.questions[1] = {
      ...scored.questions[1]!,
      type: 'multiple',
      rawScore: 1,
      selectedOptionIds: [multi.questions[1]!.options[0]!.id],
      options: multi.questions[1]!.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === 0 || optionIndex === 1,
      })),
    };
    mockedGetQuiz.mockResolvedValue(multi);
    mockedGetResult.mockResolvedValue(scored);
    render(<QuizResults quizId="quiz-1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Show answers' }));
    const card = (await screen.findByText('Prompt 2?')).parentElement;
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('Incorrect')).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText('Correct')).not.toBeInTheDocument();
  });

  it('does not show correctness when the attempt is not scored', async () => {
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'open',
    });
    mockedGetQuiz.mockResolvedValue(quiz);
    mockedGetResult.mockRejectedValue(new QuizApiError('ATTEMPT_NOT_SCORED', 'open'));
    render(<QuizResults quizId="quiz-1" />);
    expect(await screen.findByText('Submit your answers to see the result.')).toBeInTheDocument();
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
  });
});
