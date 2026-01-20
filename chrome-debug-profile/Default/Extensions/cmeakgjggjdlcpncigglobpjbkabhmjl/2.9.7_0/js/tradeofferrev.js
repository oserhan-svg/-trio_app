const cssProfilesTradeOffers = document.createElement('link');
cssProfilesTradeOffers.href = chrome.runtime.getURL('js/siteExt/profilesTradeOffers.css');
cssProfilesTradeOffers.rel = 'stylesheet';
cssProfilesTradeOffers.type = 'text/css';
(document.head || document.documentElement).prepend(cssProfilesTradeOffers);

const priceUtils = document.createElement('script');
priceUtils.src = chrome.runtime.getURL('js/priceutils.script.js');
(document.head || document.documentElement).appendChild(priceUtils);
priceUtils.onload = function () {
  priceUtils.parentNode.removeChild(priceUtils);
};

const sGlobal = document.createElement('script');
sGlobal.src = chrome.runtime.getURL('js/steam/global.js');
(document.head || document.documentElement).appendChild(sGlobal);
sGlobal.onload = function () {
  sGlobal.parentNode.removeChild(sGlobal);
};

const sLodash = document.createElement('script');
sLodash.src = chrome.runtime.getURL('js/jquery/jquery.ba-throttle-debounce.js');
(document.head || document.documentElement).appendChild(sLodash);
sLodash.onload = function () {
  sLodash.parentNode.removeChild(sLodash);
};

const sKnifePhaseDetector = document.createElement('script');
sKnifePhaseDetector.src = chrome.runtime.getURL('js/knifephasedetector.script.js');
(document.head || document.documentElement).appendChild(sKnifePhaseDetector);
sKnifePhaseDetector.onload = function () {
  sKnifePhaseDetector.parentNode.removeChild(sKnifePhaseDetector);

  const sInventoryItemRarity = document.createElement('script');
  sInventoryItemRarity.src = chrome.runtime.getURL('js/inventoryitemrarity.script.js');
  (document.head || document.documentElement).appendChild(sInventoryItemRarity);
  sInventoryItemRarity.onload = function () {
    sInventoryItemRarity.parentNode.removeChild(sInventoryItemRarity);
  };
};

const cssPQ = document.createElement('link');
cssPQ.href = chrome.runtime.getURL('css/priceQueue.css');
cssPQ.rel = 'stylesheet';
cssPQ.type = 'text/css';
(document.head || document.documentElement).appendChild(cssPQ);

const cssI = document.createElement('link');
cssI.href = chrome.runtime.getURL('css/inventscript.css');
cssI.rel = 'stylesheet';
cssI.type = 'text/css';
(document.head || document.documentElement).appendChild(cssI);

const cssT = document.createElement('link');
cssT.href = chrome.runtime.getURL('css/tradeoffer.css');
cssT.rel = 'stylesheet';
cssT.type = 'text/css';
(document.head || document.documentElement).appendChild(cssT);

chrome.storage.sync.get(
  {
    currency: '',
    gpdelayscc: 3000,
    gpdelayerr: 30000,
    agp_hover: true,
    agp_gem: false,
    agp_sticker: true,
    lang: '',
    enabledSih_tradeofferrevPage: true,
    open_trade_in_new_tab: true,
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
        $.getJSON(chrome.runtime.getURL('/assets/json/providers.json'), (PROVIDERS_LIST) => {
          langData = jQuery.extend(true, {}, enData, langData);
          const actualCode = [
            `window.currency = '${items.currency}';`,
            `window.gpdelayscc = ${items.gpdelayscc};`,
            `window.gpdelayerr = ${items.gpdelayerr};`,
            `window.agp_gem = ${items.agp_gem};`,
            `window.agp_sticker = ${items.agp_sticker};`,
            `window.SIHID = '${chrome.runtime.id}';`,
            `window.SIHLang = ${JSON.stringify(langData)};`,
            `window.IS_ENABLED_SIH = ${items.enabledSih_tradeofferrevPage};`,
            `window.open_trade_in_new_tab = ${items.open_trade_in_new_tab}`,
            `window.PROVIDERS_LIST = ${JSON.stringify(PROVIDERS_LIST)}`,
          ].join('\r\n');

          document.documentElement.setAttribute('onreset', actualCode);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
          document.documentElement.removeAttribute('onreset');

          const sPriceQueue = document.createElement('script');
          sPriceQueue.src = chrome.runtime.getURL('js/PriceQueue.js');
          (document.head || document.documentElement).appendChild(sPriceQueue);
          sPriceQueue.onload = function () {
            const sProfilesTradeOffers = document.createElement('script');
            sProfilesTradeOffers.src = chrome.runtime.getURL('js/siteExt/profilesTradeOffers.bundle.js');
            (document.head || document.documentElement).appendChild(sProfilesTradeOffers);
            sProfilesTradeOffers.onload = function () {
              const sCommon = document.createElement('script');
              sCommon.src = chrome.runtime.getURL('js/hovermod.script.js');
              (document.head || document.documentElement).appendChild(sCommon);
              sCommon.onload = function () {
                const sOffer = document.createElement('script');
                sOffer.src = chrome.runtime.getURL('js/tradeofferrev.script.js');
                (document.head || document.documentElement).appendChild(sOffer);
                sOffer.onload = function () {
                  sOffer.parentNode.removeChild(sOffer);
                };
                sCommon.parentNode.removeChild(sCommon);
              };

              sProfilesTradeOffers.parentNode.removeChild(sProfilesTradeOffers);
            };

            sPriceQueue.parentNode.removeChild(sPriceQueue);
          };
        });
      });
    });
  }
);
