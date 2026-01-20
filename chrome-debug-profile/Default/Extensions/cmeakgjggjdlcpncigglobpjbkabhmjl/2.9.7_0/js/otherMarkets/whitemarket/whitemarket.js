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

    const cssWhitemarket = document.createElement('link');
    cssWhitemarket.href = chrome.runtime.getURL('js/siteExt/whitemarket.css');
    cssWhitemarket.rel = 'stylesheet';
    cssWhitemarket.type = 'text/css';
    (document.head || document.documentElement).prepend(cssWhitemarket);

    const sWhitemarketBundle = document.createElement('script');
    sWhitemarketBundle.src = chrome.runtime.getURL('js/siteExt/whitemarket.bundle.js');
    (document.head || document.documentElement).appendChild(sWhitemarketBundle);
    sWhitemarketBundle.onload = function () {
      sWhitemarketBundle.parentNode.removeChild(sWhitemarketBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};

const port = chrome.runtime.connect({ name: 'WHITEMARKET_CONTENT_SCRIPT_CONNECTION' });

port.onMessage.addListener((response) => {
  window.dispatchEvent(new CustomEvent('PassApiResponseToSiteExt', { detail: response }));
});
