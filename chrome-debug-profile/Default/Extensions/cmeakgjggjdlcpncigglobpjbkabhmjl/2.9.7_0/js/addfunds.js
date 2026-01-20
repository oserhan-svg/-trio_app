const cssAddfunds = document.createElement('link');
cssAddfunds.href = chrome.runtime.getURL('js/siteExt/addfunds.css');
cssAddfunds.rel = 'stylesheet';
cssAddfunds.type = 'text/css';
(document.head || document.documentElement).prepend(cssAddfunds);

const actualCode = [`window.SIHID = '${chrome.runtime.id}';`];

document.documentElement.setAttribute('onreset', actualCode.join('\r\n'));
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');

const sAddfundsBundle = document.createElement('script');
sAddfundsBundle.src = chrome.runtime.getURL('js/siteExt/addfunds.bundle.js');
(document.head || document.documentElement).appendChild(sAddfundsBundle);
sAddfundsBundle.onload = function () {
  const sAddfunds = document.createElement('script');
  sAddfunds.src = chrome.runtime.getURL('js/addfunds.script.js');
  (document.head || document.documentElement).appendChild(sAddfunds);
  sAddfunds.onload = function () {
    sAddfunds.parentNode.removeChild(sAddfunds);
  };

  sAddfundsBundle.parentNode.removeChild(sAddfundsBundle);
};
