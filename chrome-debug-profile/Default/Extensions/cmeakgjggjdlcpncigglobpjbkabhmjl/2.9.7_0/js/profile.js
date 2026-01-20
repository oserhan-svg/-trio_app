chrome.storage.sync.get(
  { show_profile_modifier_btn: true, show_permalink: true, show_faceit_stats_btn: true },
  (itemsSync) => {
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

        const actualCode = [
          `window.SIHID = '${chrome.runtime.id}';`,
          `window.SIHLang = ${JSON.stringify(langData)};`,
          `window.lang = ${JSON.stringify(itemsSync.lang)};`,
          `window.show_profile_modifier_btn = ${JSON.stringify(itemsSync.show_profile_modifier_btn)};`,
          `window.show_permalink = ${JSON.stringify(itemsSync.show_permalink)};`,
          `window.show_faceit_stats_btn = ${JSON.stringify(itemsSync.show_faceit_stats_btn)};`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const cssProfilePage = document.createElement('link');
        cssProfilePage.href = chrome.runtime.getURL('js/siteExt/profilePage.css');
        cssProfilePage.rel = 'stylesheet';
        cssProfilePage.type = 'text/css';
        (document.head || document.documentElement).prepend(cssProfilePage);

        const sProfilePageBundle = document.createElement('script');
        sProfilePageBundle.src = chrome.runtime.getURL('js/siteExt/profilePage.bundle.js');
        (document.head || document.documentElement).appendChild(sProfilePageBundle);
        sProfilePageBundle.onload = function () {
          const sProfilePage = document.createElement('script');
          sProfilePage.src = chrome.runtime.getURL('js/profile.script.js');
          (document.head || document.documentElement).appendChild(sProfilePage);
          sProfilePage.onload = function () {
            sProfilePage.parentNode.removeChild(sProfilePage);
          };

          sProfilePageBundle.parentNode.removeChild(sProfilePageBundle);
        };
      });
    });
  }
);
