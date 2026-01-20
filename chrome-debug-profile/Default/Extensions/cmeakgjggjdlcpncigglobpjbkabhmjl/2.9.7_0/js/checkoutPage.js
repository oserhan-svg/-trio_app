chrome.storage.sync.get(
  {
    lang: '',
    disabled_sih_cashback_modal: false,
  },
  function (items) {
    $.getJSON(chrome.runtime.getURL(`_locales/en/controls.json`), (enData) => {
      $.getJSON(chrome.runtime.getURL(`_locales/${items.lang}/controls.json`), (langData) => {
        langData = jQuery.extend(true, {}, enData, langData);

        const actualCode = [
          `window.SIHID = '${chrome.runtime.id}'`,
          `window.SIHLang = ${JSON.stringify(langData)}`,
          `window.disabledSteamRefillCashBackModal = ${items.disabled_sih_cashback_modal}`,
        ].join('\r\n');

        document.documentElement.setAttribute('onreset', actualCode);
        document.documentElement.dispatchEvent(new CustomEvent('reset'));
        document.documentElement.removeAttribute('onreset');

        const cssCheckout = document.createElement('link');
        cssCheckout.href = chrome.runtime.getURL('js/siteExt/checkoutPage.css');
        cssCheckout.rel = 'stylesheet';
        cssCheckout.type = 'text/css';
        (document.head || document.documentElement).prepend(cssCheckout);

        const sCheckoutBundle = document.createElement('script');
        sCheckoutBundle.src = chrome.runtime.getURL('js/siteExt/checkoutPage.bundle.js');
        (document.head || document.documentElement).appendChild(sCheckoutBundle);
        sCheckoutBundle.onload = function () {
          sCheckoutBundle.parentNode.removeChild(sCheckoutBundle);
        };
      });
    });
  }
);
