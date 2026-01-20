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
    const cssGameBoost = document.createElement('link');
    cssGameBoost.href = chrome.runtime.getURL('js/siteExt/gameboost.css');
    cssGameBoost.rel = 'stylesheet';
    cssGameBoost.type = 'text/css';
    (document.head || document.documentElement).prepend(cssGameBoost);

    const sGameBoostBundle = document.createElement('script');
    sGameBoostBundle.src = chrome.runtime.getURL('js/siteExt/gameboost.bundle.js');
    (document.head || document.documentElement).appendChild(sGameBoostBundle);
    sGameBoostBundle.onload = function () {
      sGameBoostBundle.parentNode.removeChild(sGameBoostBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
