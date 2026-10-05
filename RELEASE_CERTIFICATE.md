# Systems Lab 4.1.0

## Release Certificate

**Status:** FROZEN  
**Release:** 4.1.0  
**Certified:** 2026-10-05

### Final state

- Main branch contains the 4.1.0 release.
- Quality Gate is green on the final release branch history.
- Visual regression contract is included in `npm run check`.
- First-party performance budgets are included in `npm run check`.
- No open feature work remains in the Systems Lab release path.
- `ohana-proof` remains preserved and outside the release scope.
- Future changes are restricted to critical fixes, security patches, broken public links and infrastructure maintenance.

### Final acceptance surface

**Experience:** dark/light visual system, bilingual UI, responsive layouts, interactive demos.  
**Quality:** strict static audit, visual regression contract and performance budgets.  
**Security:** CSP, self-hosted sanitizer, source-tree secret scans and risky-API checks.  
**Operations:** main is the production line; feature work is not part of the frozen release.

### Maintenance policy

After certification, Systems Lab is treated as a frozen public portfolio surface. Changes are allowed only when necessary to preserve security, functionality, availability or public-link integrity.
