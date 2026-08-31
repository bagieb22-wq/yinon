require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

// הגדרת המוח כמו בבוט האמיתי
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const chats = new Map();

async function chatWithBot(userMessage) {
    try {
        const sessionId = "cli_user";
        
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
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: systemPrompt 
        });

        if (!chats.has(sessionId)) {
            chats.set(sessionId, model.startChat());
        }

        const chat = chats.get(sessionId);
        const result = await chat.sendMessage(userMessage);
        return await result.response.text();
    } catch (error) {
        return "שגיאה בחיבור לשרת: " + error.message;
    }
}

console.log("==========================================");
console.log("🤖 סימולטור בוט IBS (בדיקה ללא וואטסאפ)");
console.log("כתוב הודעה ולחץ Enter. כדי לצאת הקלד 'יציאה'.");
console.log("==========================================\n");

function askQuestion() {
    rl.question('אתה (לקוח): ', async (answer) => {
        if (answer.trim() === 'יציאה') {
            console.log('סוגר סימולטור...');
            rl.close();
            return;
        }

        console.log('🤖 הבוט חושב...');
        const response = await chatWithBot(answer);
        console.log('\nבוט IBS: ' + response + '\n');
        
        // שואל שוב
        askQuestion();
    });
}

askQuestion();
