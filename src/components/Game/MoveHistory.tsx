import { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: string[];
  reviewMode: boolean;
  reviewIndex: number;
  onGoToMove: (index: number) => void;
  onEnterReview: () => void;
  onExitReview: () => void;
}

export default function MoveHistory({
  history,
  reviewMode,
  reviewIndex,
  onGoToMove,
  onEnterReview,
  onExitReview,
}: MoveHistoryProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest move when not reviewing
  useEffect(() => {
    if (!reviewMode && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history, reviewMode]);

  // Scroll active row into view during review
  useEffect(() => {
    if (reviewMode && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [reviewIndex, reviewMode]);

  // Group moves into pairs (white, black)
  const rows: { num: number; white: string; black?: string; whiteIndex: number; blackIndex?: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  const isCurrentInReview = (moveIndex: number) => reviewMode && reviewIndex === moveIndex;

  return (
    <div className="move-history">
      <h3 className="move-history-title">Moves</h3>

      {reviewMode && (
        <div className="review-indicator">
          <span className="review-label">
            Reviewing move {reviewIndex + 1}/{history.length}
          </span>
          <button className="btn btn-sm btn-review" onClick={onExitReview}>
            Exit Review
          </button>
        </div>
      )}

      <div className="move-history-list" ref={listRef}>
        {rows.length === 0 && !reviewMode && (
          <p className="move-history-empty">No moves yet</p>
        )}
        {rows.map((row) => (
          <div
            key={row.num}
            className={'move-row' + (isCurrentInReview(row.whiteIndex) ? ' move-row-active' : '')}
            ref={isCurrentInReview(row.whiteIndex) ? activeRowRef : undefined}
          >
            <span className="move-number">{row.num}.</span>
            <span
              className={'move-white' + (isCurrentInReview(row.whiteIndex) ? ' move-current' : '')}
              onClick={() => {
                if (!reviewMode) onEnterReview();
                onGoToMove(row.whiteIndex);
              }}
            >
              {row.white}
            </span>
            {row.black !== undefined && (
              <span
                className={
                  'move-black' + (row.blackIndex !== undefined && isCurrentInReview(row.blackIndex)
                    ? ' move-current'
                    : '')
                }
                onClick={() => {
                  if (!reviewMode) onEnterReview();
                  if (row.blackIndex !== undefined) onGoToMove(row.blackIndex);
                }}
              >
                {row.black}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="review-controls">
        <button
          className="btn btn-sm btn-review-nav"
          onClick={() => onGoToMove(reviewIndex - 1)}
          disabled={!reviewMode || reviewIndex < 0}
          aria-label="Previous move"
        >
          &larr;
        </button>
        <button
          className="btn btn-sm btn-review-nav"
          onClick={() => onGoToMove(reviewIndex + 1)}
          disabled={!reviewMode || reviewIndex >= history.length - 1}
          aria-label="Next move"
        >
          &rarr;
        </button>
        {!reviewMode && history.length > 0 && (
          <button className="btn btn-sm btn-review" onClick={onEnterReview}>
            Review
          </button>
        )}
      </div>
    </div>
  );
}
