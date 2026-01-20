const cssSearchPage = document.createElement('link');
cssSearchPage.href = chrome.runtime.getURL('js/siteExt/searchPage.css');
cssSearchPage.rel = 'stylesheet';
cssSearchPage.type = 'text/css';
(document.head || document.documentElement).prepend(cssSearchPage);

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
          `window.SIHID = '${chrome.runtime.id}';`,
          `window.SIHLang = ${JSON.stringify(langData)}`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const sDebounce = document.createElement('script');
        sDebounce.src = chrome.runtime.getURL('js/jquery/jquery.ba-throttle-debounce.min.js');
        (document.head || document.documentElement).appendChild(sDebounce);
        sDebounce.onload = function () {
          sDebounce.parentNode.removeChild(sDebounce);
          const sSearchBundle = document.createElement('script');
          sSearchBundle.src = chrome.runtime.getURL('js/siteExt/searchPage.bundle.js');
          (document.head || document.documentElement).appendChild(sSearchBundle);
          sSearchBundle.onload = function () {
            const sOffer = document.createElement('script');
            sOffer.src = chrome.runtime.getURL('js/search.script.js');
            (document.head || document.documentElement).appendChild(sOffer);
            sOffer.onload = function () {
              sOffer.parentNode.removeChild(sOffer);
            };

            sSearchBundle.parentNode.removeChild(sSearchBundle);
          };
        };
      });
    });
  }
);
