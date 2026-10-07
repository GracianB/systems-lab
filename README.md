# Systems Lab

Interactive portfolio of Gracián Baena: games, customer operations and a local agent simulation.

Public site: https://gracianb.github.io/systems-lab/

## Local development

Node 24 or newer.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173/. No backend or API keys are needed.

## Quality and release

```sh
npm run check
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run build
```

`npm run check` runs executable startup regression tests, syntax checks, source contracts and byte budgets. The source layout audit does not claim pixel-level visual coverage.

Playwright loads the real site in Chromium, Firefox and WebKit at 320, 390, 768 and 1440 px. It checks ES/EN, theme persistence, modal focus, Escape, keyboard access, reduced motion, the embedded agent, overflow, console warnings/errors and failed local resources. It also injects unavailable storage/media/canvas/animation APIs and a receiver-sensitive transition method. WebKit coverage does not replace validation on actual Safari devices.

Both quality and deployment workflows run those tests. Deployment uses only the explicit public asset build in `dist/`, after all gates pass. Set GitHub Pages source to **GitHub Actions**. A PR is not a deployed release.

## Runtime

Desktop theme changes bind `startViewTransition` to `document`. Small screens use an immediate theme change to avoid browser snapshots intercepting iframe controls. Initial paint and controls work synchronously; animation failures and promise rejections cannot stop startup. Storage is optional. Canvas is decorative and disabled on small screens and with reduced motion. The mobile drawer traps focus, marks background content inert, closes on Escape and restores focus.

The CSP is delivered through HTML meta. It deliberately omits `frame-ancestors`, which requires an HTTP header. GitHub Pages does not supply custom response-header configuration for this project. The deck uses local assets and system font fallbacks.

## Agent demo

`bodytone-chatbot/frontend/` is a standalone simulation with fictional shipping, invoice and ticket responses. Files stay on the user's device; no uploads, API calls, tickets, credentials or microphone requests occur. Messages are rendered with `textContent`. Language and theme are synchronized with an origin- and source-checked message from the parent page.

The older widget sources remain in Git history; they are excluded from the public build.

## Limits

Static byte budgets measure actual file sizes, not Core Web Vitals. Browser assertions verify layout overflow and interactions; manual screenshots are still needed to assess visual composition. External project availability must be checked separately because another host can change independently of a release.
