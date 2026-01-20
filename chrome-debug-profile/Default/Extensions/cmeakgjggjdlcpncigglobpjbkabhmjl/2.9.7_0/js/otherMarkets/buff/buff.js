const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const cssBuff = document.createElement('link');
cssBuff.href = chrome.runtime.getURL('js/siteExt/buff.css');
cssBuff.rel = 'stylesheet';
cssBuff.type = 'text/css';
(document.head || document.documentElement).prepend(cssBuff);

const sBuffBundle = document.createElement('script');
sBuffBundle.src = chrome.runtime.getURL('js/siteExt/buff.bundle.js');
(document.head || document.documentElement).appendChild(sBuffBundle);
sBuffBundle.onload = function () {
  const sBuff = document.createElement('script');
  sBuff.src = chrome.runtime.getURL('js/otherMarkets/buff/buff.script.js');
  (document.head || document.documentElement).appendChild(sBuff);
  sBuff.onload = function () {
    sBuff.parentNode.removeChild(sBuff);
  };

  sBuffBundle.parentNode.removeChild(sBuffBundle);
};
