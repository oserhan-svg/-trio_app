const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const cssLisskins = document.createElement('link');
cssLisskins.href = chrome.runtime.getURL('js/siteExt/lisskins.css');
cssLisskins.rel = 'stylesheet';
cssLisskins.type = 'text/css';
(document.head || document.documentElement).prepend(cssLisskins);

const sLisskinsBundle = document.createElement('script');
sLisskinsBundle.src = chrome.runtime.getURL('js/siteExt/lisskins.bundle.js');
(document.head || document.documentElement).appendChild(sLisskinsBundle);
sLisskinsBundle.onload = function () {
  const sLisskins = document.createElement('script');
  sLisskins.src = chrome.runtime.getURL('js/otherMarkets/lisskins/lisskins.script.js');
  (document.head || document.documentElement).appendChild(sLisskins);
  sLisskins.onload = function () {
    sLisskins.parentNode.removeChild(sLisskins);
  };

  sLisskinsBundle.parentNode.removeChild(sLisskinsBundle);
};
