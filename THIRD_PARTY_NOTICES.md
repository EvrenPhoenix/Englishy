# Third-party notices

The code written for Englishy is under the MIT licence (see `LICENSE`). The components below come from other authors and keep their own licences.

The npm packages are not committed: `npm ci` installs them into `node_modules/` and `frontend/node_modules/`, and the build bundles them into the live Worker. Versions are the ones pinned in `package.json`, `frontend/package.json` and their lockfiles; licences are the `license` field of each installed `package.json`.

## Lexend (font)

- Version: 1.007 (from the font files' name table)
- Licence: OFL-1.1, full text in `frontend/src/styles/fonts/OFL.txt`
- In this repository: `frontend/src/styles/fonts/lexend-*.woff2`; the same three files are in `frontend-compiled/assets/lexend-*.woff2`
- Upstream: https://github.com/googlefonts/lexend
- Copyright: Copyright 2018 The Lexend Project Authors (https://github.com/googlefonts/lexend), with Reserved Font Name “RevReading Lexend”.

## Zod

- Version: 4.6.7
- Licence: MIT
- In this repository: dependency of the root (bundled into the Worker) and of `frontend/` (bundled into the web app)
- Upstream: https://github.com/colinhacks/zod
- Copyright: Copyright (c) 2025 Colin McDonnell

## DOMPurify

- Version: 3.5.0
- Licence: MPL-2.0 OR Apache-2.0
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/cure53/DOMPurify
- Copyright: (c) Cure53 and other contributors (from the header of its distributed files; its licence files carry no copyright line)

## idb

- Version: 8.0.4
- Licence: ISC
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/jakearchibald/idb
- Copyright: Copyright (c) 2016, Jake Archibald <jaffathecake@gmail.com>

## Lucide React

- Version: 1.79.0
- Licence: ISC; the icons derived from Feather are under MIT
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/lucide-icons/lucide
- Copyright: Copyright (c) 2026 Lucide Icons and Contributors; Feather-derived icons: Copyright (c) 2013-present Cole Bemis

## marked

- Version: 18.3.0
- Licence: MIT; its licence file also carries the BSD-style notice of John Gruber's original Markdown
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/markedjs/marked
- Copyright: Copyright (c) 2018+, MarkedJS (https://github.com/markedjs/); Copyright (c) 2011-2018, Christopher Jeffrey (https://github.com/chjj/); Markdown: Copyright © 2004, John Gruber

## React

- Version: 19.3.1
- Licence: MIT
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/react/react
- Copyright: Copyright (c) Meta Platforms, Inc. and affiliates.

## React DOM

- Version: 19.3.1
- Licence: MIT
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/react/react
- Copyright: Copyright (c) Meta Platforms, Inc. and affiliates.

## React Router

- Version: 8.5.2
- Licence: MIT
- In this repository: dependency of `frontend/` (bundled into the web app)
- Upstream: https://github.com/remix-run/react-router
- Copyright: Copyright (c) React Training LLC 2015-2019; Copyright (c) Remix Software Inc. 2020-2021; Copyright (c) Shopify Inc. 2022-2023

## Tailwind CSS

- Version: 4.3.5
- Licence: MIT
- In this repository: development dependency of `frontend/`; the base styles it generates are in the built CSS, which keeps its licence header
- Upstream: https://github.com/tailwindlabs/tailwindcss
- Copyright: Copyright (c) Tailwind Labs, Inc.

## Packages installed with the ones above

npm also installs the runtime dependencies of these packages, and the bundler keeps the parts the app uses. According to `frontend/package-lock.json` they are all MIT: scheduler 0.28.0 (for React DOM), @remix-run/route-pattern 0.22.1 and cookie-es 3.1.1 (for React Router).

## The recovered release in `frontend-compiled/`

`frontend-compiled/` is the compiled earlier release of this app, kept as a reference. Its minified files include third-party code under the licences above: the Lexend fonts (byte-identical to the ones listed), Tailwind CSS 4.3.5 (licence header in its CSS), and code from libraries such as React, DOMPurify, Lucide and marked.
