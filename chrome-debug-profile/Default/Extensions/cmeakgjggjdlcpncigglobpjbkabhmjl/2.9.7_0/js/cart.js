const cssCartPage = document.createElement('link');
cssCartPage.href = chrome.runtime.getURL('js/siteExt/cartPage.css');
cssCartPage.rel = 'stylesheet';
cssCartPage.type = 'text/css';
(document.head || document.documentElement).prepend(cssCartPage);

const sCartBundle = document.createElement('script');
sCartBundle.src = chrome.runtime.getURL('js/siteExt/cartPage.bundle.js');
(document.head || document.documentElement).appendChild(sCartBundle);
sCartBundle.onload = function () {
  const sCart = document.createElement('script');
  sCart.src = chrome.runtime.getURL('js/cart.script.js');
  (document.head || document.documentElement).appendChild(sCart);
  sCart.onload = function () {
    sCart.parentNode.removeChild(sCart);
  };

  sCartBundle.parentNode.removeChild(sCartBundle);
};
