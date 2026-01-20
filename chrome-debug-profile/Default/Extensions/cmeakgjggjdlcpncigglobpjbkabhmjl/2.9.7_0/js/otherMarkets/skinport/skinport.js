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

    const cssSkinport = document.createElement('link');
    cssSkinport.href = chrome.runtime.getURL('js/siteExt/skinport.css');
    cssSkinport.rel = 'stylesheet';
    cssSkinport.type = 'text/css';
    (document.head || document.documentElement).prepend(cssSkinport);

    const sSkinportBundle = document.createElement('script');
    sSkinportBundle.src = chrome.runtime.getURL('js/siteExt/skinport.bundle.js');
    (document.head || document.documentElement).appendChild(sSkinportBundle);
    sSkinportBundle.onload = function () {
      const sSkinport = document.createElement('script');
      sSkinport.src = chrome.runtime.getURL('js/otherMarkets/skinport/skinport.script.js');
      (document.head || document.documentElement).appendChild(sSkinport);
      sSkinport.onload = function () {
        sSkinport.parentNode.removeChild(sSkinport);
      };

      sSkinportBundle.parentNode.removeChild(sSkinportBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
