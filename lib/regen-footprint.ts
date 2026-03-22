// Ecological footprint heuristic for AI reading generation
// Sources: IEA 2024, Luccioni et al. 2023
// Large model inference: ~0.0033 kWh per 1k tokens
// Global average grid: ~400g CO₂/kWh

export const REGEN_CONTRIBUTION_CENTS = 25; // $0.25 per reading

export function estimateFootprintGrams(reportText: string): number {
  const words = reportText.trim().split(/\s+/).length;
  const tokens = words * 1.35 + 600; // output tokens + system/user prompt overhead
  const energyKwh = (tokens / 1000) * 0.0033;
  const co2Grams = energyKwh * 400;
  return Math.max(parseFloat(co2Grams.toFixed(2)), 1);
}

export function formatCo2(grams: number): string {
  if (grams < 10) return `${grams.toFixed(1)}g`;
  return `${Math.round(grams)}g`;
}

// The claim: we use ~$0.01 in ecological cost, we give back $0.25
// That's a 25x regeneration ratio
export const REGENERATION_RATIO = 25;
export const ECOLOGICAL_COST_CENTS = 1; // ~$0.01 per reading
