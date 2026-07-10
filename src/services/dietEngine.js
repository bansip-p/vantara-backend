/**
 * Rule-based Diet Intelligence Engine.
 * Takes an animal's profile + current health status and produces
 * a food quantity, nutrition guidance, supplements, and the reasoning behind it.
 *
 * This is intentionally rule-based (not a black-box AI) so recommendations
 * stay explainable and safe for a real caretaker to trust and follow.
 */

// Baseline daily food requirements by species (kg of food per day, roughly)
const SPECIES_BASELINE = {
  'Asian Elephant': { baseFoodKg: 150, category: 'Herbivore - Large' },
  'African Elephant': { baseFoodKg: 170, category: 'Herbivore - Large' },
  'Bengal Tiger': { baseFoodKg: 8, category: 'Carnivore - Large' },
  'Lion': { baseFoodKg: 7, category: 'Carnivore - Large' },
  'Leopard': { baseFoodKg: 3, category: 'Carnivore - Medium' },
  'Sloth Bear': { baseFoodKg: 5, category: 'Omnivore - Medium' },
  'Deer': { baseFoodKg: 4, category: 'Herbivore - Small' },
};

function getSpeciesBaseline(species) {
  return SPECIES_BASELINE[species] || { baseFoodKg: 5, category: 'General' };
}

function generateDietPlan({ species, estimatedAge, healthScore, activityLevel, dietStatus, stressLevel }) {
  const baseline = getSpeciesBaseline(species);
  let foodQuantityKg = baseline.baseFoodKg;
  const reasons = [];
  const supplements = [];

  // Adjust for age
  if (estimatedAge && estimatedAge > 40) {
    foodQuantityKg *= 0.85;
    reasons.push('Reduced portion for senior animal (slower metabolism)');
    supplements.push('Joint support supplement');
  } else if (estimatedAge && estimatedAge < 3) {
    foodQuantityKg *= 0.6;
    reasons.push('Reduced portion for young/growing animal, more frequent feeding recommended');
    supplements.push('Growth-support vitamins');
  }

  // Adjust for activity level
  if (activityLevel === 'Low') {
    foodQuantityKg *= 0.9;
    reasons.push('Slightly reduced portion due to low activity level');
  } else if (activityLevel === 'High') {
    foodQuantityKg *= 1.1;
    reasons.push('Increased portion to support high activity level');
  }

  // Adjust for poor health score
  if (healthScore < 60) {
    supplements.push('Immune support supplement');
    supplements.push('Electrolyte solution');
    reasons.push('Health score is low — added recovery-focused supplements');
  } else if (healthScore < 80) {
    supplements.push('Multivitamin supplement');
    reasons.push('Health score is moderate — added general multivitamin support');
  }

  // Adjust for stress
  if (stressLevel === 'High') {
    supplements.push('Calming/stress-reduction supplement');
    reasons.push('High stress detected — added calming supplement');
  }

  // Adjust for poor diet status history
  if (dietStatus === 'Poor') {
    reasons.push('Recent diet intake has been poor — consider more palatable/preferred food options');
  }

  return {
    foodQuantityKg: Math.round(foodQuantityKg * 10) / 10,
    nutritionCategory: baseline.category,
    supplements: [...new Set(supplements)], // remove duplicates
    reasons,
  };
}

module.exports = { generateDietPlan };