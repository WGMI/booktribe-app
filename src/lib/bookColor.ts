const PALETTE = ["#a44a3f", "#3b6934", "#6c4500", "#85332a", "#4a6741", "#7c4a2a"];

export function bookColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
