window.CSGO_ORIGINS = null;
$.getJSON(chrome.runtime.getURL('/assets/json/csgo_origin_names.json'), (data) => {
  CSGO_ORIGINS = data;
});

window.PROVIDERS_LIST = null;

const priceUtils = document.createElement('script');
priceUtils.src = chrome.runtime.getURL('js/priceutils.script.js');
(document.head || document.documentElement).appendChild(priceUtils);
priceUtils.onload = function () {
  priceUtils.parentNode.removeChild(priceUtils);
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

const cssInventoryItemRarity = document.createElement('link');
cssInventoryItemRarity.href = chrome.runtime.getURL('css/colorizeinventoryitem.css');
cssInventoryItemRarity.rel = 'stylesheet';
cssInventoryItemRarity.type = 'text/css';
(document.head || document.documentElement).appendChild(cssInventoryItemRarity);

const cssProfilesInventory = document.createElement('link');
cssProfilesInventory.href = chrome.runtime.getURL('js/siteExt/profilesInventory.css');
cssProfilesInventory.rel = 'stylesheet';
cssProfilesInventory.type = 'text/css';
(document.head || document.documentElement).appendChild(cssProfilesInventory);

const sCacher = document.createElement('script');
sCacher.src = chrome.runtime.getURL('bundle/js/RequestCacher.js');
(document.head || document.documentElement).appendChild(sCacher);
sCacher.onload = function () {
  sCacher.parentNode.removeChild(sCacher);
};

const sPriceQueue = document.createElement('script');
sPriceQueue.src = chrome.runtime.getURL('js/PriceQueue.js');
(document.head || document.documentElement).appendChild(sPriceQueue);
sPriceQueue.onload = function () {
  sPriceQueue.parentNode.removeChild(sPriceQueue);
};

const cssPQ = document.createElement('link');
cssPQ.href = chrome.runtime.getURL('css/priceQueue.css');
cssPQ.rel = 'stylesheet';
cssPQ.type = 'text/css';
(document.head || document.documentElement).appendChild(cssPQ);

const sHelper = document.createElement('script');
sHelper.src = chrome.runtime.getURL('js/helper.js');
(document.head || document.documentElement).appendChild(sHelper);
sHelper.onload = function () {
  sHelper.parentNode.removeChild(sHelper);
};

const sGlobal = document.createElement('script');
sGlobal.src = chrome.runtime.getURL('js/steam/global.js');
(document.head || document.documentElement).appendChild(sGlobal);
sGlobal.onload = function () {
  sGlobal.parentNode.removeChild(sGlobal);
};

const sEconomyCommon = document.createElement('script');
sEconomyCommon.src = chrome.runtime.getURL('js/steam/economy_common.js');
(document.head || document.documentElement).appendChild(sEconomyCommon);
sEconomyCommon.onload = function () {
  sEconomyCommon.parentNode.removeChild(sEconomyCommon);
};

const sScroll = document.createElement('script');
sScroll.src = chrome.runtime.getURL('js/jquery/jquery.scrollbar.min.js');
(document.head || document.documentElement).appendChild(sScroll);
sScroll.onload = function () {
  sScroll.parentNode.removeChild(sScroll);
};

const cssF = document.createElement('link');
cssF.href = chrome.runtime.getURL('css/inventscript.css');
cssF.rel = 'stylesheet';
cssF.type = 'text/css';
(document.head || document.documentElement).appendChild(cssF);

const cssM = document.createElement('link');
cssM.href = window.location.protocol + '//steamcommunity-a.akamaihd.net/public/css/skin_1/economy_market.css';
cssM.rel = 'stylesheet';
cssM.type = 'text/css';
(document.head || document.documentElement).appendChild(cssM);

const cssC = document.createElement('link');
cssC.href = chrome.runtime.getURL('css/jquery.scrollbar.css');
cssC.rel = 'stylesheet';
cssC.type = 'text/css';
(document.head || document.documentElement).appendChild(cssC);

const cJqueryConfirm = document.createElement('link');
cJqueryConfirm.href = chrome.runtime.getURL('js/jquery/jquery-confirm.min.css');
cJqueryConfirm.rel = 'stylesheet';
cJqueryConfirm.type = 'text/css';
(document.head || document.documentElement).appendChild(cJqueryConfirm);

const sLodash = document.createElement('script');
sLodash.src = chrome.runtime.getURL('js/jquery/jquery.ba-throttle-debounce.js');
(document.head || document.documentElement).appendChild(sLodash);
sLodash.onload = function () {
  sLodash.parentNode.removeChild(sLodash);
};

const sJqueryConfirm = document.createElement('script');
sJqueryConfirm.src = chrome.runtime.getURL('js/jquery/jquery-confirm.min.js');
(document.head || document.documentElement).appendChild(sJqueryConfirm);
sJqueryConfirm.onload = function () {
  sJqueryConfirm.parentNode.removeChild(sJqueryConfirm);
};

chrome.storage.sync.get(
  {
    fastdelta: -0.01,
    delaylistings: 200,
    quicksellbuttons: true,
    instantsellbuttons: false,
    buysetbuttons: true,
    selectallbuttons: true,
    inventoryprice: true,
    currency: '',
    lang: '',
    gpdelayscc: 3000,
    gpdelayerr: 30000,
    agp_hover: true,
    agp_gem: false,
    agp_sticker: true,
    usevector: false,
    simplyinvent: false,
    hidedefaultprice: false,
    extprice: true,
    extmasslisting: false,
    extbgcolor: '#0000FF',
    exttextcolor: '#FFFFFF',
    userUrl: '//steamcommunity.com/my/',
    show_float_value: true,
    tradableinfo: false,
    show_trade_unlock_date_badge: true,
    show_inventory_rarity_color: true,
    show_phase_color: true,
    show_improved_inventory_nav: true,
    show_price_difference_warning: true,
    price_update_time: 120000,
    new_interface: true,
    user_sort_market_inventory: [],
    sih_app_market_toggle: false,
    inventory_sih_market_tab: true,
    bookmarkscategories: {},
    enabledSih_inventoryPage: true,
    backlight_brightness: 50,
    hidden_item_description: true,
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
        $.getJSON(chrome.runtime.getURL('/assets/json/providers.json'), (data) => {
          PROVIDERS_LIST = data;
          var actualCode = [
            `window.SIHID = '${chrome.runtime.id}';`,
            `window.PROVIDERS_LIST = ${JSON.stringify(PROVIDERS_LIST)}`,
            `window.CSGO_ORIGINS = ${JSON.stringify(CSGO_ORIGINS)}`,
            `window.priceUpdateTime = ${items.price_update_time}`,
            `window.SIHLang = ${JSON.stringify(langData)}`,
            `window.isNewInterface = ${items.new_interface}`,
            `window.sih_app_market_toggle = ${items.sih_app_market_toggle}`,
            `window.simplyinvent = ${items.simplyinvent}`,
            `window.inventory_sih_market_tab = ${items.inventory_sih_market_tab}`,
            `window.bookmarkscategories = ${JSON.stringify(items.bookmarkscategories)}`,
            `window.IS_ENABLED_SIH = ${items.enabledSih_inventoryPage}`,
            `window.backlight_brightness = ${items.backlight_brightness}`,
            `window.hidden_item_description = ${items.hidden_item_description}`,
          ];

          Object.keys(items).forEach((key) => {
            let prepValue;
            const value = items[key];
            if (typeof value === 'string') prepValue = `window.${key} = '${value}';`;
            else if (Array.isArray(value)) {
              if (key === 'user_sort_market_inventory') {
                prepValue = `window.user_sort_market = ${JSON.stringify(value)};`;
              } else {
                prepValue = `window.${key} = ${JSON.stringify(value)};`;
              }
            } else if (typeof value === 'object') prepValue = `window.${key} = ${JSON.stringify(value)};`;
            else prepValue = `window.${key} = ${value};`;

            actualCode.push(prepValue);
          });

          chrome.storage.local.get(
            {
              bookmarks: [],
            },
            function (subitems) {
              const actualCodeLocal = ['window.bookmarkeditems = ' + JSON.stringify(subitems.bookmarks) + ';'];

              actualCode = [...actualCode, ...actualCodeLocal];

              document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
              document.documentElement.dispatchEvent(new CustomEvent('reset'));
              document.documentElement.removeAttribute('onreset');

              const sProfilesInventory = document.createElement('script');
              sProfilesInventory.src = chrome.runtime.getURL('js/siteExt/profilesInventory.bundle.js');
              (document.head || document.documentElement).appendChild(sProfilesInventory);
              sProfilesInventory.onload = function () {
                const sCommon = document.createElement('script');
                sCommon.src = chrome.runtime.getURL('js/inventprice.script.js');
                (document.head || document.documentElement).appendChild(sCommon);
                sCommon.onload = function () {
                  sCommon.parentNode.removeChild(sCommon);

                  const sInventoryDialog = document.createElement('script');
                  sInventoryDialog.src = chrome.runtime.getURL('js/inventory.dialog.js');
                  (document.head || document.documentElement).appendChild(sInventoryDialog);
                  sInventoryDialog.onload = function () {
                    sInventoryDialog.parentNode.removeChild(sInventoryDialog);

                    const sInventory = document.createElement('script');
                    sInventory.src = chrome.runtime.getURL('js/inventory.js');
                    (document.head || document.documentElement).appendChild(sInventory);
                    sInventory.onload = function () {
                      sInventory.parentNode.removeChild(sInventory);
                    };
                  };
                };

                sProfilesInventory.parentNode.removeChild(sProfilesInventory);
              };
            }
          );
        });
      });
    });
  }
);
