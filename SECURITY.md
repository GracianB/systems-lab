# Security

Systems Lab is a public portfolio and demonstration repository.

## Scope

Security-sensitive areas include:

- browser-executed JavaScript and HTML;
- external scripts, fonts, frames and links;
- client-side storage and browser permissions;
- CI configuration and published GitHub Pages assets.

## Rules

Never commit API keys, private keys, access tokens, credentials or production secrets.

Demo code must remain deterministic and must not imply that a browser-only simulation is a production integration.

User-controlled values must be rendered as text or sanitized before entering HTML.

Changes to navigation, dialogs, forms, microphone access or external integrations must preserve keyboard, screen-reader and reduced-motion behavior.

## Reporting

For a suspected security issue, do not publish secrets or exploit details in a public issue. Contact the repository owner privately through the contact channels listed in the portfolio hub.
