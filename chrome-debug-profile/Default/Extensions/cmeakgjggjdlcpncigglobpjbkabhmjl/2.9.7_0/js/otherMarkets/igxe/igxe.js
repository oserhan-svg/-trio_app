const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const cssIgxe = document.createElement('link');
cssIgxe.href = chrome.runtime.getURL('js/siteExt/igxe.css');
cssIgxe.rel = 'stylesheet';
cssIgxe.type = 'text/css';
(document.head || document.documentElement).prepend(cssIgxe);

const sIgxeBundle = document.createElement('script');
sIgxeBundle.src = chrome.runtime.getURL('js/siteExt/igxe.bundle.js');
(document.head || document.documentElement).appendChild(sIgxeBundle);
sIgxeBundle.onload = function () {
  sIgxeBundle.parentNode.removeChild(sIgxeBundle);
};

window.addEventListener(
  'loadJQUIFromContentScript',
  function (e) {
    const sJqueryUi = document.createElement('script');
    sJqueryUi.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
    (document.head || document.documentElement).appendChild(sJqueryUi);
    sJqueryUi.onload = function () {
      sJqueryUi.parentNode.removeChild(sJqueryUi);
      window.dispatchEvent(new CustomEvent('JQUIFromContentScriptLoaded'));
    };
  },
  false
);
