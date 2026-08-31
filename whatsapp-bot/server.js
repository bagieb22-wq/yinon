require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve the HTML UI

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userChats = new Map();
const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash"];

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const sessionId = "browser_user";
        
        const systemPrompt = `
אתה איש מכירות אינטליגנטי של סוכנות הביטוח IBS.
מטרתך היא לנהל שיחה אנושית, מתגלגלת וטבעית עם הלקוח.

חוקים קריטיים (חובה ציות מלא):
1. זיכרון: אתה מנהל שיחה מתמשכת (יש לך זיכרון).
2. צעד אחר צעד: שאל *רק שאלה אחת בכל פעם*. לעולם אל תשאל 2 שאלות באותה הודעה.
3. סבלנות: *אסור* לך להפנות את הלקוח לצוות או להציע שיחה טלפונית בהודעה הראשונה או השנייה.
4. בלי קישורים בהתחלה: *אסור* לך לתת את הלינק לאתר (https://bagieb22-wq.github.io/yinon/) עד שהלקוח לא מראה עניין ספציפי בתשואות או מבקש לראות נתונים.
5. איסוף מידע עדין: כשהלקוח פונה, תגיד שלום ותשאל שאלה אחת פשוטה כדי להתחיל. למשל: "שלום! איזה סוג ביטוח אתה מחפש?". 
6. רק אחרי שיש לך מספיק פרטים (למשל, הלקוח אמר שהוא בן 30 ומחפש קופת גמל ב-1000 ש"ח בחודש), *רק אז* תגיד: "מעולה, זה נשמע מצוין. הצוות המקצועי שלנו ישמח להרכיב לך תיק. תוכל לבחור שעה שנוחה לך לשיחה ביומן שלנו כאן: https://calendar.app.google/NXSunujKqCn7ag2J9"
7. אל תייעץ: אל תמליץ על מסלול, רק תאסוף מידע.
`;

        if (!userChats.has(sessionId)) {
            userChats.set(sessionId, { history: [] });
        }
        
        let sessionData = userChats.get(sessionId);
        let reply = "";
        
        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i];
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                });
                
                const chat = model.startChat({ history: sessionData.history });
                const result = await chat.sendMessage(userMessage);
                
                sessionData.history = await chat.getHistory();
                reply = await result.response.text();
                break;
            } catch (err) {
                console.error(`[Fallback] Model ${modelName} failed:`, err.message);
                if (i === modelsToTry.length - 1) {
                    reply = "מצטערים, כל השרתים שלנו עמוסים כרגע. נסה שוב מאוחר יותר.";
                }
            }
        }
        
        res.json({ reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "שגיאה פנימית בשרת." });
    }
});

app.listen(port, () => {
    console.log(`WhatsApp Simulator server running at http://localhost:${port}`);
});
