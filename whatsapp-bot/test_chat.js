require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const systemPrompt = "You are a helpful assistant.";
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash",
            systemInstruction: systemPrompt 
        });
        
        const chat = model.startChat();
        console.log("Sending message...");
        const result = await chat.sendMessage("Hello");
        console.log("Success:", await result.response.text());
    } catch (e) {
        console.error("ERROR DETECTED:", e);
    }
}
run();
