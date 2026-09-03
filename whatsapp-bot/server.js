require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve the HTML UI

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userChats = new Map();
const modelsToTry = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash"];

const calendarTools = require('./calendar');

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
                        description: "התאריך לבדיקה בפורמט YYYY-MM-DD"
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
                    name: { type: "STRING" },
                    idNumber: { type: "STRING" },
                    occupation: { type: "STRING" },
                    goals: { type: "STRING" },
                    dateStr: { type: "STRING" },
                    timeStr: { type: "STRING" }
                },
                required: ["name", "idNumber", "occupation", "goals", "dateStr", "timeStr"]
            }
        }
    ]
}];

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const sessionId = "browser_user";
        
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
                    systemInstruction: systemPrompt,
                    tools: tools
                });
                
                const chat = model.startChat({ history: sessionData.history });
                
                let result;
                if (i === 0) {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 7000));
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
                reply = responseMsg.text();
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
