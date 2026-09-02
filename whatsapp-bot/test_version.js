require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testVersion(modelName) {
    try {
        console.log(`\nTesting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("hello");
        console.log(`✅ Success! ${modelName} is available.`);
        return true;
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        return false;
    }
}

async function run() {
    await testVersion("gemini-3.8-flash");
    await testVersion("gemini-flash-latest");
}
run();
