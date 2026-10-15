// update_calcalist.js
// Automated live fetcher for real Calcalist Capital Market news articles into assets/market_news.json
const https = require('https');
const fs = require('fs');
const path = require('path');

function unescapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}

function stripHtml(text) {
    if (!text) return '';
    let unescaped = unescapeHtml(text);
    let stripped = unescaped.replace(/<[^>]*>/g, ' ');
    stripped = stripped.replace(/\s+/g, ' ').trim();
    stripped = stripped.replace(/\s*-\s*calcalist$/i, '').replace(/calcalist$/i, '').trim();
    return stripped;
}

function getCategoryInfo(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('וול סטריט') || t.includes('נאסד"ק') || t.includes('s&p') || t.includes('דאו ג\'ונס') || t.includes('ארה"ב') || t.includes('פד') || t.includes('טסלה') || t.includes('אפל') || t.includes('אנבידיה')) {
        return { categoryKey: 'wallstreet', categoryName: 'כלכליסט | וול סטריט ומדדים', badgeColor: '#0284c7' };
    }
    if (t.includes('ריבית') || t.includes('אינפלציה') || t.includes('בנק ישראל') || t.includes('מדד') || t.includes('צמיחה') || t.includes('תקציב') || t.includes('קרן המטבע') || t.includes('גירעון') || t.includes('פיקדונות') || t.includes('עו"ש')) {
        return { categoryKey: 'macro', categoryName: 'כלכליסט | מאקרו וריבית', badgeColor: '#b45309' };
    }
    if (t.includes('פנסיה') || t.includes('גמל') || t.includes('השתלמות') || t.includes('ביטוח') || t.includes('דמי ניהול') || t.includes('קצבה') || t.includes('חיסכון') || t.includes('הראל') || t.includes('מגדל') || t.includes('כלל') || t.includes('מנורה') || t.includes('הפניקס')) {
        return { categoryKey: 'pension', categoryName: 'כלכליסט | פנסיה וחיסכון', badgeColor: '#059669' };
    }
    if (t.includes('מס') || t.includes('מיסוי') || t.includes('רשות המסים') || t.includes('הטבות') || t.includes('תיקון 190')) {
        return { categoryKey: 'tax', categoryName: 'כלכליסט | מיסוי והטבות', badgeColor: '#7c3aed' };
    }
    if (t.includes('נדל"ן') || t.includes('דיור') || t.includes('משכנתא') || t.includes('שכירות') || t.includes('קרקע') || t.includes('בנייה')) {
        return { categoryKey: 'realestate', categoryName: 'כלכליסט | נדל"ן ומשכנתאות', badgeColor: '#ea580c' };
    }
    return { categoryKey: 'wallstreet', categoryName: 'כלכליסט | שוק ההון והבורסה', badgeColor: '#dc2626' };
}

function formatHebrewDate(pubDateStr) {
    try {
        const d = new Date(pubDateStr);
        if (isNaN(d.getTime())) return 'מהדורת שוק ההון';
        const now = new Date();
        const diffMs = now - d;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
            const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));
            return `לפני ${diffMin} דקות`;
        }
        if (diffHours < 24) {
            return `לפני כ-${diffHours} שעות`;
        }
        return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch (e) {
        return 'מהדורת שוק ההון';
    }
}

function fetchCalcalistNews() {
    console.log('Fetching live Calcalist Capital Market articles...');
    const query = 'site:calcalist.co.il ("שוק ההון" OR "בורסה" OR "מניות" OR "נדלן" OR "מדד" OR "ריבית" OR "קרן" OR "דיור")';
    const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=he&gl=IL&ceid=IL:he';

    const req = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    }, (res) => {
        let xml = '';
        res.on('data', chunk => xml += chunk);
        res.on('end', () => {
            const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
            console.log(`Found ${itemMatches.length} raw articles from Calcalist RSS.`);

            const parsed = [];
            for (const item of itemMatches) {
                const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
                const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
                const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
                const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

                const rawTitle = titleMatch ? titleMatch[1] : '';
                const cleanTitle = stripHtml(rawTitle);

                const rawDesc = descMatch ? descMatch[1] : '';
                const cleanDesc = stripHtml(rawDesc);

                const link = linkMatch ? linkMatch[1] : 'https://www.calcalist.co.il/market';
                const pubDate = dateMatch ? dateMatch[1] : '';

                if (cleanTitle && cleanTitle.length > 8 && !parsed.some(p => p.title === cleanTitle)) {
                    const catInfo = getCategoryInfo(cleanTitle);
                    let finalSummary = cleanDesc;
                    if (!finalSummary || finalSummary === cleanTitle) {
                        finalSummary = `דיווח שוטף ומבזק ישיר ממדורי שוק ההון, המסחר והבורסה של עיתון 'כלכליסט'. לחצו לקריאת הידיעה המלאה באתר כלכליסט.`;
                    }

                    parsed.push({
                        title: cleanTitle,
                        summary: finalSummary,
                        link: link,
                        date: pubDate,
                        formattedDate: formatHebrewDate(pubDate),
                        category: catInfo.categoryName,
                        categoryKey: catInfo.categoryKey,
                        badgeColor: catInfo.badgeColor,
                        source: 'כלכליסט'
                    });
                }
            }

            if (parsed.length === 0) {
                console.error('No articles parsed, keeping existing market_news.json');
                return;
            }

            const outputData = {
                source: "כלכליסט - שוק ההון (Calcalist Market)",
                source_url: "https://www.calcalist.co.il/market",
                last_updated: new Date().toISOString(),
                formatted_updated: new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                breaking_news: parsed.slice(0, 10).map(a => a.title),
                lead_story: parsed[0],
                side_stories: parsed.slice(1, 3),
                articles: parsed.slice(3, 25)
            };

            const targetPath = path.join(__dirname, 'assets', 'market_news.json');
            fs.writeFileSync(targetPath, JSON.stringify(outputData, null, 2), 'utf8');
            console.log(`SUCCESS: Saved ${parsed.length} real Calcalist articles to ${targetPath}`);
        });
    });

    req.on('error', err => {
        console.error('Error fetching Calcalist news:', err.message);
    });
}

fetchCalcalistNews();
