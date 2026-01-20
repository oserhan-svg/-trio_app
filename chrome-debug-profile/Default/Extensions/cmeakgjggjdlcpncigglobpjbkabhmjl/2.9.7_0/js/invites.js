const cssInvitesPage = document.createElement('link');
cssInvitesPage.href = chrome.runtime.getURL('js/siteExt/invitesPage.css');
cssInvitesPage.rel = 'stylesheet';
cssInvitesPage.type = 'text/css';
(document.head || document.documentElement).prepend(cssInvitesPage);

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

        const sInvitesBundle = document.createElement('script');
        sInvitesBundle.src = chrome.runtime.getURL('js/siteExt/invitesPage.bundle.js');
        (document.head || document.documentElement).appendChild(sInvitesBundle);
        sInvitesBundle.onload = function () {
          const sOffer = document.createElement('script');
          sOffer.src = chrome.runtime.getURL('js/invites.script.js');
          (document.head || document.documentElement).appendChild(sOffer);
          sOffer.onload = function () {
            sOffer.parentNode.removeChild(sOffer);
          };

          sInvitesBundle.parentNode.removeChild(sInvitesBundle);
        };
      });
    });
  }
);
