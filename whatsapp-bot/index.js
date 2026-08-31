require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. הגדרת הבינה המלאכותית (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// שמירת זיכרון שיחות לפי מספר טלפון
const userChats = new Map();

// פונקציה לשליחת ההודעה לגוגל וקבלת תשובה
async function generateAIResponse(userMessage, userId) {
    if (!process.env.GEMINI_API_KEY) {
        return "שגיאה: חסר מפתח API של גוגל בקובץ .env";
    }

    try {
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
        
        if (!userChats.has(userId)) {
            userChats.set(userId, model.startChat());
        }
        
        const chat = userChats.get(userId);
        const result = await chat.sendMessage(userMessage);
        return await result.response.text();
    } catch (error) {
        console.error("Error from AI:", error);
        return "מצטערים, יש כרגע עומס קטן במערכת. נחזור אליך בהקדם.";
    }
}

// 2. הגדרת חיבור לוואטסאפ
// LocalAuth שומר את ההתחברות כדי שלא תצטרך לסרוק ברקוד כל פעם מחדש
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'] // עוזר במניעת שגיאות בסביבות מסוימות
    }
});

// הצגת ברקוד לסריקה בפעם הראשונה
client.on('qr', (qr) => {
    console.log('סרוק את הברקוד הזה עם הוואטסאפ שלך כדי לחבר את הבוט:');
    qrcode.generate(qr, { small: true });
});

// כשהבוט מוכן ומחובר
client.on('ready', () => {
    console.log('✅ הבוט של IBS מחובר לוואטסאפ ומוכן לפעולה!');
});

// מאזין להודעות נכנסות
client.on('message', async msg => {
    // מונע מהבוט לענות להודעות קבוצה או לסטטוסים
    if (msg.isGroupMsg || msg.isStatus) return;

    // מונע מהבוט לענות לעצמו
    if (msg.fromMe) return;

    console.log(`הודעה חדשה התקבלה מ: ${msg.from} | תוכן: ${msg.body}`);

    // שולח אנימציה של "מקליד..." בזמן שה-AI חושב
    const chat = await msg.getChat();
    chat.sendStateTyping();

    // שולח את ההודעה ל-AI ומקבל תשובה
    const aiResponse = await generateAIResponse(msg.body, msg.from);
    
    // עוצר את אנימציית ההקלדה ושולח את ההודעה חזרה ללקוח
    chat.clearState();
    msg.reply(aiResponse);
});

// הפעלת הבוט
client.initialize();
