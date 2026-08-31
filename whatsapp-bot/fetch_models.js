require('dotenv').config();

async function checkModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error("API Error:", data.error.message);
        } else {
            console.log("Available models:");
            data.models.forEach(m => console.log(m.name));
        }
    } catch (e) {
        console.error(e);
    }
}
checkModels();
