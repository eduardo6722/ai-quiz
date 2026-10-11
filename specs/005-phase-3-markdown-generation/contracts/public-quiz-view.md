# Get quiz (HTTP)

`GET /v1/quizzes/:quizId`  
No attempt token.

**Unchanged** from Phase 2 aside from data origin: questions now come from fetched Markdown + model output instead of fixtures.

Success body is the Phase 1/2 **public quiz view**. **MUST NOT** contain `isCorrect`, scores, tokens, `sourceExcerpt`, `modelId`, prompts-to-the-model, or API keys.

`sourceUrl` in the view is the stored **original** requested URL (not necessarily the raw GitHub URL).

Unknown `quizId` → `QUIZ_NOT_FOUND` (404). Non-ready quiz → `QUIZ_NOT_PLAYABLE` (409).

Start-attempt, submit, and result contracts remain [Phase 2](../../004-phase-2-persistence-api/contracts/start-attempt.md).
