require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connectDB = require('./config/db');

const User = require('./models/User');
const Animal = require('./models/Animal');
const DigitalTwin = require('./models/DigitalTwin');
const AIAlert = require('./models/AIAlert');

const generateQR = () => `VANTARA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (startYear) => {
  const start = new Date(`${startYear}-01-01`).getTime();
  const end = new Date('2026-06-01').getTime();
  return new Date(start + Math.random() * (end - start));
};

// ─────────────────────────────────────────────
// SPECIES IMAGES — fetched once per species from Wikipedia's free public API,
// then cached and reused for every animal of that species.
// ─────────────────────────────────────────────
const speciesImageCache = {};

const WIKIPEDIA_TITLE_OVERRIDES = {
  'Asiatic Lion': 'Asiatic_lion',
  'Indian Leopard': 'Indian_leopard',
  'Grey Langur': 'Gray_langur',
  'Rhesus Macaque': 'Rhesus_macaque',
  'Indian Peafowl': 'Indian_peafowl',
  'White-backed Vulture': 'White-backed_vulture',
  'Steppe Eagle': 'Steppe_eagle',
  'Mugger Crocodile': 'Mugger_crocodile',
  'Indian Rock Python': 'Indian_rock_python',
  'Indian Star Tortoise': 'Indian_star_tortoise',
  'Striped Hyena': 'Striped_hyena',
  'Golden Jackal': 'Golden_jackal',
  'Indian Wolf': 'Indian_wolf',
  'Nilgai': 'Nilgai',
  'Indian Wild Boar': 'Wild_boar',
  'Sarus Crane': 'Sarus_crane',
  'Greater Flamingo': 'Greater_flamingo',
  'Indian Gazelle': 'Indian_gazelle',
  'Spotted Deer': 'Chital',
  'Sambar Deer': 'Sambar_deer',
  'Snow Leopard': 'Snow_leopard',
  'Red Panda': 'Red_panda',
  'Indian Rhinoceros': 'Indian_rhinoceros',
  'Gaur': 'Gaur',
  'Blackbuck': 'Blackbuck',
  'Indian Pangolin': 'Indian_pangolin',
  'Fishing Cat': 'Fishing_cat',
  'Dhole': 'Dhole',
  'King Cobra': 'King_cobra',
  'Gharial': 'Gharial',
  'Great Indian Bustard': 'Great_Indian_bustard',
  'Malabar Giant Squirrel': 'Indian_giant_squirrel',
  'Nilgiri Tahr': 'Nilgiri_tahr',
  'Slender Loris': 'Slender_loris',
  'Indian Flying Fox': 'Indian_flying_fox',
  'Barasingha': 'Barasingha',
  'Chinkara': 'Chinkara',
  'Himalayan Griffon': 'Himalayan_griffon_vulture',
  'Painted Stork': 'Painted_stork',
  'Monitor Lizard': 'Bengal_monitor',
  'Otter': 'Smooth-coated_otter',
};

const MAX_FETCH_ATTEMPTS = 4;
const FETCH_TIMEOUT_MS = 8000;

async function fetchSpeciesImage(species, attempt = 1) {
  if (speciesImageCache[species] !== undefined) return speciesImageCache[species];

  const wikiTitle = WIKIPEDIA_TITLE_OVERRIDES[species] || species.replace(/ /g, '_');
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VantaraAIGuardian/1.0 (educational wildlife management project)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const imageUrl = data.thumbnail?.source || null;

    if (!imageUrl) {
      console.log(`ℹ️ "${species}" (${wikiTitle}) resolved on Wikipedia but has no thumbnail image.`);
    }

    speciesImageCache[species] = imageUrl;
    return imageUrl;
  } catch (err) {
    clearTimeout(timeout);
    const reason = err.name === 'AbortError' ? `timeout after ${FETCH_TIMEOUT_MS}ms` : err.message;

    if (attempt < MAX_FETCH_ATTEMPTS) {
      const backoff = 500 * Math.pow(2, attempt - 1); // 500ms, 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchSpeciesImage(species, attempt + 1);
    }

    console.log(`⚠️ Could not fetch image for ${species} (tried "${wikiTitle}", ${attempt} attempts, last error: ${reason}), will use fallback icon`);
    speciesImageCache[species] = null;
    return null;
  }
}

// ─────────────────────────────────────────────
// SPECIES CATALOG — expanded to 40 species across mammals, birds, reptiles
// ─────────────────────────────────────────────
const SPECIES_CATALOG = [
  { species: 'Asian Elephant', scientificName: 'Elephas maximus', zone: 'Zone A - Elephant Sanctuary', ageRange: [2, 55] },
  { species: 'Bengal Tiger', scientificName: 'Panthera tigris tigris', zone: 'Zone B - Big Cat Reserve', ageRange: [1, 18] },
  { species: 'Asiatic Lion', scientificName: 'Panthera leo persica', zone: 'Zone B - Big Cat Reserve', ageRange: [1, 16] },
  { species: 'Indian Leopard', scientificName: 'Panthera pardus fusca', zone: 'Zone C - Leopard Habitat', ageRange: [1, 14] },
  { species: 'Snow Leopard', scientificName: 'Panthera uncia', zone: 'Zone C - Leopard Habitat', ageRange: [1, 15] },
  { species: 'Fishing Cat', scientificName: 'Prionailurus viverrinus', zone: 'Zone C - Leopard Habitat', ageRange: [1, 10] },
  { species: 'Sloth Bear', scientificName: 'Melursus ursinus', zone: 'Zone D - Bear Sanctuary', ageRange: [1, 20] },
  { species: 'Himalayan Black Bear', scientificName: 'Ursus thibetanus', zone: 'Zone D - Bear Sanctuary', ageRange: [1, 22] },
  { species: 'Red Panda', scientificName: 'Ailurus fulgens', zone: 'Zone D - Bear Sanctuary', ageRange: [1, 12] },
  { species: 'Spotted Deer', scientificName: 'Axis axis', zone: 'Zone E - Open Grasslands', ageRange: [0, 12] },
  { species: 'Sambar Deer', scientificName: 'Rusa unicolor', zone: 'Zone E - Open Grasslands', ageRange: [0, 14] },
  { species: 'Barasingha', scientificName: 'Rucervus duvaucelii', zone: 'Zone E - Open Grasslands', ageRange: [0, 13] },
  { species: 'Indian Gazelle', scientificName: 'Gazella bennettii', zone: 'Zone E - Open Grasslands', ageRange: [0, 10] },
  { species: 'Chinkara', scientificName: 'Gazella bennettii', zone: 'Zone E - Open Grasslands', ageRange: [0, 10] },
  { species: 'Blackbuck', scientificName: 'Antilope cervicapra', zone: 'Zone E - Open Grasslands', ageRange: [0, 12] },
  { species: 'Nilgai', scientificName: 'Boselaphus tragocamelus', zone: 'Zone E - Open Grasslands', ageRange: [0, 12] },
  { species: 'Gaur', scientificName: 'Bos gaurus', zone: 'Zone E - Open Grasslands', ageRange: [1, 20] },
  { species: 'Indian Wild Boar', scientificName: 'Sus scrofa cristatus', zone: 'Zone E - Open Grasslands', ageRange: [0, 10] },
  { species: 'Indian Rhinoceros', scientificName: 'Rhinoceros unicornis', zone: 'Zone A - Elephant Sanctuary', ageRange: [1, 40] },
  { species: 'Nilgiri Tahr', scientificName: 'Nilgiritragus hylocrius', zone: 'Zone E - Open Grasslands', ageRange: [0, 10] },
  { species: 'Grey Langur', scientificName: 'Semnopithecus entellus', zone: 'Zone F - Primate Enclosure', ageRange: [0, 20] },
  { species: 'Rhesus Macaque', scientificName: 'Macaca mulatta', zone: 'Zone F - Primate Enclosure', ageRange: [0, 18] },
  { species: 'Slender Loris', scientificName: 'Loris lydekkerianus', zone: 'Zone F - Primate Enclosure', ageRange: [0, 8] },
  { species: 'Malabar Giant Squirrel', scientificName: 'Ratufa indica', zone: 'Zone F - Primate Enclosure', ageRange: [0, 8] },
  { species: 'Indian Flying Fox', scientificName: 'Pteropus medius', zone: 'Zone F - Primate Enclosure', ageRange: [0, 15] },
  { species: 'Indian Peafowl', scientificName: 'Pavo cristatus', zone: 'Zone G - Aviary', ageRange: [0, 15] },
  { species: 'White-backed Vulture', scientificName: 'Gyps bengalensis', zone: 'Zone G - Aviary', ageRange: [0, 25] },
  { species: 'Himalayan Griffon', scientificName: 'Gyps himalayensis', zone: 'Zone G - Aviary', ageRange: [0, 25] },
  { species: 'Steppe Eagle', scientificName: 'Aquila nipalensis', zone: 'Zone G - Aviary', ageRange: [0, 20] },
  { species: 'Sarus Crane', scientificName: 'Antigone antigone', zone: 'Zone G - Aviary', ageRange: [0, 25] },
  { species: 'Greater Flamingo', scientificName: 'Phoenicopterus roseus', zone: 'Zone G - Aviary', ageRange: [0, 30] },
  { species: 'Painted Stork', scientificName: 'Mycteria leucocephala', zone: 'Zone G - Aviary', ageRange: [0, 20] },
  { species: 'Great Indian Bustard', scientificName: 'Ardeotis nigriceps', zone: 'Zone G - Aviary', ageRange: [0, 15] },
  { species: 'Mugger Crocodile', scientificName: 'Crocodylus palustris', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 40] },
  { species: 'Gharial', scientificName: 'Gavialis gangeticus', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 35] },
  { species: 'Indian Rock Python', scientificName: 'Python molurus', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 25] },
  { species: 'King Cobra', scientificName: 'Ophiophagus hannah', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 20] },
  { species: 'Indian Star Tortoise', scientificName: 'Geochelone elegans', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 50] },
  { species: 'Monitor Lizard', scientificName: 'Varanus bengalensis', zone: 'Zone H - Reptile Enclosure', ageRange: [1, 15] },
  { species: 'Striped Hyena', scientificName: 'Hyaena hyaena', zone: 'Zone I - Scavenger Reserve', ageRange: [1, 12] },
  { species: 'Golden Jackal', scientificName: 'Canis aureus', zone: 'Zone I - Scavenger Reserve', ageRange: [0, 10] },
  { species: 'Indian Wolf', scientificName: 'Canis lupus pallipes', zone: 'Zone I - Scavenger Reserve', ageRange: [1, 13] },
  { species: 'Dhole', scientificName: 'Cuon alpinus', zone: 'Zone I - Scavenger Reserve', ageRange: [1, 12] },
  { species: 'Otter', scientificName: 'Lutrogale perspicillata', zone: 'Zone I - Scavenger Reserve', ageRange: [0, 12] },
  { species: 'Indian Pangolin', scientificName: 'Manis crassicaudata', zone: 'Zone I - Scavenger Reserve', ageRange: [0, 15] },
];

const NAME_POOL = [
  'Gajraj', 'Meera', 'Sher Khan', 'Amba', 'Simba', 'Rani', 'Bhalu', 'Chintu', 'Laxmi', 'Arjun',
  'Kesar', 'Vijay', 'Durga', 'Raja', 'Shanti', 'Bahadur', 'Ganga', 'Veer', 'Kavya', 'Pawan',
  'Tara', 'Indra', 'Sona', 'Bijli', 'Chandra', 'Surya', 'Prakash', 'Neel', 'Kiran', 'Ratan',
  'Moti', 'Heera', 'Panna', 'Gulab', 'Chameli', 'Basanti', 'Kajal', 'Anmol', 'Deepak', 'Roshni',
  'Nandini', 'Vikram', 'Aditi', 'Rohan', 'Priya', 'Karan', 'Ishaan', 'Anaya', 'Reyansh', 'Myra',
  'Sai', 'Tanvi', 'Om', 'Riya', 'Aarav', 'Diya', 'Vivaan', 'Saanvi', 'Ayaan', 'Pari',
  'Rudra', 'Meher', 'Yash', 'Naina', 'Dev', 'Ira', 'Kabir', 'Zara', 'Arnav', 'Myra',
  'Shiv', 'Anika', 'Aryan', 'Navya', 'Dhruv', 'Aarohi', 'Krish', 'Ahana', 'Reeva', 'Vihaan',
];

const STATUS_OPTIONS = ['Stable', 'Stable', 'Stable', 'Stable', 'Under Observation', 'Recovering', 'Critical'];
const ACTIVITY_OPTIONS = ['Low', 'Normal', 'Normal', 'High'];
const DIET_OPTIONS = ['Poor', 'Fair', 'Good', 'Good', 'Excellent'];

function buildTwinFromStatus(status) {
  let healthScore, riskLevel, predictionText, activityLevel, stressLevel;

  if (status === 'Critical') {
    healthScore = randomInt(20, 55);
    riskLevel = 'High';
    predictionText = 'Veterinary examination recommended soon';
    activityLevel = 'Low';
    stressLevel = randomFrom(['Medium', 'High']);
  } else if (status === 'Under Observation' || status === 'Recovering') {
    healthScore = randomInt(56, 79);
    riskLevel = 'Medium';
    predictionText = 'Monitor closely — mild risk factors detected';
    activityLevel = randomFrom(['Low', 'Normal']);
    stressLevel = randomFrom(['Low', 'Medium']);
  } else {
    healthScore = randomInt(80, 100);
    riskLevel = 'Low';
    predictionText = 'Healthy next 30 days';
    activityLevel = randomFrom(ACTIVITY_OPTIONS);
    stressLevel = 'Low';
  }

  return { healthScore, riskLevel, predictionText, activityLevel, stressLevel, dietStatus: randomFrom(DIET_OPTIONS) };
}

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database with large-scale realistic sample data...');

  await Animal.deleteMany({});
  await DigitalTwin.deleteMany({});
  await AIAlert.deleteMany({});
  console.log('🧹 Cleared old animals, digital twins, and alerts');

  const existingAdmin = await User.findOne({ role: 'SuperAdmin' });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    await User.create({
      name: 'Admin User',
      email: '[email protected]',
      password: hashedPassword,
      role: 'SuperAdmin',
    });
    console.log('👤 Created default SuperAdmin: [email protected] / admin1234');
  }

  const TOTAL_ANIMALS = 1000;
  const usedNames = new Set();

  for (let i = 0; i < TOTAL_ANIMALS; i++) {
    const speciesInfo = randomFrom(SPECIES_CATALOG);
    const status = randomFrom(STATUS_OPTIONS);
    const twinData = buildTwinFromStatus(status);

    let name = randomFrom(NAME_POOL);
    if (usedNames.has(name)) {
      name = `${name} ${i}`;
    }
    usedNames.add(name);

    const age = randomInt(speciesInfo.ageRange[0], speciesInfo.ageRange[1]);
    const arrivalYear = randomInt(2018, 2026);
    const speciesImage = await fetchSpeciesImage(speciesInfo.species);

    const animal = await Animal.create({
      name,
      species: speciesInfo.species,
      scientificName: speciesInfo.scientificName,
      gender: randomFrom(['Male', 'Female']),
      estimatedAge: age,
      dateOfArrival: randomDate(arrivalYear),
      enclosureLocation: speciesInfo.zone,
      currentStatus: status,
      qrCode: generateQR(),
      profileImage: speciesImage,
    });

    await DigitalTwin.create({
      animalId: animal._id,
      healthScore: twinData.healthScore,
      activityLevel: twinData.activityLevel,
      dietStatus: twinData.dietStatus,
      stressLevel: twinData.stressLevel,
      aiRiskLevel: twinData.riskLevel,
      aiPredictionText: twinData.predictionText,
      lastCalculatedAt: randomDate(2026),
    });

    if (twinData.riskLevel === 'High' || twinData.riskLevel === 'Medium') {
      await AIAlert.create({
        animalId: animal._id,
        alertType: 'Health Prediction',
        severity: twinData.riskLevel === 'High' ? 'Critical' : 'Warning',
        observation: `Health score at ${twinData.healthScore}%, activity level ${twinData.activityLevel}, stress level ${twinData.stressLevel}`,
        possibleConcern: twinData.riskLevel === 'High' ? 'Significant health discomfort' : 'Early signs of health decline',
        recommendedAction: twinData.riskLevel === 'High' ? 'Immediate veterinary examination required' : 'Schedule a veterinary check-up soon',
        status: randomFrom(['Open', 'Open', 'Acknowledged', 'Resolved']),
      });
    }

    if ((i + 1) % 50 === 0) {
      console.log(`✅ ${i + 1} / ${TOTAL_ANIMALS} animals created...`);
    }
  }

  console.log(`🎉 Seeding complete! ${TOTAL_ANIMALS} animals created across ${SPECIES_CATALOG.length} species.`);
  mongoose.connection.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.connection.close();
});