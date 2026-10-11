import { parseApiEnv } from '../../src/platform/config/env';

describe('API environment validation', () => {
  const valid = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ai_quiz',
    PORT: '3001',
    NODE_ENV: 'test',
  };

  it('accepts a valid PostgreSQL URL and default port', () => {
    const env = parseApiEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.PORT).toBe(3001);
  });

  it('fails closed when DATABASE_URL is missing and names the key without leaking a secret', () => {
    expect(() => parseApiEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    try {
      parseApiEnv({ ...valid, DATABASE_URL: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      expect(message).not.toMatch(/postgres:postgres/);
    }
  });

  it('fails closed when DATABASE_URL is malformed and does not log the secret value', () => {
    const secret = 'postgresql://super-secret-user:super-secret-pass@localhost:5432/ai_quiz';
    expect(() => parseApiEnv({ ...valid, DATABASE_URL: 'not-a-url' })).toThrow(/DATABASE_URL/);
    try {
      parseApiEnv({ ...valid, DATABASE_URL: secret.replace('postgresql', 'notaurl') });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      expect(message).not.toContain('super-secret-pass');
    }
  });

  it('does not require OPENAI_API_KEY, OPENAI_MODEL, or Langfuse keys to boot', () => {
    const env = parseApiEnv({
      ...valid,
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: undefined,
      LANGFUSE_PUBLIC_KEY: undefined,
      LANGFUSE_SECRET_KEY: undefined,
      LANGFUSE_BASE_URL: undefined,
      PROMPT_VERSION: undefined,
      EVAL_JUDGE_MODEL: undefined,
    });
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.EVAL_JUDGE_MODEL).toBeUndefined();
    expect(env.OPENAI_MODEL).toBeUndefined();
    expect(env.LANGFUSE_PUBLIC_KEY).toBeUndefined();
    expect(env.LANGFUSE_SECRET_KEY).toBeUndefined();
  });

  it('accepts optional Langfuse keys when present and still boots with public-only keys', () => {
    const withBoth = parseApiEnv({
      ...valid,
      LANGFUSE_PUBLIC_KEY: 'pk-lf-example',
      LANGFUSE_SECRET_KEY: 'sk-lf-example',
      LANGFUSE_BASE_URL: 'https://cloud.langfuse.com',
      PROMPT_VERSION: 'quiz-v1',
    });
    expect(withBoth.LANGFUSE_PUBLIC_KEY).toBe('pk-lf-example');
    expect(withBoth.PROMPT_VERSION).toBe('quiz-v1');
    expect(withBoth.LANGFUSE_SECRET_KEY).toBe('sk-lf-example');

    const publicOnly = parseApiEnv({
      ...valid,
      LANGFUSE_PUBLIC_KEY: 'pk-lf-example',
      LANGFUSE_SECRET_KEY: undefined,
    });
    expect(publicOnly.LANGFUSE_PUBLIC_KEY).toBe('pk-lf-example');
    expect(publicOnly.LANGFUSE_SECRET_KEY).toBeUndefined();
    expect(JSON.stringify(publicOnly)).not.toMatch(/sk-/);
  });

  it('defaults WEB_ORIGIN to the local web app and rejects an invalid URL', () => {
    const env = parseApiEnv({ ...valid, WEB_ORIGIN: undefined });
    expect(env.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(parseApiEnv({ ...valid, WEB_ORIGIN: '' }).WEB_ORIGIN).toBe('http://localhost:3000');
    expect(() => parseApiEnv({ ...valid, WEB_ORIGIN: 'not-a-url' })).toThrow(/WEB_ORIGIN/);
  });

  it('accepts empty OpenAI fields at parse time without printing secrets', () => {
    const env = parseApiEnv({
      ...valid,
      OPENAI_API_KEY: '',
      OPENAI_MODEL: 'gpt-6-luna',
    });
    expect(env.OPENAI_API_KEY).toBe('');
    expect(env.OPENAI_MODEL).toBe('gpt-6-luna');
    expect(JSON.stringify(env)).not.toMatch(/sk-/);
  });
});
