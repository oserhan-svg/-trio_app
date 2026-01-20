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
    const cssSkinPlace = document.createElement('link');
    cssSkinPlace.href = chrome.runtime.getURL('js/siteExt/skinplace.css');
    cssSkinPlace.rel = 'stylesheet';
    cssSkinPlace.type = 'text/css';
    (document.head || document.documentElement).prepend(cssSkinPlace);

    const sSkinPlaceBundle = document.createElement('script');
    sSkinPlaceBundle.src = chrome.runtime.getURL('js/siteExt/skinplace.bundle.js');
    (document.head || document.documentElement).appendChild(sSkinPlaceBundle);
    sSkinPlaceBundle.onload = function () {
      sSkinPlaceBundle.parentNode.removeChild(sSkinPlaceBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
