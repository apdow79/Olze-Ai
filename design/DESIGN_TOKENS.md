# Olze Design System — Brand & Tokens

## Identity

- **Name:** Olze
- **Tagline:** *Build websites and apps with AI.*
- **Personality:** friendly, fast, trustworthy, maker-oriented. Free-first is the brand promise — the UI should always feel open (no paywalls in core flows).
- **Logo sources:** `design/logo/olze-logo.svg` (wordmark), `design/logo/olze-icon.svg` (app/favicon mark). OG image generated from icon + gradient.

## Color System

### Brand palette

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--olze-primary` | `#4F46E5` (indigo-600) | `#6366F1` (indigo-500) | CTAs, links, active states |
| `--olze-primary-hover` | `#4338CA` | `#818CF8` | hover |
| `--olze-accent` | `#22D3EE` (cyan-400) | `#67E8F9` | highlights, AI moments, gradients |
| `--olze-bg` | `#FFFFFF` | `#0B1020` | page background |
| `--olze-surface` | `#F8FAFC` | `#111827` | cards, panels |
| `--olze-surface-2` | `#F1F5F9` | `#1F2937` | nested surfaces, code blocks |
| `--olze-text` | `#0F172A` | `#F8FAFC` | primary text |
| `--olze-text-muted` | `#64748B` | `#94A3B8` | secondary text |
| `--olze-border` | `#E2E8F0` | `#374151` | dividers, inputs |
| `--olze-success` | `#16A34A` | `#4ADE80` | builds/tests pass |
| `--olze-warning` | `#D97706` | `#FBBF24` | quota warnings |
| `--olze-danger` | `#DC2626` | `#F87171` | destructive actions |

AI gradient: `linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #22D3EE 100%)` — reserved for AI-generated moments (agent thinking, generation progress), never for billing.

## Typography

- UI font: **Inter** (400/500/600/700)
- Code font: **JetBrains Mono** (400/500)
- Scale (px): 12 · 13 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60

| Style | Size | Weight | Line-height |
| --- | --- | --- | --- |
| Display | 48–60 | 700 | 1.1 |
| H1 | 36 | 700 | 1.15 |
| H2 | 30 | 600 | 1.2 |
| H3 | 24 | 600 | 1.25 |
| Body | 16 | 400 | 1.6 |
| Small | 13 | 400 | 1.5 |
| Caption | 12 | 500 | 1.4 |

## Spacing / Radius / Shadows

- Spacing scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (base 4px)
- Radius: sm 6 · md 8 · lg 12 · xl 16 · full 9999
- Shadows: subtle elevation only; dark mode uses borders more than shadows.

## Tailwind Mapping (`apps/web/tailwind.config.ts`)

```ts
colors: {
  primary: { DEFAULT: 'var(--olze-primary)' /* ... */ },
  accent: 'var(--olze-accent)',
  bg: 'var(--olze-bg)',
  surface: 'var(--olze-surface)',
},
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

## Modes

Dark mode is default for the builder/editor surfaces (developer context); landing page follows system preference. Toggle persisted per user profile.

## Assets Checklist (Phase 1)

- [x] Wordmark SVG · [x] Icon SVG · [ ] favicon set (16/32/180/512) · [ ] apple-touch · [ ] OG 1200×630 · [ ] loading animation (AI gradient pulse) · [ ] empty-state illustrations
