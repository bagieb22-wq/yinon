const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

// The calendar ID is usually the primary email address of the calendar owner
const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';

// Load the Service Account key
const KEY_PATH = path.join(__dirname, 'calendar-key.json');

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Gets available time slots for a given date.
 * Currently returns a mock summary, but can be expanded to check actual free/busy.
 */
async function checkAvailability(dateStr) {
    try {
        console.log(`Checking availability for ${dateStr}...`);
        
        // Ensure date is valid format (YYYY-MM-DD)
        const date = new Date(dateStr);
        if (isNaN(date)) {
             return "תאריך לא חוקי. אנא השתמש בפורמט YYYY-MM-DD (לדוגמה 2026-09-03).";
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(9, 0, 0, 0); // Work hours start at 9:00

        const endOfDay = new Date(date);
        endOfDay.setHours(18, 0, 0, 0); // Work hours end at 18:00

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                timeZone: 'Asia/Jerusalem',
                items: [{ id: CALENDAR_ID }]
            }
        });

        const busySlots = response.data.calendars[CALENDAR_ID].busy;
        
        if (busySlots.length === 0) {
            return `ביום ${dateStr} היומן פנוי לחלוטין בין השעות 09:00 ל-18:00. אנא הצע ללקוח לבחור שעה בטווח הזה.`;
        } else {
            let busyTimes = busySlots.map(slot => {
                const s = new Date(slot.start).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
                const e = new Date(slot.end).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
                return `${s}-${e}`;
            });
            return `ביום ${dateStr}, השעות הבאות כבר תפוסות ביומן: ${busyTimes.join(', ')}. אנא הצע ללקוח לבחור שעה פנויה שאינה ברשימה זו, בין 09:00 ל-18:00.`;
        }
    } catch (error) {
        console.error("Error checking availability:", error);
        return "הייתה שגיאה בבדיקת היומן. אנא התנצל בפני הלקוח ונסה שוב, או הצע לו טווח שעות כללי.";
    }
}

/**
 * Creates a calendar event for the booked appointment.
 */
async function bookAppointment(name, idNumber, occupation, goals, dateStr, timeStr) {
    try {
        console.log(`Booking appointment for ${name} at ${dateStr} ${timeStr}...`);
        
        // Parse the start time
        const startTime = new Date(`${dateStr}T${timeStr}:00`);
        if (isNaN(startTime)) {
            return "זמן לא חוקי. אנא שלח תאריך בפורמט YYYY-MM-DD ושעה בפורמט HH:MM.";
        }

        // Assume 45 minute meetings
        const endTime = new Date(startTime.getTime() + 45 * 60000);

        const event = {
            summary: `פגישת ייעוץ IBS: ${name}`,
            description: `
פרטי הלקוח מהתחקיר האוטומטי:
------------------------------
שם מלא: ${name}
תעודת זהות: ${idNumber}
תעסוקה: ${occupation}
מטרת הפגישה: ${goals}
------------------------------
נקבע באמצעות הבוט הווירטואלי של IBS.
            `.trim(),
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Jerusalem',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Jerusalem',
            },
        };

        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });

        return `הפגישה נקבעה בהצלחה! היא נשמרה ביומן תחת הקישור: ${response.data.htmlLink}`;
    } catch (error) {
        console.error("Error booking appointment:", error);
        return "הייתה שגיאה בקביעת הפגישה ביומן. ייתכן שההרשאות לא הוגדרו נכון. אנא הבהר ללקוח שתיצור איתו קשר בהקדם.";
    }
}

module.exports = {
    checkAvailability,
    bookAppointment
};
