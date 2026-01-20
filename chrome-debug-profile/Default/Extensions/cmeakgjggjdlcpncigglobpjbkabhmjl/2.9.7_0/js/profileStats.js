const cssProfileStatsPage = document.createElement('link');
cssProfileStatsPage.href = chrome.runtime.getURL('js/siteExt/profileStatsPage.css');
cssProfileStatsPage.rel = 'stylesheet';
cssProfileStatsPage.type = 'text/css';
(document.head || document.documentElement).prepend(cssProfileStatsPage);

const sChartjs = document.createElement('script');
sChartjs.src = chrome.runtime.getURL('js/chartJS/chart.umd.min.js');
(document.head || document.documentElement).appendChild(sChartjs);
sChartjs.onload = function () {
  const sChartZoom = document.createElement('script');
  sChartZoom.src = chrome.runtime.getURL('js/chartJS/chartjs-plugin-zoom.min.js');
  (document.head || document.documentElement).appendChild(sChartZoom);
  sChartZoom.onload = function () {
    const sProfileStatsPageBundle = document.createElement('script');
    sProfileStatsPageBundle.src = chrome.runtime.getURL('js/siteExt/profileStatsPage.bundle.js');
    (document.head || document.documentElement).appendChild(sProfileStatsPageBundle);
    sProfileStatsPageBundle.onload = function () {
      sProfileStatsPageBundle.parentNode.removeChild(sProfileStatsPageBundle);
    };
    sChartZoom.parentNode.removeChild(sChartZoom);
  };

  sChartjs.parentNode.removeChild(sChartjs);
};
