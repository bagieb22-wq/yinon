require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

// הגדרת המוח כמו בבוט האמיתי
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function chatWithBot(userMessage) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        
        // זה בדיוק אותו System Prompt כמו בוואטסאפ!
        const systemPrompt = `
אתה העוזר הדיגיטלי הרשמי של סוכנות הביטוח והפיננסים IBS.
המטרה שלך היא לענות באדיבות, לתת מידע ראשוני, ובעיקר - לאסוף מידע מהלקוח כדי להבין את הצרכים שלו לפני הפניה לנציג אנושי.

כללי ברזל:
1. שפה וייצוג: ענה תמיד בעברית, קצר ולעניין (עד 3 משפטים). דבר בשם IBS ("אנחנו", "הצוות שלנו").
2. איסור ייעוץ: אסור לך לתת ייעוץ פנסיוני, להמליץ על מסלול ספציפי או להגיד ללקוח איפה כדאי לו להשקיע.
3. איסוף מידע (הכי חשוב!): אל תציע מיד שיחה עם הצוות! כשלקוח פונה, שאל אותו שאלות מנחות כדי להבין מה הוא צריך. לדוגמה:
   - אם הוא מתעניין בהשקעה, שאל: "באיזה סדר גודל של סכום מדובר? האם מדובר בהשקעה חד-פעמית או בהפקדה חודשית?"
   - אם הוא מתעניין בביטוח או פנסיה, שאל: "האם אתה שכיר או עצמאי?"
4. הפניה לצוות - רק בסוף: *רק אחרי* שהלקוח ענה על השאלות המנחות שלך והבנת את הכיוון, הצע לו לשוחח איתנו: "מעולה, הבנתי את הצורך שלך. הצוות המקצועי שלנו ישמח לעזור לך להתקדם. מתי יהיה לך נוח שנתקשר?"
5. הפניה לאתר: אם הלקוח שואל על תשואות, הפנה אותו לאתר של IBS (בכתובת: https://bagieb22-wq.github.io/yinon/) כדי להשתמש במחשבון.
6. מענה חכם: אם אתה לא יודע את התשובה, בקש מהלקוח פרטים נוספים כדי שהצוות יחזור אליו עם תשובה מדויקת.

הודעת הלקוח: "${userMessage}"
        `;

        const result = await model.generateContent(systemPrompt);
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
