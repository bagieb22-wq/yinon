require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAPI() {
    console.log("בודק את מפתח ה-API מול השרתים של גוגל...");
    
    if (!process.env.GEMINI_API_KEY) {
        console.error("שגיאה: לא נמצא מפתח API.");
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        
        const result = await model.generateContent("Say 'Test successful' in Hebrew.");
        const response = await result.response;
        console.log("✅ הצלחה! התשובה מגוגל: " + response.text());
    } catch (error) {
        console.error("❌ שגיאה בבדיקת המפתח. המפתח כנראה לא תקין.");
        console.error("פרטי השגיאה:", error.message);
    }
}

testAPI();
