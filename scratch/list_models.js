import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const dotenvContent = fs.readFileSync(envPath, 'utf-8');
const match = dotenvContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

console.log("Listing models for key:", apiKey.slice(0, 12) + "..." + apiKey.slice(-6));

const ai = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    // In @google/generative-ai, listModels is on the client instance or we can fetch the models endpoint.
    // Let's use fetch since it's direct and doesn't depend on SDK version differences.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log("\n✅ Success! Available models:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log("No models returned:", data);
    }
  } catch (error) {
    console.log("\n❌ Failed to query models:");
    console.log(error.message || error);
  }
}

run();
