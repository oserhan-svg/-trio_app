const sJquery = document.createElement('script');
sJquery.src = chrome.runtime.getURL('js/jquery/jquery-1.10.2.min.js');
(document.head || document.documentElement).appendChild(sJquery);
sJquery.onload = function () {
  const sJqueryUi = document.createElement('script');
  sJqueryUi.src = chrome.runtime.getURL('js/jquery/jquery-ui.min.js');
  (document.head || document.documentElement).appendChild(sJqueryUi);
  sJqueryUi.onload = async function () {
    sJqueryUi.parentNode.removeChild(sJqueryUi);

    const cssCsmoney = document.createElement('link');
    cssCsmoney.href = chrome.runtime.getURL('js/siteExt/csmoney.css');
    cssCsmoney.rel = 'stylesheet';
    cssCsmoney.type = 'text/css';
    (document.head || document.documentElement).prepend(cssCsmoney);

    const sCsmoneyBundle = document.createElement('script');
    sCsmoneyBundle.src = chrome.runtime.getURL(`js/siteExt/csmoney.bundle.js`);
    (document.head || document.documentElement).appendChild(sCsmoneyBundle);
    sCsmoneyBundle.onload = function () {
      sCsmoneyBundle.parentNode.removeChild(sCsmoneyBundle);
    };
  };

  sJquery.parentNode.removeChild(sJquery);
};
