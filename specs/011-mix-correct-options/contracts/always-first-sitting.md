# Contract: Always-first sitting

Pinned definition for spec FR-004 / SC-001. Used by mix repair and by automated tests. Not a public API and not stored.

## Selection rule

For each question in quiz order:

| `type` | Selection |
| ------ | --------- |
| `single` | The option with `position === 0` only. |
| `multiple` | Every option with `position < N`, where `N` is the number of options with `isCorrect === true`. |

Submit those option **ids** through the existing grade path.

## Exempt question

If all four options are `isCorrect`, always-first and true-key both earn that question’s full credit. Mixing MAY reorder it. Do not use an exempt question as the only evidence that the exploit is defeated.

## True-key sitting (comparison)

Select every option with `isCorrect === true` (by identity), none of the others. Per-question raw scores MUST match existing policy (single: 4 or 0; multiple: one point per correctly selected option, bounded 0–4). Weighted score uses existing `1.1 ** index`.

## Pass / fail

On a newly created quiz that contains at least one non-exempt question:

- **Fail (exploit still open)**: always-first weighted score **equals** true-key weighted score.
- **Pass (required)**: always-first weighted score **is strictly less than** true-key weighted score.

## Canonical 4.00 fixture

Five or more **single-answer** questions whose **generated** key is `isCorrect` only at original slot 0.

| Sitting | Weighted score after mix |
| ------- | ------------------------ |
| True-key | **4.00** (unrounded 4) |
| Always-first | **< 4** |

This is the SC-001 fixture. Mixed-type quizzes (e.g. `sampleQuiz`: four singles + one two-correct multiple) MUST still satisfy always-first **<** true-key; true-key there is not 4.00 under the current multiple-answer policy.

## Display-slot diversity

Across the canonical fixture after mix, the set of positions that hold a correct option MUST have size ≥ 2 (not “correct is always slot 1”).
