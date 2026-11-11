/**
 * IBS Insurance & Finance - Cookie Consent & Settings Modal
 * Fully compliant with Israeli Privacy Protection Law (Amendment 13)
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'ibs_cookie_consent';
    var DATE_KEY = 'ibs_cookie_consent_date';
    var PREFS_KEY = 'ibs_cookie_preferences';

    // Expose global function immediately so clicks never fail
    window.openCookieSettings = function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', openModal);
        } else {
            openModal();
        }
    };

    // Inject Styles once
    function injectStyles() {
        if (document.getElementById('ibs-cookie-styles')) return;

        var style = document.createElement('style');
        style.id = 'ibs-cookie-styles';
        style.textContent = `
            /* Floating Banner */
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
                animation: ibsSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
                font-size: 1.5rem;
                cursor: pointer;
                line-height: 1;
                padding: 4px 8px;
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
            .ibs-btn-settings {
                background: none;
                border: none;
                color: #0d3b66;
                font-size: 0.88rem;
                font-weight: 700;
                cursor: pointer;
                text-decoration: underline;
                padding: 6px 10px;
                margin-right: auto;
                font-family: inherit;
            }
            .ibs-btn-settings:hover {
                color: #00a896;
            }

            /* Centered Cookie Modal Overlay */
            #ibs-cookie-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(13, 37, 66, 0.75);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                z-index: 2147483646;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                direction: rtl;
                text-align: right;
                font-family: 'Heebo', system-ui, -apple-system, sans-serif;
                animation: ibsFadeIn 0.25s ease-out forwards;
                box-sizing: border-box;
                cursor: pointer;
            }
            @keyframes ibsFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #ibs-cookie-modal {
                background: #ffffff;
                color: #1e293b;
                width: 100%;
                max-width: 580px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 1px solid #e2e8f0;
                padding: 2rem 2.2rem;
                position: relative;
                animation: ibsPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                box-sizing: border-box;
                cursor: default;
            }
            @keyframes ibsPopIn {
                from { transform: scale(0.92); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .ibs-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1.2rem;
                padding-bottom: 0.8rem;
                border-bottom: 2px solid #f1f5f9;
            }
            .ibs-modal-title {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #0d3b66;
                font-size: 1.35rem;
                font-weight: 900;
                margin: 0;
            }
            .ibs-modal-close {
                background: #f1f5f9;
                border: none;
                color: #64748b;
                font-size: 1.4rem;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                transition: all 0.2s;
            }
            .ibs-modal-close:hover {
                background: #e2e8f0;
                color: #0f172a;
            }
            .ibs-modal-intro {
                font-size: 0.95rem;
                line-height: 1.6;
                color: #475569;
                margin-bottom: 1.5rem;
            }
            .ibs-cookie-category {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 1.1rem 1.3rem;
                margin-bottom: 1rem;
            }
            .ibs-cat-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.4rem;
            }
            .ibs-cat-title {
                font-size: 1.05rem;
                font-weight: 800;
                color: #0d3b66;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ibs-badge-always {
                background: #ecfdf5;
                color: #047857;
                font-size: 0.75rem;
                font-weight: 800;
                padding: 3px 10px;
                border-radius: 20px;
                border: 1px solid #a7f3d0;
            }
            .ibs-switch {
                position: relative;
                display: inline-block;
                width: 48px;
                height: 26px;
            }
            .ibs-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .ibs-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #cbd5e1;
                transition: 0.3s;
                border-radius: 26px;
            }
            .ibs-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
                box-shadow: 0 1px 4px rgba(0,0,0,0.2);
            }
            .ibs-switch input:checked + .ibs-slider {
                background-color: #00a896;
            }
            .ibs-switch input:checked + .ibs-slider:before {
                transform: translateX(22px);
            }
            .ibs-cat-desc {
                font-size: 0.88rem;
                color: #64748b;
                line-height: 1.5;
                margin: 0;
            }
            .ibs-modal-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-top: 1.5rem;
                padding-top: 1.2rem;
                border-top: 2px solid #f1f5f9;
                flex-wrap: wrap;
            }
            .ibs-save-btn {
                background: #0d3b66;
                color: white;
                border: none;
                padding: 11px 26px;
                border-radius: 25px;
                font-weight: 800;
                font-size: 0.95rem;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.2s;
            }
            .ibs-save-btn:hover {
                background: #00a896;
                transform: translateY(-1px);
            }
            .ibs-accept-all-btn {
                background: #ecfdf5;
                color: #047857;
                border: 1px solid #10b981;
                padding: 10px 22px;
                border-radius: 25px;
                font-weight: 800;
                font-size: 0.92rem;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.2s;
            }
            .ibs-accept-all-btn:hover {
                background: #10b981;
                color: white;
            }
            .ibs-btn-cancel {
                background: #f1f5f9;
                color: #475569;
                border: 1px solid #cbd5e1;
                padding: 10px 18px;
                border-radius: 25px;
                font-size: 0.88rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
            }
            .ibs-btn-cancel:hover {
                background: #e2e8f0;
                color: #0f172a;
            }

            /* Toast Notification */
            #ibs-cookie-toast {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: #0d3b66;
                color: white;
                padding: 12px 28px;
                border-radius: 30px;
                font-size: 0.95rem;
                font-weight: 700;
                z-index: 2147483647;
                box-shadow: 0 8px 30px rgba(0,0,0,0.35);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: ibsFadeIn 0.2s forwards;
                pointer-events: none;
            }

            /* Responsive */
            @media (max-width: 600px) {
                #ibs-cookie-banner {
                    bottom: 12px;
                    right: 12px;
                    left: 12px;
                    padding: 1.1rem 1.2rem;
                }
                #ibs-cookie-modal {
                    padding: 1.5rem 1.2rem;
                }
                .ibs-modal-footer {
                    flex-direction: column;
                    align-items: stretch;
                }
                .ibs-save-btn, .ibs-accept-all-btn {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function initCookieConsent() {
        injectStyles();
        var existingConsent = localStorage.getItem(STORAGE_KEY);
        if (!existingConsent) {
            showBanner();
        }
    }

    // Show floating banner at bottom
    function showBanner() {
        if (document.getElementById('ibs-cookie-banner')) return;
        injectStyles();

        var banner = document.createElement('div');
        banner.id = 'ibs-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'הודעת פרטיות וקובצי עוגיות');

        banner.innerHTML = `
            <div class="ibs-cookie-header">
                <h4 class="ibs-cookie-title">
                    <span>🍪</span>
                    <span>שמירה על הפרטיות וקובצי עוגיות (Cookies)</span>
                </h4>
                <button type="button" class="ibs-cookie-close" id="ibs-cookie-x" aria-label="סגירה">&times;</button>
            </div>
            <p class="ibs-cookie-text">
                באתר <strong>IBS סוכנות לביטוח ופיננסים</strong> אנו משתמשים בעוגיות הכרחיות לפעילות האתר וכן בכלי מדידה וניתוח (כגון Google Analytics ו-Meta Pixel) כדי להבטיח גלישה מאובטחת, לשפר את השירות ולהציג תכנים מותאמים. למידע נוסף עיין/י ב<a href="privacy.html" target="_blank">מדיניות הפרטיות והעוגיות</a>.
            </p>
            <div class="ibs-cookie-actions">
                <button type="button" class="ibs-btn-accept" id="ibs-accept-all">אישור כל העוגיות</button>
                <button type="button" class="ibs-btn-essential" id="ibs-accept-essential">הכרחיות בלבד</button>
                <button type="button" class="ibs-btn-settings" id="ibs-open-modal-from-banner">הגדרות עוגיות ⚙️</button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('ibs-accept-all').addEventListener('click', function() {
            saveConsent('all', { analytics: true, marketing: true });
            closeBanner();
            showToast('כל העוגיות אושרו בהצלחה');
        });

        document.getElementById('ibs-accept-essential').addEventListener('click', function() {
            saveConsent('essential', { analytics: false, marketing: false });
            closeBanner();
            showToast('נשמרו עוגיות הכרחיות בלבד');
        });

        document.getElementById('ibs-cookie-x').addEventListener('click', function() {
            saveConsent('essential', { analytics: false, marketing: false });
            closeBanner();
        });

        document.getElementById('ibs-open-modal-from-banner').addEventListener('click', function() {
            closeBanner();
            window.openCookieSettings();
        });
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

    // Open Centered Cookie Settings Modal
    function openModal() {
        var banner = document.getElementById('ibs-cookie-banner');
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);

        var existing = document.getElementById('ibs-cookie-modal-overlay');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        injectStyles();
        try { document.body.style.overflow = 'hidden'; } catch(e) {}

        var prefs = getPreferences();

        var overlay = document.createElement('div');
        overlay.id = 'ibs-cookie-modal-overlay';

        overlay.innerHTML = `
            <div id="ibs-cookie-modal" role="dialog" aria-modal="true" aria-labelledby="ibs-cookie-modal-title">
                <div class="ibs-modal-header">
                    <h3 class="ibs-modal-title" id="ibs-cookie-modal-title">
                        <span>🍪</span>
                        <span>הגדרות קובצי עוגיות (Cookies)</span>
                    </h3>
                    <button type="button" class="ibs-modal-close" id="ibs-modal-close-x" aria-label="סגור">&times;</button>
                </div>
                
                <p class="ibs-modal-intro">
                    אנו מכבדים את פרטיותך ומאפשרים לך לבחור אילו קובצי עוגיות יופעלו במהלך ביקורך באתר IBS. בחירתך תישמר בהתאם לחוק הגנת הפרטיות. לפרטים מלאים, קרא/י את <a href="privacy.html" target="_blank" style="color: #00a896; text-decoration: underline; font-weight: 700;">מדיניות הפרטיות המלאה</a>.
                </p>

                <!-- 1. Essential -->
                <div class="ibs-cookie-category">
                    <div class="ibs-cat-head">
                        <span class="ibs-cat-title">
                            <i class="fa-solid fa-lock" style="color: #047857;"></i>
                            <span>עוגיות הכרחיות</span>
                        </span>
                        <span class="ibs-badge-always">פעיל תמיד</span>
                    </div>
                    <p class="ibs-cat-desc">
                        עוגיות הנדרשות לפעילותו התקינה והמאובטחת של האתר, כגון ניווט בין דפים, אבטחת טפסים ושמירת העדפות נגישות. לא ניתן להשבית עוגיות אלו.
                    </p>
                </div>

                <!-- 2. Analytics -->
                <div class="ibs-cookie-category">
                    <div class="ibs-cat-head">
                        <span class="ibs-cat-title">
                            <i class="fa-solid fa-chart-line" style="color: #0284c7;"></i>
                            <span>עוגיות סטטיסטיקה ומדידה (Google Analytics)</span>
                        </span>
                        <label class="ibs-switch" aria-label="הפעלת עוגיות סטטיסטיקה">
                            <input type="checkbox" id="ibs-pref-analytics" ${prefs.analytics ? 'checked' : ''}>
                            <span class="ibs-slider"></span>
                        </label>
                    </div>
                    <p class="ibs-cat-desc">
                        מסייעות לנו להבין כיצד גולשים משתמשים באתר, אילו דפים פופולריים וכיצד לשפר את ביצועי האתר. המידע נאסף בצורה אנונימית ומצטברת.
                    </p>
                </div>

                <!-- 3. Marketing -->
                <div class="ibs-cookie-category">
                    <div class="ibs-cat-head">
                        <span class="ibs-cat-title">
                            <i class="fa-solid fa-bullhorn" style="color: #ea580c;"></i>
                            <span>עוגיות שיווק ופרסום (Meta / Facebook Pixel)</span>
                        </span>
                        <label class="ibs-switch" aria-label="הפעלת עוגיות שיווק">
                            <input type="checkbox" id="ibs-pref-marketing" ${prefs.marketing ? 'checked' : ''}>
                            <span class="ibs-slider"></span>
                        </label>
                    </div>
                    <p class="ibs-cat-desc">
                        משמשות למדידת יעילות קמפיינים פרסומיים ברשתות החברתיות ולהצגת מודעות רלוונטיות למשתמשים שביקרו באתר.
                    </p>
                </div>

                <div class="ibs-modal-footer">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button type="button" class="ibs-save-btn" id="ibs-modal-save">שמירת העדפות</button>
                        <button type="button" class="ibs-accept-all-btn" id="ibs-modal-accept-all">אישור הכל</button>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button type="button" class="ibs-btn-essential" id="ibs-modal-essential-only">הכרחיות בלבד</button>
                        <button type="button" class="ibs-btn-cancel" id="ibs-modal-cancel">סגירה ✕</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on background click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });

        // Close X
        document.getElementById('ibs-modal-close-x').addEventListener('click', closeModal);

        // Close Cancel Button in footer
        document.getElementById('ibs-modal-cancel').addEventListener('click', closeModal);

        // Save Custom Preferences
        document.getElementById('ibs-modal-save').addEventListener('click', function() {
            var analytics = document.getElementById('ibs-pref-analytics').checked;
            var marketing = document.getElementById('ibs-pref-marketing').checked;
            saveConsent('custom', { analytics: analytics, marketing: marketing });
            closeModal();
            showToast('העדפות העוגיות שלך נשמרו בהצלחה');
        });

        // Accept All from modal
        document.getElementById('ibs-modal-accept-all').addEventListener('click', function() {
            saveConsent('all', { analytics: true, marketing: true });
            closeModal();
            showToast('כל העוגיות אושרו בהצלחה');
        });

        // Essential only from modal
        document.getElementById('ibs-modal-essential-only').addEventListener('click', function() {
            saveConsent('essential', { analytics: false, marketing: false });
            closeModal();
            showToast('נשמרו עוגיות הכרחיות בלבד');
        });

        // Close on Escape key
        function onEsc(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', onEsc);
            }
        }
        document.addEventListener('keydown', onEsc);
    }

    function closeModal() {
        var overlay = document.getElementById('ibs-cookie-modal-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        try { document.body.style.overflow = ''; } catch(e) {}
    }

    function getPreferences() {
        try {
            var raw = localStorage.getItem(PREFS_KEY);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { analytics: true, marketing: true };
    }

    function saveConsent(type, prefs) {
        try {
            localStorage.setItem(STORAGE_KEY, type);
            localStorage.setItem(DATE_KEY, new Date().toISOString());
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch(e) {}
    }

    function showToast(text) {
        var existing = document.getElementById('ibs-cookie-toast');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        var toast = document.createElement('div');
        toast.id = 'ibs-cookie-toast';
        toast.innerHTML = '<span>✓</span> <span>' + text + '</span>';
        document.body.appendChild(toast);

        setTimeout(function() {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3200);
    }

    // Expose global helper to reopen settings from anywhere
    window.openCookieSettings = function() {
        openModal();
    };

    // Global Click Delegation - Ensures clicking "הגדרות עוגיות" ALWAYS works anywhere on the site
    document.addEventListener('click', function(e) {
        if (!e.target) return;
        var btn = e.target.closest && e.target.closest('.ibs-open-cookie-settings, [data-ibs-cookie-settings], button[onclick*="openCookieSettings"], a[onclick*="openCookieSettings"]');
        if (!btn) {
            var text = (e.target.textContent || '').trim();
            if ((e.target.tagName === 'BUTTON' || e.target.tagName === 'A') && text.includes('הגדרות עוגיות')) {
                btn = e.target;
            }
        }
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        }
    }, true);

    // Auto-open modal or scroll if navigated with #cookies
    function checkHash() {
        if (window.location.hash === '#cookies') {
            setTimeout(openModal, 350);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initCookieConsent();
            checkHash();
        });
    } else {
        initCookieConsent();
        checkHash();
    }
    window.addEventListener('hashchange', checkHash);
})();
