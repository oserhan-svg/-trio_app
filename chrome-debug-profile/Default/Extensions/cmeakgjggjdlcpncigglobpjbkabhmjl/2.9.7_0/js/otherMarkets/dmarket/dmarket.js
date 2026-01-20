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
  sJqueryUi.onload = async function () {
    sJqueryUi.parentNode.removeChild(sJqueryUi);

    const cssDmarket = document.createElement('link');
    cssDmarket.href = chrome.runtime.getURL('js/siteExt/dmarket.css');
    cssDmarket.rel = 'stylesheet';
    cssDmarket.type = 'text/css';
    (document.head || document.documentElement).prepend(cssDmarket);

    const sDmarketBundle = document.createElement('script');
    sDmarketBundle.src = chrome.runtime.getURL(`js/siteExt/dmarket.bundle.js`);
    (document.head || document.documentElement).appendChild(sDmarketBundle);
    sDmarketBundle.onload = function () {
      sDmarketBundle.parentNode.removeChild(sDmarketBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
