const ANIMAL_CATEGORY = {
  Elephant: { sizeClass: 'Large', requiresHeavyEquipment: true },
  Tiger: { sizeClass: 'Large-Predator', requiresHeavyEquipment: true },
  Lion: { sizeClass: 'Large-Predator', requiresHeavyEquipment: true },
  Leopard: { sizeClass: 'Medium-Predator', requiresHeavyEquipment: false },
  Deer: { sizeClass: 'Small', requiresHeavyEquipment: false },
  Bird: { sizeClass: 'Small', requiresHeavyEquipment: false },
};

function getAnimalCategory(animalType) {
  const match = Object.keys(ANIMAL_CATEGORY).find((key) => animalType.toLowerCase().includes(key.toLowerCase()));
  return match ? ANIMAL_CATEGORY[match] : { sizeClass: 'Medium', requiresHeavyEquipment: false };
}

function generateRescuePlan({ animalType, conditionDescription, emergencyLevel }) {
  const category = getAnimalCategory(animalType);
  const equipment = ['First aid kit', 'Transport carrier/vehicle', 'Communication radios'];
  let team = 'Standard Rescue Team (2-3 members)';
  let riskLevel = 'Low';
  const medicalPrep = ['Basic wound care supplies'];

  if (category.sizeClass.includes('Large')) {
    team = 'Large Animal Rescue Team (5+ members, includes veterinary support)';
    equipment.push('Heavy-duty transport vehicle', 'Tranquilizer equipment (vet-operated)', 'Winching/lifting gear');
    riskLevel = 'High';
  } else if (category.sizeClass.includes('Medium')) {
    team = 'Standard Rescue Team with Veterinary Support (3-4 members)';
    equipment.push('Secure transport cage');
    riskLevel = 'Medium';
  }

  if (category.sizeClass.includes('Predator')) {
    riskLevel = 'High';
    equipment.push('Protective gear (bite/claw resistant)', 'Tranquilizer equipment (vet-operated)');
    team = 'Specialized Predator Rescue Team (5+ members, includes armed backup and vet)';
  }

  if (emergencyLevel === 'Critical') {
    riskLevel = 'High';
    medicalPrep.push('IV fluids and emergency stabilization kit', 'On-call veterinary surgeon notified');
  } else if (emergencyLevel === 'High') {
    medicalPrep.push('Sedation kit', 'Veterinarian on standby');
  }

  const conditionLower = (conditionDescription || '').toLowerCase();
  if (conditionLower.includes('injur') || conditionLower.includes('wound') || conditionLower.includes('bleed')) {
    medicalPrep.push('Trauma care kit prioritized');
  }
  if (conditionLower.includes('trap') || conditionLower.includes('stuck') || conditionLower.includes('flood')) {
    equipment.push('Rope/extraction gear');
  }

  return {
    recommendedTeam: team,
    equipment: [...new Set(equipment)],
    riskLevel,
    transportRequired: true,
    medicalPreparation: [...new Set(medicalPrep)],
  };
}

module.exports = { generateRescuePlan };