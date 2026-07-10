const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateConservationStory({ animal, twin, medicalHighlights }) {
  const prompt = `
You are writing a short conservation awareness story for a wildlife sanctuary's donor newsletter and website.

Write a warm, respectful, factual 3-paragraph story about the following animal. Do not invent specific events, dates, or details that aren't provided below — you may describe general context (e.g., what the species needs, why sanctuaries matter) but stay honest about what's actually known.

ANIMAL FACTS:
- Name: ${animal.name}
- Species: ${animal.species}
- Gender: ${animal.gender}
- Arrived at sanctuary: ${animal.dateOfArrival ? new Date(animal.dateOfArrival).toDateString() : 'Unknown'}
- Current status: ${animal.currentStatus}
- Current AI-assessed health score: ${twin.healthScore}%
- Current risk level: ${twin.aiRiskLevel}
- Activity level: ${twin.activityLevel}
- Diet status: ${twin.dietStatus}
${medicalHighlights ? `- Notable medical history: ${medicalHighlights}` : ''}

STRUCTURE:
Paragraph 1: Introduce the animal warmly, its species, and arrival at the sanctuary.
Paragraph 2: Describe its current condition and care journey, grounded in the facts above.
Paragraph 3: A hopeful, forward-looking close that connects to the sanctuary's broader conservation mission.

Keep the tone sincere and professional — suitable for a real conservation organization's public communications. Avoid exaggeration or clichés.
`.trim();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateConservationStory };