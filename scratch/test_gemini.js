import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const dotenvContent = fs.readFileSync(envPath, 'utf-8');
const match = dotenvContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

console.log("Testing API Key:", apiKey.slice(0, 12) + "..." + apiKey.slice(-6));

const ai = new GoogleGenerativeAI(apiKey);

async function run() {
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
  for (const modelName of models) {
    try {
      console.log(`\nSending test request to ${modelName}...`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello! Respond with 'Connected successfully' if you hear me.");
      console.log(`✅ SUCCESS with ${modelName}! Response:`);
      console.log(result.response.text());
    } catch (error) {
      console.log(`❌ FAILED with ${modelName}!`);
      console.log(error.message || error);
    }
  }
}

run();
