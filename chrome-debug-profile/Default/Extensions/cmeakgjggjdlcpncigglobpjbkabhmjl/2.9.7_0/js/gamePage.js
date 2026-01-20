const cssGamePage = document.createElement('link');
cssGamePage.href = chrome.runtime.getURL('js/siteExt/gamePage.css');
cssGamePage.rel = 'stylesheet';
cssGamePage.type = 'text/css';
(document.head || document.documentElement).prepend(cssGamePage);

chrome.storage.sync.get(
  {
    lang: '',
    disabled_steam_refill_banner: false,
    show_online_users: true,
    show_twitch_stats: true,
    show_streamlink: true,
  },
  function (items) {
    $.getJSON(chrome.runtime.getURL(`_locales/en/controls.json`), (enData) => {
      $.getJSON(chrome.runtime.getURL(`_locales/${items.lang}/controls.json`), (langData) => {
        langData = jQuery.extend(true, {}, enData, langData);

        const actualCode = [
          `window.SIHID = '${chrome.runtime.id}'`,
          `window.disabledSteamRefillBanner = ${items.disabled_steam_refill_banner}`,
          `window.SIHLang = ${JSON.stringify(langData)}`,
          `window.show_online_users = ${items.show_online_users}`,
          `window.show_twitch_stats = ${items.show_twitch_stats}`,
          `window.show_streamlink = ${items.show_streamlink}`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const sGameBundle = document.createElement('script');
        sGameBundle.src = chrome.runtime.getURL('js/siteExt/gamePage.bundle.js');
        (document.head || document.documentElement).appendChild(sGameBundle);
        sGameBundle.onload = function () {
          const sGame = document.createElement('script');
          sGame.src = chrome.runtime.getURL('js/gamePage.script.js');
          (document.head || document.documentElement).appendChild(sGame);
          sGame.onload = function () {
            sGame.parentNode.removeChild(sGame);
          };

          sGameBundle.parentNode.removeChild(sGameBundle);
        };
      });
    });
  }
);
