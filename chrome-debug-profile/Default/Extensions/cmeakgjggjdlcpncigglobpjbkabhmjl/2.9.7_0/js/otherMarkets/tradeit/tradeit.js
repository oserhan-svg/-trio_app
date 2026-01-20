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

    const cssTradeit = document.createElement('link');
    cssTradeit.href = chrome.runtime.getURL('js/siteExt/tradeit.css');
    cssTradeit.rel = 'stylesheet';
    cssTradeit.type = 'text/css';
    (document.head || document.documentElement).prepend(cssTradeit);

    const sTradeitBundle = document.createElement('script');
    sTradeitBundle.src = chrome.runtime.getURL(`js/siteExt/tradeit.bundle.js`);
    (document.head || document.documentElement).appendChild(sTradeitBundle);
    sTradeitBundle.onload = function () {
      sTradeitBundle.parentNode.removeChild(sTradeitBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
