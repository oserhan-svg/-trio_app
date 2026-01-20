// For pages where there are PriceQueue.js
const EXCLUDE_LOCATION_PRICE_NAME = ['tradeoffer', 'tradeoffers', '/inventory', 'market'];
// For pages where there are import global styles
const EXCLUDE_LOCATION_GLOBAL_STYLES_NAME = ['tradeoffer/', '/inventory', 'market/listings'];
// For pages with ssr
const EXCLUDE_SSR_URLS = ['https://store.steampowered.com/wishlist'];

if (!EXCLUDE_SSR_URLS.some((url) => window.location.href.includes(url))) {
  const cssPagination = document.createElement('link');
  cssPagination.href = chrome.runtime.getURL('js/jquery/pagination.css');
  cssPagination.rel = 'stylesheet';
  cssPagination.type = 'text/css';
  (document.head || document.documentElement).prepend(cssPagination);

  const cssJqueryUI = document.createElement('link');
  cssJqueryUI.href = chrome.runtime.getURL('css/jquery-ui.css');
  cssJqueryUI.rel = 'stylesheet';
  cssJqueryUI.type = 'text/css';
  (document.head || document.documentElement).appendChild(cssJqueryUI);

  const sJqueryUI = document.createElement('script');
  sJqueryUI.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
  (document.head || document.documentElement).appendChild(sJqueryUI);
  sJqueryUI.onload = function () {
    sJqueryUI.parentNode.removeChild(sJqueryUI);
  };

  const sPurify = document.createElement('script');
  sPurify.src = chrome.runtime.getURL('js/jquery/purify.min.js');
  (document.head || document.documentElement).appendChild(sPurify);
  sPurify.onload = function () {
    sPurify.parentNode.removeChild(sPurify);
  };

  sJqueryBeforeAfter = document.createElement('script');
  sJqueryBeforeAfter.src = chrome.runtime.getURL('js/jquery/beforeafter.jquery-1.0.0.min.js');
  (document.head || document.documentElement).appendChild(sJqueryBeforeAfter);
  sJqueryBeforeAfter.onload = function () {
    sJqueryBeforeAfter.parentNode.removeChild(sJqueryBeforeAfter);
  };

  const cssSwitcher = document.createElement('link');
  cssSwitcher.href = chrome.runtime.getURL('css/switcher.css');
  cssSwitcher.rel = 'stylesheet';
  cssSwitcher.type = 'text/css';
  (document.head || document.documentElement).appendChild(cssSwitcher);

  const sSwitcher = document.createElement('script');
  sSwitcher.src = chrome.runtime.getURL('js/jquery/jquery.switcher.min.js');
  (document.head || document.documentElement).appendChild(sSwitcher);
  sSwitcher.onload = function () {
    sSwitcher.parentNode.removeChild(sSwitcher);
  };

  const cssFlicking = document.createElement('link');
  cssFlicking.href = chrome.runtime.getURL('js/flicking/flicking.css');
  cssFlicking.rel = 'stylesheet';
  cssFlicking.type = 'text/css';
  (document.head || document.documentElement).appendChild(cssFlicking);

  const sFlicking = document.createElement('script');
  sFlicking.src = chrome.runtime.getURL('js/flicking/flicking.pkgd.min.js');
  (document.head || document.documentElement).appendChild(sFlicking);
  sFlicking.onload = function () {
    const sFlickingPlugins = document.createElement('script');
    sFlickingPlugins.src = chrome.runtime.getURL('js/flicking/plugins.js');
    (document.head || document.documentElement).appendChild(sFlickingPlugins);
    sFlickingPlugins.onload = function () {
      const sChartjs = document.createElement('script');
      sChartjs.src = chrome.runtime.getURL('js/chartJS/chart.umd.min.js');
      (document.head || document.documentElement).appendChild(sChartjs);
      sChartjs.onload = function () {
        const sChartZoom = document.createElement('script');
        sChartZoom.src = chrome.runtime.getURL('js/chartJS/chartjs-plugin-zoom.min.js');
        (document.head || document.documentElement).appendChild(sChartZoom);
        sChartZoom.onload = function () {
          sChartZoom.parentNode.removeChild(sChartZoom);
        };
        sChartjs.parentNode.removeChild(sChartjs);
      };
      sFlickingPlugins.parentNode.removeChild(sFlickingPlugins);
    };
    sFlicking.parentNode.removeChild(sFlicking);
  };

  const cssFlickingInline = document.createElement('link');
  cssFlickingInline.href = chrome.runtime.getURL('js/flicking/flicking-inline.css');
  cssFlickingInline.rel = 'stylesheet';
  cssFlickingInline.type = 'text/css';
  (document.head || document.documentElement).appendChild(cssFlickingInline);

  const cssFlickingPlugins = document.createElement('link');
  cssFlickingPlugins.href = chrome.runtime.getURL('js/flicking/flicking-plugins.css');
  cssFlickingPlugins.rel = 'stylesheet';
  cssFlickingPlugins.type = 'text/css';
  (document.head || document.documentElement).appendChild(cssFlickingPlugins);

  const cssManrope = document.createElement('link');
  cssManrope.href = chrome.runtime.getURL('css/fonts/manrope.css');
  cssManrope.rel = 'stylesheet';
  cssManrope.type = 'text/css';
  (document.head || document.documentElement).prepend(cssManrope);

  const cssRoboto = document.createElement('link');
  cssRoboto.href = chrome.runtime.getURL('css/fonts/roboto.css');
  cssRoboto.rel = 'stylesheet';
  cssRoboto.type = 'text/css';
  (document.head || document.documentElement).prepend(cssRoboto);

  const cssFlagIcons = document.createElement('link');
  cssFlagIcons.href = chrome.runtime.getURL('css/flag-icon.css');
  cssFlagIcons.rel = 'stylesheet';
  cssFlagIcons.type = 'text/css';
  (document.head || document.documentElement).prepend(cssFlagIcons);

  chrome.storage.sync.get((itemsSync) => {
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

        chrome.storage.local.get((itemsLocal) => {
          const {
            userInfo: { steamId },
            isCollapsedStreamEmbed,
          } = itemsLocal;

          const actualCode = [
            `window.SIHID = '${chrome.runtime.id}';`,
            `window.steamCurrency = ${JSON.stringify(itemsSync.steamCurrency)};`,
            `window.SIHLang = ${JSON.stringify(langData)};`,
            `window.lang = ${JSON.stringify(itemsSync.lang)};`,
            `window.manifest_v3_accepted = ${JSON.stringify(itemsSync.manifest_v3_accepted)};`,
            `window.sih_steamID = ${JSON.stringify(steamId)}`,
            `window.disabledSteamRefillHeaderButton = ${itemsSync.disabled_steam_refill_header_button}`,
            `window.disabledSteamRefillCashBackModal = ${itemsSync.disabled_sih_cashback_modal}`,
            `window.disabledSihFeaturesMenu = ${itemsSync.disabled_sih_features_menu}`,
            `window.ExchangeSteamRates= ${JSON.stringify(itemsSync.default_steam_rates.rates || {})}`,
          ].join('\r\n');

          document.documentElement.setAttribute('onreset', actualCode);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
          document.documentElement.removeAttribute('onreset');

          let isIncludePrice = false;
          let isIncludeGlobalStyles = false;

          EXCLUDE_LOCATION_PRICE_NAME.forEach((locationName) => {
            // For /inventoryhistory endpoint
            if (locationName === '/inventory' && window.location.href.includes('inventoryhistory')) return;

            if (window.location.href.includes(locationName)) {
              if (locationName !== 'market') isIncludePrice = true;
              else if (!window.location.href.includes('search')) {
                isIncludePrice = true;
              }
            }
          });

          EXCLUDE_LOCATION_GLOBAL_STYLES_NAME.forEach((locationName) => {
            // For /inventoryhistory endpoint
            if (locationName === '/inventory' && window.location.href.includes('inventoryhistory')) return;

            // For addFunds page with redirect url on listing
            if (
              locationName === 'market/listings' &&
              window.location.href.includes('market/listings') &&
              window.location.href.includes('steamaccount/addfunds')
            )
              return;

            if (window.location.href.includes(locationName)) {
              isIncludeGlobalStyles = true;
            }
          });

          //TODO: ЗАТЕСТИТЬ БЕЗ ЭТОГО
          // if (!isIncludeGlobalStyles) {
          const cssSihGlobalHeader = document.createElement('link');
          cssSihGlobalHeader.href = chrome.runtime.getURL('js/siteExt/sihGlobalHeader.css');
          cssSihGlobalHeader.rel = 'stylesheet';
          cssSihGlobalHeader.type = 'text/css';
          (document.head || document.documentElement).appendChild(cssSihGlobalHeader);
          // }

          if (!isIncludePrice) {
            const sPriceQueue = document.createElement('script');
            sPriceQueue.src = chrome.runtime.getURL('js/PriceQueue.js');
            (document.head || document.documentElement).appendChild(sPriceQueue);
            sPriceQueue.onload = function () {
              sPriceQueue.parentNode.removeChild(sPriceQueue);
            };
          }

          const sPagination = document.createElement('script');
          sPagination.src = chrome.runtime.getURL('js/jquery/pagination.min.js');
          (document.head || document.documentElement).appendChild(sPagination);
          sPagination.onload = function () {
            const sDebounce = document.createElement('script');
            sDebounce.src = chrome.runtime.getURL('js/jquery/jquery.ba-throttle-debounce.min.js');
            (document.head || document.documentElement).appendChild(sDebounce);
            sDebounce.onload = function () {
              const sSihGlobalHeaderBundle = document.createElement('script');
              sSihGlobalHeaderBundle.src = chrome.runtime.getURL('js/siteExt/sihGlobalHeader.bundle.js');
              (document.head || document.documentElement).appendChild(sSihGlobalHeaderBundle);
              sSihGlobalHeaderBundle.onload = function () {
                const sSihGlobalHeader = document.createElement('script');
                sSihGlobalHeader.src = chrome.runtime.getURL('js/sih_global_header.script.js');
                (document.head || document.documentElement).appendChild(sSihGlobalHeader);
                sSihGlobalHeader.onload = function () {
                  const rootPage = document.createElement('sih-app-root');
                  document.getElementsByTagName('body')[0].appendChild(rootPage);

                  const cssAngularStyles = document.createElement('link');
                  cssAngularStyles.href = chrome.runtime.getURL('js/angular/styles.css');
                  cssAngularStyles.rel = 'stylesheet';
                  cssAngularStyles.type = 'text/css';
                  (document.head || document.documentElement).prepend(cssAngularStyles);

                  const angularScript = document.createElement('script');
                  angularScript.src = chrome.runtime.getURL('js/angular/main.js');
                  document.body.appendChild(angularScript);

                  angularScript.onload = function () {
                    angularScript.parentNode.removeChild(angularScript);

                    const angularRuntimeScript = document.createElement('script');
                    angularRuntimeScript.src = chrome.runtime.getURL('js/angular/runtime.js');
                    document.body.appendChild(angularRuntimeScript);

                    angularRuntimeScript.onload = function () {
                      try {
                        const angularVendorScript = document.createElement('script');
                        angularVendorScript.src = chrome.runtime.getURL('js/angular/vendor.js');

                        document.body.appendChild(angularVendorScript);

                        angularVendorScript.onload = function () {
                          angularVendorScript.parentNode.removeChild(angularVendorScript);
                        };
                      } catch (e) {}

                      angularRuntimeScript.parentNode.removeChild(angularRuntimeScript);
                    };

                    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
                      if (msg.type === 'OPEN_KEYS_MAIN_MODAL_AFTER_LOGIN') {
                        const sKeysMainModalOpener = document.createElement('script');
                        sKeysMainModalOpener.src = chrome.runtime.getURL('js/sihKeys/openKeysMainModal.script.js');
                        (document.head || document.documentElement).appendChild(sKeysMainModalOpener);
                        sKeysMainModalOpener.onload = function () {
                          sKeysMainModalOpener.parentNode.removeChild(sKeysMainModalOpener);
                        };
                      }
                    });
                  };

                  sSihGlobalHeader.parentNode.removeChild(sSihGlobalHeader);
                };

                const excluded_urls = ['https://steamcommunity.com/openid/login', 'https://steamcommunity.com/chat'];

                if (!excluded_urls.some((url) => window.location.href.includes(url))) {
                  initStreamEmbed(langData, itemsSync.display_stream_embed, isCollapsedStreamEmbed);
                }

                sSihGlobalHeaderBundle.parentNode.removeChild(sSihGlobalHeaderBundle);
              };
              sDebounce.parentNode.removeChild(sDebounce);
            };

            sPagination.parentNode.removeChild(sPagination);
          };
        });
      });
    });
  });
}

function initStreamEmbed(langData, needDisplayEmbed = true, isCollapsedEmbed) {
  if (needDisplayEmbed) {
    const steamUserInfo = $('#application_config').attr('data-userinfo');

    const countryCode = steamUserInfo ? JSON.parse(steamUserInfo)?.country_code : null;

    const CIS_COUNTRY_CODE = ['RU', 'AZ', 'AM', 'BY', 'KZ', 'KG', 'MD', 'TJ', 'UZ', 'TM'];

    const isCisRegion = countryCode && CIS_COUNTRY_CODE.includes(countryCode);

    chrome.runtime.sendMessage(
      chrome.runtime.id,
      { type: 'STEAM_STATS_GET_STREAM_EMBED', data: { isCisRegion } },
      (response) => {
        if (!response.success) return;

        const embeds = response.result;

        chrome.runtime.sendMessage(chrome.runtime.id, { type: 'BACKGROUND_CHECK_SUBSCRIBE_ADS' }, (subscribeInfo) => {
          const needCollapse = isCollapsedEmbed !== undefined ? isCollapsedEmbed : subscribeInfo.success;

          if (embeds?.kick?.length) {
            const kickEmbed = embeds.kick[0];

            const iframeHtml = /* HTML */ ` <iframe
              class="stream-embed__frame"
              src="https://player.kick.com/${kickEmbed.u}"
              width="427"
              height="240"
              allowfullscreen
            ></iframe>`;

            addStreamEmbed(kickEmbed, iframeHtml, langData, needCollapse);
          } else if (embeds?.twitch?.length) {
            const twitchEmbed = embeds.twitch[0];

            const iframeHtml = /* HTML */ ` <iframe
              class="stream-embed__frame"
              src="https://player.twitch.tv/?channel=${twitchEmbed.u}&parent=${location.hostname}&autoplay=true&muted=true"
              width="427"
              height="240"
              allowfullscreen
            ></iframe>`;

            addStreamEmbed(twitchEmbed, iframeHtml, langData, needCollapse);
          } else return;

          const sStreamEmbed = document.createElement('script');
          sStreamEmbed.src = chrome.runtime.getURL('js/stream_embed.script.js');
          (document.head || document.documentElement).appendChild(sStreamEmbed);
          sStreamEmbed.onload = function () {
            sStreamEmbed.parentNode.removeChild(sStreamEmbed);
          };
        });
      }
    );
  }
}

function addStreamEmbed(embed, iframeHtml, langData, needCollapse) {
  const streamEmbedHtml = /* HTML */ `<div class="stream-embed ${needCollapse ? 'stream-embed_collapsed' : ''}">
    <div class="stream-embed__header embed-header">
      <div class="embed-header-left">
        <div class="embed-header-left__live-icon">LIVE</div>
        <div class="embed-header-left__stream-name">${embed.t}</div>
      </div>
      <div class="embed-header-right">
        <svg
          class="embed-header-right__collapse"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g opacity="0.7">
            <path
              d="M12 6.33334L8 10.3333L4 6.33334"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
        </svg>
        <svg
          class="embed-header-right__close"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g opacity="0.7">
            <path
              d="M4.66675 4.66666L11.3334 11.3333"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M4.66675 11.3333L11.3334 4.66666"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>
    <div class="stream-embed__main">${iframeHtml}</div>
    <div class="stream-embed__footer">
      <input type="checkbox" id="disableStreamEmbed" />
      <label for="disableStreamEmbed" class="sih_checkbox">${langData.stream_embed.dont_show_again}</label>
    </div>
  </div>`;

  $('body').prepend(streamEmbedHtml);
}
