interface StatusBarProps {
  status: string;
  fen: string;
}

export default function StatusBar({ status, fen }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-text">{status}</span>
      <span className="status-fen" title={fen}>
        {fen.length > 30 ? fen.slice(0, 30) + '…' : fen}
      </span>
    </div>
  );
}
