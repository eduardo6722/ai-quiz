import { ApplicationError } from '../errors.js';
import { SAMPLE_SNAPSHOT } from '../testing/quiz-fixture.js';
import { assertSourceSufficient, countUniqueClaims } from './source-sufficiency.js';

export const HEADING_ONLY = '# Notes\n';
export const COMMENTS_ONLY = '<!-- badge chrome only -->';
export const REPEATED_SENTENCE = 'Ports are interfaces the core depends on. '.repeat(12);
export const ONE_SECTION = `# Setup

Install the widget with npm to add routing helpers to your application.
`;
export const SIX_CLAIM_BODY = `Ports are interfaces the core depends on.
Adapters implement those ports at the edges of the system.
Scoring is deterministic and never decided by a model.
The application core stays free of HTTP clients and SDKs.
Ready quizzes never expose answer keys before submit.
Each question must offer exactly four distinct option labels.
`;

describe('countUniqueClaims', () => {
  it('counts empty and whitespace-only text as zero claims', () => {
    expect(countUniqueClaims('')).toBe(0);
    expect(countUniqueClaims('   \n\t  ')).toBe(0);
  });

  it('counts heading-only Markdown as zero claims', () => {
    expect(countUniqueClaims(HEADING_ONLY)).toBe(0);
  });

  it('counts comment-only Markdown as zero claims', () => {
    expect(countUniqueClaims(COMMENTS_ONLY)).toBe(0);
  });

  it('counts a repeated identical sentence as one claim regardless of length', () => {
    expect(countUniqueClaims(REPEATED_SENTENCE)).toBe(1);
    expect(REPEATED_SENTENCE.length).toBeGreaterThan(200);
  });

  it('counts the canonical one-section body as one claim', () => {
    expect(countUniqueClaims(ONE_SECTION)).toBe(1);
  });

  it('counts six distinct keepable sentences as six claims', () => {
    expect(countUniqueClaims(SIX_CLAIM_BODY)).toBe(6);
  });

  it('counts the expanded sample snapshot as at least eight claims', () => {
    expect(countUniqueClaims(SAMPLE_SNAPSHOT)).toBeGreaterThanOrEqual(8);
  });
});

describe('assertSourceSufficient', () => {
  it('throws SOURCE_UNUSABLE when unique claims are fewer than the requested count', () => {
    expect(() => assertSourceSufficient(ONE_SECTION, 8)).toThrow(ApplicationError);
    try {
      assertSourceSufficient(ONE_SECTION, 8);
    } catch (error) {
      expect(error).toMatchObject({ code: 'SOURCE_UNUSABLE' });
    }
    expect(() => assertSourceSufficient(SIX_CLAIM_BODY, 8)).toThrow(ApplicationError);
    expect(() => assertSourceSufficient('', 5)).toThrow(ApplicationError);
  });

  it('does not throw when unique claims meet the requested count', () => {
    expect(() => assertSourceSufficient(SIX_CLAIM_BODY, 5)).not.toThrow();
    expect(() => assertSourceSufficient(SAMPLE_SNAPSHOT, 5)).not.toThrow();
    expect(() => assertSourceSufficient(SAMPLE_SNAPSHOT, 8)).not.toThrow();
  });
});
