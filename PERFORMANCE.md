# Performance budgets

Run `npm run audit:performance` for uncompressed file-byte limits. The deck uses local assets and system fonts; the public build excludes old integrations, audio and large widget images.

Canvas caps device pixel ratio and particle count, throttles frames, pauses when the document is hidden and is skipped below 900 px or under reduced motion. The interface remains usable when canvas or animation APIs are unavailable.

These budgets measure source transfer size; they are not measured LCP, INP or CLS scores. Browser smoke tests check viewport overflow and functional behavior. Capture real-device field data separately before making Core Web Vitals claims.
