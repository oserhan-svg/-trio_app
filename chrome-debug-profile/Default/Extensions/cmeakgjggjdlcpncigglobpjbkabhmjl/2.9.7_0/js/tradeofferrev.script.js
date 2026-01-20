var itemRegExp = /BuildHover.*;/i;

var _tradesTimers = {};
var _openedWins = {};
SIH?.panelMode?.loadHtml();

const BuildHoverMaster = BuildHover;
BuildHover = function (prefix, item, owner) {
  BuildHoverMaster(prefix, item, owner);

  const { appid, classid, instanceid } = item;

  const $items =
    instanceid && instanceid !== '0'
      ? $J(`[data-economy-item="classinfo/${appid}/${classid}/${instanceid}"]`)
      : $J(`[data-economy-item="classinfo/${appid}/${classid}"]`);

  $items.each((index, element) => {
    if (!element.rgItem) {
      element.rgItem = item;
    }
  });
};

if (IS_ENABLED_SIH) {
  function ShowFriendSelect(title, fnOnSelect) {
    var Modal = ShowAlertDialog(
      title,
      '<div class="group_invite_throbber"><img src="https://community.akamai.steamstatic.com/public/images/login/throbber.gif"></div>',
      'Cancel'
    );
    var $ListElement = $J('<div/>', { class: 'player_list_ctn' });
    var $Buttons = Modal.GetContent().find('.newmodal_buttons').detach();

    Modal.GetContent().css('min-width', 268);

    var rgParams = { type: 'friends' };

    $J.get('https://steamcommunity.com/actions/PlayerList/', rgParams, function (html) {
      $ListElement.html(html);

      $ListElement.find('a').remove();
      $ListElement.find('[data-miniprofile]').each(function () {
        var $El = $J(this);

        $El.click(function () {
          Modal.Dismiss();
          fnOnSelect($El.data('miniprofile'));
          SIH?.latestFriends?.SaveLatestFriend($El);
        });
      });

      var $Content = Modal.GetContent().find('.newmodal_content');
      $Content.text(''); // erase the throbber
      $Content.append($ListElement);
      $Content.append($Buttons);

      SIH?.latestFriends?.RenderLatestSelectedFriends();

      Modal.AdjustSizing();
    });
  }

  if (open_trade_in_new_tab) {
    ShowTradeOffer = function (tradeOfferID, rgParams) {
      let strParams = '';
      if (rgParams) strParams = '?' + $J.param(rgParams);

      const strURL = 'https://steamcommunity.com/tradeoffer/' + tradeOfferID + '/' + strParams;

      window.open(strURL, '_blank').focus();
    };
  }
}

$J(function () {
  if (IS_ENABLED_SIH) {
    var warningMsg = $J(
      '<div class="warning_message text text_tiny" style="color: red; z-index: 0">Warning! This is an empty trade offer, you will not receive anything after accepted.<br /> <a href="https://support.steampowered.com/kb_article.php?ref=2178-QGJV-0708#whatoffer" target="_blank">Steam wallet funds can not be included in trade, or trade offer.</a></div>'
    );
    warningMsg.click(function (e) {
      e.stopPropagation();
    });
    var emptyTradeOffers = $J('.tradeoffer_items.primary .tradeoffer_item_list:not(:has(.trade_item ))');
    emptyTradeOffers.append(warningMsg);
    emptyTradeOffers.parents('.tradeoffer_items_ctn').find('.link_overlay').css('top', '110px');
  }

  $J(function () {
    $J(window).on('message', function (event) {
      var origin = event.originalEvent.origin;
      var data = event.originalEvent.data;
      if (
        origin &&
        data &&
        ('http://steamcommunity.com/'.indexOf(origin) == 0 || 'https://steamcommunity.com/'.indexOf(origin) == 0)
      ) {
        if (data.type == 'accepted' || (data.type == 'await_confirm' && _openedWins[data.tradeofferid])) {
          _openedWins[data.tradeofferid].close();
        }
      }
    });
  });

  if (IS_ENABLED_SIH) {
    const data = SIH?.common?.GetDataFromLocalStorage();
    if (data && data.mode && data.mode === 'lite') {
      SIH?.common?.sendTradeofferTxtToBackground();
      SIH?.filter?.load();
      SIH?.tradeofferLite?.load();
      SIH?.itemsRule?.load();
      SIH?.items?.load();
      SIH?.footer?.load();
      SIH?.tradeSummary?.RenderTradeOfferSummary();
      SIH?.sihRepPanel?.RenderSihRepPanel();
      SIH?.common?.removeDeclinedOfferFromSihWindow();
      SIH?.common?.sendTradeLinkToBackground();
      SIH?.sihRepReviewBtn?.RenderSihRepReviewBtn();
    } else {
      SIH?.common?.sendTradeofferTxtToBackground();
      SIH?.filter?.load();
      SIH?.tradeoffer?.load().then(() => {
        SIH?.tradeSummary?.RenderTradeOfferSummary();
        SIH?.sihRepPanel?.RenderSihRepPanel();
      });
      SIH?.items?.load();
      SIH?.lots?.load();
      SIH?.itemsRule?.load();
      SIH?.footer?.load();
      SIH?.common?.removeDeclinedOfferFromSihWindow();
      SIH?.common?.sendTradeLinkToBackground();
      SIH?.sihRepReviewBtn?.RenderSihRepReviewBtn();
    }
  }
});

var regRpLink = /javascript:ReportTradeScam\( '(\d+)',/;
