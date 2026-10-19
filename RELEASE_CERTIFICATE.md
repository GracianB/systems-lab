# Systems Lab P30 · Release record

**Status: merged and deployed · 19 October 2026**

This document records the completed GitHub-controlled release of the five-phase Systems Lab simplification. It is not a claim that every third-party link was independently smoke-tested from an external network.

## GitHub evidence

- [PR #30](https://github.com/GracianB/systems-lab/pull/30) merged at 2026-10-19 01:50 UTC.
- Merge commit on `main`: [`48e0de20`](https://github.com/GracianB/systems-lab/commit/48e0de200f18d77c59a1397c69df7aa7f7144549).
- [PR checks](https://github.com/GracianB/systems-lab/actions/runs/39186871669): **success**, including 78 browser tests passing, seven deliberate skips, 102 strict source/security checks and the before/after screenshot job.
- [Post-merge Quality](https://github.com/GracianB/systems-lab/actions/runs/39187168311): **success**.
- [GitHub Pages Deploy](https://github.com/GracianB/systems-lab/actions/runs/39187168328): **success**, following its own verify/build job.

## Functional and visual scope

The homepage has one four-destination explorer; OHANA has a wide playable-game feature; Vórtice runs only on demand; Aigoritmo shows a public visual explanation without localhost links; RevOps is a sample-data public demo; Cutter remains private. Bodytone is the real support case and the fictional agent loads only after expansion.

The CI-produced comparison included **16 browser screenshots** covering 390/1440 px, ES/EN, dark/light. Measured viewport outcomes include:

| Scenario | Hero before | Hero after | Full-page before | Full-page after |
| --- | ---: | ---: | ---: | ---: |
| 390 px ES dark | 1,909 px | 588 px | 9,132 px | 5,379 px |
| 1440 px ES dark | 1,015 px | 667 px | 5,686 px | 4,388 px |

The screenshots were visually inspected during PR review. Automated assertions verify overflow and elements, not taste, human usability, or Core Web Vitals.

## Boundaries

- A successful deploy job verifies GitHub Pages published the artifact. A separate external-browser HTTP smoke of the final public URL was **not** available in the reviewing environment.
- External links, third-party services and all production integrations have their own availability and authorization boundaries.
- No secrets or private Aigoritmo/Cutter code are published by this portfolio.
- Future functional or design changes use separate PRs. The old `v5.0.0` tag stays untouched.
