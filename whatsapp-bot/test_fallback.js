require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel(modelName) {
    console.log("Testing:", modelName);
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("hello");
        console.log("Success! Response:", await result.response.text());
        return true;
    } catch (e) {
        console.log("Failed:", e.message);
        return false;
    }
}
testModel("gemini-3.6-flash");
