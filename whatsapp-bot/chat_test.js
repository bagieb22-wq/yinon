require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

// הגדרת המוח כמו בבוט האמיתי
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const userChats = new Map();
const modelsToTry = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-3.5-flash"];

async function chatWithBot(userMessage) {
    try {
        const sessionId = "cli_user";
        
        const systemPrompt = `
אתה סוכן ביטוח ופיננסים אינטליגנטי של סוכנות IBS.
מטרתך היא לנהל שיחה אנושית, מקצועית וטבעית עם הלקוח, להבין את הצרכים שלו לעומק, ולאסוף פרטים מזהים לבדיקה.

שלבי השיחה (חובה לעבוד לפי הסדר, וכל פעם לשאול *רק שאלה אחת*):

שלב 1: חקר עומק והבנת הצורך
כשהלקוח פונה, הראה התעניינות אמיתית ושאל שאלות כדי להבין את המצב שלו. 
חובה עליך לאסוף את *כל* המידע הבא מהלקוח (זכור: שאל רק שאלה אחת בכל הודעה, לא הכל בבת אחת!):
1. מה התחום המדויק שמעניין אותו (ביטוח, פנסיה, קופת גמל, השתלמות וכו').
2. גיל הלקוח ומצב משפחתי (רווק/נשוי/ילדים).
3. סטטוס תעסוקתי (שכיר או עצמאי) ובמה הוא עוסק.
4. מה המטרה העיקרית שלו (הוזלת דמי ניהול, חיסכון לילדים, בדיקת כפילויות בביטוחים, בניית תיק השקעות).
5. אם זה חיסכון/השקעה: מה סדר הגודל של הסכום הפנוי או ההפקדה החודשית.
רק אחרי שניהלת איתו שיחה ארוכה ויש לך פרופיל מלא ומפורט של הלקוח, עבור לשלב 2.
*אסור בשלב זה לבקש פרטים אישיים מזהים או לתת קישורים*.

שלב 2: איסוף פרטים מזהים לבדיקה
רק אחרי שהבנת בדיוק מה הלקוח מחפש ויש לך תמונה ברורה, תגיד לו שהשלב הבא הוא לעשות עבורו בדיקה יסודית.
כדי לבצע את הבדיקה (למשל במסלקה הפנסיונית או בהר הביטוח), בקש ממנו 2 פרטים: מספר תעודת זהות + תאריך הנפקה של תעודת הזהות.
(שאל רק שאלה אחת בכל פעם, או בקש את שניהם יחד במשפט אחד קצר).

שלב 3: הפניה ליומן פגישות
אחרי שהלקוח סיפק את תעודת הזהות ותאריך ההנפקה, תגיד: "מעולה, הפרטים התקבלו והצוות שלנו יתחיל בבדיקה. כדי שנוכל לחזור אליך עם תשובות והרכבת תיק מסודרת, אנא בחר שעה שנוחה לך לשיחה ביומן שלנו כאן: https://calendar.app.google/NXSunujKqCn7ag2J9"

חוקים קריטיים:
- זיכרון: אתה מנהל שיחה מתמשכת (יש לך זיכרון).
- לעולם אל תשאל 2 שאלות שונות באותה הודעה.
- אל תייעץ ואל תמליץ על מסלול ספציפי, רק תאסוף מידע.
- בלי קישורים בהתחלה: אל תיתן את יומן הפגישות ואל תיתן את האתר עד שלב 3.
        `;
        
        if (!userChats.has(sessionId)) {
            userChats.set(sessionId, { history: [] });
        }
        
        let sessionData = userChats.get(sessionId);
        
        for (let i = 0; i < modelsToTry.length; i++) {
            const modelName = modelsToTry[i];
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
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
                
                sessionData.history = await chat.getHistory();
                return await result.response.text();
            } catch (error) {
                console.error(`\n[Fallback] Model ${modelName} failed:`, error.message);
                if (i === modelsToTry.length - 1) {
                    return "מצטערים, כל השרתים שלנו עמוסים כרגע.";
                }
            }
        }
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
