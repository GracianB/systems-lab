# Systems Lab P30 · Release review

Status: five implementation phases prepared on a separate branch. This document is **not** a public deployment certificate.

Required before merging:
- Node syntax / i18n / security / static performance gates pass on PR HEAD.
- Chromium, Firefox, WebKit and both mobile emulations pass via one explicit Playwright config.
- GitHub Actions visual baseline comparison produces before/after screenshots and HTML report for ES/EN, dark/light, 390/1440px; a human reviews the intentional design changes.
- No dead access links, localhost public CTA, private source exposure or unexpected media autoplay.
- After merge, Quality and Deploy must pass on `main`, and production smoke must be checked separately.

Screenshots and a green code gate do not alone certify aesthetic quality or a production deploy.
