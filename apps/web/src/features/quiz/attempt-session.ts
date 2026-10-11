export type AttemptStatus = "open" | "scored";

export type AttemptSitting = {
  attemptId: string;
  token: string;
  currentIndex: number;
  selections: Record<string, string[]>;
  status: AttemptStatus;
};

export function sittingStorageKey(quizId: string): string {
  return `ai-quiz.attempt.${quizId}`;
}

export function playerPath(quizId: string): string {
  return `/quiz/${quizId}`;
}

export function resultsPath(quizId: string): string {
  return `/quiz/${quizId}/results`;
}

export function loadSitting(quizId: string): AttemptSitting | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(sittingStorageKey(quizId));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AttemptSitting;
    if (
      typeof parsed.attemptId !== "string" ||
      typeof parsed.token !== "string" ||
      typeof parsed.currentIndex !== "number" ||
      (parsed.status !== "open" && parsed.status !== "scored") ||
      typeof parsed.selections !== "object" ||
      parsed.selections === null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSitting(quizId: string, sitting: AttemptSitting): void {
  sessionStorage.setItem(sittingStorageKey(quizId), JSON.stringify(sitting));
}

export function clearSitting(quizId: string): void {
  sessionStorage.removeItem(sittingStorageKey(quizId));
}

const pendingStarts = new Map<string, Promise<AttemptSitting>>();

export async function ensureOpenSitting(
  quizId: string,
  start: () => Promise<{ attemptId: string; token: string }>,
): Promise<AttemptSitting> {
  const existing = loadSitting(quizId);
  if (existing) {
    return existing;
  }
  const pending = pendingStarts.get(quizId);
  if (pending) {
    return pending;
  }
  const promise = start()
    .then((started) => {
      const raced = loadSitting(quizId);
      if (raced) {
        return raced;
      }
      const sitting: AttemptSitting = {
        attemptId: started.attemptId,
        token: started.token,
        currentIndex: 0,
        selections: {},
        status: "open",
      };
      saveSitting(quizId, sitting);
      return sitting;
    })
    .finally(() => {
      pendingStarts.delete(quizId);
    });
  pendingStarts.set(quizId, promise);
  return promise;
}
