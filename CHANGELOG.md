# Changelog

All notable public changes to Chess by Sparsh are recorded here.

This project follows practical versioned release notes rather than claiming strict semantic versioning before the project matures.

---

## v0.1.1 — Repository Professionalization

**Status:** Released

### Changed

- Updated all repository slug references from `openboard-chess` to `chess-by-sparsh` to match the GitHub rename.
- Updated package name from `openboard-chess` to `chess-by-sparsh`.
- Updated storage key from `openboard-chess-save` to `chess-by-sparsh-save`.
- Updated README with accurate repository structure, corrected URLs, and current naming conventions.
- Updated AGENTS.md and CONTRIBUTING.md to reflect the new repository slug.

### Added

- MIT `LICENSE` file.
- `.editorconfig` with sensible defaults (2-space indent, UTF-8, LF line endings).
- CI workflow (`.github/workflows/ci.yml`) running install, lint, test, and build on Node.js 20.

---

## v0.1.0 — Local Chess MVP

**Status:** Released

**Status:** Released

### Added

- Custom 8x8 chess board.
- Unicode chess piece rendering.
- Click-to-select interaction model.
- Legal move highlighting.
- Legal move validation through `chess.js`.
- Support for castling, en passant, promotion, check, checkmate, stalemate, and draw states through the rules layer.
- Pawn promotion dialog.
- Move history display.
- FEN export.
- FEN import.
- Browser-local save and restore through `localStorage`.
- Game status display.
- Responsive layout.
- Rule-focused test suite.
- Vercel deployment instructions.

### Deferred

- Online multiplayer.
- User accounts.
- AI opponent or engine analysis.
- PGN support.
- Undo or takeback.
- Board orientation controls.
- Clocks or timed play.
- Sound effects and animations.
