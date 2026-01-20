const cssExplorePage = document.createElement('link');
cssExplorePage.href = chrome.runtime.getURL('js/siteExt/explorePage.css');
cssExplorePage.rel = 'stylesheet';
cssExplorePage.type = 'text/css';
(document.head || document.documentElement).appendChild(cssExplorePage);

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
        const actualCode = [`window.SIHLang = ${JSON.stringify(langData)}`].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const sExploreBundle = document.createElement('script');
        sExploreBundle.src = chrome.runtime.getURL('js/siteExt/explorePage.bundle.js');
        (document.head || document.documentElement).appendChild(sExploreBundle);
        sExploreBundle.onload = function () {
          const sExplore = document.createElement('script');
          sExplore.src = chrome.runtime.getURL('js/explore.script.js');
          (document.head || document.documentElement).appendChild(sExplore);
          sExplore.onload = function () {
            sExplore.parentNode.removeChild(sExplore);
          };

          sExploreBundle.parentNode.removeChild(sExploreBundle);
        };
      });
    });
  }
);
