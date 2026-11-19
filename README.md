# kham.udom: portfolio

Personal portfolio of **Kham Udom**, UX Engineer (design systems, accessibility, frontend architecture).

The site is built on **[@charm-ux/core](https://github.com/charm-ux/core)**: an open-source design system of accessible, headless Lit web components that began as an internal Microsoft library and is now public. I contribute to building its core components, and this portfolio dogfoods them: every button, card, badge, breadcrumb, and the token panel is a `ch-*` component, with the entire look applied as a Charm **theme override** through design tokens alone.

## Highlights

- **Live token panel**: the "tokens" button opens a `ch-push-pane` with theme (light / dark / high-contrast), accent hue, and corner radius controls. These mutate Charm's token layer at runtime, so the whole page (Charm components included) re-themes live.
- **Charm theme override**: `src/styles/theme.css` remaps Charm's primary ramp to `oklch(… var(--accent-h))`, the neutral ramp to porcelain (with dark and high-contrast variants), and shape tokens to a live `--radius` token. No component CSS is forked.
- **Project pages**: `/work/the-recipe-room` and other work routes cover architecture, request flow, and decisions & tradeoffs.
- **Accessibility**: skip link, visible focus everywhere, `prefers-reduced-motion` and `prefers-color-scheme` respected, keyboard-operable panel, semantic landmarks.

## Stack

- [Astro](https://astro.build/): build-time components, static HTML output, real URLs per project
- [@charm-ux/core](https://www.npmjs.com/package/@charm-ux/core) (Lit web components) as the component layer
- TypeScript (strict) for all site behavior

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # astro check
npm run build      # static build → dist/
npm run preview    # preview the production build
```

## Structure

```
├── src/
│   ├── pages/
│   │   ├── index.astro                 # home
│   │   └── work/                       # one static route per case study
│   ├── layouts/Base.astro              # document shell, Charm styles, token boot
│   ├── components/                     # header, footer, token drawer
│   ├── charm.ts                        # the Charm components this site registers
│   ├── scripts/site.ts                 # entry: token drawer + video facades
│   ├── lib/
│   │   ├── tokens.ts                   # theme, hue, radius, persistence, focus trap
│   │   ├── effects.ts                  # scroll reveal, video facades
│   │   └── dom.ts                      # Charm element typings + strict DOM lookup
│   └── styles/
│       ├── theme.css                   # the Charm UX theme override (tokens only)
│       └── site.css                    # page layout
└── public/
    ├── images/                         # project images
    └── favicon.svg
```

## Deploy

Any static host works. For Vercel/Netlify: build command `npm run build`, output directory `dist`.

## License

Content © Kham Udom. Code MIT. Charm UX is © its contributors, MIT licensed.
