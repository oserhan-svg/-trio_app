const cssRoboto = document.createElement('link');
cssRoboto.href = chrome.runtime.getURL('css/fonts/roboto.css');
cssRoboto.rel = 'stylesheet';
cssRoboto.type = 'text/css';
(document.head || document.documentElement).prepend(cssRoboto);

chrome.storage.sync.get(
  {
    lang: '',
  },
  function (items) {
    $.getJSON(chrome.runtime.getURL(`_locales/en/controls.json`), (enData) => {
      $.getJSON(chrome.runtime.getURL(`_locales/${items.lang}/controls.json`), (langData) => {
        langData = jQuery.extend(true, {}, enData, langData);

        const sJquery = document.createElement('script');
        sJquery.src = chrome.runtime.getURL('js/jquery/jquery-1.10.2.min.js');
        (document.head || document.documentElement).appendChild(sJquery);
        sJquery.onload = function () {
          const actualCode = [
            `window.SIHID = '${chrome.runtime.id}'`,
            `window.SIHLang = ${JSON.stringify(langData)}`,
            `window.$J = window.jQuery.noConflict(true)`,
          ].join('\r\n');

          document.documentElement.setAttribute('onreset', actualCode);
          document.documentElement.dispatchEvent(new CustomEvent('reset'));
          document.documentElement.removeAttribute('onreset');

          const cssEpicGames = document.createElement('link');
          cssEpicGames.href = chrome.runtime.getURL('js/siteExt/epicGamesPage.css');
          cssEpicGames.rel = 'stylesheet';
          cssEpicGames.type = 'text/css';
          (document.head || document.documentElement).prepend(cssEpicGames);

          const sEpicGamesBundle = document.createElement('script');
          sEpicGamesBundle.src = chrome.runtime.getURL('js/siteExt/epicGamesPage.bundle.js');
          (document.head || document.documentElement).appendChild(sEpicGamesBundle);
          sEpicGamesBundle.onload = function () {
            sEpicGamesBundle.parentNode.removeChild(sEpicGamesBundle);
          };

          sJquery.parentNode.removeChild(sJquery);
        };
      });
    });
  }
);
