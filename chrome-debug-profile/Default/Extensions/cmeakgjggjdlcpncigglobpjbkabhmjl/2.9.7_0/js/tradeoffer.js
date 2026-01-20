const cssTradeOffer = document.createElement('link');
cssTradeOffer.href = chrome.runtime.getURL('js/siteExt/tradeOffer.css');
cssTradeOffer.rel = 'stylesheet';
cssTradeOffer.type = 'text/css';
(document.head || document.documentElement).prepend(cssTradeOffer);

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

const sEconomy = document.createElement('script');
sEconomy.src = chrome.runtime.getURL('js/steam/economy_common.js');
(document.head || document.documentElement).appendChild(sEconomy);
sEconomy.onload = function () {
  sEconomy.parentNode.removeChild(sEconomy);
};

const sHelper = document.createElement('script');
sHelper.src = chrome.runtime.getURL('js/helper.js');
(document.head || document.documentElement).appendChild(sHelper);
sHelper.onload = function () {
  sHelper.parentNode.removeChild(sHelper);
};

const cssFontello = document.createElement('link');
cssFontello.href = chrome.runtime.getURL('css/fontello.css');
cssFontello.rel = 'stylesheet';
cssFontello.type = 'text/css';
(document.head || document.documentElement).appendChild(cssFontello);

const cssPQ = document.createElement('link');
cssPQ.href = chrome.runtime.getURL('css/priceQueue.css');
cssPQ.rel = 'stylesheet';
cssPQ.type = 'text/css';
(document.head || document.documentElement).appendChild(cssPQ);

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

const cssInventoryItemRarity = document.createElement('link');
cssInventoryItemRarity.href = chrome.runtime.getURL('css/colorizeinventoryitem.css');
cssInventoryItemRarity.rel = 'stylesheet';
cssInventoryItemRarity.type = 'text/css';
(document.head || document.documentElement).appendChild(cssInventoryItemRarity);

const sLodash = document.createElement('script');
sLodash.src = chrome.runtime.getURL('js/jquery/jquery.ba-throttle-debounce.js');
(document.head || document.documentElement).appendChild(sLodash);
sLodash.onload = function () {
  sLodash.parentNode.removeChild(sLodash);
};

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
    offerdelayinterval: 100,
    offerdelay: true,
    autocheckofferprice: true,
    currency: '',
    usevector: false,
    lang: '',
    gpdelayscc: 3000,
    gpdelayerr: 30000,
    agp_hover: true,
    agp_gem: false,
    agp_sticker: true,
    custombuttons: null,
    extprice: true,
    extbgcolor: '#0000FF',
    exttextcolor: '#FFFFFF',
    extcustom: [],
    userUrl: '//steamcommunity.com/my/',
    show_inventory_rarity_color_tradeoffer: true,
    show_phase_color_tradeoffer: true,
    enabledSih_tradeofferPage: true,
  },
  function (itemsSync) {
    // modStyle({extbgcolor: items.extbgcolor, exttextcolor: items.exttextcolor});
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
        $.getJSON(chrome.runtime.getURL('/assets/json/providers.json'), (PROVIDERS_LIST) => {
          langData = jQuery.extend(true, {}, enData, langData);
          if (itemsSync.custombuttons == null) {
            itemsSync.custombuttons = {
              440: {
                keys: { Type: 'TF_T' },
                craft_items: { Type: 'Craft Item' },
              },
              570: {
                rares: { Quality: 'unique', Rarity: 'Rarity_Rare', Type: 'wearable' },
                keys: { Type: 'DOTA_WearableType_Treasure_Key' },
              },
              730: {
                keys: { Type: 'CSGO_Tool_WeaponCase_KeyTag' },
              },
              753: {
                get_prices: { manualLoad: true },
                trading_cards: { item_class: 'item_class_2' },
              },
            };
          }

          chrome.storage.local.get(
            {
              bookmarks: [],
            },
            function (itemsLocal) {
              const actualCode = [
                'window.offerdelayinterval = ' + (itemsSync.offerdelayinterval || '100') + ';',
                'window.offerdelay = ' + (itemsSync.offerdelay || 'true') + ';',
                'window.autocheckofferprice = ' + itemsSync.autocheckofferprice + ';',
                "window.currency = '" + itemsSync.currency + "';",
                'window.usevector = ' + itemsSync.usevector + ';',
                'window.takeButtonsJson = window.custombuttons = ' + JSON.stringify(itemsSync.custombuttons) + ';',
                'window.gpdelayscc = ' + itemsSync.gpdelayscc + ';',
                'window.gpdelayerr = ' + itemsSync.gpdelayerr + ';',
                'window.agp_gem = ' + itemsSync.agp_gem + ';',
                'window.agp_sticker = ' + itemsSync.agp_sticker + ';',
                'window.extprice = ' + itemsSync.extprice + ';',
                'window.extcustom = ' + itemsSync.extcustom.length + ';',
                "window.SIHID = '" + chrome.runtime.id + "';",
                "window.userUrl = '" + itemsSync.userUrl + "';",
                "window.userLanguage = '" + itemsSync.lang + "';",
                'window.show_inventory_rarity_color_tradeoffer = ' +
                  itemsSync.show_inventory_rarity_color_tradeoffer +
                  ';',
                'window.show_phase_color_tradeoffer = ' + itemsSync.show_phase_color_tradeoffer + ';',
                `window.SIHLang = ${JSON.stringify(langData)}`,
                `window.IS_ENABLED_SIH = ${itemsSync.enabledSih_tradeofferPage}`,
                'window.bookmarkeditems = ' + JSON.stringify(itemsLocal.bookmarks) + ';',
                'window.PROVIDERS_LIST = ' + JSON.stringify(PROVIDERS_LIST) + ';',
              ].join('\r\n');

              document.documentElement.setAttribute('onreset', actualCode);
              document.documentElement.dispatchEvent(new CustomEvent('reset'));
              document.documentElement.removeAttribute('onreset');

              const sPriceQueue = document.createElement('script');
              sPriceQueue.src = chrome.runtime.getURL('js/PriceQueue.js');
              (document.head || document.documentElement).appendChild(sPriceQueue);
              sPriceQueue.onload = function () {
                const sTradeOffer = document.createElement('script');
                sTradeOffer.src = chrome.runtime.getURL('js/siteExt/tradeOffer.bundle.js');
                (document.head || document.documentElement).appendChild(sTradeOffer);
                sTradeOffer.onload = function () {
                  const sCommon = document.createElement('script');
                  sCommon.src = chrome.runtime.getURL('js/hovermod.script.js');
                  (document.head || document.documentElement).appendChild(sCommon);
                  sCommon.onload = function () {
                    const sOffer = document.createElement('script');
                    sOffer.src = chrome.runtime.getURL('js/tradeoffer.script.js');
                    (document.head || document.documentElement).appendChild(sOffer);
                    sOffer.onload = function () {
                      sOffer.parentNode.removeChild(sOffer);
                    };
                    sCommon.parentNode.removeChild(sCommon);
                  };

                  sTradeOffer.parentNode.removeChild(sTradeOffer);
                };
                sPriceQueue.parentNode.removeChild(sPriceQueue);
              };
            }
          );
        });
      });
    });
  }
);
