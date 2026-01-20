const cssPointsPage = document.createElement('link');
cssPointsPage.href = chrome.runtime.getURL('js/siteExt/pointsPage.css');
cssPointsPage.rel = 'stylesheet';
cssPointsPage.type = 'text/css';
(document.head || document.documentElement).prepend(cssPointsPage);

chrome.storage.sync.get(
  {
    lang: '',
  },
  function (items) {
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
    items.lang = items.lang || detectUserLanguage();

    $.getJSON(chrome.runtime.getURL(`_locales/en/controls.json`), (enData) => {
      $.getJSON(chrome.runtime.getURL(`_locales/${items.lang}/controls.json`), (langData) => {
        langData = jQuery.extend(true, {}, enData, langData);
        const actualCode = [
          `window.SIHID = '${chrome.runtime.id}'`,
          `window.SIHLang = ${JSON.stringify(langData)}`,
          `window.lang = '${items.lang}'`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const sPointsBundle = document.createElement('script');
        sPointsBundle.src = chrome.runtime.getURL('js/siteExt/pointsPage.bundle.js');
        (document.head || document.documentElement).appendChild(sPointsBundle);
        sPointsBundle.onload = function () {
          sPointsBundle.parentNode.removeChild(sPointsBundle);
        };
      });
    });
  }
);
