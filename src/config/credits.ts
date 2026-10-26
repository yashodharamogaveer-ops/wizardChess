// Single source of truth for developer credits. Edit here and every screen updates.
export const GAME_TITLE = 'Wizard Chess';

export const DEVELOPERS = [
  { name: 'Yashodhar Mogaveera', role: 'Design & Development' },
  { name: 'Sharanya Poojary', role: 'Design & Development' },
] as const;

export const DEVELOPER_NAMES = DEVELOPERS.map((d) => d.name).join(' & ');

export const CREDIT_LINE = `Created by ${DEVELOPER_NAMES}`;
export const CREDIT_SHORT = `Crafted by ${DEVELOPER_NAMES}`;

// Optional: fill these in for your program/college.
export const PROGRAM_NAME = '';
export const COLLEGE_NAME = '';
