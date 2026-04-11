// 累積 EXP 達到此值時，晉升至該等級
// index = level (1-based), value = cumulative EXP needed to reach this level
// Lv1 starts at 0, max level is 20

export const EXP_TABLE: number[] = [
  0,    // Lv1
  100,  // Lv2
  250,  // Lv3  → 見習戰士 / 學院生
  450,  // Lv4
  700,  // Lv5
  1000, // Lv6
  1350, // Lv7  → 戰士 / 學者
  1750, // Lv8
  2200, // Lv9
  2700, // Lv10
  3250, // Lv11
  3850, // Lv12 → 菁英戰士 / 研究者
  4500, // Lv13
  5200, // Lv14
  5950, // Lv15
  6750, // Lv16
  7600, // Lv17
  8000, // Lv18
  8000, // Lv19 (placeholder, Lv20 is max)
  8000, // Lv20 → 戰鬥大師 / 賢者（滿級）
];

export const MAX_LEVEL = 20;

// EXP needed to go from current level to next level
export function expToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return EXP_TABLE[level] - EXP_TABLE[level - 1];
}

// Get cumulative EXP needed to reach a level
export function expForLevel(level: number): number {
  return EXP_TABLE[level - 1] ?? EXP_TABLE[EXP_TABLE.length - 1];
}
