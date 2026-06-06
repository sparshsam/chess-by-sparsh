import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PromotionChoice, AppSettings, GameMode } from '../types';
import type { Difficulty } from '../chess/difficulty';
import { getComputerMove, COMPUTER_DELAY_MS } from '../chess/computer';
import { saveGame, loadGame, clearGame } from '../lib/storage';
import {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCheckmateSound,
  playPromotionSound,
} from '../lib/sounds';

interface UseChessGameOptions {
  settings: AppSettings;
}

export type GameResult = { winner: 'w' | 'b'; reason: 'checkmate' | 'resign' | 'draw' } | null;

const PIECE_VALUE: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

function rebuildMoveFens(history: string[]): string[] {
  const fens: string[] = [new Chess().fen()];
  for (let i = 0; i < history.length; i++) {
    const g2 = new Chess();
    const moves = history.slice(0, i + 1);
    for (const m of moves) {
      g2.move(m);
    }
    fens.push(g2.fen());
  }
  return fens;
}

export function useChessGame({ settings }: UseChessGameOptions) {
  const [game] = useState(() => {
    const g = new Chess();
    return g;
  });
  const [fen, setFen] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PromotionChoice | null>(null);
  const [status, setStatus] = useState<string>('White to move');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);

  // Move review state
  const [moveFens, setMoveFens] = useState<string[]>([game.fen()]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(-1);

  const prevModeRef = useRef<GameMode>(settings.gameMode);
  const prevDifficultyRef = useRef<Difficulty>(settings.difficulty);
  const settingsRef = useRef(settings);
  const gameRef = useRef(game);
  const computerMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync via effect (not during render)
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateState = useCallback(() => {
    const newFen = game.fen();
    const newHistory = game.history();
    const newMoveFens = rebuildMoveFens(newHistory);
    setFen(newFen);
    setHistory(newHistory);
    setMoveFens(newMoveFens);
    saveGame(newFen, newHistory);

    const turn = game.turn() === 'w' ? 'White' : 'Black';
    let msg = `${turn} to move`;

    if (game.isCheckmate()) {
      msg = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins!`;
    } else if (game.isStalemate()) {
      msg = 'Stalemate! The game is a draw.';
    } else if (game.isDraw()) {
      if (game.isInsufficientMaterial()) {
        msg = 'Draw due to insufficient material.';
      } else if (game.isThreefoldRepetition()) {
        msg = 'Draw due to threefold repetition.';
      } else {
        msg = 'Draw!';
      }
    } else if (game.isCheck()) {
      msg = `${turn} is in check`;
    }

    setStatus(msg);
  }, [game]);

  // ── Schedule computer move (called after user plays) ───────────
  const scheduleComputerMove = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
    }

    setIsComputerThinking(true);

    computerMoveTimeoutRef.current = setTimeout(async () => {
      const g = gameRef.current;
      const s = settingsRef.current;
      if (s.gameMode !== 'computer' || g.turn() !== 'b' || g.isGameOver()) {
        setIsComputerThinking(false);
        return;
      }

      try {
        const move = await getComputerMove(g, s.difficulty);
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
        setSelectedSquare(null);
        setLegalMoves([]);

        const newFen = g.fen();
        const newHistory = g.history();
        const newMoveFens = rebuildMoveFens(newHistory);
        setFen(newFen);
        setHistory(newHistory);
        setMoveFens(newMoveFens);
        saveGame(newFen, newHistory);

        const turn = g.turn() === 'w' ? 'White' : 'Black';
        let msg = `${turn} to move`;
        if (g.isCheckmate()) {
          msg = `Checkmate! ${turn === 'White' ? 'Black' : 'White'} wins!`;
        } else if (g.isStalemate()) {
          msg = 'Stalemate! The game is a draw.';
        } else if (g.isDraw()) {
          msg = 'Draw!';
        } else if (g.isCheck()) {
          msg = `${turn} is in check`;
        }
        setStatus(msg);
      } catch (err) {
        console.error('Computer move failed:', err);
      } finally {
        setIsComputerThinking(false);
        computerMoveTimeoutRef.current = null;
      }
    }, COMPUTER_DELAY_MS + Math.random() * 300);
  }, []);

  // ── New game ───────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    if (computerMoveTimeoutRef.current) {
      clearTimeout(computerMoveTimeoutRef.current);
      computerMoveTimeoutRef.current = null;
    }

    game.reset();
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
    setIsComputerThinking(false);
    setGameResult(null);
    setReviewMode(false);
    setReviewIndex(-1);
    clearGame();
    updateState();
  }, [game, updateState]);

  // ── Helper: after a user move, let computer respond ────────────
  const afterUserMove = useCallback(
    (wasPromotion: boolean = false) => {
      const s = settingsRef.current;
      if (s.soundEnabled) {
        const g = gameRef.current;
        if (g.isCheckmate()) {
          playCheckmateSound();
        } else if (g.isCheck()) {
          playCheckSound();
        } else {
          const hist = g.history({ verbose: true });
          if (hist.length > 0) {
            const last = hist[hist.length - 1];
            if (last.captured) {
              playCaptureSound();
            } else if (wasPromotion) {
              playPromotionSound();
            } else {
              playMoveSound();
            }
          } else {
            playMoveSound();
          }
        }
      }
      const isComputerTurn =
        settingsRef.current.gameMode === 'computer' && game.turn() === 'b' && !game.isGameOver();
      if (isComputerTurn) {
        scheduleComputerMove();
      }
    },
    [game, scheduleComputerMove]
  );

  // ── Move Review ─────────────────────────────────────────────
  const enterReviewMode = useCallback(() => {
    if (history.length === 0) return;
    setReviewMode(true);
    setReviewIndex(history.length - 1);
  }, [history.length]);

  const exitReviewMode = useCallback(() => {
    setReviewMode(false);
    setReviewIndex(-1);
    setFen(game.fen());
  }, [game]);

  const goToMove = useCallback(
    (index: number) => {
      if (index < -1 || index >= moveFens.length - 1) return;
      setReviewIndex(index);
      if (index === -1) {
        setFen(moveFens[0]);
      } else {
        setFen(moveFens[index + 1]);
      }
    },
    [moveFens]
  );

  // ── User interaction ───────────────────────────────────────────
  const selectSquare = useCallback(
    (square: Square) => {
      if (isComputerThinking) return;
      if (settings.gameMode === 'computer' && game.turn() === 'b') return;
      if (game.isGameOver()) return;

      // If in review mode, exit on any interaction
      if (reviewMode) {
        exitReviewMode();
      }

      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to as Square));
        return;
      }

      if (selectedSquare) {
        const moves = game.moves({ square: selectedSquare, verbose: true });
        const targetMove = moves.find((m) => m.to === square);

        if (targetMove) {
          if (targetMove.promotion) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }

          game.move({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
          updateState();
          afterUserMove(false);
          return;
        }

        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          const newMoves = game.moves({ square, verbose: true });
          setLegalMoves(newMoves.map((m) => m.to as Square));
          return;
        }

        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [game, selectedSquare, updateState, afterUserMove, isComputerThinking, settings.gameMode, reviewMode, exitReviewMode]
  );

  const promote = useCallback(
    (piece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      game.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      updateState();
      afterUserMove(true);
    },
    [game, pendingPromotion, updateState, afterUserMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  const newGame = useCallback(() => {
    handleNewGame();
  }, [handleNewGame]);

  const exportFen = useCallback(() => {
    return game.fen();
  }, [game]);

  const importFen = useCallback(
    (fenStr: string) => {
      try {
        game.load(fenStr);
        setSelectedSquare(null);
        setLegalMoves([]);
        setPendingPromotion(null);
        setGameResult(null);
        setReviewMode(false);
        setReviewIndex(-1);
        updateState();
        afterUserMove(false);
        return true;
      } catch {
        return false;
      }
    },
    [game, updateState, afterUserMove]
  );

  // ── Undo Move ────────────────────────────────────────────────
  const undoMove = useCallback(() => {
    if (history.length === 0) return;
    if (game.isGameOver() && gameResult) {
      setGameResult(null);
    }

    // In computer mode, undo 2 moves if possible (player + computer)
    const undoCount = settingsRef.current.gameMode === 'computer' ? Math.min(2, history.length) : 1;
    const newFens = [...moveFens];
    for (let i = 0; i < undoCount; i++) {
      game.undo();
      newFens.pop();
    }
    setMoveFens(newFens);
    setReviewMode(false);
    setReviewIndex(-1);
    updateState();
  }, [game, history.length, moveFens, updateState, gameResult]);

  // ── Resign ───────────────────────────────────────────────────
  const resign = useCallback(() => {
    const winner = game.turn() === 'w' ? 'b' : 'w';
    setGameResult({ winner, reason: 'resign' });
    const winnerName = winner === 'w' ? 'White' : 'Black';
    const loserName = winner === 'w' ? 'Black' : 'White';
    setStatus(`${loserName} resigned — ${winnerName} wins!`);

    if (settingsRef.current.soundEnabled) {
      playCheckmateSound();
    }
  }, [game]);

  // ── PGN Export ───────────────────────────────────────────────
  const exportPgn = useCallback(() => {
    return game.pgn();
  }, [game]);

  // ── Captured Pieces ──────────────────────────────────────────
  const capturedPieces = useCallback(() => {
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];

    const verboseHistory = game.history({ verbose: true });
    for (const move of verboseHistory) {
      if (move.captured) {
        if (move.color === 'w') {
          whiteCaptured.push(move.captured);
        } else {
          blackCaptured.push(move.captured);
        }
      }
    }

    const sortPieces = (pieces: string[]) =>
      pieces.sort((a, b) => (PIECE_VALUE[b] ?? 0) - (PIECE_VALUE[a] ?? 0));

    return {
      white: sortPieces(whiteCaptured),
      black: sortPieces(blackCaptured),
    };
  }, [game]);

  // ── Effects ────────────────────────────────────────────────────

  // Restore saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      try {
        game.load(saved.fen);
        /* eslint-disable react-hooks/set-state-in-effect */
        setFen(saved.fen);
        setHistory(saved.history);
        const fens = rebuildMoveFens(saved.history);
        setMoveFens(fens);
        updateState();
        /* eslint-enable react-hooks/set-state-in-effect */
      } catch {
        // invalid state, start fresh
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset board when game mode or difficulty changes
  useEffect(() => {
    if (
      prevModeRef.current !== settings.gameMode ||
      prevDifficultyRef.current !== settings.difficulty
    ) {
      prevModeRef.current = settings.gameMode;
      prevDifficultyRef.current = settings.difficulty;
      handleNewGame();
    }
  }, [settings.gameMode, settings.difficulty, handleNewGame]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (computerMoveTimeoutRef.current) {
        clearTimeout(computerMoveTimeoutRef.current);
      }
    };
  }, []);

  return {
    game,
    fen,
    history,
    status,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    isComputerThinking,
    gameResult,
    reviewMode,
    reviewIndex,
    moveFens,
    selectSquare,
    promote,
    cancelPromotion,
    newGame,
    exportFen,
    importFen,
    undoMove,
    resign,
    exportPgn,
    capturedPieces,
    enterReviewMode,
    exitReviewMode,
    goToMove,
  };
}
