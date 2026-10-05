# Systems Lab Performance Budget

## Final release target

The public lab keeps a small dependency-free budget for its first-party surface.

| Asset | Budget |
| --- | ---: |
| `index.html` | 18 KB |
| `styles.css` | 42 KB |
| `main.js` | 18 KB |
| `i18n.js` | 9 KB |
| `boot.js` | 1 KB |
| Agent `demo.js` | 10 KB |
| Agent `demo.css` | 10 KB |
| Aggregate | 108 KB |

The budget is checked by `npm run audit:performance`.

The page also avoids unnecessary runtime work through deferred JavaScript, capped decorative rendering, reduced-motion handling and offscreen content containment.
