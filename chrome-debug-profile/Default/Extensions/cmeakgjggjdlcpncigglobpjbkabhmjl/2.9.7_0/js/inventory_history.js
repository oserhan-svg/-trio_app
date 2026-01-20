const cssInventoryHistory = document.createElement('link');
cssInventoryHistory.href = chrome.runtime.getURL('js/siteExt/inventoryHistory.css');
cssInventoryHistory.rel = 'stylesheet';
cssInventoryHistory.type = 'text/css';
(document.head || document.documentElement).prepend(cssInventoryHistory);

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

        const sInventoryHistoryBundle = document.createElement('script');
        sInventoryHistoryBundle.src = chrome.runtime.getURL('js/siteExt/inventoryHistory.bundle.js');
        (document.head || document.documentElement).appendChild(sInventoryHistoryBundle);
        sInventoryHistoryBundle.onload = function () {
          const sInventoryHistory = document.createElement('script');
          sInventoryHistory.src = chrome.runtime.getURL('js/inventory_history.script.js');
          (document.head || document.documentElement).appendChild(sInventoryHistory);
          sInventoryHistory.onload = function () {
            sInventoryHistory.parentNode.removeChild(sInventoryHistory);
          };

          sInventoryHistoryBundle.parentNode.removeChild(sInventoryHistoryBundle);
        };
      });
    });
  }
);
