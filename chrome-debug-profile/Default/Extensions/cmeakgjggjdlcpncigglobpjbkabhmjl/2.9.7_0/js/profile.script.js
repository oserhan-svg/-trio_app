function ShowTradeOffer(tradeOfferID, rgParams) {
  var strParams = '';
  if (rgParams) strParams = '?' + $J.param(rgParams);

  var strKey = tradeOfferID == 'new' ? 'NewTradeOffer' + rgParams['partner'] : 'TradeOffer' + tradeOfferID;

  var winHeight = 1120;
  if (Steam.BIsUserInSteamClient() && Steam.GetClientPackageVersion() < 1407800248) {
    // workaround for client break when the popup window is too tall for the screen.  Try and pick a height that will fit here.
    var nClientChromePX = 92;
    if (window.screen.availHeight && window.screen.availHeight - nClientChromePX < winHeight)
      winHeight = window.screen.availHeight - nClientChromePX;
  }

  var winOffer = window.open(
    'https://steamcommunity.com/tradeoffer/' + tradeOfferID + '/' + strParams,
    strKey,
    'height=' + winHeight + ',width=1328,resize=yes,scrollbars=yes'
  );

  winOffer.focus();
}

const linkInterval = setInterval(() => {
  const $icons = $J('.sih_profile_link .sih_icons');

  if ($icons) {
    clearInterval(linkInterval);

    $icons.tooltip({
      position: { my: 'center bottom', at: 'center top' },
      tooltipClass: 'name-tooltip item-hover-name-tooltip',
    });

    $icons.click(function () {
      $J(this).blur();
    });
  }
}, 1000);

$J(function () {
  const urlPattern = /^https?:\/\/steamcommunity\.com\/(id|profiles)\/[^\/]+\/?$/;
  const cleanUrl = window.location.origin + window.location.pathname;

  if (urlPattern.test(cleanUrl)) {
    if (window.show_profile_modifier_btn) SIH?.initProfileModifier();

    if (window.show_permalink) SIH?.RenderInspectLink();

    if (typeof g_bViewingOwnProfile !== 'undefined' && g_bViewingOwnProfile) {
      SIH?.RenderDeleteAllCommentsBtn();
    } else if (typeof g_bViewingOwnProfile !== 'undefined' && !g_bViewingOwnProfile) {
      SIH?.RenderInteractionHistory();
    }

    if (window.show_faceit_stats_btn) SIH?.RenderFaceitSummaryBtn();

    SIH?.RenderSihRepInfo();
  }
});
