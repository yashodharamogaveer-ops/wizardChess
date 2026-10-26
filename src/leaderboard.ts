export type GameResult = 'win' | 'loss' | 'draw';

export interface GameRecord {
  id: string;
  gameId: number;
  player: string;
  result: GameResult;
  side: 'w' | 'b';
  moves: number;
  seconds: number;
  date: string; // ISO
}

export interface PlayerStats {
  player: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  bestTime: number | null;
  fewestMoves: number | null;
  streak: number;
  bestStreak: number;
  lastPlayed: string;
}

const RECORDS_KEY = 'wizardchess.records.v1';
const PLAYER_KEY = 'wizardchess.player.v1';

export function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: GameRecord[]) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    /* storage unavailable */
  }
}

export function loadPlayer(): string {
  try {
    return localStorage.getItem(PLAYER_KEY) || '';
  } catch {
    return '';
  }
}

export function savePlayer(name: string) {
  try {
    localStorage.setItem(PLAYER_KEY, name);
  } catch {
    /* storage unavailable */
  }
}

export function formatTime(totalSeconds: number | null): string {
  if (totalSeconds === null || !isFinite(totalSeconds)) return '—';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Win = 3 points, draw = 1, loss = 0.
export function computeStats(records: GameRecord[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>();
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  for (const r of sorted) {
    const key = r.player.trim().toLowerCase();
    let st = map.get(key);
    if (!st) {
      st = {
        player: r.player.trim(),
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        bestTime: null,
        fewestMoves: null,
        streak: 0,
        bestStreak: 0,
        lastPlayed: r.date,
      };
      map.set(key, st);
    }
    st.player = r.player.trim();
    st.played += 1;
    st.lastPlayed = r.date;
    if (r.result === 'win') {
      st.wins += 1;
      st.points += 3;
      st.streak += 1;
      st.bestStreak = Math.max(st.bestStreak, st.streak);
      st.bestTime = st.bestTime === null ? r.seconds : Math.min(st.bestTime, r.seconds);
      st.fewestMoves = st.fewestMoves === null ? r.moves : Math.min(st.fewestMoves, r.moves);
    } else if (r.result === 'draw') {
      st.draws += 1;
      st.points += 1;
      st.streak = 0;
    } else {
      st.losses += 1;
      st.streak = 0;
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      (a.bestTime ?? Infinity) - (b.bestTime ?? Infinity) ||
      a.player.localeCompare(b.player)
  );
}
