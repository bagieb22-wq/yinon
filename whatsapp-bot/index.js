require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. הגדרת הבינה המלאכותית (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// פונקציה לשליחת ההודעה לגוגל וקבלת תשובה
async function generateAIResponse(userMessage) {
    if (!process.env.GEMINI_API_KEY) {
        return "שגיאה: חסר מפתח API של גוגל בקובץ .env";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
        
        // כאן אנחנו מגדירים את ה"מוח" והכללים של הבוט
        const systemPrompt = `
אתה העוזר הדיגיטלי הרשמי של ינון, מסוכנות הביטוח והפיננסים IBS.
המטרה שלך היא לענות באדיבות ללקוחות הפונים בוואטסאפ.

כללי ברזל חמורים:
1. ענה תמיד בשפה העברית, בצורה מקצועית, שירותית ומזמינה. התשובות צריכות להיות קצרות (עד 3 משפטים) ומותאמות להודעת טקסט.
2. איסור מוחלט על ייעוץ פנסיוני או השקעות: אסור לך להגיד ללקוח איפה להשקיע או מה כדאי לו.
3. אם לקוח שואל איפה כדאי להשקיע, ענה: "התאמת אפיק השקעה דורשת היכרות אישית ובחינת צרכים. ינון הסוכן ישמח לבנות לך תיק אישי. נרצה לקבוע שיחה קצרה?"
4. הסבר כללי מותר: אתה יכול להסביר בכלליות מהי קופת גמל להשקעה (עד 79,000 ש"ח בשנה, נזיל), או מהי קרן השתלמות (פטורה ממס אחרי 6 שנים).
5. הפניה לאתר: הצע ללקוחות להיכנס לאתר של ינון כדי להשתמש במחשבון התשואות החכם לבדיקת מסלולים.
6. אם אינך יודע תשובה בוודאות מוחלטת, אמור: "אני אעביר את השאלה המצוינת הזו לינון, והוא יחזור אליך בהקדם."

הודעת הלקוח: "${userMessage}"
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error from AI:", error);
        return "מצטערים, יש כרגע עומס קטן במערכת. ינון יחזור אליך בהקדם.";
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
    const aiResponse = await generateAIResponse(msg.body);
    
    // עוצר את אנימציית ההקלדה ושולח את ההודעה חזרה ללקוח
    chat.clearState();
    msg.reply(aiResponse);
});

// הפעלת הבוט
client.initialize();
