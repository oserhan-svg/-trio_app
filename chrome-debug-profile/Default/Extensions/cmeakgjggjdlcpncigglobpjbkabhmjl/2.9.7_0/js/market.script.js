/* global CreateMarketActionButton, $J, MergeWithAssetArray, bookmarkeditems */
var startPage = 0;
const assetList = new Map();

var $ACTIVE_LISTING_ROWS = null;

$J('#myMarketTabs').append(`
    <div id="switchPanel">
        <span style="margin-right: 10px;">SIH - Steam Inventory Helper</span>
        <label class="switch">
            <input id="switcher" type="checkbox" ${IS_ENABLED_SIH ? 'checked' : ''}>
            <span class="slider round"></span>
        </label>
    </div>
`);
$J('#switchPanel #switcher').change((e) => {
  const { currentTarget } = e;

  chrome.runtime.sendMessage(
    SIHID,
    { type: 'BACKGROUND_SET_SYNC_STORAGE', data: { key: 'enabledSih_marketPage', value: currentTarget.checked } },
    () => {
      window.location.reload();
    }
  );
});

var orgLoadMarketHistory = null;
var orgRefreshMyMarketListings = null;
var removeLinkExp = /javascript:.*\('mylisting', '(\d+)', (\d+), '(\d+)', '(\d+)'\)/;
var FraudAlert = function () {
  $J('#sellListingRows .market_listing_row.market_recent_listing_row[id]').each(function () {
    var $row = $J(this);
    var idListing = $J(this).attr('id').replace('listing_sell_new_', '');
    var rgListing = g_rgListingInfo[idListing];
    var asset = null;
    if (rgListing) {
      asset = g_rgListingInfo[idListing].asset;
    } else {
      return;
    }
    var rgItem = g_rgAssets[asset.appid][asset.contextid][asset.id];

    if (rgItem.fraudwarnings && rgItem.fraudwarnings.length > 0) {
      const $nameEl = $J(this).find('.market_listing_item_name');
      $nameEl.text(`${$nameEl.text()} (warning)'`);
    }
    //if (rgListing['price'] > 0) {
    //    var quickBuyBt = $J('<a href="#" class="item_market_action_button item_market_action_button_green">' +
    //                '<span class="item_market_action_button_edge item_market_action_button_left"></span>' +
    //                '<span class="item_market_action_button_contents">' + SIHLang.quickbuy + '</span>' +
    //                '<span class="item_market_action_button_edge item_market_action_button_right"></span>' +
    //                '<span class="item_market_action_button_preload"></span></a>');
    //    quickBuyBt.click(function () {
    //        $J(this).hide();
    //        $row.find('.market_listing_buy_button').append('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
    //        var Subtotal = rgListing['converted_price'];
    //        var FeeAmount = rgListing['converted_fee'];
    //        var Total = rgListing['converted_price'] + rgListing['converted_fee'];
    //        var data = {
    //            sessionid: g_sessionID,
    //            currency: g_rgWalletInfo['wallet_currency'],
    //            subtotal: Subtotal,
    //            fee: FeeAmount,
    //            total: Total,
    //            quantity: 1
    //        }
    //        $J.ajax({
    //            url: 'https://steamcommunity.com/market/buylisting/' + idListing,
    //            type: 'POST',
    //            data: data,
    //            crossDomain: true,
    //            xhrFields: { withCredentials: true }
    //        }).done(function (data) {
    //            if ($row.is(':visible'))
    //                $row.find('.market_listing_buy_button').text('Success');
    //            else
    //                alert('Success');
    //        }).fail(function (jqxhr) {
    //            $row.find('.market_listing_buy_button img').remove();
    //            var data = $J.parseJSON(jqxhr.responseText);
    //            if (data && data.message) {
    //                $row.find('.market_listing_buy_button').html(data.message);
    //                //BuyItemDialog.DisplayError(data.message);
    //            }

    //        });
    //        return false;
    //    });
    //    AddItemHoverToElement(quickBuyBt[0], rgItem);
    //    $J(this).find('.market_listing_buy_button .item_market_action_button.item_market_action_button_green').remove();
    //    $J(this).find('.market_listing_buy_button').append(quickBuyBt);
    //}
  });
  //$J('.market_listing_action_buttons').css({ width: '200px' });
};

var SetPhaseColors = function () {
  if (!window.show_phase_color_listing) return;

  // Colorize "My sell listing"
  $J('#tabContentsMyActiveMarketListingsRows')
    .find('.market_recent_listing_row')
    .each(function () {
      const $row = $J(this);
      const removeButtonHref = $row.find('a.item_market_action_button_edit').attr('href') || '';

      if (!removeButtonHref) return;

      const matches = removeButtonHref.match(/\((.+)\)/);

      if (!matches || !matches.length || matches.length < 1) {
        return;
      }

      const [, , appId, contextId, itemId] = matches[1]
        .replace(/'/g, '')
        .split(',')
        .map((i) => i.trim());
      const rgItem = g_rgAssets[appId][contextId][itemId];

      if (!rgItem) return;

      window.InventoryItemRarity.colorizeItem(rgItem, null, true, {
        disableBorderColorization: true,
        onBackGroundColor: (
          (row) => (color) =>
            row.find('img.market_listing_item_img').css('background-color', `#${color}`)
        )($row),
      });
    });

  // Colorize "My listings awaiting confirmation"
  $J('.my_listing_section.market_content_block.market_home_listing_table:not(#tabContentsMyActiveMarketListingsTable)')
    .find('a.market_listing_item_name_link')
    .each(async function () {
      try {
        const $itemImg = $J(this).parent().parent().parent().find('img.market_listing_item_img');
        const imageSrc = $itemImg.attr('src');
        const phaseColor = window.InventoryItemRarity.getPhaseColorByImageUrl(imageSrc);

        if (phaseColor) {
          $itemImg.css('background-color', `#${phaseColor}`);
        }
      } catch (error) {
        console.log('Market: listing item info loading error', error);
      }
    });
};

const parseListings = function () {
  let totalSelling = 0;
  let totalRecieve = 0;
  $ACTIVE_LISTING_ROWS
    .find('.market_listing_price')
    .children('span')
    .each(function (rowId, price) {
      let isBuyOrder = false;
      var $price = $J(price);
      if ($price.hasClass('market_listing_inline_buyorder_qty')) {
        isBuyOrder = true;
        $price = $price.parent();
      }
      // var buyerPrice = isBuyOrder ? /[+-]?([0-9]*[.,])?[0-9]+/.exec($price.text().split('@')[1])[0] : $price.find('span:first').text();
      var buyerPrice = isBuyOrder ? $price.text().split('@')[1] : $price.find('span:first').text();
      var pays = getPriceAsInt(buyerPrice);
      if (!isNaN(pays)) totalSelling += pays;

      var yourPrice = isBuyOrder ? '0.00' : $price.find('span:last').text();
      var recieve = getPriceAsInt(yourPrice.trim().replace('(', '').replace(')', ''));
      if (!isNaN(recieve)) totalRecieve += recieve;
    });

  const totalSellingStr = totalSelling
    ? `<span class="sih-total-sell__selling text text_white fs-14" data-price="${totalSelling / 100}">${formatNumber(totalSelling / 100)}</span>`
    : '';
  const totalRecieveStr = totalRecieve
    ? `<span class="sih-total-sell__receive text text_grey-900 fs-12" data-price="${totalRecieve / 100}">(${formatNumber(totalRecieve / 100)})</span>`
    : '';

  const $totalColumn = $J(`
        <div class="sih-total-sell column justify-center" title="${SIHLang.market.tooltips.cost_all_items}">
            ${totalSellingStr}
            ${totalRecieveStr}
        </div>
  `);

  $totalColumn.tooltip({
    position: {
      my: 'left bottom',
      at: 'left top',
    },
    classes: {
      'ui-tooltip': 'sih-steam-market__tooltip',
    },
  });

  if (!$J('#totalRow0').find('.sih-total-sell').length) {
    $J('#totalRow0').find('.market_listing_right_cell.market_listing_edit_buttons').html($totalColumn);
  } else {
    $J('#totalRow0')
      .find('.sih-total-sell__selling')
      .attr('data-price', `${totalSelling / 100}`)
      .text(`${formatNumber(totalSelling / 100)}`);
    $J('#totalRow0')
      .find('.sih-total-sell__selling')
      .attr('data-price', `${totalRecieve / 100}`)
      .text(`(${formatNumber(totalRecieve / 100)})`);
  }

  SIH?.activeListings?.filterPanel?.RenderHeaderTotal();
};

var htmlListings = '';
const getOverallTotal = function (startCount) {
  return new Promise((resolve) => {
    const pageSize = 100;
    new Ajax.Request(`${window.location.protocol}//steamcommunity.com/market/mylistings`, {
      method: 'get',
      parameters: {
        start: startCount,
        count: pageSize,
      },
      onSuccess: function (transport) {
        if (transport.responseJSON) {
          SIH?.activeListings?.resubmitOrders?.SaveSellListing(transport?.responseJSON?.assets);

          const response = transport.responseJSON;
          const total = response.total_count;
          htmlListings += response.results_html;

          if (total > startCount + pageSize) {
            getOverallTotal(startCount + pageSize);
          } else {
            $ACTIVE_LISTING_ROWS = $J($J.parseHTML(`<div>${htmlListings}</div>`)).find(
              '#tabContentsMyActiveMarketListingsTable .market_listing_row[id^="mylisting_"]'
            );
            parseListings();
          }

          resolve();
        }
      },
      onFailure: function (transport) {
        console.error('Something went wrong', transport);
        resolve();
      },
    });
  });
};

var isReloading = false;
var ReloadListings = function () {
  if (isReloading) return;
  isReloading = true;
  $J('#tabContentsMyListings').html(
    '<div style="text-align: center; padding: 20px"><img src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working..."></div>'
  );
  $J.ajax({
    url: '/market/mylistings/',
    success: async function (res) {
      if (res.success && typeof res.num_active_listings != 'undefined') {
        clearCachePrices();
        MergeWithAssetArray(res.assets);
        $J('#tabContentsMyListings').html(res.results_html);
        $J('#my_market_activelistings_number').html(res.num_active_listings);
        eval(res.hovers);
        await UpdateTotalListings();
      }
    },
    error: function () {
      $J('#tabContentsMyListings').html('<div style="text-align: center; padding: 20px">Error</div>');
    },
    complete: function () {
      isReloading = false;

      SIH?.activeListings?.RenderHeaderTable();
      SIH?.activeListings?.filterPanel?.RenderMarketFilter();
    },
  });
};

var RemoveTotalAndFilter = function (isPaging = false) {
  isPaging ? $J('div[id="totalRow0"]').remove() : $J('div[id*="totalRow"]').remove();
  $J('.filter_ctn.inventory_filters').parent().remove();
  $J('.market_sort_arrow').hide();
};

var UpdateTotalListings = function (isPaging = false) {
  return new Promise((resolve) => {
    if (typeof window.totalrow === 'undefined' || window.totalrow) {
      let $listings = $J('#myListings .market_content_block.my_listing_section.market_home_listing_table');

      if (isPaging) {
        $listings = $J('#myListings [data-table-id="sell_listings"]');
      }

      $listings.each(function (idx, listingsTable) {
        let totalSelling = 0;
        let totalRecieve = 0;
        const $listingsTable = $J(listingsTable);
        $listingsTable
          .find('.market_listing_price')
          .children('span')
          .each(function (rowId, price) {
            let isBuyOrder = false;
            let $price = $J(price);
            if ($price.hasClass('market_listing_inline_buyorder_qty')) {
              isBuyOrder = true;
              $price = $price.parent();
            }
            // var buyerPrice = isBuyOrder ? /[+-]?([0-9]*[.,])?[0-9]+/.exec($price.text().split('@')[1])[0] : $price.find('span:first').text();
            let buyerPrice;
            let qty = 1;
            if (isBuyOrder) {
              [qty, buyerPrice] = $price.text().split('@');
            } else {
              buyerPrice = $price.find('span:first').text();
            }
            const pays = getPriceAsInt(buyerPrice);
            if (!isNaN(pays)) totalSelling += qty * pays;

            const yourPrice = isBuyOrder ? '0.00' : $price.find('span:last').text();
            const recieve = getPriceAsInt(yourPrice.trim().replace('(', '').replace(')', ''));
            if (!isNaN(recieve)) totalRecieve += recieve;
          });

        const $priceDiv = $J(`
        <div id="totalRow${idx}" class="sih-global market_listing_row market_recent_listing_row">
            <span class="market_listing_item_name_block">
                ${SIHLang.market.total}
            </span>
            <div class="market_listing_right_cell market_listing_my_price">
                <div class="market_table_value">
                  <div class="market_listing_price" title="${SIHLang.market.tooltips.cost_page_items}">
                    <div class="column">
                        ${totalSelling ? `<span class="sih-market-total__seller" data-price="${totalSelling / 100}">${formatNumber(totalSelling / 100)}</span>` : ''}
                        ${totalRecieve ? `<span class="sih-market-total__receive" data-price="${totalRecieve / 100}" style="color: #979797; font-size: 12px" >(${formatNumber(totalRecieve / 100)})</span>` : ''}
                    </div>
                  </div>
                </div>
            </div>
            <div class="sih-header-total market_listing_right_cell market_listing_edit_buttons"></div>
        </div>
      `);

        $priceDiv.find('.market_listing_price').tooltip({
          position: {
            my: 'left bottom',
            at: 'left top',
          },
          classes: {
            'ui-tooltip': 'sih-steam-market__tooltip',
          },
        });

        if (!$listingsTable.find(`#totalRow${idx}`).length) {
          $listingsTable.find('.market_listing_table_header').after($priceDiv);
        } else {
          $listingsTable
            .find('.sih-market-total__seller')
            .attr('data-price', `${totalSelling / 100}`)
            .text(`${formatNumber(totalSelling / 100)}`);
          $listingsTable
            .find('.sih-market-total__receive')
            .attr('data-price', `${totalRecieve / 100}`)
            .text(`(${formatNumber(totalRecieve / 100)})`);
        }
      });

      // if (window.overallsum) {
      if ($ACTIVE_LISTING_ROWS === null) {
        //Clear SELL_LISTING in chrome.storage.local
        chrome.runtime.sendMessage(
          SIHID,
          { type: 'BACKGROUND_SET_LOCAL_STORAGE', data: { key: 'SELL_LISTING', value: [] } },
          () => {
            getOverallTotal(0).then(() => resolve());
          }
        );
        // }
        // else {
        //   parseListings();
        //   resolve();
        // }
      } else {
        parseListings();
        resolve();
      }
    } else resolve();
  });
};

const rowIdsArr = [];

var bookmarksLoaded = false;
var ShowBookmarks = function () {
  bookmarksLoaded = true;
  if (bookmarkeditems) {
    $J('#tabContentsMyBookmarks').html(
      '<div class="my_listing_section market_home_listing_table">' +
        '<div class="market_listing_table_header">' +
        '<span class="market_listing_right_cell market_listing_edit_buttons"></span>' +
        '<span class="market_listing_right_cell market_listing_my_price market_sortable_column" style="display: block;">PRICE<span class="market_sort_arrow" style="display:none"></span></span>' +
        '<span class="market_listing_right_cell market_listing_listed_date market_sortable_column">VOLUME<span class="market_sort_arrow" style="display:none"></span></span>' +
        '<span class="market_sortable_column" style="display: block;"><span class="market_listing_header_namespacer"></span>NAME<span class="market_sort_arrow" style="display:none"></span></span>' +
        '</div></div>'
    );

    if (bookmarkscategories) {
      var divCats = $J(`
                <div class="bookmark-categories">
                    <a href="#" class="category active" data-cat="all">${SIHLang.market.all}</a>
                    <a href="#" class="category" data-cat="">${SIHLang.market.general}</a>
                </div>`);
      for (var i in bookmarkscategories) {
        var cat = bookmarkscategories[i];
        divCats.append('<a href="#" class="category" data-cat="' + i + '">' + cat + '</a>');
      }

      divCats.prependTo('#tabContentsMyBookmarks');
      divCats.find('a.category').click(function (e) {
        $J('.category.active').removeClass('active');
        $J(this).addClass('active');
        var cat = $J(this).data('cat');
        if (cat === 'all') {
          $J('#tabContentsMyBookmarks .market_listing_row').show();
        } else {
          $J('#tabContentsMyBookmarks .market_listing_row').hide();
          $J('#tabContentsMyBookmarks .market_listing_row[data-cat="' + cat + '"]').show();
        }
        e.preventDefault();
      });
    }

    $J.each(bookmarkeditems, function (idex, item) {
      if (!item || !item.img || !item.hashmarket) return true;

      var divItem =
        '<div class="market_listing_row market_recent_listing_row" data-cat="' +
        (item.cat || '') +
        '" data-hash="' +
        item.hashmarket +
        '" data-appid="' +
        item.appid +
        '">' +
        '<img src="' +
        item.img.replace('360fx360f', '38fx38f') +
        '" style="border-color: ' +
        item.color +
        ';" class="market_listing_item_img" alt="">' +
        '<div class="market_listing_right_cell market_listing_edit_buttons">' +
        '<div class="market_listing_cancel_button">' +
        '<a href="javascript:void(0)" data-hash="' +
        item.hashmarket +
        '" class="item_market_action_button item_market_action_button_edit nodisable remove-bookmark">' +
        '<span class="item_market_action_button_edge item_market_action_button_left"></span>' +
        '<span class="item_market_action_button_contents">' +
        SIHLang.market.remove +
        '</span>' +
        '<span class="item_market_action_button_edge item_market_action_button_right"></span>' +
        '<span class="item_market_action_button_preload"></span>' +
        '</a>' +
        '</div>' +
        '</div>' +
        '<div class="market_listing_right_cell market_listing_my_price">' +
        '<span class="market_table_value">' +
        '<span class="market_listing_price">' +
        '<span style="display: inline-block">' +
        '<span title="This is the lowest price." class="bookmark-price">loading</span><br>' +
        '<span title="This is the seller price." class="bookmark-seller-price" style="color: #979797"></span>' +
        '</span>' +
        '</span>' +
        '</span>' +
        '</div>' +
        '<div class="market_listing_right_cell market_listing_my_price">' +
        '<span class="market_table_value">' +
        '<span class="market_listing_price">' +
        '<span style="display: inline-block">' +
        '<span class="bookmark-volume" title="Number of this item sold in the last 24 hours">loading</span><br />' +
        '<span title="This is the median price." class="bookmark-median-price" style="color: #979797"></span>' +
        '</span>' +
        '</span>' +
        '</span>' +
        '</div>' +
        '<div class="market_listing_item_name_block">' +
        '<span class="market_listing_item_name" style="color: ' +
        item.color +
        ';"><a class="market_listing_item_name_link" href="' +
        item.url +
        '">' +
        item.name +
        '</a></span><br>' +
        '<span class="market_listing_game_name">' +
        item.gamename +
        '</span>' +
        '</div>' +
        '<div style="clear: both"></div>' +
        '</div>';

      var $div = $J(divItem);
      if (item.cat) {
        $div.data('cat', item.cat);
      }
      $J('#tabContentsMyBookmarks .my_listing_section').append($div);

      var itemLink =
        '//steamcommunity.com/market/priceoverview/?appid=' +
        item.appid +
        '&country=' +
        countryCode +
        '&currency=' +
        currencyId +
        '&market_hash_name=' +
        decodeURIComponent(item.hashmarket.substring(item.hashmarket.indexOf('/') + 1));

      PriceQueue.GetPrice({
        method: 'GET',
        url: itemLink,
        innerDiv: $div,
        success: function (response) {
          if (response.success) {
            $div.find('.bookmark-price').html(response.lowest_price);
            $div.find('.bookmark-median-price').html(response.median_price);

            var inputValue = getPriceAsInt(response.lowest_price);
            var nAmount = inputValue;
            var priceWithoutFee = null;
            if (inputValue > 0 && nAmount == parseInt(nAmount)) {
              var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
              nAmount = nAmount - feeInfo.fees;
              priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
            }

            $div.find('.bookmark-seller-price').text(`(${priceWithoutFee})`);
            var volume = response.volume ? response.volume : '';
            $div.find('.bookmark-volume').html(volume);
          }
        },
        error: function () {},
      });
    });
  }
  // if (bookmarkTimer) window.clearTimeout(bookmarkTimer);
  // bookmarkTimer = window.setTimeout(UpdateBookmarksPrices, 10000);
};

var bookmarkTimer = null;
var UpdateBookmarksPrices = function () {
  if (bookmarkTimer) window.clearTimeout(bookmarkTimer);

  var date = new Date();
  var strTime = date.toLocaleTimeString();
  $J(
    '#tabContentsMyBookmarks .my_listing_section .market_listing_table_header .market_listing_right_cell.market_listing_edit_buttons'
  ).text(strTime);
  $J('#tabContentsMyBookmarks .my_listing_section .market_listing_row.market_recent_listing_row').each(function (idx) {
    var $div = $J(this);
    var data = $div.data();
    var itemLink =
      '//steamcommunity.com/market/priceoverview/?appid=' +
      data.appid +
      '&country=' +
      countryCode +
      '&currency=' +
      currencyId +
      '&market_hash_name=' +
      decodeURIComponent(data.hash.substring(data.hash.indexOf('/') + 1));

    PriceQueue.GetPrice({
      method: 'GET',
      url: itemLink,
      innerDiv: $div,
      success: function (response) {
        if (response.success) {
          var priceSpan = $div.find('.bookmark-price');
          var oldPrice = priceSpan.text();
          priceSpan.text(response.lowest_price);
          $div.find('.bookmark-median-price').html(response.median_price);
          if (oldPrice != priceSpan.text()) {
            BlinkElement(priceSpan);
          }

          var inputValue = getPriceAsInt(response.lowest_price);
          var nAmount = inputValue;
          var priceWithoutFee = null;
          if (inputValue > 0 && nAmount == parseInt(nAmount)) {
            var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nAmount = nAmount - feeInfo.fees;
            priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
          }

          $div.find('.bookmark-seller-price').text(`(${priceWithoutFee})`);
          var volume = response.volume ? response.volume : '';
          $div.find('.bookmark-volume').html(volume);
        }
      },
      error: function () {},
    });
  });

  if ($J('#tabMyBookmarks').is('.market_tab_well_tab_active')) {
    // If all price of bookmark was loaded clean cache and update prices
    if (Object.keys(bookmarkeditems).length == Object.keys(PriceQueue._cache).length) {
      PriceQueue._cache = {};
    }
    bookmarkTimer = window.setTimeout(UpdateBookmarksPrices, 10000);
  }
};

var oder = -1;
var BlinkElement = function (el) {
  $J(el).css({ backgroundColor: 'rgba(255,0,0,1)' }).animate({ backgroundColor: 'rgba(255,0,0,0)' }, 1000);
};

var GetActualItemPrice = function (self) {
  const $itemRowBlock = $J(self).parent().parent().parent();
  const name = $itemRowBlock.find('.market_listing_item_name').text();

  const assetItemObj = getAssetItemFromList($itemRowBlock);

  if (assetItemObj && assetItemObj[name].market_hash_name && assetItemObj[name].appid) {
    $J(self).text('...');
    $J.ajax({
      url: '//steamcommunity.com/market/priceoverview/',
      method: 'get',
      data: {
        currency: currencyId,
        appid: assetItemObj[name].appid,
        market_hash_name: assetItemObj[name].market_hash_name,
      },
    })
      .done(function (res) {
        $J(self).text(res.lowest_price);
      })
      .fail(function () {
        $J(self).text('Check price');
      });
  }
};

var RenderPriceButtons = function () {
  var $tableRows = $J('#tabContentsMyMarketHistoryRows .market_listing_row');
  $J.each($tableRows, function (i, element) {
    const $itemRowBlock = $J(element);
    const name = $itemRowBlock.find('.market_listing_item_name').text();
    const price = $J(element).find('.market_listing_price').text().trim();

    const assetItemObj = getAssetItemFromList($itemRowBlock);

    if (
      price &&
      assetItemObj[name] &&
      assetItemObj[name].market_hash_name &&
      assetItemObj[name].appid &&
      !$itemRowBlock.find('.price-label').length
    ) {
      var html =
        '<span class="price-label"><span class="label" onclick="GetActualItemPrice(this); return false;">Check price</span></span>';
      $J(element).find('.market_listing_their_price').append(html);
    }
  });
};

const getListingSectionType = function (section) {
  if (section.find('#totalRow0').length) {
    return 'sell_listings';
  }
  if (section.find('div[id^="mybuyorder_"]').length) {
    return 'buy_orders';
  }
  if (section.find('#totalRow1').length) {
    return 'await_listings';
  }
};

var FindLoadedPriceForRow = function (tableId) {
  if (tableId === 'sell_listings') {
    const listings = $J('#tabContentsMyActiveMarketListingsRows .market_listing_row[id^="mylisting"]');
    let loadFlag = false;
    $J(listings).each((index, element) => {
      const currentRowId = $J(element)
        .attr('id')
        .replace(/mylisting_/g, '')
        .trim();
      $J(rowIdsArr).each((idx, id) => {
        if (id === currentRowId) {
          loadFlag = true;
        }
      });
    });
    if (loadFlag) {
      setTimeout(() => {
        SIH?.activeListings?.filterPanel?.autoLoadPrices?.FetchAllItemsPrices(tableId);
      }, 500);
    }
  }
};

var statMarketPage =
  statMarketPage ||
  (() => {
    const register = () => {
      // const timeout = setTimeout(() => {
      //   clearTimeout(timeout)
      //
      //   const data = {
      //     adId: 5,
      //     partner: 'sih',
      //     action: 'show',
      //     adLocation: 'market-page'
      //   };
      //
      //   chrome.runtime.sendMessage(SIHID, {type: "AD_HIT_STORE", data});
      // }, 500)
    };

    return { register };
  })();

var marketHistoryButton =
  marketHistoryButton ||
  (() => {
    const register = () => {
      // const timeout = setTimeout(() => {
      //   clearTimeout(timeout)
      //
      //   const data = {
      //     adId: 6,
      //     partner: 'sih',
      //     action: 'click',
      //     adLocation: 'market-history-button'
      //   };
      //
      //   chrome.runtime.sendMessage(SIHID, {type: "AD_HIT_STORE", data});
      // }, 500)
    };

    return { register };
  })();

var ImprovedMyMarketHistoryNav =
  ImprovedMyMarketHistoryNav ||
  (() => {
    const renderControls = () => {
      const controls = $J('#tabContentsMyMarketHistory_ctn');

      controls.find('#pageinput_index').remove();
      controls.find('#pagebtn_page').remove();

      controls.find('#tabContentsMyMarketHistory_controls')
        .after(`<div class="market_paging_controls" style="margin-right: 24px;">
            <input id="pageinput_index" min="1" value="${(g_oMyHistory.m_iCurrentPage || 0) + 1}" max="${g_oMyHistory.m_cMaxPages || 1}" class="selectableText filter_search_box nav-page-index" type="number" style="height: 16px;width: 30px;margin-top: -1px;"></input>
            <a id="pagebtn_page" class="pagebtn" style="margin-left: 3px;">Go</a>
            </div>
        `);

      const pageButton = controls.find('#pagebtn_page');
      const pageIndexInput = controls.find('#pageinput_index');

      return {
        controls,
        pageButton,
        pageIndexInput,
      };
    };

    const addEventListeners = ({ pageButton, pageIndexInput }) => {
      pageButton.click(() => {
        const page = pageIndexInput.val() - 1;
        g_oMyHistory.GoToPage(page);
      });
    };

    const init = () => {
      try {
        const $controls = renderControls();
        addEventListeners($controls);
      } catch (error) {
        console.error(error);
      }
    };

    return {
      init,
    };
  })();

function linkInventory() {
  $J(`.market_listing_row.market_recent_listing_row[id*=history_row]`).each((ind, elm) => {
    const $itemRowBlock = $J(elm);
    const name = $itemRowBlock.find('.market_listing_item_name').text();

    const assetItemObj = getAssetItemFromList($itemRowBlock);

    const link = $itemRowBlock.find('.market_listing_item_name').find('a');

    if (assetItemObj && assetItemObj[name].market_hash_name && assetItemObj[name].appid && link.length === 0) {
      const marketLink = `${window.location.protocol}//steamcommunity.com/market/listings/${assetItemObj[name].appid}/${encodeURIComponent(assetItemObj[name].market_hash_name)}`;

      $itemRowBlock
        .find('.market_listing_item_name')
        .html(DOMPurify.sanitize(`<a href="${marketLink}" target="_blank">${name}</a>`));
    }
  });
}

function marketMyHistoryRequestOnSuccessAfter(url, data, transport) {
  const assets = transport.responseJSON.assets;
  for (const appId in assets) {
    const items = assets[appId][1] || assets[appId][2] || assets[appId][6];

    for (const key in items) {
      // icon_url key is need for exterior weapons
      const assetItemObj = assetList.get(items[key].icon_url);
      const shortName = items[key].name;

      //Get listing id from inspect link
      const assetListingId =
        +items[key].appid === 730 && items[key].actions ? items[key].actions[0].link.match(/%20M(.+)A/)[1] : null;

      // if () {
      const obj = Object.assign(assetItemObj && !assetItemObj[shortName] ? assetItemObj : {}, {
        [items[key].name]: {
          appid: items[key].appid,
          market_hash_name: items[key].market_hash_name,
        },
      });

      assetList.set(assetListingId ? assetListingId : items[key].icon_url, obj);
      // }
      // else {
      //   const obj = Object.assign({},  { [items[key].name] : {appid: items[key].appid, market_hash_name : items[key].market_hash_name}})
      //   assetList.set(items[key].icon_url, obj);
      // }
    }
  }

  RenderPriceButtons();
  linkInventory();
}

if (IS_ENABLED_SIH) {
  $J(function () {
    SIH?.RefactorAdvancedSearchDialog();
    SIH?.sihMarketTab?.LoadSihMarketTab();
    SIH?.marketHistory?.filter?.selectTabMarket();
    SIH?.RenderMarketSideBanner();

    $J('#tabMyMarketHistory').click(function () {
      marketHistoryButton.register();
    });

    var btReload =
      $J(`<a class="btnControl" href="javascript:void(0)" accesskey="r" title="${SIHLang.market.reloadlistings}">
          <span class="icon-reload"></span>
        </a>`);
    btReload.click(function () {
      // ReloadListings();
      htmlListings = '';
      $ACTIVE_LISTING_ROWS = null;
      RefreshMyMarketListings();
      // buyProgressBarWidth = 0;
    });
    $J('.pick_and_sell_button .item_market_action_button_contents').css({ minWidth: '80px' });
    if (
      $J('#tabContentsMyListings #tabContentsMyActiveMarketListingsTable:not(:has(.market_listing_table_message))')
        .length
    ) {
      $J('.pick_and_sell_button').prepend(btReload);
    }

    jQuery.expr[':'].Contains = jQuery.expr.createPseudo(function (arg) {
      return function (elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
      };
    });

    if (window.bookmarkeditems) {
      var bookmarkcount = 0;
      if (window.bookmarkeditems) {
        for (var i in window.bookmarkeditems) bookmarkcount++;
      }
      if (bookmarkcount) {
        var ftab = $J(
          '<a id="tabMyBookmarks" class="market_tab_well_tab market_tab_well_tab_inactive" href="#">' +
            '<span class="market_tab_well_tab_left"></span>' +
            '<span class="market_tab_well_tab_contents">' +
            SIHLang.market.mybookmarks +
            '<span class="my_market_header_count">(<span id="my_market_activelistings_number">' +
            bookmarkcount +
            '</span>)</span>' +
            '</span>' +
            '<span class="market_tab_well_tab_right"></span>' +
            '<span class="market_tab_well_tab_preload"></span>' +
            '</a>'
        );

        $J('#myMarketTabs .market_tab_well_tabs').append(ftab);

        $J('#myMarketTabs .market_tab_well_tabs')
          .contents()
          .filter(function () {
            return this.nodeType === 3 && this.nodeValue.trim() === '';
          })
          .remove();

        var fdiv = $J(
          '<div id="tabContentsMyBookmarks" class="my_listing_section market_content_block" style="display:none">' +
            '<div style="text-align: center"><img src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Loading"></div></div>'
        );
        $J('#tabContentsMyMarketHistory').after(fdiv);
        ftab.click(function (e) {
          $J('#tabContentsMyListings, #tabContentsMyMarketHistory').hide();
          $J('#tabContentsMyBookmarks').show();
          $J('#tabMyListings, #tabMyMarketHistory, #sih-tab-export-market-history')
            .removeClass('market_tab_well_tab_active')
            .addClass('market_tab_well_tab_inactive');
          $J('#tabMyBookmarks').removeClass('market_tab_well_tab_inactive').addClass('market_tab_well_tab_active');
          if (bookmarksLoaded) {
            UpdateBookmarksPrices();
          } else {
            ShowBookmarks();
          }
          e.preventDefault();
        });

        $J('#tabMyListings, #tabMyMarketHistory').click(function () {
          $J('#tabContentsMyBookmarks').hide();
          $J('#tabMyBookmarks').removeClass('market_tab_well_tab_active').addClass('market_tab_well_tab_inactive');
        });

        var sortByName = function (a, b) {
          var an = $J(a).find('.market_listing_item_name_link').text(),
            bn = $J(b).find('.market_listing_item_name_link').text();

          if (an > bn) {
            return 1 * oder;
          }
          if (an < bn) {
            return -1 * oder;
          }
          return 0;
        };

        var sortByPrice = function (a, b) {
          var an = getPriceAsInt($J(a).find('.bookmark-price').text()),
            bn = getPriceAsInt($J(b).find('.bookmark-price').text());

          if (an == bn) {
            (an = $J(a).find('.market_listing_item_name_link').text()),
              (bn = $J(b).find('.market_listing_item_name_link').text());
          }

          if (an > bn) {
            return 1 * oder;
          }
          if (an < bn) {
            return -1 * oder;
          }
          return 0;
        };

        var sortByVolume = function (a, b) {
          var an = parseInt(getPriceAsInt($J(a).find('.bookmark-volume').text())),
            bn = parseInt(getPriceAsInt($J(b).find('.bookmark-volume').text()));

          if (an == bn) {
            (an = $J(a).find('.market_listing_item_name_link').text()),
              (bn = $J(b).find('.market_listing_item_name_link').text());
          }

          if (an > bn) {
            return 1 * oder;
          }
          if (an < bn) {
            return -1 * oder;
          }
          return 0;
        };

        $J('#tabContentsMyBookmarks').on('click', '.market_sortable_column', function () {
          var $parent = $J(this);
          var sortFunc = sortByName;
          if ($J(this).text().startsWith('PRICE')) {
            sortFunc = sortByPrice;
          } else if ($J(this).text().startsWith('VOLUME')) {
            sortFunc = sortByVolume;
          }

          $J('#tabContentsMyBookmarks .market_sortable_column').find('.market_sort_arrow').hide();
          oder = 1;
          if ($parent.find('.market_sort_arrow').is(':contains("▲")')) {
            oder = -1;
            $parent.find('.market_sort_arrow').text('▼');
          } else {
            $parent.find('.market_sort_arrow').text('▲');
          }

          $parent.find('.market_sort_arrow').show();
          var $rows = $J('#tabContentsMyBookmarks').find('.market_home_listing_table'),
            $rowsli = $rows.children('.market_listing_row');

          $rowsli.sort(sortFunc);

          $rowsli.detach().appendTo($rows);
        });
      }
    }

    $J('.my_listing_section.market_home_listing_table .market_listing_table_header').each(function () {
      const $header = $J(this);
      if ($header.parent().has('div[id^="mylisting"]').length > 0) {
        $J(
          `<span class="market_listing_right_cell market_listing_minimum can_combine">${SIHLang.market.minimum}</span>`
        ).insertAfter($header.find('.market_listing_my_price'));
      } else {
        $header
          .find('.market_listing_buyorder_qty')
          .before(
            `<span class="market_listing_right_cell market_listing_maximum" style="display: block;">${SIHLang.market.maximum}<span class="market_sort_arrow" style="display:none"></span></span>`
          );
      }
      SIH?.activeListings?.AddSortableColumns($header);
    });
    if (LoadRecentListings) {
      LoadRecentListings = function (type, rows) {
        if (g_bBusyLoadingMore) {
          return;
        }

        var elRows = $(rows);

        elRows.update();

        g_bBusyLoadingMore = true;
        new Ajax.Request('//steamcommunity.com/market/recent', {
          method: 'get',
          parameters: {
            country: g_strCountryCode,
            language: g_strLanguage,
            currency: typeof g_rgWalletInfo != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1, //time: g_rgRecents[type]['time'],
            //listing: g_rgRecents[type]['listing']
          },
          onSuccess: function (transport) {
            if (transport.responseJSON) {
              var response = transport.responseJSON;

              if (response.assets.length != 0) {
                g_rgRecents[type]['time'] = response.last_time;
                g_rgRecents[type]['listing'] = response.last_listing;

                elRows.update(g_htmlSellListingsTableHeader + response.results_html);

                MergeWithAssetArray(response.assets);
                MergeWithListingInfoArray(response.listinginfo);
                MergeWithAppDataArray(response.app_data);
                eval(response.hovers);
              }
            }
          },
          onComplete: function () {
            g_bBusyLoadingMore = false;
            FraudAlert();
          },
        });
      };
    }

    // tabContentsMyListings
    // tabContentsMyActiveMarketListingsTable
    // tabContentsMyActiveMarketListingsRows
    // g_bBusyLoadingMyMarketListings
    // g_oMyListings
    // RefreshMyMarketListings
    orgRefreshMyMarketListings = RefreshMyMarketListings;
    RefreshMyMarketListings = function (bScrollIntoView) {
      if (g_bBusyLoadingMyMarketListings) {
        return;
      }

      g_bBusyLoadingMyMarketListings = true;
      var elMyMarketListings = $('tabContentsMyListings');
      new Ajax.Request('//steamcommunity.com/market/mylistings', {
        method: 'get',
        parameters: {
          count: g_nMySellListingsPageSize,
        },
        onSuccess: function (transport) {
          if (transport.responseJSON) {
            var response = transport.responseJSON;

            elMyMarketListings.innerHTML = response.results_html;
            $('my_market_activelistings_number').update(response.num_active_listings);

            MergeWithAssetArray(response.assets);
            eval(response.hovers);
            RemoveTotalAndFilter();
            $J('.my_listing_section.market_home_listing_table .market_listing_table_header').each(function () {
              const $header = $J(this);
              if ($header.parent().has('div[id^="mylisting"]').length > 0) {
                $J(
                  `<span class="market_listing_right_cell market_listing_minimum can_combine">${SIHLang.market.minimum}</span>`
                ).insertAfter($header.find('.market_listing_my_price'));
              } else {
                $header
                  .find('.market_listing_buyorder_qty')
                  .before(
                    `<span class="market_listing_right_cell market_listing_maximum" style="display: block;">${SIHLang.market.maximum}<span class="market_sort_arrow" style="display:none"></span></span>`
                  );
              }
              SIH?.activeListings?.AddSortableColumns($header);
            });

            if (response.total_count > response.pagesize) {
              g_oMyListings = new CAjaxPagingControls(
                {
                  query: '',
                  total_count: response.total_count,
                  pagesize: response.pagesize,
                  prefix: 'tabContentsMyActiveMarketListings',
                  class_prefix: 'market',
                },
                '//steamcommunity.com/market/mylistings/'
              );

              g_oMyListings.SetResponseHandler(async function (response) {
                MergeWithAssetArray(response.assets);

                chrome.runtime.sendMessage(SIHID, { type: 'BACKGROUND_STOP_RESELL_ITEMS' }, (response) => {});

                eval(response.hovers);
                FindLoadedPriceForRow('sell_listings');

                RemoveTotalAndFilter(true);

                await UpdateTotalListings(true);

                SIH?.activeListings?.RenderHeaderTable();
                SIH?.activeListings?.filterPanel?.RenderMarketFilter();

                SIH?.activeListings?.resubmitOrders?.resubmitButton?.LoadResubmitOrderButton('sell_listings');
                SIH?.activeListings?.listingRow?.RefactorListingRow();
              });

              g_nMySellListingsPageSize = response.pagesize;
              $J('#my_listing_pagesize_10').addClass('whiteLink').removeClass('disabled');
              $J('#my_listing_pagesize_30').addClass('whiteLink').removeClass('disabled');
              $J('#my_listing_pagesize_100').addClass('whiteLink').removeClass('disabled');
              $J('#my_listing_pagesize_' + g_nMySellListingsPageSize)
                .removeClass('whiteLink')
                .addClass('disabled');

              if (bScrollIntoView) {
                var elTable = $J('#tabContentsMyActiveMarketListingsTable').get(0);
                if (typeof elTable.scrollIntoView !== 'undefined') {
                  elTable.scrollIntoView();
                }
              }
            }
          }
        },
        onComplete: async function (response) {
          g_bBusyLoadingMyMarketListings = false;

          await UpdateTotalListings();

          SIH?.activeListings?.RenderHeaderTable();
          SIH?.activeListings?.filterPanel?.RenderMarketFilter();

          SIH?.activeListings?.resubmitOrders?.resubmitButton?.LoadResubmitOrderButton('sell_listings');
          SIH?.activeListings?.listingRow?.RefactorListingRow();
          SetPhaseColors();
          SIH?.activeListings?.resubmitOrders?.resubmitButton?.LoadResubmitOrderButton('buy_orders');
        },
      });
    };
    Market_SetActiveLisitingsPerPage(g_nMySellListingsPageSize);

    if (typeof window.historypagesize !== 'undefined' && window.historypagesize != 10) {
      orgLoadMarketHistory = LoadMarketHistory;
      LoadMarketHistory = function () {
        if (g_bBusyLoadingMarketHistory) {
          return;
        }

        g_bBusyLoadingMarketHistory = true;
        var elMyHistoryContents = $('tabContentsMyMarketHistory');
        new Ajax.Request('//steamcommunity.com/market/myhistory', {
          method: 'get',
          parameters: {
            count: window.historypagesize,
          },
          onSuccess: function (transport) {
            if (transport.responseJSON) {
              var response = transport.responseJSON;

              elMyHistoryContents.innerHTML = response.results_html;

              MergeWithAssetArray(response.assets);
              eval(response.hovers);

              g_oMyHistory = new CAjaxPagingControls(
                {
                  query: '',
                  total_count: response.total_count,
                  pagesize: response.pagesize,
                  prefix: 'tabContentsMyMarketHistory',
                  class_prefix: 'market',
                },
                '//steamcommunity.com/market/myhistory/'
              );

              g_oMyHistory.SetResponseHandler(function (response) {
                MergeWithAssetArray(response.assets);
                eval(response.hovers);
              });
            }
          },
          onComplete: function () {
            g_bBusyLoadingMarketHistory = false;
          },
        });
      };
    }
    $J('#mainContents')
      .on('click', '#tabContentsMyMarketHistory_links .market_paging_pagelink', function () {
        startPage = (parseInt($J(this).text()) - 1) * window.historypagesize;
      })
      .on('click', '#tabContentsMyMarketHistory_btn_next', function () {
        startPage += window.historypagesize;
      })
      .on('click', '#tabContentsMyMarketHistory_btn_prev', function () {
        startPage -= window.historypagesize;
      });

    statMarketPage.register();
  });

  // Prototype Steam

  let AjaxRequestMaster = Ajax.Request;
  Ajax.Request = function (url, data) {
    data.sihData = data.sihData || {};

    const onSuccess = data.onSuccess;
    data.onSuccess = function (transport) {
      if (url.indexOf('/market/myhistory') > -1) {
        SIH?.marketHistory?.filter?.marketMyHistoryRequestOnSuccessBefore();
      }

      onSuccess(transport);

      if (url.indexOf('/market/myhistory') > -1) {
        SIH?.marketHistory?.filter?.marketMyHistoryRequestOnSuccessAfter(url, data, transport);
        marketMyHistoryRequestOnSuccessAfter(url, data, transport);
      }
    };

    const onFailure = data.onFailure;
    data.onFailure = function (transport) {
      if (url.indexOf('/market/myhistory') > -1) {
        SIH?.marketHistory?.filter?.marketMyHistoryRequestOnFailureBefore(url, data, transport);
      }
      onFailure(transport);
    };

    if (url.indexOf('/market/myhistory') > -1) {
      SIH?.marketHistory?.filter?.marketMyHistoryRequestBefore(url, data);
      SIH?.marketHistory?.filter?.marketMyHistoryRequestOnSuccessBefore();
    }

    new AjaxRequestMaster(url, data);
  };
  Ajax.Request.__proto__ = AjaxRequestMaster;
}

const getAssetItemFromList = ($itemRow) => {
  const itemListingId = $itemRow.attr('id').match(/row_(\d+)_/)[1];

  //Find by listing id for appid 730
  let assetItemObj = assetList.get(itemListingId);

  //Find by iconUrl for other games
  if (!assetItemObj) {
    const iconSrc = $itemRow.find('img').attr('src');
    const iconUrl = iconSrc ? iconSrc.match(/image\/(.*)\//)[1] : '';
    assetItemObj = assetList.get(iconUrl);
  }

  return assetItemObj;
};
