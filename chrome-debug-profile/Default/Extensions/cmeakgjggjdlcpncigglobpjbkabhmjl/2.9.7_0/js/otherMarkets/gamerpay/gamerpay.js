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

    const cssGamerpay = document.createElement('link');
    cssGamerpay.href = chrome.runtime.getURL('js/siteExt/gamerpay.css');
    cssGamerpay.rel = 'stylesheet';
    cssGamerpay.type = 'text/css';
    (document.head || document.documentElement).prepend(cssGamerpay);

    const sGamerpayBundle = document.createElement('script');
    sGamerpayBundle.src = chrome.runtime.getURL('js/siteExt/gamerpay.bundle.js');
    (document.head || document.documentElement).appendChild(sGamerpayBundle);
    sGamerpayBundle.onload = function () {
      sGamerpayBundle.parentNode.removeChild(sGamerpayBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
