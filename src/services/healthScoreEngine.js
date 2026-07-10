/**
 * This is our rule-based "AI" health scoring engine.
 * It takes recent behavior/diet/medical signals and produces:
 * - a health score (0-100)
 * - a risk level
 * - a plain-English prediction
 * - a list of contributing factors (why the score is what it is)
 *
 * Later phases can replace the inside of this function with a real
 * machine learning model — the rest of the app won't need to change,
 * because everything else just calls calculateHealthScore().
 */

function calculateHealthScore({ movementChangePercent, foodIntakeChangePercent, weightChangePercent, stressLevel }) {
  let score = 100;
  const factors = [];

  // Movement drop is a strong warning sign
  if (movementChangePercent <= -40) {
    score -= 25;
    factors.push(`Movement reduced by ${Math.abs(movementChangePercent)}%`);
  } else if (movementChangePercent <= -20) {
    score -= 12;
    factors.push(`Movement reduced by ${Math.abs(movementChangePercent)}%`);
  }

  // Reduced eating is one of the earliest signs of illness
  if (foodIntakeChangePercent <= -30) {
    score -= 20;
    factors.push(`Food intake decreased by ${Math.abs(foodIntakeChangePercent)}%`);
  } else if (foodIntakeChangePercent <= -15) {
    score -= 10;
    factors.push(`Food intake decreased by ${Math.abs(foodIntakeChangePercent)}%`);
  }

  // Sudden weight loss is medically significant
  if (weightChangePercent <= -5) {
    score -= 15;
    factors.push(`Weight decreased by ${Math.abs(weightChangePercent)}%`);
  }

  // High stress compounds other risks
  if (stressLevel === 'High') {
    score -= 10;
    factors.push('Stress level elevated');
  } else if (stressLevel === 'Medium') {
    score -= 5;
  }

  // Keep score within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine risk level from final score
  let riskLevel = 'Low';
  if (score < 60) riskLevel = 'High';
  else if (score < 80) riskLevel = 'Medium';

  // Generate plain-English prediction
  let predictionText = 'Healthy next 30 days';
  if (riskLevel === 'Medium') {
    predictionText = 'Monitor closely — mild risk factors detected';
  } else if (riskLevel === 'High') {
    predictionText = 'Veterinary examination recommended soon';
  }

  return {
    healthScore: score,
    riskLevel,
    predictionText,
    contributingFactors: factors,
  };
}

module.exports = { calculateHealthScore };