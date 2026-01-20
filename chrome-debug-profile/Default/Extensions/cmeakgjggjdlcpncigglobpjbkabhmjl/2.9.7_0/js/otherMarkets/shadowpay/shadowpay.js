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

    const cssShadowpay = document.createElement('link');
    cssShadowpay.href = chrome.runtime.getURL('js/siteExt/shadowpay.css');
    cssShadowpay.rel = 'stylesheet';
    cssShadowpay.type = 'text/css';
    (document.head || document.documentElement).prepend(cssShadowpay);

    const sShadowpayBundle = document.createElement('script');
    sShadowpayBundle.src = chrome.runtime.getURL('js/siteExt/shadowpay.bundle.js');
    (document.head || document.documentElement).appendChild(sShadowpayBundle);
    sShadowpayBundle.onload = function () {
      sShadowpayBundle.parentNode.removeChild(sShadowpayBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
