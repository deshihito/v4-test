const EXP_BASE = 50;
const EXP_RATIO = 1.25;

// 移行元 (Python) の round は銀行丸め (round-half-even) のため、
// Math.round のままでは 62.5 のような端数で必要EXPが1ずれる。
const roundHalfEven = (value: number): number => {
  const floor: number = Math.floor(value);
  const diff: number = value - floor;

  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;

  return floor % 2 === 0 ? floor : floor + 1;
};

const calcLevel = (exp: number): { level: number; current: number; next: number } => {
  let level: number = 1;
  let remaining: number = Math.max(0, Math.floor(exp));

  while (true) {
    const next: number = Math.max(1, roundHalfEven(EXP_BASE * EXP_RATIO ** (level - 1)));

    if (remaining < next) {
      return { level, current: remaining, next };
    }

    remaining -= next;
    level += 1;

    if (level > 9999) {
      return { level, current: remaining, next };
    }
  }
};

export default calcLevel;
