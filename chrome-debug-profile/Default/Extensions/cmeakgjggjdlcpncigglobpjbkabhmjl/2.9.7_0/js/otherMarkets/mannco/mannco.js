const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const sJqueryUi = document.createElement('script');
sJqueryUi.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
(document.head || document.documentElement).appendChild(sJqueryUi);
sJqueryUi.onload = function () {
  sJqueryUi.parentNode.removeChild(sJqueryUi);

  const cssMannco = document.createElement('link');
  cssMannco.href = chrome.runtime.getURL('js/siteExt/mannco.css');
  cssMannco.rel = 'stylesheet';
  cssMannco.type = 'text/css';
  (document.head || document.documentElement).prepend(cssMannco);

  const sManncoBundle = document.createElement('script');
  sManncoBundle.src = chrome.runtime.getURL('js/siteExt/mannco.bundle.js');
  (document.head || document.documentElement).appendChild(sManncoBundle);
  sManncoBundle.onload = function () {
    const sMannco = document.createElement('script');
    sMannco.src = chrome.runtime.getURL('js/otherMarkets/mannco/mannco.script.js');
    (document.head || document.documentElement).appendChild(sMannco);
    sMannco.onload = function () {
      sMannco.parentNode.removeChild(sMannco);
    };

    sManncoBundle.parentNode.removeChild(sManncoBundle);
  };
};
