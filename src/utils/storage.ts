const STORAGE_KEY = 'openboard-chess-save';

export function saveGame(fen: string, history: string[]): void {
  try {
    const data = JSON.stringify({ fen, history, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // localStorage may be unavailable or full
  }
}

export function loadGame(): { fen: string; history: string[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.fen === 'string' && Array.isArray(data.history)) {
      return { fen: data.fen, history: data.history };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
