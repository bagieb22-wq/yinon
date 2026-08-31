require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // We will just fetch one model to see if the key works at all
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Checking if key works with basic prompt...");
        const result = await model.generateContent("hello");
        console.log(await result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}
listModels();
