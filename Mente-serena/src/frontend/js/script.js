(() => {
    'use strict';

    // Storage can be blocked by browser privacy settings. UI must still work.
    function readPreference(storageName, key) {
        try {
            return window[storageName].getItem(key);
        } catch {
            return null;
        }
    }

    function savePreference(storageName, key, value) {
        try {
            window[storageName].setItem(key, value);
        } catch {
            // The current-page action still succeeds without persistence.
        }
    }

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    function setTheme(theme) {
        document.documentElement.dataset.bsTheme = theme;
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
        }
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
        }
    }

    setTheme(readPreference('localStorage', 'theme') === 'dark' ? 'dark' : 'light');
    if (themeToggle) {
        themeToggle.hidden = false;
        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
            setTheme(theme);
            savePreference('localStorage', 'theme', theme);
        });
    }

    const promoBanner = document.getElementById('promoBanner');
    const closePromo = document.getElementById('btnFecharPromo');
    if (promoBanner) {
        promoBanner.hidden = readPreference('sessionStorage', 'promoBannerFechado') === 'true';
        if (closePromo) closePromo.hidden = false;
        closePromo?.addEventListener('click', () => {
            promoBanner.hidden = true;
            savePreference('sessionStorage', 'promoBannerFechado', 'true');
            document.querySelector('.brand')?.focus();
        });
    }

    const cookieBanner = document.getElementById('cookieConsentBanner');
    const acceptCookies = document.getElementById('btnCookieAccept');
    if (cookieBanner && acceptCookies) {
        cookieBanner.hidden = readPreference('localStorage', 'cookieConsent') === 'true';
        acceptCookies.addEventListener('click', () => {
            cookieBanner.hidden = true;
            savePreference('localStorage', 'cookieConsent', 'true');
            document.querySelector('.support-link')?.focus();
        });
    }
})();
