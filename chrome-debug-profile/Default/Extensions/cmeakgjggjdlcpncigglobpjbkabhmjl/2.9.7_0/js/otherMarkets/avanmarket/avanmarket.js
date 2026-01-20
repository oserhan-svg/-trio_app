const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const sJquery = document.createElement('script');
sJquery.src = chrome.runtime.getURL('js/jquery/jquery-1.10.2.min.js');
(document.head || document.documentElement).appendChild(sJquery);
sJquery.onload = function () {
  const sJqueryUi = document.createElement('script');
  sJqueryUi.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
  (document.head || document.documentElement).appendChild(sJqueryUi);
  sJqueryUi.onload = function () {
    sJqueryUi.parentNode.removeChild(sJqueryUi);
    const cssAvanMarket = document.createElement('link');
    cssAvanMarket.href = chrome.runtime.getURL('js/siteExt/avanmarket.css');
    cssAvanMarket.rel = 'stylesheet';
    cssAvanMarket.type = 'text/css';
    (document.head || document.documentElement).prepend(cssAvanMarket);

    const sAvanMarketBundle = document.createElement('script');
    sAvanMarketBundle.src = chrome.runtime.getURL('js/siteExt/avanmarket.bundle.js');
    (document.head || document.documentElement).appendChild(sAvanMarketBundle);
    sAvanMarketBundle.onload = function () {
      sAvanMarketBundle.parentNode.removeChild(sAvanMarketBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
