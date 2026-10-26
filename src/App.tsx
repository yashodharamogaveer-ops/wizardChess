import { useCallback, useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { CREDIT_LINE, DEVELOPERS } from './config/credits';
import {
  GameRecord,
  computeStats,
  loadPlayer,
  loadRecords,
  savePlayer,
  saveRecords,
} from './leaderboard';
import { AboutModal, LeaderboardModal, ResultCard, WelcomeModal } from './components/Modals';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface GameOverDetail {
  gameId: number;
  winnerColor: 'w' | 'b' | null;
  playerColor: 'w' | 'b';
  plies: number;
}

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [player, setPlayer] = useState<string>(() => loadPlayer());
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [records, setRecords] = useState<GameRecord[]>(() => loadRecords());
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{ record: GameRecord; rank: number } | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => {
    try {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      return standalone || localStorage.getItem('wizardchess.installed') === '1';
    } catch {
      return false;
    }
  });

  const playerRef = useRef(player);
  const gameStartRef = useRef(Date.now());
  const lastReportedRef = useRef<number>(-1);
  const recordsRef = useRef(records);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const handleWelcomeSubmit = useCallback((name: string) => {
    savePlayer(name);
    setPlayer(name);
    playerRef.current = name;
    gameStartRef.current = Date.now();
    setWelcomeOpen(false);
  }, []);

  // Listen for game events coming from the 3D engine
  useEffect(() => {
    const onNewGame = () => {
      gameStartRef.current = Date.now();
      setLastResult(null);
    };
    const onGameOver = (e: Event) => {
      const d = (e as CustomEvent<GameOverDetail>).detail;
      if (!d || lastReportedRef.current === d.gameId) return;
      const name = playerRef.current.trim();
      if (!name) return;
      lastReportedRef.current = d.gameId;
      const result: GameRecord['result'] =
        d.winnerColor === null ? 'draw' : d.winnerColor === d.playerColor ? 'win' : 'loss';
      const record: GameRecord = {
        id: `${Date.now()}-${d.gameId}`,
        gameId: d.gameId,
        player: name,
        result,
        side: d.playerColor,
        moves: Math.ceil(d.plies / 2),
        seconds: Math.max(1, Math.round((Date.now() - gameStartRef.current) / 1000)),
        date: new Date().toISOString(),
      };
      const next = [...recordsRef.current, record];
      saveRecords(next);
      setRecords(next);
      const rank = computeStats(next).findIndex((p) => p.player.toLowerCase() === name.toLowerCase()) + 1;
      // let the checkmate animation play before showing the card
      window.setTimeout(() => setLastResult({ record, rank }), result === 'draw' ? 600 : 3800);
    };
    window.addEventListener('wizardchess:newgame', onNewGame);
    window.addEventListener('wizardchess:gameover', onGameOver);
    return () => {
      window.removeEventListener('wizardchess:newgame', onNewGame);
      window.removeEventListener('wizardchess:gameover', onGameOver);
    };
  }, []);

  // PWA: install prompt + offline ready notice
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      // The browser only offers installation when the app is NOT installed
      try { localStorage.removeItem('wizardchess.installed'); } catch { /* ignore */ }
      setInstalled(false);
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      try { localStorage.setItem('wizardchess.installed', '1'); } catch { /* ignore */ }
      setInstalled(true);
      setInstallEvent(null);
    };
    const onOfflineReady = () => {
      setOfflineReady(true);
      window.setTimeout(() => setOfflineReady(false), 5000);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('wizardchess:offline-ready', onOfflineReady);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('wizardchess:offline-ready', onOfflineReady);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      try { localStorage.setItem('wizardchess.installed', '1'); } catch { /* ignore */ }
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setLeaderboardOpen(false);
        setAboutOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRestoreUI = () => {
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Hide UI [H]';
    }
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Wizard Chess</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Summoning Sanctum Architecture &amp; Sculpted Pieces...</div>
        <div className="loader-credit">
          <span className="wm-label">Conjured by</span>
          <span className="wm-name">{DEVELOPERS[0].name}</span>
          <span className="wm-amp">&amp;</span>
          <span className="wm-name">{DEVELOPERS[1].name}</span>
        </div>
      </div>

      {welcomeOpen && (
        <WelcomeModal
          initialName={player}
          top3={computeStats(records).slice(0, 3)}
          players={computeStats(records).map((p) => p.player).slice(0, 4)}
          onSubmit={handleWelcomeSubmit}
        />
      )}

      <div id="canvas-container"></div>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Show HUD Controls"
      >
        Show UI
      </button>

      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <div className="brand-pill">
            <span className="brand-title">Wizard Chess</span>
            {player && !welcomeOpen && <span className="mode-badge" id="player-badge">{player}</span>}
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">White to Move</span>
            <span className="mode-badge" id="mode-badge">Playing as White</span>
          </div>
          {installEvent && !installed && (
            <button
              type="button"
              className="hud-btn install-pill"
              id="btn-install"
              title="Install Wizard Chess as an app"
              onClick={handleInstall}
            >
              <span className="install-ico">⬇</span> Install App
            </button>
          )}
        </div>

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          {mobileSheetOpen ? 'Close' : 'Controls'}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Controls</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Close Controls"
            >
              Close ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Game Actions</div>

          <button
            className="hud-btn"
            id="btn-side-toggle"
            title="Switch between Playing as White and Playing as Black"
            onClick={() => setMobileSheetOpen(false)}
          >
            Play as Black
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title="Let the AI make the next move immediately"
            onClick={() => setMobileSheetOpen(false)}
          >
            AI Move
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Start a fresh game on the altar"
            onClick={() => setMobileSheetOpen(false)}
          >
            New Game
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Camera Views</span>
            <span className="mobile-sheet-section-sub">Tap active view to flip</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Player Camera (Click again to flip White / Black view)"
          >
            Player Cam
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Overhead Board View (Click again to flip White / Black orientation)"
          >
            Overhead
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Side Profile View (Click again to switch East / West side)"
          >
            Side
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Wide Cathedral View (Click again to switch North Rose / South Narthex)"
          >
            Cathedral
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Scoreboard &amp; Info</div>

          <button
            className="hud-btn primary"
            id="btn-leaderboard"
            title="View the leaderboard"
            onClick={() => {
              setLeaderboardOpen(true);
              setMobileSheetOpen(false);
            }}
          >
            🏆 Leaderboard
          </button>
          <button
            className="hud-btn"
            id="btn-about"
            title="About & developer credits"
            onClick={() => {
              setAboutOpen(true);
              setMobileSheetOpen(false);
            }}
          >
            ⓘ About
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Display &amp; Gestures</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Toggle HUD visibility (Shortcut: H)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Hide UI [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Touch:</strong> Tap Piece to Move &nbsp;•&nbsp; 1-Finger Drag: Orbit &nbsp;•&nbsp; 2-Finger Drag: Pan &nbsp;•&nbsp; Pinch: Zoom
          </div>
        </div>
      </div>

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          <strong>Controls:</strong> Click Piece to Move &nbsp;•&nbsp; Left-Drag: Orbit &nbsp;•&nbsp; Right-Drag: Pan &nbsp;•&nbsp; Scroll: Zoom &nbsp;•&nbsp; WASD + R/F: Fly Cam &nbsp;•&nbsp; H: Hide UI
        </div>
        <div className="captured-pill" id="captured-tray"></div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Sanctum Judgment &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Checkmate</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            White Triumphs • The Black King Has Fallen
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Replay King Fall
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              New Game
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Dismiss
            </button>
          </div>
          <div className="wc-footer-credit"><span>✦</span> {CREDIT_LINE} <span>✦</span></div>
        </div>
      </div>

      <div id="credit-watermark">
        <span className="wm-star">✦</span>
        <span className="wm-label">Conjured by</span>
        <span className="wm-name">{DEVELOPERS[0].name}</span>
        <span className="wm-amp">&amp;</span>
        <span className="wm-name">{DEVELOPERS[1].name}</span>
        <span className="wm-star">✦</span>
      </div>

      {offlineReady && <div className="wc-toast">Offline ready — you can play without internet.</div>}

      {lastResult && !welcomeOpen && (
        <ResultCard
          record={lastResult.record}
          rank={lastResult.rank}
          onClose={() => setLastResult(null)}
          onLeaderboard={() => {
            setLastResult(null);
            setLeaderboardOpen(true);
          }}
        />
      )}

      {leaderboardOpen && (
        <LeaderboardModal
          records={records}
          currentPlayer={player}
          onClose={() => setLeaderboardOpen(false)}
          onReset={() => {
            saveRecords([]);
            setRecords([]);
          }}
        />
      )}

      {aboutOpen && (
        <AboutModal
          onClose={() => setAboutOpen(false)}
          canInstall={!!installEvent}
          onInstall={handleInstall}
        />
      )}
    </>
  );
}
