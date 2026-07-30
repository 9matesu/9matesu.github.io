import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  baseURL: "https://api.venice.ai/api/v1",
  apiKey: process.env.VENICE_API_KEY,
});

const response = await client.chat.completions.create({
  model: "zai-org-glm-5-2",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello and confirm Venice AI is working." },
  ],
});

console.log(JSON.stringify(response, null, 2));
