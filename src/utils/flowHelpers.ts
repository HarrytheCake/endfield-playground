export function getEfficiencyBg(efficiency: number | null | undefined): string {
  if (efficiency === null || efficiency === undefined) return 'bg-neutral-400'
  if (efficiency >= 1) return 'bg-green-500'
  if (efficiency >= 0.75) return 'bg-yellow-500'
  if (efficiency > 0) return 'bg-orange-500'
  return 'bg-neutral-400'
}
