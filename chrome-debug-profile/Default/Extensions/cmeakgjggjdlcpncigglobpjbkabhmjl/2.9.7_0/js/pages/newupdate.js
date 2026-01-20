$(function () {
  $('.version').html(chrome.runtime.getManifest().version);
  $('#lnk_view').click(function (e) {
    e.preventDefault();
    chrome.storage.local.set(
      {
        latestver: chrome.runtime.getManifest().version,
      },
      function () {}
    );
    // chrome.action.setPopup({
    //     popup: "html/tradeoffers.html"
    // });
    chrome.action.setBadgeText({ text: '' });
    window.open('https://steamcommunity.com/groups/SteamInventoryHelper#announcements', '_blank');
  });
  $('#lnk_skip').click(function (e) {
    e.preventDefault();
    chrome.storage.local.set(
      {
        latestver: chrome.runtime.getManifest().version,
      },
      function () {}
    );
    chrome.action.setBadgeText({ text: '' });
    location.href = 'tradeoffers.html';
  });
});
