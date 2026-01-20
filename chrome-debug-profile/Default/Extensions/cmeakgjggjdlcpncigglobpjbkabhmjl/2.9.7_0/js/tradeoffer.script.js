var apiItems = {};
var priceTimer = null;
var loading = false;
var lastExtPricesProvider = null;
var itemsInTrades = [];

const steamLang = GetCookie('Steam_Language');

$J('.trade_area').before(`
    <div id="infoPanel">
        <div id="switchPanel">
            <span style="margin-right: 10px;">SIH - Steam Inventory Helper</span>
            <label class="switch">
                <input id="switcher" type="checkbox" ${IS_ENABLED_SIH ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
        </div>
    </div>
`);
$J('#switchPanel #switcher').change((e) => {
  const { currentTarget } = e;

  chrome.runtime.sendMessage(
    SIHID,
    { type: 'BACKGROUND_SET_SYNC_STORAGE', data: { key: 'enabledSih_tradeofferPage', value: currentTarget.checked } },
    () => {
      window.location.reload();
    }
  );
});

var UpdateTotal = function () {
  //SIH?.GetTotalPrice();
};
var tt = 0;
var lastOrderSort = null;
var lastCatSort = null;

const floatQueue = [];
const GetFloat = (link) => {
  link = link.replace('%owner_steamid%', g_ActiveUser.strSteamId);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(SIHID, { type: 'BACKGROUND_GET_WEAR_VALUE', data: { link } }, (respData) => {
      if (respData && respData.success) {
        resolve(respData);
      } else {
        reject(respData);
      }
    });
  });
};

const processFloatQueue = () => {
  if (!floatQueue.length) return null;

  Promise.all(
    floatQueue.map(({ link, element }) =>
      GetFloat(link).then((data) => {
        const $curItem = $J(element);
        if (!$curItem.find('.float-value').length) {
          const itemInfo = data.iteminfo;
          const { rgItem } = $curItem[0];
          const $phaseLabel = $curItem.find('.phase-label');
          const $price = $curItem.find('.p-price');

          rgItem.float_value = itemInfo.floatvalue;
          const $floatDataHtml = $J(`<div class="tradeoffer float-data">
        <span class="float-data-row">
          <span class="rating-pos">${SIH?.phaseOfItems?.GetRatingPos(itemInfo)}</span>
          <span class="paintseed">${itemInfo.paintseed}</span>
        </span>
        <span class="float-value">${itemInfo.floatvalue.toFixed(13)}</span>
      </div>`);

          if ($phaseLabel.length) $floatDataHtml.prepend($phaseLabel);
          if ($price.length) $floatDataHtml.append($price);

          $curItem.append($floatDataHtml);
        }
      })
    )
  );

  floatQueue.length = 0;
};

const GetFloatValues = () => {
  const rgItemElements = g_ActiveInventory.rgChildInventories?.[2]?.rgItemElements?.length
    ? g_ActiveInventory.rgChildInventories[2].rgItemElements
    : g_ActiveInventory.rgItemElements;

  $J.each(rgItemElements, (idx, elem) => {
    const isWeapon = elem.rgItem.tags.find((x) => x.category.toUpperCase() === 'WEAPON');
    if (isWeapon && elem.rgItem.actions !== undefined) {
      const { element, actions, id, appid, contextid, descriptions } = elem.rgItem;
      const action = actions[0];
      const actionLink = action.link.replace('%assetid%', id).replace('%owner_steamid%', g_ActiveUser.strSteamId);
      floatQueue.push({ id, descriptions, element, link: actionLink });
    }
  });

  processFloatQueue();
};

var AddItemDescription = function (el) {
  var rgItem = el.rgItem;
  var exterior = '';
  for (var i = 0; i < rgItem.tags.length; i++) {
    if (rgItem.tags[i].category == 'Exterior') {
      exterior = rgItem.tags[i].name;
      break;
    }
  }

  if (exterior != '') {
    if (rgItem.float_value >= 0) {
      exterior +=
        ' (' +
        Math.trunc(rgItem.float_value * 10000) / 10000 +
        (rgItem.dopplerPhase ? ' ' + dopplerPhaseNameShort[rgItem.dopplerPhase] : '') +
        ')';
    }

    var divDestag;
    if ($J(el).has('.des-tag').length) {
      divDestag = $J(el).find('.des-tag');
    } else {
      divDestag = $J('<div class="des-tag">');
      $J(el).append(divDestag);
    }
    divDestag.html(exterior);
  }
};

var SetTotal = function () {
  const sihSteamMarketPlaceAppIds = [730, 570, 440, 252490];
  var yourTotal = 0,
    yourTotalnotax = 0;
  var yourExt = 0,
    theirExt = 0;
  var exttotal = [{}, {}];

  $J('#trade_yours .price-tag').each(function (i, e) {
    const item = $J(this).parent('.item')[0].rgItem;
    const text = $J(this).text();
    const price = getPriceAsInt(text);

    // price = parseInt(price * 100);
    yourTotal += price;

    // const publisherFee = typeof item.market_fee != 'undefined' ? item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'] || 0.1;
    const publisherFee = window.PriceUtils.publisherFee(item, g_rgWalletInfo, 0.1);
    const feeInfo = CalculateFeeAmount(price, publisherFee);
    yourTotalnotax += price ? price - feeInfo.fees : 0;
  });

  var steamTotal = [
    '<div class="steam-total">',
    '<span class="total-title">Steam (minus fees):</span>',
    '<div class="total-value">',
    formatNumberV2(yourTotal),
    '<span class="total-value-fee"> (',
    formatNumberV2(yourTotalnotax),
    ')</span>',
    '</div>',
    '</div>',
  ].join('');
  $J('#trade_yours .total').html(steamTotal);

  if (extprice) {
    $J('#trade_yours .item ').each(function (i, e) {
      const item = $J(this)[0].rgItem;
      if (item.extprice) {
        if (item.extcrr) {
          if (!exttotal[0][item.extcrr]) {
            exttotal[0][item.extcrr] = 0;
          }
          exttotal[0][item.extcrr] += item.extprice;
        } else {
          const currencyCode = PriceQueue._getCurrencyCodeSteam() || 1;
          if (item.extprice_provider === 'steam' && !sihSteamMarketPlaceAppIds.includes(+item.appid)) {
            const priceFormatted = SIH?.CurrencyService?.getPriceFromCurrency(
              item.extprice,
              currencyId,
              currencyCode
            ).price;
            yourExt += priceFormatted;
          } else yourExt += item.extprice;
        }
      }
    });

    let totalstr = '';
    totalstr = formatNumber(yourExt);

    for (var ppp in exttotal[0]) {
      totalstr += '; ' + exttotal[0][ppp] + ' ' + ppp;
    }

    var extTotal = [
      '<div class="ext-total">',
      '<span class="total-title">',
      lastExtPricesProvider || 'Ext. Price',
      ':</span>',
      '<div class="total-value">',
      totalstr,
      '</div>',
      '</div>',
    ].join('');
    $J('#trade_yours .total').append(extTotal);
    // $J('#trade_yours .total').append('<span class="ext-total">' + totalstr + '</span>');
  }

  if ($J('#trade_yours .price-tag.no-price').length > 0) {
    $J('#trade_yours .total').addClass('warning');
  } else {
    $J('#trade_yours .total').removeClass('warning');
  }

  var theirTotal = 0,
    theirTotalnotax = 0;
  $J('#trade_theirs .price-tag').each(function (i, e) {
    const item = $J(this).parent('.item')[0].rgItem;
    const text = $J(this).text();
    const price = getPriceAsInt(text);

    // price = parseInt(price * 100);
    theirTotal += price;

    // const publisherFee = typeof item.market_fee != 'undefined' ? item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'] || 0.1;
    const publisherFee = window.PriceUtils.publisherFee(item, g_rgWalletInfo, 0.1);
    const feeInfo = CalculateFeeAmount(price, publisherFee);
    theirTotalnotax += price ? price - feeInfo.fees : 0;
  });

  var steamTotal = [
    '<div class="steam-total">',
    '<span class="total-title">Steam (minus fees):</span>',
    '<div class="total-value">',
    formatNumberV2(theirTotal),
    '<span class="total-value-fee"> (',
    formatNumberV2(theirTotalnotax),
    ')</span>',
    '</div>',
    '</div>',
  ].join('');
  $J('#trade_theirs .total').html(steamTotal);
  if (extprice) {
    $J('#trade_theirs .item ').each(function (i, e) {
      const item = $J(this)[0].rgItem;
      if (item.extprice) {
        if (item.extcrr) {
          if (!exttotal[1][item.extcrr]) {
            exttotal[1][item.extcrr] = 0;
          }
          exttotal[1][item.extcrr] += item.extprice;
        } else {
          const currencyCode = PriceQueue._getCurrencyCodeSteam() || 1;
          if (item.extprice_provider === 'steam' && !sihSteamMarketPlaceAppIds.includes(+item.appid)) {
            const priceFormatted = SIH?.CurrencyService?.getPriceFromCurrency(
              item.extprice,
              currencyId,
              currencyCode
            ).price;
            theirExt += priceFormatted;
          } else theirExt += item.extprice;
        }
      }
    });

    let totalstr = '';
    totalstr = formatNumber(theirExt);

    for (var ppp in exttotal[1]) {
      totalstr += '; ' + exttotal[1][ppp] + ' ' + ppp;
    }
    var extTotal = [
      '<div class="ext-total">',
      '<span class="total-title">',
      lastExtPricesProvider || 'Ext. Price',
      ':</span>',
      '<div class="total-value">',
      totalstr,
      '</div>',
      '</div>',
    ].join('');
    $J('#trade_theirs .total').append(extTotal);
    // $J('#trade_theirs .total').append('<span class="ext-total">' + totalstr + '</span>');
  }

  if ($J('#trade_theirs .price-tag.no-price').length > 0) {
    $J('#trade_theirs .total').addClass('warning');
  } else {
    $J('#trade_theirs .total').removeClass('warning');
  }
};

var itemsCount = null;
var lastCatname = null;
var SetCount = function () {
  var tx = '';
  itemsCount = {};

  $J('#your_slots .trade_slot .item').each(function (el) {
    var rgItem = $J(this)[0].rgItem;
    for (var itag = 0; itag < rgItem.tags.length; itag++) {
      var tag = rgItem.tags[itag];
      if (typeof itemsCount[tag.category_name] == 'undefined') {
        itemsCount[tag.category_name] = {};
      }

      if (typeof itemsCount[tag.category_name][tag.internal_name] == 'undefined') {
        itemsCount[tag.category_name][tag.internal_name] = {
          name: tag.name,
          color: tag.color,
          mycount: 0,
          theircount: 0,
        };
      }

      itemsCount[tag.category_name][tag.internal_name].mycount += 1;
    }
  });

  $J('#their_slots .trade_slot .item').each(function (el) {
    var rgItem = $J(this)[0].rgItem;
    for (var itag = 0; itag < rgItem.tags.length; itag++) {
      var tag = rgItem.tags[itag];
      if (typeof itemsCount[tag.category_name] == 'undefined') {
        itemsCount[tag.category_name] = {};
      }

      if (typeof itemsCount[tag.category_name][tag.internal_name] == 'undefined') {
        itemsCount[tag.category_name][tag.internal_name] = {
          name: tag.name,
          color: tag.color,
          mycount: 0,
          theircount: 0,
        };
      }

      itemsCount[tag.category_name][tag.internal_name].theircount += 1;
    }
  });

  $J('#sp_count').html(tx);
  if (Object.keys(itemsCount).length) {
    $J('.itemsCountPanel').show();
    $J('#divCats').empty();
    for (var catname in itemsCount) {
      if (lastCatname == null) {
        lastCatname = catname;
      }
      const $opt = $J(`<option value="${catname}">${catname}</option>`);
      if (catname === lastCatname) $opt.prop('selected', true);
      $J('#divCats').append($opt);
    }
    if (lastCatname) {
      ShowCount(lastCatname);
    }
  } else {
    $J('.itemsCountPanel').hide();
  }
};

var ShowCount = function (category_name) {
  var myCount = `<b>${SIHLang.tradeoffers.youritems}</b> (${$J('#your_slots .trade_slot .item').length}):<br />`,
    theirCount = `<b>${SIHLang.tradeoffers.theiritem}</b> (${$J('#their_slots .trade_slot .item').length}):<br />`;

  if (itemsCount[category_name]) {
    for (var iname in itemsCount[category_name]) {
      var cat = itemsCount[category_name][iname];
      if (cat.mycount) {
        myCount +=
          '<span class="category__item" style="color:#' +
          cat.color +
          '">' +
          cat.name +
          ' (' +
          cat.mycount +
          ' <a href="#" class="remove-category" title="Remove all" data-slot="your" data-category="' +
          category_name +
          '" data-name="' +
          iname +
          '" >x</a>)</span> ';
      }

      if (cat.theircount) {
        theirCount +=
          '<span class="category__item" style="color:#' +
          cat.color +
          '">' +
          cat.name +
          ' (' +
          cat.theircount +
          ' <a href="#" class="remove-category" title="Remove all" data-slot="their" data-category="' +
          category_name +
          '" data-name="' +
          iname +
          '" >x</a>)</span> ';
      }
    }
    lastCatname = category_name;
    SetCookie('lastCategoryCount', lastCatname, 365 * 10, '/tradeoffer/');
  }
  $J('#divDetail').html(`${myCount}<br /><br />${theirCount}`);
};

var CheckItemByPrice = function (rgItem, higher, priceText) {
  if (rgItem == null) {
    return false;
  }
  const pricenum = parseFloat(priceText);
  if (!pricenum || !rgItem.extprice) return false;
  if ((pricenum < rgItem.extprice && higher) || (pricenum > rgItem.extprice && !higher)) {
    return true;
  }
  return false;
};

var Trash = ['Axe', 'Omniknight', 'Morphling', 'Witch Doctor', 'Broodmother'];

var CheckTrashHero = function (rgItem) {
  if (!rgItem || !rgItem.tags) return false;
  for (var i = 0; i < rgItem.tags.length; i++) {
    if (rgItem.tags[i].category == 'Hero') {
      for (var j = 0; j < Trash.length; j++) {
        if (rgItem.tags[i].name === Trash[j]) {
          return true;
        }
      }
    }
  }

  return false;
};

var CheckIntrade = function (Item) {
  if (!Item) {
    return false;
  }
  const $item = $J(Item);
  if ($item.find('.item_flag').length && $item.find('.item_flag').hasClass('item_intrade')) {
    return true;
  }

  return false;
};

var CheckDuplicate = function (rgItem) {
  if (!rgItem || !rgItem.market_hash_name) {
    return false;
  }
  var hashName = rgItem.market_hash_name;
  var isTheirs = $J('#inventory_select_their_inventory').hasClass('active');
  var idslot = isTheirs ? '#their_slots' : '#your_slots';
  var isDupe = false;
  var dup = $J('#Txt_Dup').val();
  var idup = parseInt(dup);
  $J(idslot + ' .item').each(function () {
    if (this.rgItem && this.rgItem.market_hash_name == hashName) {
      idup--;
      if (idup == 0) {
        return false;
      }
    }
  });

  return idup == 0;
};

var TakeMany = false;

var SortItem = (asc, cat = 'price') => {
  lastOrderSort = asc;
  lastCatSort = cat;
  var order = asc ? 1 : -1;
  var sortFunc = function (a, b) {
    var aobj = $J(a).find('.item')[0].rgItem,
      bobj = $J(b).find('.item')[0].rgItem;
    var an = cat === 'price' ? getPriceAsInt(aobj.lowestPrice) : aobj.float_value || 0,
      bn = cat === 'price' ? getPriceAsInt(bobj.lowestPrice) : bobj.float_value || 0;

    if (!an && cat === 'price' && aobj.extprice) {
      an = aobj.extprice;
    }

    if (!bn && cat === 'price' && bobj.extprice) {
      bn = bobj.extprice;
    }

    if (an === bn) {
      an = aobj.market_hash_name;
      bn = bobj.market_hash_name;
    }

    if (an === bn) {
      an = a.id;
      bn = b.id;
    }

    if (an > bn) {
      return 1 * order;
    }
    if (an < bn) {
      return -1 * order;
    }
    return 0;
  };

  var your_elems = $J('#your_slots .itemHolder.trade_slot:has(.price-tag,.p-price)');
  your_elems.sort(sortFunc);
  your_elems.detach().prependTo($J('#your_slots'));

  var their_elems = $J('#their_slots .itemHolder.trade_slot:has(.price-tag,.p-price)');
  their_elems.sort(sortFunc);
  their_elems.detach().prependTo($J('#their_slots'));
};

var lastFilter = null;
var orgTradePageSelectInventory = null;

var ModifyItemDisplay = function () {
  UserThem.OnLoadInventoryComplete = UserYou.OnLoadInventoryComplete = function (transport, appid, contextid) {
    this.cLoadsInFlight--;
    if (transport.responseJSON && transport.responseJSON.success) {
      var inventory = new CInventory(
        this,
        appid,
        contextid,
        transport.responseJSON.rgInventory,
        transport.responseJSON.rgCurrency
      );

      this.addInventory(inventory);
      var elInventory = inventory.getInventoryElement();
      elInventory.hide();
      $('inventories').insert(elInventory);

      var elTags = inventory.getTagContainer();
      var elTagHolder = $('filter_options');
      if (elTagHolder && elTags) {
        elTags.hide();
        elTagHolder.insert(elTags);
        elTagHolder.addClassName('filter_collapsed');
      }

      var classArr = {};
      for (var ii in transport.responseJSON.rgInventory) {
        var rgItem = transport.responseJSON.rgInventory[ii];
        if (!classArr[rgItem.classid]) {
          classArr[rgItem.classid] = 1;
        } else {
          classArr[rgItem.classid]++;
        }
      }

      for (var ii in transport.responseJSON.rgInventory) {
        var rgItem = transport.responseJSON.rgInventory[ii];

        if (classArr[rgItem.classid] && classArr[rgItem.classid] > 1 && rgItem.descriptions) {
          if (!rgItem.descriptions[0].iscount) {
            rgItem.descriptions.unshift({
              iscount: true,
              type: 'html',
              value:
                'Number owned: <i style="color: rgb(153, 204, 255); font-size: 16px">' +
                classArr[rgItem.classid] +
                '</i>',
            });
          }
        }
      }

      ///External prices
      if (window.extprice) {
        if (ExternalPrices[appid]) {
          var lastAPIIdx = GetCookie('lastext_' + appid);
          if (lastAPIIdx != null) {
            lastAPIIdx = parseInt(lastAPIIdx);
          } else {
            lastAPIIdx = 0;
          }
          var lastAPI = null;
          const elem = ExternalPrices[appid].apis[lastAPIIdx];
          if (elem.api && elem.api.GetPrices) {
            if (elem.isApproved) {
              lastAPI = elem.api;
            }

            lastAPI = Object.assign({}, elem.api, { name: elem.name });
            lastExtPricesProvider = lastAPI.name;

            // elem.api.GetPrices(appid, { market: elem.name }, true);
          }

          // $J('#inventory_select_your_inventory, #inventory_select_their_inventory').click(function () {
          //     if ($J(this).hasClass('active')) lastAPI.SetPrices(appid, lastExtPricesProvider);
          // });
          // window.setTimeout(function () {
          //     lastAPI.SetPrices(appid);
          // }, 300);
        }
      }
    } else {
      this.OnInventoryLoadFailed(transport, appid, contextid);
      return;
    }

    this.ShowInventoryIfActive(appid, contextid);
    $J(window).trigger('resize.DynamicInventorySizing');

    // $J.each(itemsInTrades, function (idx, item) {
    //     var it = item;
    //     if (it.appid == appid) {
    //         if (!it.assetid && !it.contextid) {
    //             $J(`[id^=item${appid}_]`).each((idx, elem) => {
    //                 const rgItem = elem.rgItem;
    //                 if (rgItem.classid == it.classid && rgItem.instanceid == it.instanceid) {
    //                     it.contextid = rgItem.contextid;
    //                     it.assetid = rgItem.id;
    //                     return false;
    //                 }
    //             });
    //         }
    //         var elIt = $J('div.item[id=item' + it.appid + '_' + it.contextid + '_' + it.assetid + ']');
    //         elIt.addClass('item-in-trade');
    //     }
    // });

    if (g_bIsTrading) {
      RedrawCurrentTradeStatus();
    }
  };
};

var numberOfRetries = 0,
  maxRetries = 10;
var activeUser = null;
var apiTimer = null;
var dopplerPhaseName = {
  421: 'Phase 4',
  420: 'Phase 3',
  419: 'Phase 2',
  418: 'Phase 1',
  417: 'Black Pearl',
  416: 'Sapphire',
  415: 'Ruby',
};

var dopplerPhaseNameShort = {
  'Phase 4': 'P4',
  'Phase 3': 'P3',
  'Phase 2': 'P2',
  'Phase 1': 'P1',
  'Black Pearl': 'BP',
  Sapphire: 'Sap',
  Ruby: 'Rub',
};

var ModifySelectInventory = function () {
  orgTradePageSelectInventory = TradePageSelectInventory;
  TradePageSelectInventory = function (user, appid, contextid, bLoadCompleted) {
    orgTradePageSelectInventory(user, appid, contextid, bLoadCompleted);
    SetupTakeButtons(appid);

    SIH?.RenderProviderSelectOptions(appid);
    // SetupAdBanner(appid);
  };
};

var SetupTakeButtons = function (appid) {
  $J('#Bt_GetFloatSecond, #divTakeButtons .take-button, .sih-get-prices').remove();
  if (takeButtonsJson[appid]) {
    $J.each(takeButtonsJson[appid], function (k, vObject) {
      if (+appid === 730) {
        const $btnFloat = $J(
          `<a href="javascript:void(0);" id="Bt_GetFloatSecond" class="take-gen-button" style="color: #ff0">${SIHLang.market.getfloat}</a>`
        );
        $btnFloat.click(() => {
          GetFloatValues();
          return false;
        });
        $J('#divTakeButtons').append($btnFloat);
      }

      if (+appid === 753 && k.toLowerCase() === 'get_prices') {
        const $btnGetPrices = $J(
          `<a href="javascript:void(0);" class="sih-get-prices" style="color: #ff0">${SIHLang.tradeoffers[k]}</a>`
        );
        $btnGetPrices.click(() => {
          SIH?.RightPanelLoadPrice(appid, vObject);
        });
        $J('#divTakeButtons').append($btnGetPrices);
      } else {
        var bt = $J(`<a href="javascript:void(0);" class="take-button">${SIHLang.tradeoffers[k]}</a>`);
        bt.data('exp', vObject);
        $J('#divTakeButtons').append(bt);
      }
    });
  }
};

var _verifyUsers = function () {
  // $J('#trade_theirs h2').append('<a href="#" class="verified-user" title="Verified by CSGOFAST">Verified by CSGOFAST</a>');
  // $J.getJSON('chrome-extension://' + SIHID + '/assets/csmoney/bots.json', function (data) {
  //   if(data.includes(g_ulTradePartnerSteamID)) $J('#trade_theirs h2').append('<span class="icon-check verified others-user" title="Verified by CS.MONEY"></span>');
  // });
  chrome.runtime.sendMessage(SIHID, { type: 'GET_EXTERNAL_PRICES', data: { appid: 730, market: 'csgofast' } }, (e) => {
    if (e.success) {
      if (e.bots && e.bots.includes(g_ulTradePartnerSteamID)) {
        $J('#trade_theirs h2').append(
          '<span class="icon-check verified csgofast-user" title="Verified by CSGOFAST"></span>'
        );
        return false;
      }
    }
  });
};

var SortInvItems = function (asc, cat = 'price') {
  lastOrderSort = asc;
  lastCatSort = cat;
  var order = asc ? 1 : -1;
  var sortFunc = function (a, b) {
    var aobj = a.rgItem;
    var bobj = b.rgItem;

    var an = cat === 'price' ? aobj.extprice || 0 : aobj.float_value || 0;
    var bn = cat === 'price' ? bobj.extprice || 0 : bobj.float_value || 0;

    if (an === bn) {
      an = aobj.market_hash_name;
      bn = bobj.market_hash_name;
    }

    if (an === bn) {
      an = a.id;
      bn = b.id;
    }

    if (an > bn) {
      return order;
    }
    if (an < bn) {
      return -1 * order;
    }
    return 0;
  };

  if (g_ActiveInventory.appid == 753 && g_ActiveInventory.contextid == 0) {
    g_ActiveInventory.rgChildInventories[6].rgItemElements.sort(sortFunc);
  } else {
    const rgItemElements = g_ActiveInventory.rgChildInventories?.[2]?.rgItemElements?.length
      ? g_ActiveInventory.rgChildInventories[2].rgItemElements
      : g_ActiveInventory.rgItemElements;

    rgItemElements.sort(sortFunc);
  }

  var curTags = Filter.rgCurrentTags;
  var elFilter = Filter.elFilter;
  var strLastFilter = Filter.strLastFilter;

  Filter.ClearFilter();
  g_ActiveInventory.LayoutPages();

  Filter.strLastFilter = strLastFilter;
  Filter.elFilter = elFilter;
  Filter.elFilter.value = strLastFilter;

  Filter.UpdateTagFiltering(curTags);
  Filter.ReApplyFilter();

  g_ActiveInventory.MakeActive();
};

if (IS_ENABLED_SIH) {
  $J(function () {
    SIH?.RefactoredSteamMethods();

    if (typeof custombuttons != 'undefined') {
      takeButtonsJson = custombuttons;
    }
    var idExp = /item(\d+)_(\d+)_(\d+)/i;
    var tmp = GetCookie('lastCategoryCount');
    if (tmp) {
      lastCatname = tmp;
    }
    $J('#responsivetrade_itemfilters').before(`
            <div id="divTakeButtons">
                <div class="dropdown">
                    <div class="dropbtn">
                        <div id="activeSortType" data-category="price">
                            <div class="sortType asc"></div>
                            <div class="title">${SIHLang.sort.price}</div>
                        </div>
                        <div class="btn_details_arrow down"></div>
                    </div>
                    <div class="dropdown-content">
                        <a href="javascript:void(0)" id="btPriceSort">${SIHLang.sort.price}</a>
                        <a href="javascript:void(0)" id="btFloatSort">${SIHLang.sort.float}</a>
                    </div>
                </div>
                <a href="javascript:void(0);" id="Bt_RemoveAll" class="take-gen-button">${SIHLang.tradeoffers.removeall}</a>
                <a href="javascript:void(0);" id="Bt_TakeAll" class="take-gen-button">${SIHLang.tradeoffers.takeall}</a>
                ${
                  +g_ActiveInventory?.appid === 730
                    ? `<a href="javascript:void(0);" id="Bt_GetFloatSecond" class="take-gen-button" style="color: #ff0">${SIHLang.market.getfloat}</a>`
                    : ``
                }

            </div>
        `);
    $J('.dropdown #btPriceSort').click(() => {
      $J('.dropdown #activeSortType .title').html(SIHLang.sort.price);
      $J('.dropdown #activeSortType').data('category', 'price');
      const isAsc = $J('.dropdown #activeSortType .sortType').hasClass('asc');
      $J('.dropdown .dropbtn .btn_details_arrow').click();
      SortInvItems(isAsc, 'price');
    });

    $J('.dropdown #btFloatSort').click(() => {
      $J('.dropdown #activeSortType .title').html(SIHLang.sort.float);
      $J('.dropdown #activeSortType').data('category', 'float');
      const isAsc = $J('.dropdown #activeSortType .sortType').hasClass('asc');
      $J('.dropdown .dropbtn .btn_details_arrow').click();
      SortInvItems(isAsc, 'float');
    });

    $J('.dropdown #activeSortType').click((e) => {
      const { currentTarget } = e;
      const cat = $J(currentTarget).data('category');
      const isAsc = $J('.dropdown #activeSortType .sortType').hasClass('asc');
      if (isAsc) {
        $J('.dropdown #activeSortType .sortType').removeClass('asc');
        $J('.dropdown #activeSortType .sortType').addClass('desc');
      } else {
        $J('.dropdown #activeSortType .sortType').removeClass('desc');
        $J('.dropdown #activeSortType .sortType').addClass('asc');
      }
      SortInvItems(!isAsc, cat);
    });

    $J('.dropdown .dropbtn .btn_details_arrow').click((e) => {
      const { currentTarget } = e;
      if ($J(currentTarget).hasClass('down')) {
        $J(currentTarget).removeClass('down');
        $J(currentTarget).addClass('up');
        $J('.dropdown .dropdown-content').show();
      } else {
        $J(currentTarget).removeClass('up');
        $J(currentTarget).addClass('down');
        $J('.dropdown .dropdown-content').hide();
      }
    });

    $J('#inventory_displaycontrols').after(
      '<div style="clear:both"><span id="sp_count"></span></div>' +
        '<div id="divInvControls">' +
        '<span data-lang="tradeoffers.noofitems">' +
        SIHLang.tradeoffers.noofitems +
        '</span>: <input type="text" id="Txt_Num" value="" style="width:50px; text-align:right; padding-right: 3px"/>' +
        '<label for="Ck_SkipIntrade"><input type="checkbox" id="Ck_SkipIntrade" /> <span data-lang="tradeoffers.skipintrade">' +
        SIHLang.tradeoffers.skipintrade +
        '</span></label>' +
        '<div style="padding:8px 0"><label for="Txt_Dup"><span data-lang="tradeoffers.noduplicate">' +
        SIHLang.tradeoffers.noduplicate +
        '</span></label>: <input type="number" id="Txt_Dup" value="" min="0" style="width:50px; text-align:right; padding-right: 3px"/></div>' +
        '</div>' +
        '<div class="itemsCountPanel"><select id="divCats"></select><div id="divDetail"></div></div>'
    );

    $J('#Bt_TakeAll').click(function () {
      SIH?.MoveItem(null);
    });
    $J('#Bt_RemoveAll').click(function () {
      SIH?.RemoveItems();
    });

    $J('#divTakeButtons').on('click', 'a.take-button', function () {
      var exp = $J(this).data('exp');
      if (exp) {
        SIH?.MoveItem(exp);
      }
    });
    $J('.trade_left').on('click', '.item', function (event) {
      if (event.ctrlKey) {
        if (this.rgItem && this.rgItem.classid) {
          SIH?.MoveItem(this.rgItem.classid);
        }
      }
    });
    $J('.trade_right').on('click', '.item', function (event) {
      if (event.ctrlKey) {
        if (this.rgItem && this.rgItem.classid) {
          var iclassid = this.rgItem.classid;
          $J(this)
            .parents('.trade_item_box')
            .find('.item')
            .each(function () {
              if (this.rgItem && this.rgItem.classid == iclassid) {
                var rgItem = this.rgItem;
                var elItem = this;

                if (BIsInTradeSlot(elItem)) {
                  CleanupSlot(elItem.parentNode.parentNode);
                }

                if (rgItem.is_stackable) {
                  SetStackableItemInTrade(rgItem, 0);
                  return;
                }
                RevertItem(rgItem);
                rgItem.homeElement.down('.slot_actionmenu_button').show();
                GTradeStateManager.RemoveItemFromTrade(rgItem);
              }
            });

          SetCount();
          if (window.autocheckofferprice) {
            SIH?.GetTotalPrice();
          }

          setTimeout(function () {
            $J('.itemHolder.trade_slot[id=""]').remove();
          }, 300);
        }
      }
    });

    const $mainDiv = $J('.trade_partner_header.responsive_trade_offersection.top').parent();
    $mainDiv.css('position', 'relative');

    SIH?.RenderTradeOfferRightPanel();
    SIH?.RenderSihRepUsersInfo();

    //Add sponsor block
    SIH?.RenderLeftSponsorBanner({ $container: $mainDiv });

    $J('#btPriceSort').click(function () {
      $J('#btFloatSort').html(SIHLang.sort.float);
      if ($J(this).data('asc')) {
        $J(this).text('▲ ' + SIHLang.sort.price);
        $J(this).data('asc', false);
        SortItem(true, 'price');
      } else {
        $J(this).text('▼ ' + SIHLang.sort.price);
        $J(this).data('asc', true);
        SortItem(false, 'price');
      }
    });

    $J('#btFloatSort').click((e) => {
      const { target } = e;
      $J('#btPriceSort').html(SIHLang.sort.price);
      if ($J(target).data('asc')) {
        $J(target).text(`▲ ${SIHLang.sort.float}`);
        $J(target).data('asc', false);
        SortItem(true, 'float');
      } else {
        $J(target).text(`▼ ${SIHLang.sort.float}`);
        $J(target).data('asc', true);
        SortItem(false, 'float');
      }
    });

    $J('#divCats').change((e) => {
      e.preventDefault();
      const {
        target: { value },
      } = e;
      ShowCount(value);
    });

    if (!g_bTradeOffer) {
      GTradeStateManager.SetItemInTrade = function (item, slot, xferAmount) {
        CancelTradeStatusPoll();
        var params = {
          sessionid: g_sessionID,
          appid: item.appid,
          contextid: item.contextid,
          itemid: item.id,
          slot: slot,
        };

        if (xferAmount) {
          params.amount = xferAmount;
        }

        new Ajax.Request(
          window.location.protocol + '//steamcommunity.com/trade/' + g_ulTradePartnerSteamID + '/additem/',
          {
            method: 'post',
            parameters: params,
            onComplete: function (transport) {
              HandleDropFailure(transport);
              SetCount();
              SIH?.MoveItem(lastFilter);
            },
          }
        );
      };
    }

    $J('#sp_count,#Bt_Count').click(function () {
      SetCount();
      return false;
    });

    $J('#Bt_GetTotal').click(function () {
      SIH?.GetTotalPrice();
      return false;
    });

    $J('#Bt_GetFloat').click(() => {
      GetFloatValues();
      return false;
    });
    $J('#Bt_GetFloatSecond').click(() => {
      GetFloatValues();
      return false;
    });

    $J('#divDetail').on('click', '.remove-category', function () {
      const $thisCategory = $J(this);
      SIH?.RemoveItems({ $category: $thisCategory });
      return false;
    });

    MoveItemToInventory = function (elItem) {
      var item = elItem.rgItem;
      if (BIsInTradeSlot(elItem)) {
        CleanupSlot(elItem.parentNode.parentNode);
      }

      if (item.is_stackable) {
        // stackable items are fully removed by this call
        SetStackableItemInTrade(item, 0);
        return;
      }

      RevertItem(item);

      item.homeElement.down('.slot_actionmenu_button').show();

      GTradeStateManager.RemoveItemFromTrade(item);

      SetCount();
      if (window.autocheckofferprice) {
        SIH?.GetTotalPrice();
      }
      if (lastOrderSort != null) {
        SortItem(lastOrderSort, lastCatSort);
      }
    };

    // if (window._apikey) {
    //   checkSteamBan();
    //   getLastTrade();
    // }
    StopWatchingForUnload();
    ModifyItemDisplay();
    ModifySelectInventory();

    const partners = ['csgofast'];

    const createBannerElement = (partner) =>
      new Promise((resolve) => {
        chrome.runtime.sendMessage(
          SIHID,
          {
            type: 'GetBanner',
            data: { place: 'to', partner },
          },
          ({ success, data: banner }) => {
            if (success) {
              const link = `a-to-${banner.partner}`;
              const img = `img-to-${banner.partner}`;

              resolve({
                html: `
                            <a href="${banner.href}" target="_blank" class="sponsor" title="${banner.title}" id="${link}">
                                <img src="${banner.img}" alt="${banner.title}" id="${img}">
                            </a>
                        `,
                link,
                img,
                banner,
              });
            } else {
              resolve(false);
            }
          }
        );
      });

    // скрыт блок баннера
    // Promise
    //   .all(partners.map(p => createBannerElement(p)))
    //   .then(banners => {
    //     const divSponsor = $J(`<div class="tradePanel"><div class="blockTitle">${SIHLang.sponsors}</div></div>`);
    //
    //     banners.forEach((bannerElement) => {
    //       if (!bannerElement) {
    //         return;
    //       }
    //
    //       const {html, link, img, banner} = bannerElement;
    //
    //       if (!banner.ignore) {
    //         divSponsor.append(html);
    //
    //         divSponsor.find(`#${img}`).on('load', function () {
    //           // chrome.runtime.sendMessage(SIHID, {
    //           //   type: "AD_HIT_STORE", data: {
    //           //     adLocation: 'to', action: 'show', adId: 2, partner: banner.partner, ignore: banner.ignore
    //           //   }
    //           // });
    //         });
    //
    //         divSponsor.find(`#${link}`).click(function () {
    //           // chrome.runtime.sendMessage(SIHID, {
    //           //   type: "AD_HIT_STORE", data: {
    //           //     adLocation: 'to', action: 'click', adId: 2, partner: banner.partner, ignore: banner.ignore
    //           //   }
    //           // });
    //         });
    //
    //         const $subHtml = $J(
    //           `<a class="blockTitle sih-subscribe-donat" href="javascript:void(0)">${SIHLang.tradeoffers.ads_notification}</a>`
    //         );
    //
    //         $subHtml.off('click').click((ev) => {
    //
    //           SIH?.subscribeAds?.loadSubscribeAds();
    //           SIH?.subscribeAds?.ShowModalSubscribeAds();
    //         })
    //
    //         divSponsor.append($subHtml)
    //       }
    //     });
    //
    //
    //     divRight.prepend(divSponsor);
    //
    //   });

    // Colorize inventory items (frame and background)
    if (window.show_inventory_rarity_color_tradeoffer) {
      InventoryItemRarity.colorize(window.show_phase_color_tradeoffer);
      $J('.inventory_user_tab').click((event) => {
        InventoryItemRarity.colorize(window.show_phase_color_tradeoffer);
      });
      $J('.option.popup_menu_item').click((event) => {
        InventoryItemRarity.colorize(window.show_phase_color_tradeoffer);
      });
    }

    setStickerCountForItem();
    $J('.inventory_user_tab').click(function () {
      setStickerCountForItem();
    });

    setTimeout(() => {
      try {
        SetCount();
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  });

  SIH?.ReworkTradeHeader();

  chrome.runtime.sendMessage(
    SIHID,
    { type: 'BACKGROUND_GET_SYNC_STORAGE', data: 'show_user_recent_transactions' },
    (cb) => {
      const { show_user_recent_transactions } = cb;

      if (show_user_recent_transactions) {
        SIH?.RenderTradeSummary();
      }
    }
  );
}

function setStickerCountForItem() {
  $J(document).ajaxComplete(function (event, request, settings) {
    let appID = 730;
    const items = $J('.trade_item_box').find('.item');
    $J(items).each((index, element) => {
      // Находим количество стикеров для КСГО и вставляем где они есть
      if (+element.rgItem.appid === +appID) {
        let countSticker = 0;

        for (let item of element.rgItem.descriptions) {
          if (item.value.includes('sticker_info')) {
            const stickerBlock = item.value;
            const itemToHTML = $J.parseHTML(stickerBlock);
            countSticker = $J(itemToHTML[1]).find('img').length;
            if ($J(element).find('.sih_item_sticker').length === 0) {
              const html = `<div class="sih_item_sticker">
                            <span>${countSticker}</span>
                         </div>`;
              $J(element).append(html);
            }
          }
        }
      }
    });
  });
}

var SetupAdBanner = function (appid) {
  var partner = +appid === 570 ? 'csmoney-dota' : 'csmoney';
  chrome.runtime.sendMessage(SIHID, { type: 'GetBanner', data: { size: 'mini', partner: partner } }, (e) => {
    if (e.success) {
      $J('.right-panel >.tradePanel > a:not(:first-of-type) > img')[0].setAttribute('src', e.url);
    }
  });
};

var econItemExp = /data-economy-item="(\w+)\/(\d+)\/(\d+)\/(\d+)"/gi;

// function checkSteamBan() {
//   chrome.runtime.sendMessage(SIHID, { type: 'GetPlayerBans', steamids: g_ulTradePartnerSteamID }, function (res) {
//     if (res.success && res.data[g_ulTradePartnerSteamID]) {
//       var player = res.data[g_ulTradePartnerSteamID];
//       var div = $J('<div class="rep"><div class="ban-info"></div></div>');
//       var cdiv = div.find('.ban-info');
//       cdiv.append('<span>Trade Ban: <strong>' + (player.EconomyBan || '') + '</strong></span> - ');
//       cdiv.append(
//         '<span>VAC Ban: <strong>' +
//           (player.VACBanned ? 'VAC Banned' : 'none') +
//           '</strong>' +
//           (player.DaysSinceLastBan ? ' (' + player.DaysSinceLastBan + ' days since last ban)' : '') +
//           '</span> - '
//       );
//       cdiv.append('<span>Community Ban: <strong>' + (player.CommunityBanned ? 'Banned' : 'none') + '</strong></span>');
//       cdiv.show();
//       // $J('.trade_partner_header.responsive_trade_offersection.top').after(div);
//       $J('#infoPanel').append(div);
//     }
//   });
// }

// function getLastTrade() {
//   const data = { get_received_offers: 1, get_sent_offers: 1 };
//   chrome.runtime.sendMessage(SIHID, { type: 'GetLastTrades', data }, function (result) {
//     if (result.success && typeof result.response !== 'undefined') {
//       var sentCounters = {},
//         receivedCounters = {};
//
//       $J.each(result.response.trade_offers_sent || [], function (i, row) {
//         if (sentCounters[row.accountid_other]) {
//           sentCounters[row.accountid_other].count++;
//         } else {
//           sentCounters[row.accountid_other] = { count: 1, time_created: row.time_created };
//         }
//       });
//       $J.each(result.response.trade_offers_received || [], function (i, row) {
//         if (receivedCounters[row.accountid_other]) {
//           receivedCounters[row.accountid_other].count++;
//         } else {
//           receivedCounters[row.accountid_other] = { count: 1, time_created: row.time_created };
//         }
//       });
//
//       var theirsProfileId = $J('#trade_theirs').find('.avatarIcon img').data('miniprofile');
//
//       var yourActivity = sentCounters[theirsProfileId] || { count: 0 };
//       var yourLastDate = yourActivity.time_created ? formatDate(yourActivity.time_created) : '';
//       var yourLastActivity = yourActivity.count ? ', last: ' + yourLastDate : '';
//
//       var theirsActivity = receivedCounters[theirsProfileId] || { count: 0 };
//       var theirsLastDate = theirsActivity.time_created ? formatDate(theirsActivity.time_created) : '';
//       var theirsLastActivity = theirsActivity.count ? ', last: ' + theirsLastDate : '';
//
//       $J('#trade_yours .ellipsis').after(
//         '<div class="label">Sent: ' + yourActivity.count + yourLastActivity + '</div>'
//       );
//       $J('#trade_theirs h2').after(
//         '<div class="label">Received: ' + theirsActivity.count + theirsLastActivity + '</div>'
//       );
//     }
//   });
// }

function getUrlVars() {
  var vars = [],
    hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

var queryStr = getUrlVars();
if (queryStr['sihaccept'] && queryStr['sihaccept'] == g_sessionID) {
  CTradeOfferStateManager.ConfirmTradeOffer();
}
if (queryStr['sihrefuse'] && queryStr['sihrefuse'] == g_sessionID) {
  CTradeOfferStateManager.DeclineTradeOffer();
}
