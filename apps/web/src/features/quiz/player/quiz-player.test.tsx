import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizApiError, getQuiz, startAttempt, submitAttempt } from '../api/api-client';
import { saveSitting } from '../session/attempt-session';
import { QuizPlayer } from './quiz-player';
import { makePublicQuiz } from '../testing/test-fixtures';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('../api/api-client', () => {
  const actual = jest.requireActual('../api/api-client') as typeof import('../api/api-client');
  return {
    ...actual,
    getQuiz: jest.fn(),
    startAttempt: jest.fn(),
    submitAttempt: jest.fn(),
  };
});

const mockedGetQuiz = getQuiz as jest.MockedFunction<typeof getQuiz>;
const mockedStart = startAttempt as jest.MockedFunction<typeof startAttempt>;
const mockedSubmit = submitAttempt as jest.MockedFunction<typeof submitAttempt>;

function questionAt(quiz: ReturnType<typeof makePublicQuiz>, index: number) {
  const question = quiz.questions[index];
  if (!question) {
    throw new Error(`missing question ${index}`);
  }
  return question;
}

function optionLabel(question: ReturnType<typeof questionAt>, index: number) {
  const option = question.options[index];
  if (!option) {
    throw new Error(`missing option ${index}`);
  }
  return option.label;
}

async function renderReady(count = 5) {
  const quiz = makePublicQuiz(count);
  mockedGetQuiz.mockResolvedValue(quiz);
  mockedStart.mockResolvedValue({ attemptId: 'attempt-1', token: 'a'.repeat(32) });
  render(<QuizPlayer quizId="quiz-1" />);
  await screen.findByText('Question 1 of ' + String(count));
  return quiz;
}

describe('QuizPlayer', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockedGetQuiz.mockReset();
    mockedStart.mockReset();
    mockedSubmit.mockReset();
  });

  it('starts an attempt, hides keys, and submits every question', async () => {
    const user = userEvent.setup();
    const quiz = await renderReady(5);
    expect(mockedStart).toHaveBeenCalledWith('quiz-1');
    expect(screen.queryByText(/isCorrect/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/rawScore|weightedScore|isCorrect/);

    mockedSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      weightedScore: 1.87,
      weightedScoreDisplay: 1.87,
      percentageDisplay: 46.83,
      questions: [],
    } as never);

    for (let index = 0; index < quiz.questions.length; index += 1) {
      const question = questionAt(quiz, index);
      await user.click(
        screen.getByRole(question.type === 'single' ? 'radio' : 'checkbox', {
          name: optionLabel(question, 0),
        }),
      );
      if (index < quiz.questions.length - 1) {
        await user.click(screen.getByRole('button', { name: 'Next' }));
      }
    }
    await user.click(screen.getByRole('button', { name: 'Submit answers' }));
    await waitFor(() => expect(mockedSubmit).toHaveBeenCalled());
    const payload = mockedSubmit.mock.calls[0]?.[2];
    if (!payload) {
      throw new Error('submit was not called');
    }
    expect(payload.answers).toHaveLength(5);
    expect(payload.answers.map((answer) => answer.questionId)).toEqual(
      quiz.questions.map((question) => question.id),
    );
    expect(mockPush).toHaveBeenCalledWith('/quiz/quiz-1/results');
    expect(mockPush.mock.calls[0][0]).not.toContain('token');
  });

  it('uses radios for single, checkboxes for multiple, and keeps selections on Back', async () => {
    const user = userEvent.setup();
    const quiz = await renderReady(6);
    expect(screen.getByText('Select one answer.')).toBeInTheDocument();
    const first = questionAt(quiz, 0);
    const firstA = screen.getByRole('radio', { name: optionLabel(first, 0) });
    const firstB = screen.getByRole('radio', { name: optionLabel(first, 1) });
    await user.click(firstA);
    await user.click(firstB);
    expect(firstB).toBeChecked();
    expect(firstA).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Question 2 of 6')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prompt 2?' })).toHaveFocus();
    expect(screen.getByText('Select all that apply.')).toBeInTheDocument();
    const second = questionAt(quiz, 1);
    const secondA = screen.getByRole('checkbox', { name: optionLabel(second, 0) });
    const secondB = screen.getByRole('checkbox', { name: optionLabel(second, 1) });
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(secondA);
    await user.click(secondB);
    expect(secondA).toBeChecked();
    expect(secondB).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('radio', { name: optionLabel(first, 1) })).toBeChecked();
  });

  it('skips startAttempt when an open sitting exists and redirects when scored', async () => {
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'open',
    });
    await renderReady(5);
    expect(mockedStart).not.toHaveBeenCalled();

    sessionStorage.clear();
    saveSitting('quiz-1', {
      attemptId: 'attempt-1',
      token: 'a'.repeat(32),
      currentIndex: 0,
      selections: {},
      status: 'scored',
    });
    mockedGetQuiz.mockResolvedValue(makePublicQuiz());
    render(<QuizPlayer quizId="quiz-1" />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/quiz/quiz-1/results'));
  });

  it('shows unavailable copy without options when the quiz is missing', async () => {
    mockedGetQuiz.mockRejectedValue(new QuizApiError('QUIZ_NOT_FOUND', 'missing'));
    render(<QuizPlayer quizId="missing" />);
    expect(await screen.findByText('This quiz is not available.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create another quiz' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('locks answers while submitting and keeps selections when submission fails', async () => {
    const user = userEvent.setup();
    const quiz = await renderReady(5);
    let rejectSubmission: (reason: Error) => void = () => undefined;
    mockedSubmit.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectSubmission = reject;
        }),
    );
    for (let index = 0; index < quiz.questions.length; index += 1) {
      const question = questionAt(quiz, index);
      await user.click(
        screen.getByRole(question.type === 'single' ? 'radio' : 'checkbox', {
          name: optionLabel(question, 0),
        }),
      );
      if (index < quiz.questions.length - 1) {
        await user.click(screen.getByRole('button', { name: 'Next' }));
      }
    }
    await user.click(screen.getByRole('button', { name: 'Submit answers' }));
    expect(screen.getByRole('status')).toHaveTextContent('Submitting your answers…');
    expect(screen.getByRole('button', { name: 'Submit answers' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    for (const option of screen.getAllByRole('radio')) {
      expect(option).toBeDisabled();
    }
    await act(async () => {
      rejectSubmission(new QuizApiError('NETWORK', 'offline'));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the quiz service. Try again.',
    );
    expect(screen.getByRole('button', { name: 'Submit answers' })).toBeEnabled();
    const last = questionAt(quiz, 4);
    expect(
      screen.getByRole(last.type === 'single' ? 'radio' : 'checkbox', {
        name: optionLabel(last, 0),
      }),
    ).toBeChecked();
  });

  it('does not label a selected option as correct before submit', async () => {
    const user = userEvent.setup();
    const quiz = await renderReady(5);
    const firstQuestion = questionAt(quiz, 0);
    await user.click(screen.getByRole('radio', { name: optionLabel(firstQuestion, 0) }));
    const row = screen.getByRole('radio', { name: optionLabel(firstQuestion, 0) }).closest('label');
    expect(row).not.toHaveTextContent(/correct/i);
    expect(within(row as HTMLElement).queryByText('Incorrect')).not.toBeInTheDocument();
  });
});
