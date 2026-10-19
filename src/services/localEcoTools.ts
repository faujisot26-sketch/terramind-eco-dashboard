import { MATERIAL_CARBON_FACTORS } from '../constants';
import type { WasteAuditResult, WasteCategory } from '../types';

type CoachContext = {
  wasteKg: number;
  divertedKg: number;
  diversionRate: number;
  energyKwh: number;
  topAppliance?: { name: string; kwh: number } | null;
};

export function replyWithLocalGuidance(question: string, context: CoachContext): string {
  const prompt = question.toLowerCase();
  if (prompt.includes('energy') || prompt.includes('electric') || prompt.includes('kwh') || prompt.includes('appliance')) {
    if (context.topAppliance) {
      return `${context.topAppliance.name} is your highest logged appliance at ${context.topAppliance.kwh.toFixed(1)} kWh. Try one small check today: compare its next reading over the same time window, then look for a simple change such as a cooler setting, full-load cycle, or standby switch-off. Your ${context.energyKwh.toFixed(1)} kWh total is based only on the entries you logged, so it may not represent the whole home.`;
    }
    return 'Start with one appliance you use every day. Add its kWh reading in Energy, then repeat the reading over a comparable period; a small, consistent comparison is more useful than guessing a whole-home total.';
  }
  if (prompt.includes('recycl') || prompt.includes('waste') || prompt.includes('compost') || prompt.includes('plastic')) {
    if (context.wasteKg > 0) {
      const nextStep = context.diversionRate < 100
        ? 'Pick one item currently going to landfill and check whether your local service accepts it before changing its disposal method.'
        : 'Keep separating clean, accepted materials and check local guidance for anything with food residue or mixed layers.';
      return `You have logged ${context.wasteKg.toFixed(1)} kg of waste and diverted ${context.divertedKg.toFixed(1)} kg (${context.diversionRate}%). ${nextStep} Your log is self-reported, and local recycling rules can differ.`;
    }
    return 'Try weighing one day of kitchen scraps and packaging separately. Log the material and where it actually went; local collection rules matter, so check your municipality’s guidance before treating something as recyclable.';
  }
  if (context.wasteKg === 0 && context.energyKwh === 0) {
    return 'Let’s start small: log one waste item or one appliance reading today. TerraMind will use those entries to suggest a practical next step. Your records stay in this browser.';
  }
  return `From your current logs, ${context.divertedKg.toFixed(1)} kg has been diverted and ${context.energyKwh.toFixed(1)} kWh of electricity use has been recorded. Choose one change you can repeat this week, then compare new entries over the same period. The app’s figures are estimates, not an independent audit.`;
}

export function auditWasteLocally(
  totalKg: number,
  divertedKg: number,
  diversionRate: number,
  byCategory: Record<WasteCategory, number>,
  avoidedKgCo2e: number,
): WasteAuditResult {
  const biggestCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const tips = [
    'Keep a small kitchen scale near your sorting area and record weights on the day they are created.',
    'Check local collection rules for mixed packaging and contaminated recyclables before sorting.',
    diversionRate < 100
      ? 'Choose one landfill item this week and look for a safe reuse, donation, or accepted recycling option.'
      : 'Your current entries show full diversion; keep checking that each item is accepted by the receiving service.',
  ];

  return {
    summary: `You have recorded ${totalKg.toFixed(1)} kg of waste and diverted ${divertedKg.toFixed(1)} kg (${diversionRate}%). ${biggestCategory?.[1] ? `${biggestCategory[0]} is your largest logged category at ${biggestCategory[1].toFixed(1)} kg.` : 'Add a few weighed entries to reveal your largest category.'}`,
    estimatedCarbonImpactKg: avoidedKgCo2e,
    topRecommendation: biggestCategory?.[1]
      ? `Focus on reducing ${biggestCategory[0].toLowerCase()} at the source; avoiding a disposable item is often simpler than managing it later.`
      : 'Record a few items by material to find the easiest place to reduce waste.',
    divertedImprovementTips: tips,
    uncertaintyDisclaimer: 'On-device estimate based on self-reported weights and the starter material factors shown in Methodology. It is not an independent audit; local collection outcomes and lifecycle impacts vary.',
  };
}

export function estimateActionLocally(input: string) {
  const text = input.toLowerCase();
  const amount = Number(text.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  let detectedCategory = 'Everyday action';
  let co2SavedKg = 0;
  let assumptionsUsed = 'No carbon credit is estimated without a clear quantity and a comparison with a higher-impact alternative.';

  if (/(recycl|compost|reuse|donat)/.test(text) && amount > 0 && /kg|kilo/.test(text)) {
    detectedCategory = 'Waste';
    const category: WasteCategory = /plastic/.test(text) ? 'Plastic'
      : /paper|cardboard/.test(text) ? 'Paper'
      : /glass/.test(text) ? 'Glass'
      : /metal|alumin/.test(text) ? 'Metal'
      : 'Organic';
    co2SavedKg = amount * MATERIAL_CARBON_FACTORS[category];
    assumptionsUsed = `Rough starter factor for ${category.toLowerCase()} (${MATERIAL_CARBON_FACTORS[category]} kg CO₂e/kg) applied to the quantity you entered; real outcomes depend on local processing.`;
  } else if (/(saved|reduced|avoided|less)/.test(text) && amount > 0 && /kwh/.test(text)) {
    detectedCategory = 'Energy';
    co2SavedKg = amount * 0.82;
    assumptionsUsed = 'Rough estimate using the starter grid factor of 0.82 kg CO₂e/kWh; use a current local factor for a location-specific result.';
  } else if (/(walk|bik|cycle|metro|transit|bus)/.test(text) && /(instead of|replaced|rather than|instead)/.test(text) && amount > 0 && /km|kilomet/.test(text)) {
    detectedCategory = 'Commute';
    co2SavedKg = amount * 0.12;
    assumptionsUsed = 'Approximate comparison of a lower-carbon trip with a solo car trip at 0.12 kg CO₂e/km; actual route, vehicle and occupancy change the result.';
  }

  co2SavedKg = Math.min(25, Math.max(0, co2SavedKg));
  return {
    detectedCategory,
    co2SavedKg,
    points: co2SavedKg > 0 ? Math.max(10, Math.min(150, Math.round(co2SavedKg * 20))) : 0,
    insight: co2SavedKg > 0
      ? 'A useful small action. Keep the quantity and comparison consistent so your next estimate is easier to interpret.'
      : 'Add a quantity such as kg, kWh, or km and name the higher-impact alternative if there was one. No external service was used.',
    confidenceRating: 'Approximate' as const,
    assumptionsUsed,
  };
}
