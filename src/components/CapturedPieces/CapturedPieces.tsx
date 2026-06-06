const PIECE_CHARS: Record<string, string> = {
  k: '\u265A',
  q: '\u265B',
  r: '\u265C',
  b: '\u265D',
  n: '\u265E',
  p: '\u265F',
};

interface CapturedPiecesProps {
  whiteCaptured: string[];
  blackCaptured: string[];
}

export default function CapturedPieces({ whiteCaptured, blackCaptured }: CapturedPiecesProps) {
  return (
    <div className="captured-pieces">
      <div className="captured-row">
        <span className="captured-label captured-black-label">Black captured: </span>
        <span className="captured-pieces-list captured-pieces-black">
          {blackCaptured.length === 0 ? (
            <span className="captured-empty">&mdash;</span>
          ) : (
            blackCaptured.map((piece, i) => (
              <span key={'black-' + piece + '-' + i} className="captured-piece captured-piece-black">
                {PIECE_CHARS[piece] ?? ''}
              </span>
            ))
          )}
        </span>
      </div>
      <div className="captured-row">
        <span className="captured-label captured-white-label">White captured: </span>
        <span className="captured-pieces-list captured-pieces-white">
          {whiteCaptured.length === 0 ? (
            <span className="captured-empty">&mdash;</span>
          ) : (
            whiteCaptured.map((piece, i) => (
              <span key={'white-' + piece + '-' + i} className="captured-piece captured-piece-white">
                {PIECE_CHARS[piece] ?? ''}
              </span>
            ))
          )}
        </span>
      </div>
    </div>
  );
}
