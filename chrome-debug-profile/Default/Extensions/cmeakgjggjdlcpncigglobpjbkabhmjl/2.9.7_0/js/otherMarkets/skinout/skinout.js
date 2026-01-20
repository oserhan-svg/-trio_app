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

    const cssSkinout = document.createElement('link');
    cssSkinout.href = chrome.runtime.getURL('js/siteExt/skinout.css');
    cssSkinout.rel = 'stylesheet';
    cssSkinout.type = 'text/css';
    (document.head || document.documentElement).prepend(cssSkinout);

    const sSkinoutBundle = document.createElement('script');
    sSkinoutBundle.src = chrome.runtime.getURL('js/siteExt/skinout.bundle.js');
    (document.head || document.documentElement).appendChild(sSkinoutBundle);
    sSkinoutBundle.onload = function () {
      const sSkinout = document.createElement('script');
      sSkinout.src = chrome.runtime.getURL('js/otherMarkets/skinout/skinout.script.js');
      (document.head || document.documentElement).appendChild(sSkinout);
      sSkinout.onload = function () {
        sSkinout.parentNode.removeChild(sSkinout);
      };

      sSkinoutBundle.parentNode.removeChild(sSkinoutBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
