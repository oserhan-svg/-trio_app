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

    const cssSkinbaron = document.createElement('link');
    cssSkinbaron.href = chrome.runtime.getURL('js/siteExt/skinbaron.css');
    cssSkinbaron.rel = 'stylesheet';
    cssSkinbaron.type = 'text/css';
    (document.head || document.documentElement).prepend(cssSkinbaron);

    const sSkinbaronBundle = document.createElement('script');
    sSkinbaronBundle.src = chrome.runtime.getURL(`js/siteExt/skinbaron.bundle.js`);
    (document.head || document.documentElement).appendChild(sSkinbaronBundle);
    sSkinbaronBundle.onload = function () {
      sSkinbaronBundle.parentNode.removeChild(sSkinbaronBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
