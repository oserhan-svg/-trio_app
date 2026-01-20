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

    const cssHaloskins = document.createElement('link');
    cssHaloskins.href = chrome.runtime.getURL('js/siteExt/haloskins.css');
    cssHaloskins.rel = 'stylesheet';
    cssHaloskins.type = 'text/css';
    (document.head || document.documentElement).prepend(cssHaloskins);

    const sHaloskinsBundle = document.createElement('script');
    sHaloskinsBundle.src = chrome.runtime.getURL('js/siteExt/haloskins.bundle.js');
    (document.head || document.documentElement).appendChild(sHaloskinsBundle);
    sHaloskinsBundle.onload = function () {
      sHaloskinsBundle.parentNode.removeChild(sHaloskinsBundle);
    };
  };
};

sJquery.parentNode.removeChild(sJquery);
