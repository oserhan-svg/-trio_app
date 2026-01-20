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

    const cssBitskins = document.createElement('link');
    cssBitskins.href = chrome.runtime.getURL('js/siteExt/bitskins.css');
    cssBitskins.rel = 'stylesheet';
    cssBitskins.type = 'text/css';
    (document.head || document.documentElement).prepend(cssBitskins);

    const sBitskinsBundle = document.createElement('script');
    sBitskinsBundle.src = chrome.runtime.getURL('js/siteExt/bitskins.bundle.js');
    (document.head || document.documentElement).appendChild(sBitskinsBundle);
    sBitskinsBundle.onload = function () {
      sBitskinsBundle.parentNode.removeChild(sBitskinsBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
