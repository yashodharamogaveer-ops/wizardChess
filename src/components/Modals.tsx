import { useEffect, useMemo, useRef, useState } from 'react';
import { CREDIT_LINE, DEVELOPERS, COLLEGE_NAME, PROGRAM_NAME, GAME_TITLE } from '../config/credits';
import {
  GameRecord,
  PlayerStats,
  computeStats,
  formatTime,
} from '../leaderboard';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/* Ornamental divider used across the credit designs */
function Ornament() {
  return (
    <div className="orn" aria-hidden="true">
      <span className="orn-line" />
      <span className="orn-gem">✦</span>
      <span className="orn-line" />
    </div>
  );
}

/* The signature credit plate: two "artificers" with glowing monogram seals */
export function CreditsBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`artificers ${compact ? 'compact' : ''}`} id="developer-credits">
      <div className="art-kicker">
        <span className="art-kicker-line" />
        <span>Conjured by</span>
        <span className="art-kicker-line" />
      </div>
      <div className="art-cards">
        {DEVELOPERS.map((d, i) => (
          <div className="art-card" key={d.name} style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
            <div className="art-seal">
              <span className="art-seal-ring" />
              <span className="art-seal-core">{initials(d.name)}</span>
            </div>
            <div className="art-name">{d.name}</div>
            {!compact && <div className="art-role">{d.role}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const NAME_A = ['Arcane', 'Mystic', 'Shadow', 'Ember', 'Storm', 'Silver', 'Crimson', 'Lunar', 'Iron', 'Frost'];
const NAME_B = ['Rook', 'Knight', 'Sage', 'Warlock', 'Bishop', 'Oracle', 'Monarch', 'Alchemist', 'Seer', 'Regent'];
const randomName = () =>
  `${NAME_A[Math.floor(Math.random() * NAME_A.length)]} ${NAME_B[Math.floor(Math.random() * NAME_B.length)]}`;

/* Welcome / name entry screen (also the credits splash) */
export function WelcomeModal({
  initialName,
  top3,
  players,
  onSubmit,
}: {
  initialName: string;
  top3: PlayerStats[];
  players: string[];
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const clean = name.trim().slice(0, 24);

  const embers = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 10,
        dur: 7 + Math.random() * 9,
        drift: (Math.random() - 0.5) * 80,
      })),
    []
  );

  const runes = ['♔', '♕', '♖', '♗', '♘', '♙'];

  return (
    <div className="wc-modal-backdrop welcome" id="welcome-modal" role="dialog" aria-modal="true">
      <div className="welcome-bg" aria-hidden="true">
        <div className="welcome-glow" />
        {embers.map((e) => (
          <span
            key={e.id}
            className="ember"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.dur}s`,
              ['--drift' as string]: `${e.drift}px`,
            }}
          />
        ))}
        <svg className="rune-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="96" className="rr-a" />
          <circle cx="100" cy="100" r="88" className="rr-b" />
          <circle cx="100" cy="100" r="68" className="rr-a" />
          {Array.from({ length: 36 }, (_, i) => (
            <line
              key={i}
              x1="100"
              y1="6"
              x2="100"
              y2={i % 3 === 0 ? 14 : 10}
              className="rr-tick"
              transform={`rotate(${i * 10} 100 100)`}
            />
          ))}
          {runes.map((r, i) => (
            <text
              key={r}
              x="100"
              y="30"
              textAnchor="middle"
              className="rr-rune"
              transform={`rotate(${i * 60} 100 100)`}
            >
              {r}
            </text>
          ))}
        </svg>
      </div>

      <div className="wc-modal welcome-card">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />

        <svg className="welcome-emblem" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff1b0" />
              <stop offset="55%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#9c7a1c" />
            </linearGradient>
          </defs>
          <g fill="url(#goldGrad)">
            <rect x="28" y="10" width="12" height="17" rx="2" />
            <rect x="44" y="10" width="12" height="17" rx="2" />
            <rect x="60" y="10" width="12" height="17" rx="2" />
            <rect x="23" y="25" width="54" height="9" rx="2" />
            <polygon points="32,34 68,34 73,76 27,76" />
            <rect x="22" y="76" width="56" height="8" rx="2" />
            <rect x="16" y="84" width="68" height="9" rx="3" />
          </g>
          <circle cx="50" cy="54" r="5.5" fill="#0a0c14" />
          <circle cx="50" cy="54" r="2" fill="#f5d76e" />
        </svg>

        <div className="welcome-kicker">✦ &nbsp; 3D Sanctum Edition &nbsp; ✦</div>
        <h1 className="welcome-title">{GAME_TITLE}</h1>
        <Ornament />

        <label className="wc-label" htmlFor="input-player-name">
          Name thyself, wizard
        </label>
        <div className="name-field">
          <span className="name-field-icon" aria-hidden="true">⚔</span>
          <input
            ref={inputRef}
            id="input-player-name"
            className="wc-input"
            value={name}
            maxLength={24}
            autoComplete="off"
            placeholder="Type your name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && clean) onSubmit(clean);
            }}
          />
          <button
            type="button"
            className="dice-btn"
            id="btn-random-name"
            title="Suggest a wizard name"
            onClick={() => setName(randomName())}
          >
            🎲
          </button>
        </div>

        {players.length > 0 && (
          <div className="chip-row" aria-label="Previous players">
            {players.map((pl) => (
              <button
                type="button"
                key={pl}
                className={`chip ${pl.toLowerCase() === clean.toLowerCase() ? 'on' : ''}`}
                onClick={() => setName(pl)}
              >
                {pl}
              </button>
            ))}
          </div>
        )}

        <button
          className="enter-btn"
          id="btn-start-game"
          disabled={!clean}
          onClick={() => onSubmit(clean)}
        >
          <span>Enter the Sanctum</span>
        </button>

        {top3.length > 0 && (
          <div className="podium">
            <div className="mini-board-title">Hall of Wizards</div>
            <div className="podium-row">
              {top3.map((p, i) => (
                <div className={`podium-card p${i + 1}`} key={p.player}>
                  <div className="podium-medal">{['🥇', '🥈', '🥉'][i]}</div>
                  <div className="podium-name">{p.player}</div>
                  <div className="podium-pts">{p.points} pts</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Ornament />
        <CreditsBlock />
        {(PROGRAM_NAME || COLLEGE_NAME) && (
          <div className="welcome-program">{[PROGRAM_NAME, COLLEGE_NAME].filter(Boolean).join(' • ')}</div>
        )}
      </div>
    </div>
  );
}

/* Leaderboard */
export function LeaderboardModal({
  records,
  currentPlayer,
  onClose,
  onReset,
}: {
  records: GameRecord[];
  currentPlayer: string;
  onClose: () => void;
  onReset: () => void;
}) {
  const stats = computeStats(records);
  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wizard-chess-scoreboard.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wc-modal-backdrop" id="leaderboard-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="wc-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="wc-modal-head">
          <div className="checkmate-ornament">✦ &nbsp; Hall of Wizards &nbsp; ✦</div>
          <button className="mobile-sheet-close wc-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <h2 className="wc-h2">Leaderboard</h2>
        <div className="wc-sub">Win = 3 pts • Draw = 1 pt • Loss = 0 pts</div>

        {stats.length === 0 ? (
          <div className="wc-empty">No completed games yet. Win a game to claim the first place!</div>
        ) : (
          <div className="wc-table-wrap">
            <table className="wc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>W</th>
                  <th>L</th>
                  <th>D</th>
                  <th>Pts</th>
                  <th>Best Time</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((p, i) => (
                  <tr
                    key={p.player}
                    className={p.player.toLowerCase() === currentPlayer.toLowerCase() ? 'me' : ''}
                  >
                    <td>{i === 0 ? '🏆' : i + 1}</td>
                    <td className="left">
                      {p.player}
                      {i === 0 && <span className="gw-tag">Grand Wizard</span>}
                    </td>
                    <td>{p.wins}</td>
                    <td>{p.losses}</td>
                    <td>{p.draws}</td>
                    <td className="pts">{p.points}</td>
                    <td>{formatTime(p.bestTime)}</td>
                    <td>{p.bestStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recent.length > 0 && (
          <>
            <div className="mini-board-title" style={{ marginTop: 14 }}>Recent Games</div>
            <div className="recent-list">
              {recent.map((r) => (
                <div className="mini-row" key={r.id}>
                  <span>
                    {r.result === 'win' ? '✔ Won' : r.result === 'loss' ? '✖ Lost' : '＝ Draw'} — {r.player}
                  </span>
                  <span>
                    {r.moves} moves • {formatTime(r.seconds)} • {new Date(r.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="checkmate-actions" style={{ marginTop: 16 }}>
          <button className="checkmate-btn secondary" onClick={exportJson} disabled={!records.length}>
            Export JSON
          </button>
          <button
            className="checkmate-btn secondary"
            disabled={!records.length}
            onClick={() => {
              if (window.confirm('Delete all scoreboard records on this device?')) onReset();
            }}
          >
            Reset Scores
          </button>
          <button className="checkmate-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="wc-footer-credit"><span>✦</span> {CREDIT_LINE} <span>✦</span></div>
      </div>
    </div>
  );
}

/* About / Credits */
export function AboutModal({
  onClose,
  canInstall,
  onInstall,
}: {
  onClose: () => void;
  canInstall: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="wc-modal-backdrop" id="about-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wc-modal-head">
          <div className="checkmate-ornament">✦ &nbsp; About &nbsp; ✦</div>
          <button className="mobile-sheet-close wc-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <h2 className="wc-h2">{GAME_TITLE} 3D</h2>
        <div className="wc-sub">Gothic cathedral chess with cinematic captures and a single-player AI.</div>
        <div className="checkmate-rule" />
        <CreditsBlock />
        {(PROGRAM_NAME || COLLEGE_NAME) && (
          <div className="welcome-program">{[PROGRAM_NAME, COLLEGE_NAME].filter(Boolean).join(' • ')}</div>
        )}
        <div className="checkmate-actions" style={{ marginTop: 16 }}>
          {canInstall && (
            <button className="checkmate-btn" id="btn-install-about" onClick={onInstall}>
              Install App
            </button>
          )}
          <button className="checkmate-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* Result card shown after a completed game */
export function ResultCard({
  record,
  rank,
  onLeaderboard,
  onClose,
}: {
  record: GameRecord;
  rank: number;
  onLeaderboard: () => void;
  onClose: () => void;
}) {
  const headline =
    record.result === 'win' ? 'Victory Recorded' : record.result === 'loss' ? 'Defeat Recorded' : 'Draw Recorded';
  return (
    <div className="result-card" id="result-card" role="status">
      <button className="wc-close result-x" onClick={onClose} aria-label="Dismiss result">
        ✕
      </button>
      <div className="result-head">{headline}</div>
      <div className="result-player">{record.player}</div>
      <div className="result-grid">
        <div><b>{record.moves}</b><span>Moves</span></div>
        <div><b>{formatTime(record.seconds)}</b><span>Time</span></div>
        <div><b>#{rank}</b><span>Rank</span></div>
      </div>
      <div className="result-actions">
        <button className="checkmate-btn" onClick={onLeaderboard}>Leaderboard</button>
      </div>
      <div className="wc-footer-credit"><span>✦</span> {CREDIT_LINE} <span>✦</span></div>
    </div>
  );
}
