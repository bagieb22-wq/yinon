require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. הגדרת הבינה המלאכותית (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// שמירת זיכרון שיחות לפי מספר טלפון
const userChats = new Map();

// פונקציה לשליחת ההודעה לגוגל וקבלת תשובה
const userChats = new Map();
const modelsToTry = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash"];

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
                    timeStr: { type: "STRING", description: "שעת הפגישה בפורמט HH:MM (למשל 10:30)" }
                },
                required: ["name", "idNumber", "occupation", "goals", "dateStr", "timeStr"]
            }
        }
    ]
}];

async function generateAIResponse(userMessage, userId, onFallbackMessage) {
    if (!process.env.GEMINI_API_KEY) {
        return "שגיאה: חסר מפתח API של גוגל בקובץ .env";
    }

    const systemPrompt = `
אתה סוכן ביטוח ופיננסים אינטליגנטי של סוכנות IBS. הוא מתנהג כסוכן אנושי.
מטרתך היא לנהל שיחה אנושית, טבעית, להבין את הצרכים לעומק, ולאסוף פרטים מזהים לבדיקה, ולבסוף לקבוע להם פגישה.

שלבי השיחה (חובה לעבוד לפי הסדר, וכל פעם לשאול *רק שאלה אחת*):

שלב 1: חקר עומק והבנת הצורך
חובה לאסוף את כל המידע הבא מהלקוח (שאל רק שאלה אחת בכל הודעה):
1. מה התחום המדויק שמעניין אותו.
2. גיל ומצב משפחתי.
3. סטטוס תעסוקתי.
4. מטרה עיקרית.
5. סדר גודל סכום להשקעה (אם רלוונטי).
רק אחרי שיש לך פרופיל מלא, עבור לשלב 2.

שלב 2: איסוף פרטים מזהים
כדי לבצע בדיקה מקצועית, בקש מהלקוח: תעודת זהות + תאריך הנפקה.

שלב 3: הפניה ליומן פגישות הממוחשב (Function Calling)
אחרי קבלת הת"ז, עליך לקבוע פגישה ישירות ביומן!
1. שאל את הלקוח באיזה יום נוח לו (למשל: "מתי נוח לך שנדבר השבוע?").
2. כשהוא בוחר יום, הפעל מיד את הכלי check_availability עבור התאריך ההוא.
3. לאחר קבלת התשובה מהיומן על השעות התפוסות, הצג ללקוח שעות פנויות הגיוניות (בין 09:00 ל-18:00 שאינן תפוסות) ושאל אותו מה נוח לו.
4. כשהלקוח מסכים על שעה, הפעל את הכלי book_appointment עם כל הפרטים שאספת עליו עד כה.
5. הודע ללקוח שהפגישה נקבעה בהצלחה.

חוקים קריטיים:
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
            if (i === 0) {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("TIMEOUT - לקח יותר מדי זמן")), 7000);
                });
                const apiPromise = chat.sendMessage(userMessage);
                apiPromise.catch(() => {});
                result = await Promise.race([apiPromise, timeoutPromise]);
            } else {
                result = await chat.sendMessage(userMessage);
            }
            
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
            if (i === 0 && onFallbackMessage) {
                onFallbackMessage("זיהינו עומס בשרת הראשי. אנחנו מעבירים את השיחה לשרת גיבוי, אנא המתן מספר שניות...");
            }
            if (i === modelsToTry.length - 1) {
                return "מצטערים, כל השרתים שלנו עמוסים כרגע. נשמח לעזור לך בהמשך או שתחייג אלינו!";
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

    // שולח אנימציה של "מקליד..." בזמן שה-AI חושב
    const chat = await msg.getChat();
    chat.sendStateTyping();

    // שולח את ההודעה ל-AI ומקבל תשובה, וגם מעביר פונקציית גיבוי
    const aiResponse = await generateAIResponse(msg.body, msg.from, (fallbackMsg) => {
        msg.reply(fallbackMsg);
        // מחזיר אנימציית הקלדה כי הבוט ממשיך לחשוב בשרת השני
        chat.sendStateTyping();
    });
    
    // עוצר את אנימציית ההקלדה ושולח את ההודעה חזרה ללקוח
    chat.clearState();
    msg.reply(aiResponse);
});

// הפעלת הבוט
client.initialize();
