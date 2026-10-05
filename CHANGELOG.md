# Changelog

## 4.1.0 · 2026-10-05

### Visual
- Finalized the dark and light design systems with distinct palettes, surface hierarchy and responsive treatment.
- Added a smoother theme transition path with reduced-motion fallback.
- Tightened visual hierarchy for navigation, hero, cards, controls and technical stages.

### Evidence
- Added dependency-free visual regression and performance budget checks.
- Documented first-party performance budgets and final release acceptance criteria.
- Updated public asset cache versions for the 4.1 release.

### Release
- Systems Lab is now prepared for frozen portfolio status.
- `ohana-proof` remains outside the release scope.

## 4.0.0 · 2026-10-05

### Experience
- Refined the Systems Lab visual system for stronger hierarchy, status signaling, depth and responsive behavior.
- Added contextual navigation state, improved mobile navigation, richer focus states and adaptive motion.
- Added a compact live-status signal to make the public surface immediately legible.

### Agent demo
- Reworked the public demo styling around the Systems Lab visual language.
- Hardened file intake with file-count, size and MIME constraints.
- Restricted demo API interception to same-origin paths.
- Hardened Markdown URL handling, action attributes and dynamic file-chip rendering.
- Self-hosted DOMPurify 3.4.16 to reduce third-party runtime dependency risk.

### Security
- Added a strict Content Security Policy for the public lab.
- Expanded the quality gate to scan the repository source tree for secrets and risky browser APIs.
- Added automated checks for dynamic `innerHTML`, JavaScript syntax, agent security contracts and accessibility contracts.
- Added a public SECURITY.md policy and repository editing baseline.

### Performance
- Added low-power particle budgets and a capped decorative frame budget.
- Deferred offscreen sections with `content-visibility` and reduced mobile blur work.
- Deferred notification audio loading in the agent demo.

### Quality
- Removed retired integrations and translation keys.
- Kept `ohana-proof` untouched.
- Main branch remains the single production line for Systems Lab.
