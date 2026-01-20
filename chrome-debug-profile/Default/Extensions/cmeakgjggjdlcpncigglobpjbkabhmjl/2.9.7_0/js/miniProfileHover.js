const actualCode = [`window.SIHID = '${chrome.runtime.id}';`].join('\r\n');
document.documentElement.setAttribute('onreset', actualCode);
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const cssFlicking = document.createElement('link');
cssFlicking.href = chrome.runtime.getURL('js/siteExt/miniProfileHover.css');
cssFlicking.rel = 'stylesheet';
cssFlicking.type = 'text/css';
(document.head || document.documentElement).appendChild(cssFlicking);

const sMiniProfileBundle = document.createElement('script');
sMiniProfileBundle.src = chrome.runtime.getURL('js/siteExt/miniProfileHover.bundle.js');
(document.head || document.documentElement).appendChild(sMiniProfileBundle);
sMiniProfileBundle.onload = function () {
  sMiniProfileBundle.parentNode.removeChild(sMiniProfileBundle);
};
