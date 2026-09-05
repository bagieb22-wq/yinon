require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. הגדרת הבינה המלאכותית (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// שמירת זיכרון שיחות לפי מספר טלפון
const userChats = new Map();

// מנהל מודלים
const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];

const calendarTools = require('./calendar');

// כלי עבודה שה-AI יכול להפעיל
const tools = [{
    functionDeclarations: [
        {
            name: "check_availability",
            description: "בודק ביומן מתי סוכן הביטוח פנוי או תפוס בתאריך מסוים.",
            parameters: {
                type: "OBJECT",
                properties: {
                    dateStr: {
                        type: "STRING",
                        description: "התאריך לבדיקה בפורמט YYYY-MM-DD, למשל 2026-09-03"
                    }
                },
                required: ["dateStr"]
            }
        },
        {
            name: "book_appointment",
            description: "קובע פגישה ביומן של סוכן הביטוח ומכניס את פרטי הלקוח פנימה.",
            parameters: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING", description: "שם הלקוח" },
                    idNumber: { type: "STRING", description: "תעודת זהות של הלקוח ותאריך הנפקה" },
                    occupation: { type: "STRING", description: "תעסוקת הלקוח" },
                    goals: { type: "STRING", description: "מטרת הפגישה של הלקוח" },
                    dateStr: { type: "STRING", description: "תאריך הפגישה בפורמט YYYY-MM-DD" },
                    timeStr: { type: "STRING", description: "שעת הפגישה בפורמט HH:MM (לדוגמה 10:30)" }
                },
                required: ["dateStr", "timeStr"]
            }
        },
        {
            name: "cancel_appointment",
            description: "מבטל פגישה קיימת ביומן על בסיס תעודת הזהות או הח.פ של הלקוח.",
            parameters: {
                type: "OBJECT",
                properties: {
                    idNumber: { type: "STRING", description: "תעודת הזהות או הח.פ איתה הלקוח קבע את הפגישה." }
                },
                required: ["idNumber"]
            }
        }
    ]
}];

async function generateAIResponse(messagePayload, userId, onFallbackMessage) {
    if (!process.env.GEMINI_API_KEY) {
        return "שגיאה: חסר מפתח API של גוגל בקובץ .env";
    }

    const systemPrompt = `
אתה סוכן ביטוח ופיננסים אינטליגנטי של סוכנות IBS. הוא מתנהג כסוכן אנושי.
מטרתך היא לנהל שיחה אנושית, טבעית, להבין את הצרכים לעומק, ולאסוף נתונים (תעודת זהות או דוחות פנסיוניים), ולבסוף לקבוע להם פגישה.

שלבי השיחה (חובה לעבוד לפי הסדר, וכל פעם לשאול *רק שאלה אחת*):

שלב 1: חקר עומק והבנת הצורך
חובה לאסוף את כל המידע הבא מהלקוח (שאל רק שאלה אחת בכל הודעה):
1. שם מלא של הלקוח.
2. מה התחום המדויק שמעניין אותו.
3. גיל ומצב משפחתי.
4. סטטוס תעסוקתי.
5. מטרה עיקרית.
6. סדר גודל סכום להשקעה (אם רלוונטי).
רק אחרי שיש לך פרופיל מלא, עבור לשלב 2.

שלב 2: איסוף נתונים לבדיקה
כדי לבצע בדיקה מקצועית, בקש מהלקוח: תעודת זהות + תאריך הנפקה, **או** הצע לו פשוט לשלוח לך לכאן בוואטסאפ קובץ PDF של הדו"ח (מהר הביטוח או המסלקה הפנסיונית).

שלב 3: ניתוח הדו"ח (במידה ונשלח קובץ PDF)
אם הלקוח שלח מסמך, קרא אותו ביסודיות!
שלוף 2-3 נקודות קריטיות שמצאת שם (למשל: דמי ניהול יקרים במספרים מדויקים, כפל ביטוחים, קופות שאפשר לשפר).
הצג ללקוח משפט או שניים עם התגליות שלך כדי להראות לו מקצועיות, ומיד לאחר מכן עבור לשלב 4 לקביעת פגישה כדי שתוכלו לסדר את זה.
אם הוא לא שלח קובץ ונתן רק ת"ז, עבור ישר לשלב 4.

שלב 4: הפניה ליומן פגישות הממוחשב (Function Calling)
אחרי קבלת הת"ז (או אחרי שניתחת את המסמך שלו), עליך לקבוע פגישה ישירות ביומן!
1. שאל את הלקוח באיזה יום נוח לו השבוע (למשל: "מתי נוח לך שנדבר?").
2. כשהוא בוחר יום, הפעל מיד את הכלי check_availability עבור התאריך ההוא.
3. לאחר קבלת התשובה מהיומן על השעות התפוסות, הצג ללקוח שעות פנויות הגיוניות (בין 09:00 ל-18:00 שאינן תפוסות) ושאל אותו מה נוח לו.
4. כאשר הלקוח מסכים על שעה, הפעל את הכלי book_appointment עם כל הפרטים כולל הזמן המדויק.
5. החזר ללקוח שהפגישה נקבעה בהצלחה.

ביטול פגישות:
- אם לקוח מבקש לבטל פגישה עתידית, בקש ממנו את תעודת הזהות (או ח.פ) שלו.
- רק לאחר שהלקוח מספק את המספר, הפעל את הכלי cancel_appointment.
- החזר ללקוח את תוצאת הביטול.

כללים הכרחיים:
- לעולם אל תשאל 2 שאלות שונות באותה הודעה.
- התאריך היום הוא: ${new Date().toISOString().split('T')[0]}.
`;

    if (!userChats.has(userId)) {
        userChats.set(userId, { history: [] });
    }
    
    let sessionData = userChats.get(userId);
    
    for (let i = 0; i < modelsToTry.length; i++) {
        const modelName = modelsToTry[i];
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: systemPrompt,
                tools: tools
            });
            
            const chat = model.startChat({ history: sessionData.history });
            
            let result;
            result = await chat.sendMessage(messagePayload);
            
            // Handle Function Calling Loop
            let responseMsg = result.response;
            while (responseMsg.functionCalls && responseMsg.functionCalls() && responseMsg.functionCalls().length > 0) {
                const call = responseMsg.functionCalls()[0];
                let apiResponse;
                
                if (call.name === 'check_availability') {
                    const resultText = await calendarTools.checkAvailability(call.args.dateStr);
                    apiResponse = { result: resultText };
                } else if (call.name === 'book_appointment') {
                    const resultText = await calendarTools.bookAppointment(
                        call.args.name, 
                        call.args.idNumber, 
                        call.args.occupation, 
                        call.args.goals, 
                        call.args.dateStr, 
                        call.args.timeStr
                    );
                    apiResponse = { result: resultText };
                } else if (call.name === 'cancel_appointment') {
                    const resultText = await calendarTools.cancelAppointment(call.args.idNumber);
                    apiResponse = { result: resultText };
                }
                
                const functionResponseParts = [{
                    functionResponse: {
                        name: call.name,
                        response: apiResponse
                    }
                }];
                
                result = await chat.sendMessage(functionResponseParts);
                responseMsg = result.response;
            }
            
            sessionData.history = await chat.getHistory();
            return responseMsg.text();
            
        } catch (error) {
            console.error(`[Fallback] Model ${modelName} failed:`, error.message);
            if (i === modelsToTry.length - 1) {
                let waitTime = 60;
                const match = error.message.match(/Please retry in ([\d\.]+)s/);
                if (match) waitTime = Math.ceil(parseFloat(match[1]));
                return `מערכת הבינה המלאכותית שלנו תחת עומס קל ותחזור לפעילות בעוד ${waitTime} שניות. אנא המתן...`;
            }
        }
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

    const chat = await msg.getChat();
    
    // שליחת אינדיקציית "מקליד..."
    chat.sendStateTyping();
    
    let userMessage = msg.body || "";
    let mediaPart = null;

    try {
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media.mimetype === 'application/pdf') {
                mediaPart = {
                    inlineData: {
                        data: media.data,
                        mimeType: media.mimetype
                    }
                };
                if (!userMessage) {
                    userMessage = "מצורף קובץ PDF של הדוח. קרא ונתח אותו.";
                }
            } else {
                if (!userMessage) {
                    chat.clearState();
                    return; // Ignore random photos without text
                }
            }
        }
    } catch (e) {
        console.error("Failed to download media", e);
    }

    const messagePayload = mediaPart ? [userMessage, mediaPart] : userMessage;

    // קבלת תשובה מה-AI (מעבירים את ה-Payload במקום רק טקסט)
    const aiResponse = await generateAIResponse(messagePayload, msg.from, (fallbackMsg) => {
        msg.reply(fallbackMsg);
        // מחדש אינדיקציית הקלדה כי הבוט החליף שרת
        chat.sendStateTyping();
    });
    
    // ניקוי אינדיקציית ההקלדה ושליחת התשובה חזרה ללקוח
    chat.clearState();
    msg.reply(aiResponse);
});

// הפעלת הבוט
client.initialize();
