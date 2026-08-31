require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testBot() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        console.log("Model initialized, sending message...");
        const result = await model.generateContent("hello");
        console.log("Response:", await result.response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
testBot();
