# Contributing to Chess by Sparsh

Chess by Sparsh is intentionally small, local-first, and focused. Contributions should preserve that character.

---

## Contribution Priorities

The most useful contributions are:

- Chess rule edge-case tests
- Accessibility improvements (keyboard navigation, screen reader support, contrast)
- Small UI clarity or readability improvements
- FEN handling edge cases
- Documentation improvements
- Performance or maintainability improvements
- Bug fixes with clear reproduction steps
- Computer opponent evaluation improvements (include before/after benchmarks)

---

## Scope Boundaries

The following must **not** be added without an explicit project decision recorded in a decision document:

- Online multiplayer
- User accounts or authentication
- Backend services or server-side computation
- Stockfish or other external chess engine
- Ratings, ladders, or matchmaking
- Payments, subscriptions, or donations handling
- Telemetry, analytics, or data collection
- Social features (chat, profiles, friends)

---

## Development Setup

### Local Environment

1. **Node.js version**: This project expects Node.js 20+. Use `.nvmrc` (for `nvm`/`fnm`/etc.) or `.node-version` (for nodenv/avn) to auto-select the correct version.

2. **Install dependencies**:
   ```bash
   cd chess-by-sparsh
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   # or: npm start
   ```

4. **VSCode (optional but recommended)**: Install the recommended extensions listed in `.vscode/extensions.json` (ESLint, Prettier). Format-on-save is configured in `.vscode/settings.json`.

### Stockfish / Nightmare Notes

Nightmare difficulty uses `stockfish.wasm` — a WebAssembly port of Stockfish that requires `SharedArrayBuffer` and the `Atomics` API. In local development, Vite serves the app with the necessary `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers.

- Stockfish is **lazy-loaded** only when Nightmare is selected — it is NOT loaded on startup.
- If Stockfish fails to load, open DevTools and check the Console and Network tabs.
- Supported browsers for Nightmare: Chrome 79+, Edge 79+, Firefox 79+ (desktop only).
- Safari and mobile browsers do not support the required APIs.

---

## Before Submitting a PR

Run the full pre-submit checklist:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

All four must pass. Documentation-only changes (`.md` files only, no code or config) may skip runtime checks.

Also verify the app works locally:

- Start the dev server (`npm run dev`) and play a few moves
- Test each difficulty level (including Nightmare on a supported browser)
- Test both game modes (User vs Computer and Local Two Player)
- Run the production preview (`npm run build && npm run preview`) to catch build-only issues

---

## Commit Guidance

Prefer small, descriptive commits with conventional commit prefixes.

**Good examples:**

```text
feat: add computer opponent with three difficulty bands
feat(chess): improve king safety evaluation at club level
fix: handle invalid FEN input gracefully
test: add promotion edge cases
docs: clarify localStorage behavior
refactor(settings): extract ModeSelector as standalone component
```

**Prefixes:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `style:`.

When a change touches specific source files, add a scope: `feat(chess):`, `fix(board):`, `test(settings):`, etc.

---

## Project Structure

```text
.
├── .github/
│   ├── workflows/ci.yml
│   ├── FUNDING.yml
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── assets/
│   └── screenshots/
│       └── chess-main.png
├── src/
│   ├── app/              — App entry, CSS
│   ├── chess/            — AI engine (computer, evaluate, PST, difficulty)
│   ├── components/       — UI by area (Board, Game, GameControls, Settings, etc.)
│   ├── hooks/            — React hooks (useChessGame, useSettings)
│   ├── lib/              — utility modules (storage)
│   ├── types/            — shared TypeScript types
│   └── __tests__/        — test files
├── ARCHITECTURE.md
├── ROADMAP.md
├── CHANGELOG.md
├── AGENTS.md
├── CONTRIBUTING.md
├── SECURITY.md
└── package.json
```

## Naming Rule

The visible product name is always:

```text
Chess by Sparsh
```

Use `chess-by-sparsh` as the technical repository slug, package name, URL paths, and storage keys.
