const cssBadges = document.createElement('link');
cssBadges.href = chrome.runtime.getURL('js/siteExt/badges.css');
cssBadges.rel = 'stylesheet';
cssBadges.type = 'text/css';
(document.head || document.documentElement).prepend(cssBadges);

const cssJqueryUI = document.createElement('link');
cssJqueryUI.href = chrome.runtime.getURL('css/jquery-ui.css');
cssJqueryUI.rel = 'stylesheet';
cssJqueryUI.type = 'text/css';
(document.head || document.documentElement).appendChild(cssJqueryUI);

const sJqueryUI = document.createElement('script');
sJqueryUI.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
(document.head || document.documentElement).appendChild(sJqueryUI);
sJqueryUI.onload = function () {
  sJqueryUI.parentNode.removeChild(sJqueryUI);
};

const cssManrope = document.createElement('link');
cssManrope.href = chrome.runtime.getURL('css/fonts/manrope.css');
cssManrope.rel = 'stylesheet';
cssManrope.type = 'text/css';
(document.head || document.documentElement).prepend(cssManrope);

const cssRoboto = document.createElement('link');
cssRoboto.href = chrome.runtime.getURL('css/fonts/roboto.css');
cssRoboto.rel = 'stylesheet';
cssRoboto.type = 'text/css';
(document.head || document.documentElement).prepend(cssRoboto);

chrome.storage.sync.get((itemsSync) => {
  const detectUserLanguage = () => {
    let navLang;
    if (window.navigator.languages && window.navigator.languages.length > 0) {
      [navLang] = window.navigator.languages;
    }
    if (!navLang) {
      navLang = window.navigator.language || window.navigator.userLanguage || '';
    }

    const VALID_LANGUAGES = [
      'bg',
      'cs',
      'de',
      'en',
      'es',
      'fa',
      'fr',
      'he',
      'it',
      'ka',
      'lv',
      'no',
      'pl',
      'pt_BR',
      'ro',
      'ru',
      'sv',
      'tr',
      'vi',
      'uk',
      'zh_CN',
      'zh_TW',
    ];
    return VALID_LANGUAGES.includes(navLang) ? navLang : 'en';
  };
  itemsSync.lang = itemsSync.lang || detectUserLanguage();

  $.getJSON(chrome.runtime.getURL(`_locales/en/controls.json`), (enData) => {
    $.getJSON(chrome.runtime.getURL(`_locales/${itemsSync.lang}/controls.json`), (langData) => {
      langData = jQuery.extend(true, {}, enData, langData);

      chrome.storage.local.get((itemsLocal) => {
        const {
          userInfo: { steamId },
        } = itemsLocal;

        const actualCode = [
          `window.SIHID = '${chrome.runtime.id}';`,
          `window.steamCurrency = ${JSON.stringify(itemsSync.steamCurrency)};`,
          `window.SIHLang = ${JSON.stringify(langData)};`,
          `window.lang = ${JSON.stringify(itemsSync.lang)};`,
          `window.sih_steamID = ${JSON.stringify(steamId)}`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const sBadgesBundle = document.createElement('script');
        sBadgesBundle.src = chrome.runtime.getURL('js/siteExt/badges.bundle.js');
        (document.head || document.documentElement).appendChild(sBadgesBundle);
        sBadgesBundle.onload = function () {
          const sBadgesMain = document.createElement('script');
          sBadgesMain.src = chrome.runtime.getURL('js/badges-main.script.js');
          (document.head || document.documentElement).appendChild(sBadgesMain);
          sBadgesMain.onload = function () {
            sBadgesMain.parentNode.removeChild(sBadgesMain);
          };

          sBadgesBundle.parentNode.removeChild(sBadgesBundle);
        };
      });
    });
  });
});
