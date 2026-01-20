const scriptJquery = document.createElement('script');
scriptJquery.src = chrome.runtime.getURL('js/jquery/jquery-1.10.2.min.js');
(document.head || document.documentElement).appendChild(scriptJquery);
scriptJquery.onload = function () {
  chrome.storage.sync.get({ show_remove_wishlist_btn: true }, (itemsSync) => {
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
        chrome.storage.local.get((itemsLocal) => {
          const {
            userInfo: { steamId },
          } = itemsLocal;

          const sActualCodeListener = document.createElement('script');
          sActualCodeListener.src = chrome.runtime.getURL('js/actualCodeListener.script.js');
          (document.head || document.documentElement).appendChild(sActualCodeListener);
          sActualCodeListener.onload = function () {
            const actualCode = {
              SIHID: chrome.runtime.id,
              SIHLang: langData,
              lang: itemsSync.lang,
              sih_steamID: steamId,
              show_remove_wishlist_btn: itemsSync.show_remove_wishlist_btn,
            };

            const event = new CustomEvent('set-actual-code', { detail: actualCode });
            document.dispatchEvent(event);

            const sWishlistBundle = document.createElement('script');
            sWishlistBundle.src = chrome.runtime.getURL('js/siteExt/wishlistPage.bundle.js');
            (document.head || document.documentElement).appendChild(sWishlistBundle);
            sWishlistBundle.onload = function () {
              sWishlistBundle.parentNode.removeChild(sWishlistBundle);
            };

            sActualCodeListener.parentNode.removeChild(sActualCodeListener);
          };
        });
      });
    });
  });
  scriptJquery.parentNode.removeChild(scriptJquery);
};
