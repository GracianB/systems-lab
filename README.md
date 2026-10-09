<div align="center">

# Systems Lab

### Ideas that work. Systems that hold up.

**Gracián Baena · Product engineering · Customer Success · Data · Applied AI**

[Explore the lab ↗](https://gracianb.github.io/systems-lab/) · [Quality Gate](https://github.com/GracianB/systems-lab/actions/workflows/quality.yml) · [Deployment](https://github.com/GracianB/systems-lab/actions/workflows/deploy.yml)

**Public technical portfolio · maintained release**

</div>

---

Systems Lab connects people, data and action through systems you can explore. Games, customer operations and a local agent simulation share one small, bilingual interface. Two roadmap slots prepare the next systems without presenting unfinished work as a working product.

The point is to make the work visible: what it does, how it behaves, and where the evidence ends.

## The systems

| System | Focus | Status / evidence |
| --- | --- | --- |
| [OHANA](https://gracianb.github.io/project-ohana/) | Game and product engineering: rooms, characters and transformations | Public playable project; maintained in its own repository |
| [VÓRTICE](https://vortex-gilt-xi.vercel.app/) | Creative interactive development and WebGL | Public interactive prototype |
| [BODYTONE](https://bodytonehelp.zendesk.com/hc/es) | Customer Success and Support Ops | Public Zendesk Help Center; the portfolio describes the work, it does not audit private workflows |
| AGENT | Applied AI interaction for shipping, invoices and tickets | Local simulation with fictional responses; no backend |
| REVOPS | Signals, metrics and context → decisions → operational action | **BUILDING**; roadmap card with no project link |
| CONTENT ENGINE | YouTube → Shorts → Publish | **BUILDING**; planned moment selection, vertical clips, copy/metadata and automated distribution |

**The project should state what it proves, not quietly upgrade evidence into marketing.**

The BUILDING cards are intentional. They reserve space for future work, without a dead link or a launch claim. When a system is ready, replace its placeholder treatment with a real preview, add its URL and change its status to LIVE. Its implementation belongs in its own repository.

## A small surface, held to a real standard

The current site brings together responsive composition, ES/EN content, persistent themes, keyboard navigation and an embedded agent demo. Decorative effects stay optional. Controls must still work when storage, canvas, animation or browser transition APIs are unavailable.

```text
Systems Lab · static public site
│
├── index.html + styles.css       Layout, projects and roadmap slots
├── boot.js + main.js + i18n.js   Startup, interaction, themes and ES/EN
├── bodytone-chatbot/frontend/   Standalone local agent simulation
│
└── checks → browser tests → explicit dist/ build → GitHub Pages
```

There is no application backend or build framework. The public build copies an explicit asset list into `dist/`; older widget sources are excluded.

### Decisions that matter

- Desktop theme changes bind `startViewTransition` to `document`. Small screens change themes immediately so browser snapshots do not intercept iframe controls. The receiver-sensitive Firefox failure is covered by a regression test.
- Initial paint and controls start synchronously. Animation failures and rejected promises cannot stop startup. Storage is optional; decorative canvas is disabled on small screens and with reduced motion.
- The mobile drawer traps focus, marks the background inert, closes on Escape and restores focus. Parent-to-demo settings messages check origin and source.
- Assets are local, with system font fallbacks. The HTML meta CSP omits `frame-ancestors`, which requires an HTTP header; this GitHub Pages deployment does not configure custom response headers.

### Agent demo and privacy

`bodytone-chatbot/frontend/` simulates shipping, invoice and ticket responses. Files remain on the user's device. It makes no uploads, API calls, real tickets, credential requests or microphone requests. Messages use `textContent`. Language and theme follow the parent page through checked messages.

The demo shows an interaction pattern. It is not evidence of a deployed AI integration.

## Run locally

Node **24 or newer**. No backend or API keys are needed.

```sh
npm ci
npm start
```

Open [127.0.0.1:4173](http://127.0.0.1:4173/).

## Validate a release

```sh
npm run check
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run build
```

`npm run check` runs startup regression tests, syntax checks, source contracts and byte budgets. Playwright exercises the real site in Chromium, Firefox and WebKit at 320, 390, 768 and 1440 px: ES/EN, theme persistence, focus, Escape, keyboard access, reduced motion, the agent, overflow, console warnings/errors and failed local resources. It also injects unavailable APIs and a receiver-sensitive transition method.

Both quality and deployment workflows run the gates. Deployment publishes only `dist/` after they pass. GitHub Pages must use **GitHub Actions** as its source. A PR is not a deployed release.

The source layout audit is not pixel-level visual coverage. Byte budgets are not Core Web Vitals. WebKit tests do not replace actual Safari device checks. External projects have independent availability and release cycles.

## Narrative and design contract

The site tells a deliberate story: **ideas → playable systems → a real operations case → an honest local simulation → what is coming later**. Every section must answer a different question rather than repeat the cover.

The homepage opens directly on its actual hero, “Ideas that work”. The cyan wand is an understated supporting symbol, not a separate gateway. Dark and light modes retain the independent technical palette, away from the graphite-and-beige Deck and botanical-green Yoga.

The final portfolio scope is the existing public projects, local agent simulation and two explicitly marked BUILDING slots. No unfinished roadmap item becomes a public product just because it appears in the portfolio.

Close the release when the final commit is on local and remote `main`, the Quality Gate is green, production deployment succeeds and the public site serves the final cards. The existing `v5.0.0` tag records the original V5 release; this closure follows it without rewriting that tag.

After closure, changes require a concrete product, accessibility or maintenance reason. RevOps and Content Engine evolve separately. Promoting a card to LIVE is a small, deliberate update, with real evidence and a working link.

## The engineering journey

**7 October 2026.** Systems Lab V5 was not built to be closed because we were tired. It was built to be closed when it was finished.

The final stretch took days of iteration across design, runtime, accessibility, security, CI and deployment. V4.1 had already been certified when a real Firefox failure exposed a bad `startViewTransition` receiver. The failure became a regression test.

There were broken runs, protection rules, a local checkout that lost its `.git` directory, another clean clone, more tests and another verification. The finish line was never just a merge button. It was the code, the checks and the public result agreeing with each other.

> Effort, work, and not giving up.<br>
> Do not close because you are tired. Close when it is finished.<br>
> Fail, understand why, fix it, and turn the failure into protection for the future.

**That is the part of V5 worth remembering. ❤️**
