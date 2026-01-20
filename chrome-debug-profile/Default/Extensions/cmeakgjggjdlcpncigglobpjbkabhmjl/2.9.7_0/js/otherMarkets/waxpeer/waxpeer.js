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

    const cssWaxpeer = document.createElement('link');
    cssWaxpeer.href = chrome.runtime.getURL('js/siteExt/waxpeer.css');
    cssWaxpeer.rel = 'stylesheet';
    cssWaxpeer.type = 'text/css';
    (document.head || document.documentElement).prepend(cssWaxpeer);

    const sWaxpeerBundle = document.createElement('script');
    sWaxpeerBundle.src = chrome.runtime.getURL('js/siteExt/waxpeer.bundle.js');
    (document.head || document.documentElement).appendChild(sWaxpeerBundle);
    sWaxpeerBundle.onload = function () {
      const sWaxpeer = document.createElement('script');
      sWaxpeer.src = chrome.runtime.getURL('js/otherMarkets/waxpeer/waxpeer.script.js');
      (document.head || document.documentElement).appendChild(sWaxpeer);
      sWaxpeer.onload = function () {
        sWaxpeer.parentNode.removeChild(sWaxpeer);
      };

      sWaxpeerBundle.parentNode.removeChild(sWaxpeerBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
