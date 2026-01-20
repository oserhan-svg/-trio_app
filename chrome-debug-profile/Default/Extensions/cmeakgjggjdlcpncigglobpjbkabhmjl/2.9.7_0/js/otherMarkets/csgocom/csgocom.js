const sCsgocomInjector = document.createElement('script');
sCsgocomInjector.src = chrome.runtime.getURL('js/siteExt/csgocom_injector.bundle.js');
(document.head || document.documentElement).appendChild(sCsgocomInjector);
sCsgocomInjector.onload = function () {
  sCsgocomInjector.parentNode.removeChild(sCsgocomInjector);
};

const sJquery = document.createElement('script');
sJquery.src = chrome.runtime.getURL('js/jquery/jquery-1.10.2.min.js');
(document.head || document.documentElement).appendChild(sJquery);
sJquery.onload = function () {
  //They overwrite the $, this script does it before they do it

  const sJqueryUi = document.createElement('script');
  sJqueryUi.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
  (document.head || document.documentElement).appendChild(sJqueryUi);
  sJqueryUi.onload = function () {
    sJqueryUi.parentNode.removeChild(sJqueryUi);

    const cssCsgocom = document.createElement('link');
    cssCsgocom.href = chrome.runtime.getURL('js/siteExt/csgocom.css');
    cssCsgocom.rel = 'stylesheet';
    cssCsgocom.type = 'text/css';
    (document.head || document.documentElement).prepend(cssCsgocom);

    const sCsgocomBundle = document.createElement('script');
    sCsgocomBundle.src = chrome.runtime.getURL('js/siteExt/csgocom.bundle.js');
    (document.head || document.documentElement).appendChild(sCsgocomBundle);
    sCsgocomBundle.onload = function () {
      sCsgocomBundle.parentNode.removeChild(sCsgocomBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
