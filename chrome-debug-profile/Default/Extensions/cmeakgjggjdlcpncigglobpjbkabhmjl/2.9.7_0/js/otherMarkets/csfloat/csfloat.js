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
    const cssCsfloat = document.createElement('link');
    cssCsfloat.href = chrome.runtime.getURL('js/siteExt/csfloat.css');
    cssCsfloat.rel = 'stylesheet';
    cssCsfloat.type = 'text/css';
    (document.head || document.documentElement).prepend(cssCsfloat);

    const sCsfloatBundle = document.createElement('script');
    sCsfloatBundle.src = chrome.runtime.getURL('js/siteExt/csfloat.bundle.js');
    (document.head || document.documentElement).appendChild(sCsfloatBundle);
    sCsfloatBundle.onload = function () {
      sCsfloatBundle.parentNode.removeChild(sCsfloatBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
