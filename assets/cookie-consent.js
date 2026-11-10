/**
 * IBS Insurance & Finance - Cookie Consent Banner
 * Compliant with Israeli Privacy Protection Law (Amendment 13) & Cookie Regulations
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'ibs_cookie_consent';
    var DATE_KEY = 'ibs_cookie_consent_date';

    function initCookieConsent() {
        var existingConsent = localStorage.getItem(STORAGE_KEY);
        if (existingConsent) {
            return; // Consent already provided
        }
        showBanner();
    }

    function showBanner() {
        if (document.getElementById('ibs-cookie-banner')) return;

        // Inject Styles
        var style = document.createElement('style');
        style.id = 'ibs-cookie-styles';
        style.textContent = `
            #ibs-cookie-banner {
                position: fixed;
                bottom: 24px;
                right: 24px;
                left: 24px;
                max-width: 640px;
                margin: 0 auto;
                background: #ffffff;
                color: #1e293b;
                border-radius: 16px;
                box-shadow: 0 12px 40px rgba(13, 59, 102, 0.22), 0 2px 10px rgba(0, 0, 0, 0.08);
                border: 1px solid #e2e8f0;
                padding: 1.4rem 1.6rem;
                z-index: 9999999;
                font-family: 'Heebo', system-ui, -apple-system, sans-serif;
                direction: rtl;
                text-align: right;
                animation: ibsSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
            }
            @keyframes ibsSlideUp {
                from { transform: translateY(40px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes ibsSlideDown {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(40px); opacity: 0; }
            }
            .ibs-cookie-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 0.6rem;
            }
            .ibs-cookie-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 1.1rem;
                font-weight: 800;
                color: #0d3b66;
                margin: 0;
            }
            .ibs-cookie-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 1.4rem;
                cursor: pointer;
                line-height: 1;
                padding: 4px;
                border-radius: 50%;
                transition: color 0.2s, background 0.2s;
            }
            .ibs-cookie-close:hover {
                color: #0f172a;
                background: #f1f5f9;
            }
            .ibs-cookie-text {
                font-size: 0.92rem;
                line-height: 1.6;
                color: #475569;
                margin: 0 0 1.2rem 0;
            }
            .ibs-cookie-text a {
                color: #00a896;
                text-decoration: underline;
                font-weight: 700;
            }
            .ibs-cookie-text a:hover {
                color: #028072;
            }
            .ibs-cookie-actions {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .ibs-btn-accept {
                background: #0d3b66;
                color: #ffffff;
                border: none;
                padding: 10px 22px;
                border-radius: 25px;
                font-size: 0.92rem;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                box-shadow: 0 4px 12px rgba(13, 59, 102, 0.25);
            }
            .ibs-btn-accept:hover {
                background: #00a896;
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(0, 168, 150, 0.35);
            }
            .ibs-btn-essential {
                background: #f8fafc;
                color: #334155;
                border: 1px solid #cbd5e1;
                padding: 9px 18px;
                border-radius: 25px;
                font-size: 0.88rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            .ibs-btn-essential:hover {
                background: #e2e8f0;
                color: #0f172a;
            }
            .ibs-cookie-link {
                color: #64748b;
                font-size: 0.85rem;
                text-decoration: underline;
                margin-right: auto;
            }
            @media (max-width: 600px) {
                #ibs-cookie-banner {
                    bottom: 12px;
                    right: 12px;
                    left: 12px;
                    padding: 1.1rem 1.2rem;
                }
                .ibs-cookie-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
                .ibs-btn-accept, .ibs-btn-essential {
                    text-align: center;
                    width: 100%;
                }
                .ibs-cookie-link {
                    text-align: center;
                    margin-right: 0;
                    margin-top: 4px;
                }
            }
        `;
        document.head.appendChild(style);

        // Banner HTML
        var banner = document.createElement('div');
        banner.id = 'ibs-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'הודעת פרטיות וקובצי עוגיות');
        banner.setAttribute('aria-modal', 'false');

        banner.innerHTML = `
            <div class="ibs-cookie-header">
                <h4 class="ibs-cookie-title">
                    <span>🍪</span>
                    <span>שמירה על הפרטיות וקובצי עוגיות (Cookies)</span>
                </h4>
                <button type="button" class="ibs-cookie-close" id="ibs-cookie-x" aria-label="סגירה">&times;</button>
            </div>
            <p class="ibs-cookie-text">
                באתר <strong>IBS סוכנות לביטוח ופיננסים</strong> אנו משתמשים בעוגיות הכרחיות לפעילות האתר וכן בכלי מדידה וניתוח (כגון Google Analytics ו-Meta Pixel) כדי להבטיח גלישה מאובטחת, לשפר את השירות ולהציג תכנים מותאמים. מידע מלא מופיע ב<a href="privacy.html">מדיניות הפרטיות והעוגיות</a> שלנו.
            </p>
            <div class="ibs-cookie-actions">
                <button type="button" class="ibs-btn-accept" id="ibs-accept-all">אישור כל העוגיות</button>
                <button type="button" class="ibs-btn-essential" id="ibs-accept-essential">עוגיות הכרחיות בלבד</button>
                <a href="privacy.html#cookies" class="ibs-cookie-link">פירוט והגדרות</a>
            </div>
        `;

        document.body.appendChild(banner);

        // Event Listeners
        document.getElementById('ibs-accept-all').addEventListener('click', function() {
            saveConsent('all');
            closeBanner();
        });

        document.getElementById('ibs-accept-essential').addEventListener('click', function() {
            saveConsent('essential');
            closeBanner();
        });

        document.getElementById('ibs-cookie-x').addEventListener('click', function() {
            saveConsent('essential');
            closeBanner();
        });
    }

    function saveConsent(type) {
        try {
            localStorage.setItem(STORAGE_KEY, type);
            localStorage.setItem(DATE_KEY, new Date().toISOString());
        } catch (e) {
            // localStorage might be unavailable in private browsing
        }
    }

    function closeBanner() {
        var banner = document.getElementById('ibs-cookie-banner');
        if (banner) {
            banner.style.animation = 'ibsSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(function() {
                if (banner && banner.parentNode) {
                    banner.parentNode.removeChild(banner);
                }
            }, 300);
        }
    }

    // Expose global helper to reopen settings from privacy page or footer
    window.openCookieSettings = function() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch(e) {}
        showBanner();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        initCookieConsent();
    }
})();
