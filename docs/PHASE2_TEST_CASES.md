# Phase 2 QA family and test cases

Use a dedicated non-production QA family. Parent display name: **Kavleen Test Parent**.

## Children
- **Aarav**, age profile 6: visual-first routine, recurring hand washing, outdoor-play trigger, 15-minute reading timer.
- **Maya**, age profile 10: homework sequence, 30-minute TV sessions with a 60-minute daily allowance, scheduled bedtime.

## Core regression cases
1. Parent can add, rename and reorder sections.
2. Parent can add an activity from the library, drag it to another section, and reorder with both drag/drop and arrow controls.
3. Each child keeps an independent routine.
4. A timed activity starts from the child screen and survives hiding/reopening the timer.
5. Timer gives configured warnings and completes at zero.
6. Completing Outdoor Play announces the triggered Wash Hands next step.
7. Recurring activities can be completed again without blocking the child.
8. Existing Phase 1 children are upgraded with a default routine.
9. Voice settings remain shared at the parent level and can be tested before saving.
10. Mobile layout remains usable at 320px width.
