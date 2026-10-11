import { publicQuizViewSchema } from './public-quiz.js';

function question(index: number) {
  return {
    id: `q${index}`,
    position: index,
    prompt: `Prompt ${index}`,
    type: 'single' as const,
    options: [0, 1, 2, 3].map((position) => ({
      id: `q${index}-${position}`,
      position,
      label: `Label ${position}`,
    })),
  };
}

function view() {
  return {
    id: 'quiz-1',
    topic: 'Hexagonal architecture',
    sourceUrl: 'https://example.com/README.md',
    questions: [0, 1, 2, 3, 4].map(question),
  };
}

describe('publicQuizViewSchema', () => {
  it('accepts five questions with four label-only options', () => {
    expect(publicQuizViewSchema.parse(view()).questions).toHaveLength(5);
  });

  it('rejects isCorrect on options', () => {
    const payload = view();
    (payload.questions[0]!.options[0] as { isCorrect?: boolean }).isCorrect = true;
    expect(() => publicQuizViewSchema.parse(payload)).toThrow();
  });

  it('rejects scoring fields on the quiz view', () => {
    expect(() => publicQuizViewSchema.parse({ ...view(), weightedScore: 4 })).toThrow();
  });

  it('rejects sourceExcerpt and modelId on the public quiz view', () => {
    expect(() => publicQuizViewSchema.parse({ ...view(), modelId: 'gpt-6-luna' })).toThrow();
    const payload = view();
    (payload.questions[0] as { sourceExcerpt?: string }).sourceExcerpt = 'Ports are interfaces';
    expect(() => publicQuizViewSchema.parse(payload)).toThrow();
  });
});
