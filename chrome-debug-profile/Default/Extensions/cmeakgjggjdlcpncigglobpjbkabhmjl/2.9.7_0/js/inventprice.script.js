/*global $J, g_ActiveInventory, g_ActiveUser, g_sessionID, UserYou, SellItemDialog*/

var lowestPriceWithFeeRegExp =
  /<span class="market_listing_price market_listing_price_with_fee">\s*(((?!Sold).)*?)\s*<\/span>/i;
var lowestPriceWithoutFeeRegExp =
  /<span class="market_listing_price market_listing_price_without_fee">\s*(((?!Sold).)*?)\s*<\/span>/i;
var insGemExp =
  /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Inscribed Gem<\/span>/gi;
var kinGemExp =
  /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Kinetic Gem<\/span>/gi;
var priGemExp =
  /<span style="font-size: 18px; color: rgb\(\d+, \d+, \d+\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Prismatic Gem<\/span>/gi;
var ethGemExp =
  /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Ethereal Gem<\/span>/gi;
var corGemExp =
  /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Foulfell Shard<\/span>/gi;
var masGemExp =
  /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Rune of the Duelist Indomitable<\/span>/gi;
var buyingExp = /javascript:BuyMarketListing\('listing', '(\d+)', (\d+), '(\d+)', '(\d+)'\)/;
var itemRegExp = /BuildHover.*;/i;
var taradableStrExp = /Tradable after.+?/i;
var cacheItems = {};
var cachePrices = {};
var itemsInTrades = [];
var sellingStack = {};
var selectmode = false;
var currencyId = 1;
var sellcurrencyId = 1;
var lastSelectedItem = null;
var reqPriceHistory = true;
var apiItems = {};
var inventoryPrice = 0;
var userInventory = [];
let lastHistoryMarketHashName;

const MAX_NUM_PROVIDERS_CAN_BE_CHOSEN = 5;
const PROWIDERS_LIST_FULL_WARN_DURATION_MS = 1e4;

var COOKIE_STEAM_CURRENCY_ID = 'steamCurrencyId';

SIH?.InitWalletInfo();
SIH?.interfacePage?.loadPanelSIHMode(IS_ENABLED_SIH, isNewInterface);
SIH?.gamesList?.loadGamesList();
SIH?.RenderSIHMarketTab();

// if (g_ActiveInventory.m_steamid === g_steamID) {
//   SIH?.itemDescription?.InitSihAppSteamInventory();
// }

CAppwideInventory.prototype.LoadCompleteInventory = function () {
  if (this.m_bFullyLoaded) return $J.Deferred().resolve();

  if (!this.m_promiseLoadCompleteInventory) {
    this.EnsureChildInventoriesReady();

    var rgDeferreds = [];
    for (var contextid in this.m_rgChildInventories) {
      rgDeferreds.push(this.m_rgChildInventories[contextid].LoadCompleteInventory());
    }

    var _this = this;
    this.m_promiseLoadCompleteInventory = $J.when.apply($J, rgDeferreds).done(function () {
      _this.m_bFullyLoaded = true;
      SIH?.itemCard?.ItemCardModify();
    });
  }

  return this.m_promiseLoadCompleteInventory;
};

if (IS_ENABLED_SIH) {
  setTimeout(function () {
    // Click inventory
    $J('.trade_item_box').on('click', '.item', function (e) {
      if (!g_bViewingOwnProfile) {
        if (this.rgItem.description.marketable || (this.rgItem.is_currency && CurrencyIsWalletFunds(this.rgItem))) {
          // getLowestPriceHandlerV2(this.rgItem, true).then(() => {
          SIH?.blockOfMarketplaces?.loadForInventory(
            this.rgItem?.appid.toString(),
            this.rgItem?.description?.market_hash_name.toString(),
            ImageURL(this.rgItem?.description?.icon_url, 96, 96),
            this.rgItem?.description?.name
          );
          // });
        } else {
          SIH?.blockOfMarketplaces?.loadForInventory(
            this.rgItem?.appid.toString(),
            this.rgItem?.description?.market_hash_name.toString(),
            ImageURL(this.rgItem?.description?.icon_url, 96, 96),
            this.rgItem?.description?.name
          );
        }
      } else {
        SIH?.blockOfMarketplaces?.loadForInventory(
          this.rgItem?.appid.toString(),
          this.rgItem?.description?.market_hash_name.toString(),
          ImageURL(this.rgItem?.description?.icon_url, 96, 96),
          this.rgItem?.description?.name
        );

        if (Array.isArray(this.rgItem?.groupInventories)) {
          const numberOfSelected = (this.rgItem?.groupInventories.filter((x) => x.isSelectedForSell)).length;

          if (this.rgItem?.groupInventories.length > 1) {
            if (numberOfSelected || selectmode) {
              const isWeapon = isUniqueInventory(this.rgItem?.description.tags);

              if (isWeapon) {
                SIH?.inventoryGroup?.uniqueInventory.load(this.rgItem);
              } else {
                SIH?.inventoryGroup?.standardInventory.load(this.rgItem);
              }
            }
          } else {
            SIH?.inventoryGroup?.clear();
          }
        }
      }

      $J('.equiped').remove();
      $J('.review').remove();

      const isStack = Array.isArray(this.rgItem.groupInventories) && this.rgItem.groupInventories.length > 1;
      const includeTradelocked = $J('#include_tradelocked_checkbox').is(':checked');

      if (selectmode && !isStack) {
        if (
          this.rgItem &&
          (this.rgItem.description.marketable ||
            ((this.rgItem.blockExpiredAt ||
              this.rgItem.tradeProtectionExpiredAt ||
              +this.rgItem.description.appid === 753) &&
              includeTradelocked))
        ) {
          $J(this).toggleClass('selectedSell');
          $J('.similar-item').removeClass('similar-item');
          var p_market_hash_name = this.rgItem.description.market_hash_name;
          var iclassid = this.rgItem.classid;
          var bselected = $J(this).hasClass('selectedSell');
          if (e.ctrlKey) {
            $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
              if (
                (this.rgItem.description.marketable ||
                  ((this.rgItem.blockExpiredAt || this.rgItem.tradeProtectionExpiredAt) && includeTradelocked)) &&
                this.rgItem.classid == iclassid
              ) {
                if (bselected) {
                  $J(this).addClass('selectedSell');
                } else {
                  $J(this).removeClass('selectedSell');
                }
              }
            });
          } else if (bselected) {
            $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
              if (
                this.rgItem &&
                this.rgItem.description &&
                this.rgItem.description.market_hash_name == p_market_hash_name &&
                this.rgItem.description.marketable
              ) {
                $J(this).addClass('similar-item');
              }
            });
          }

          if (e.shiftKey && lastSelectedItem) {
            var lastContainer = $J(lastSelectedItem).parent('.itemHolder');
            var itemsPage = lastContainer.parent('.inventory_page');
            var idx1 = lastContainer.index(),
              idx2 = $J(this).parent('.itemHolder').index(),
              pidx1 = itemsPage.index(),
              pidx2 = $J(this).parents('.inventory_page').index();

            if ((pidx1 == pidx2 && idx1 > idx2) || pidx2 < pidx1) {
              var tmp = idx1;
              idx1 = idx2;
              idx2 = tmp;
            }

            for (var pi = pidx1; pi <= pidx2; pi++) {
              var filter = '.inventory_ctn:visible .inventory_page:eq(' + pi + ') .itemHolder';
              if (pi == pidx1) {
                filter += ':gt(' + idx1 + ')';

                if (pi == pidx2) {
                  filter += ':lt(' + (idx2 - idx1) + ')';
                }
              } else if (pi == pidx2) {
                filter += ':lt(' + idx2 + ')';
              }

              $J(filter + '[style!="display: none;"] .item').each(function () {
                if (
                  this.rgItem &&
                  (this.rgItem.description.marketable ||
                    ((this.rgItem.blockExpiredAt ||
                      this.rgItem.tradeProtectionExpiredAt ||
                      +this.rgItem.description.appid === 753) &&
                      includeTradelocked))
                ) {
                  $J(this).addClass('selectedSell');
                }
              });
            }
          }

          sellBtn();

          lastSelectedItem = this;
        }

        return false;
      }

      SIH?.itemDescription?.loadItemDescription();

      if (this.rgItem.description.descriptions === undefined)
        this.rgItem.description.descriptions = [{ type: 'html', value: '' }];

      SIH?.itemDescription.FloatInventoryButton(this.rgItem.description);

      if (g_inventoryData?.[g_ActiveInventory.appid]?.isLoadFirst) {
        RenderSelectAllSimilarItemsBtn(this.rgItem);
      }

      if (!this.rgItem?.description?.lowestPrice) {
        SIH?.inventoryUtils?.CopyDuplicateInventory(this.rgItem);
      }

      PriceQueue.GenPriceDescription(this.rgItem.description);
      SIH?.itemDescription?.UpdateReactDescription();
    });

    $J('.inventory_page_right').on('click', '.floatbutton', async function () {
      const $btn = $J(this);
      const $curItem = $J('.item.activeInfo');
      const rgItem = $curItem[0].rgItem;

      const actionLink = rgItem.description.actions[0].link
        .replace('%owner_steamid%', g_ActiveUser.strSteamId)
        .replace('%assetid%', rgItem.assetid);

      if (!rgItem.floatvalue) {
        $btn.hide();
        $btn.siblings('.spinner').show();

        const data = await getFloat(actionLink);
        const hasKeychain = rgItem.description.descriptions.find((item) => item.name === 'keychain_info');

        if (hasKeychain && !data.iteminfo.keychains) {
          const forcedData = await getFloat(actionLink, true);
          SIH?.itemDescription?.UpdateFloatValueInDescription(forcedData, $btn, rgItem);
        } else {
          SIH?.itemDescription?.UpdateFloatValueInDescription(data, $btn, rgItem);
        }
      } else {
        const { floatvalue, paintseed, origin, globalRatingPos, localRatingPos, keychains } = rgItem;

        const hasKeychain = rgItem.description.descriptions.find((item) => item.name === 'keychain_info');
        if (hasKeychain && !keychains) {
          const forcedData = await getFloat(actionLink, true);
          SIH?.itemDescription?.UpdateFloatValueInDescription(forcedData, $btn, rgItem);
        } else {
          SIH?.itemDescription?.UpdateFloatValueInDescription(
            {
              iteminfo: { floatvalue, paintseed, origin, globalRatingPos, localRatingPos, keychains },
            },
            $btn,
            rgItem
          );
        }
      }
    });

    if (window.show_inventory_rarity_color) {
      window.InventoryItemRarity.colorize(window.show_phase_color);
      $J('.games_list_tab').click((event) => {
        window.InventoryItemRarity.colorize(window.show_phase_color);
      });
    }

    // QuickSellAll: onclick "Quick sell all" button
    QuickSellAllFeature.init();
  }, 100);
}

if (isNewInterface) {
  if (IS_ENABLED_SIH) {
    setTimeout(() => {
      sellcurrencyId =
        typeof g_rgWalletInfo !== 'undefined' && g_rgWalletInfo.success ? g_rgWalletInfo.wallet_currency : 1;
      currencyId = typeof window.currency !== 'undefined' && window.currency !== '' ? window.currency : sellcurrencyId;

      SetCookie(COOKIE_STEAM_CURRENCY_ID, sellcurrencyId, 365);

      ExchangeRates.GetRate(() => {
        if (g_bViewingOwnProfile) {
          ModifySellingFunctions();
        }

        ModifyDescriptionFunction();
        AddDialogHTML();
        SetupAcceptAllGifts();

        if (g_ActiveInventory && g_ActiveInventory.appid) {
          SIH?.itemCard?.ItemCardModify();
          getStickerCount();
        }

        $J('.games_list_tabs .games_list_tab').click(() => {
          if (
            g_inventoryData &&
            g_inventoryData[g_ActiveInventory.appid] &&
            Array.isArray(g_inventoryData[g_ActiveInventory.appid].profile.rgDescriptions)
          ) {
            g_inventoryData[g_ActiveInventory.appid].profile.rgDescriptions = g_ActiveInventory.m_rgDescriptions;
            LoadCompleteAllInventory().then(() => {
              disabledControls(false);
            });
          }

          SIH?.interfacePage?.load();
          if (g_inventoryData?.[g_ActiveInventory.appid]?.isLoadFirst) {
            SIH?.interfacePage?.loadTotalPriceSteam();
          }
          $J('.sih.block_of_marketplace_prices.profile_inventory').remove();
          SIH?.itemCard?.ItemCardModify();
          getStickerCount();

          SIH?.itemDescription?.loadItemDescription();
        });

        setTimeout(() => {
          SIH?.interfacePage?.load();
        }, 500);
      });

      statInventoryPage.register.newInterface();
    }, 100);
  }
}
//TODO: REMOVE OLD INVENTORY DESIGN
else {
  if (IS_ENABLED_SIH) {
    setTimeout(function () {
      sellcurrencyId =
        typeof g_rgWalletInfo !== 'undefined' && g_rgWalletInfo.success ? g_rgWalletInfo.wallet_currency : 1;
      currencyId = typeof window.currency !== 'undefined' && window.currency !== '' ? window.currency : sellcurrencyId;

      SetCookie(COOKIE_STEAM_CURRENCY_ID, sellcurrencyId, 365);

      $J('.inventory_page_right .hover_item_name').after('<h2 class="dd_price"></h2>');
      if (window.usevector) {
        $J('.inventory_page_right .hover_item_name').after(
          '<a href="javascript:void(0)" id="lnk_Medium" style="clear:both; display: block">use this as vector</a>'
        );
        var _mediumName = GetCookie('mediumname');
        var _mediumAppid = GetCookie('mediumappid');
        $J('#lnk_Medium').click(function () {
          SetCookie('mediumname', g_ActiveInventory.selectedItem.description.market_hash_name, 365 * 10, '/');
          SetCookie('mediumappid', g_ActiveInventory.selectedItem.appid, 365 * 10, '/');
          getMediumPrice(g_ActiveInventory.selectedItem.description);
          return false;
        });

        if (_mediumName && _mediumAppid) {
          getMediumPrice({ market_hash_name: _mediumName, appid: _mediumAppid });
        }
      }

      // var apiKey = window._apikey;

      $J('#inventory_load_error_ctn').before(`
            <div id="sih-inventory-panel">
                <div class="row">
                    <div id="optionalPanel">
                        <button id="Lnk_Reload" class="icon-refresh" ></button>
                        <div id="Lnk_SortItems" class="dropdown">
                            <div class="dropbtn">
                                <div class="sortType asc" data-title="${SIHLang.sort.price}" data-category="price"></div>
                                <div class="caret"></div>
                            </div>
                            <div id="sort-types-content" class="dropdown-content">
                                <a href="javascript:void(0);" id="price" data-category="price">${SIHLang.sort.price}</a>
                                <a href="javascript:void(0);" id="float" data-category="float">${SIHLang.sort.float}</a>
                                <a href="javascript:void(0);" id="name" data-category="name">${SIHLang.sort.name}</a>
                                <a href="javascript:void(0);" id="blocking" data-category="blocking">${SIHLang.sort.blocking}</a>
                            </div>
                        </div>
                        <button onclick="GetFloatValues();" id="Bt_GetFloat">${SIHLang.market.getfloat}</button>
                    </div>

                    <div id="pricesPanel">
                        <div id="steamPrice">Steam price: <span class="priceValue">----</span></div>
                        <div id="providerPrice">
                            <select id="cb_provider" class="priceProvider"></select>: <span class="priceValue">----</span>
                        </div>
                        <button id="invValue">${SIHLang.inventvalue}</button>
                    </div>
                </div>
                <div class="row">
                    <div id="selectPanel">
                        <button id="Lnk_Sellmulti">${SIHLang.selectitem}</button>
                        <button id="Lnk_Sellall">${SIHLang.selectall}</button>
                        <button id="Lnk_Cancel" style="display: none;">${SIHLang.cancel}</button>
                    </div>
                    <div id="tradePanel">
                        <button id="Lnk_TurnIntoGems" style="display:none;">${SIHLang.turngems || 'Turn into gems'}</button>
                        <button id="Lnk_SendGifts" style="display:none;">${SIHLang.sendgifts || 'Send gifts'}</button>
                        <button id="Lnk_Unpack" style="display:none;">${SIHLang.unpack}</button>
                        <button id="Lnk_ShowSellMulti" style="display:none;">${SIHLang.sell1item}</button>
                    </div>
                </div>
            </div>
        `);

      if (g_ActiveInventory && hasExternalPricesAPI(g_ActiveInventory.appid)) {
        $J.getJSON(`chrome-extension://${window.SIHID}/assets/json/providers.json`, (dataList) => {
          window.PROVIDERS_LIST = dataList;
          updateInventoryProviders();
        });
      }

      if (!g_bViewingOwnProfile) $J('#sih-inventory-panel .row:last').remove();

      $J('.games_list_tab').click(() => {
        $J('#pricesPanel').toggle(window.inventoryprice && hasExternalPricesAPI(g_ActiveInventory.appid));
        if (g_ActiveInventory && hasExternalPricesAPI(g_ActiveInventory.appid)) {
          updateInventoryProviders();
          $J('#Lnk_SortItems').show();
        } else {
          $J('#Lnk_SortItems').hide();
        }

        $J('#Bt_GetFloat, #sort-types-content #float').toggle(
          g_ActiveInventory && g_ActiveInventory.appid == 730 && window.show_float_value
        );
        if (g_ActiveInventory) {
          $J('#steamPrice').toggle([730, 578080, 570, 753].includes(parseInt(g_ActiveInventory.appid, 10)));
        }
      });

      $J('#Bt_GetFloat, #sort-types-content #float').toggle(
        g_ActiveInventory && g_ActiveInventory.appid == 730 && window.show_float_value
      );
      if (g_ActiveInventory) {
        $J('#steamPrice').toggle([730, 578080, 570, 753].includes(parseInt(g_ActiveInventory.appid, 10)));
        $J('#pricesPanel').toggle(window.inventoryprice && hasExternalPricesAPI(g_ActiveInventory.appid));
        $J('#Lnk_SortItems').toggle(hasExternalPricesAPI(g_ActiveInventory.appid));
      }
      $J('#Lnk_Reload').click(function () {
        disabledControls(true);
        g_inventoryData[g_ActiveInventory.appid] = null;
        g_isLocalReloadAllInventory = false;
        g_ActiveInventory.m_iCurrentPage = 0;
        g_ActiveInventory.m_bNeedsReload = true;
        g_ActiveInventory.ReloadIfNeeded();
        cachePrices = {};
        selectmode = false;
        $J('#Lnk_Cancel').hide();
        $J('#Lnk_ShowSellMulti').hide();
        $J('#Lnk_TurnIntoGems').hide();
        $J('#Lnk_SendGifts').hide();
        $J('#Lnk_Unpack').hide();
        SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
        $J('.item.selectedSell').removeClass('selectedSell');
        $J('.similar-item').removeClass('similar-item');

        MarketplaceSource.appIdLoaded = null;
        MarketplaceSource.marketsLoaded = [];
        SteamBySihSource.appIdLoaded = null;
        SteamBySihSource.marketsLoaded = [];
        SteamLvlUpSource.appIdLoaded = null;
        SteamLvlUpSource.marketsLoaded = [];

        SetupExternalDropdown(g_ActiveInventory.appid);

        return false;
      });

      $J('#sih-inventory-panel .dropbtn .caret').click(() => {
        $J('#sih-inventory-panel #sort-types-content').toggleClass('show');
      });
      $J('#sih-inventory-panel .dropbtn .sortType').click((e) => {
        const { currentTarget } = e;
        const cat = $J(currentTarget).attr('data-category');
        const isAsc = $J(currentTarget).hasClass('asc');
        $J(currentTarget).toggleClass('asc');
        $J(currentTarget).toggleClass('desc');
        SortItem(!isAsc, cat);
      });
      $J('#sih-inventory-panel #sort-types-content').on('click', 'a', (e) => {
        const { currentTarget } = e;
        const cat = $J(currentTarget).attr('data-category');
        const title = $J(currentTarget).text();
        $J('#sih-inventory-panel .sortType').attr('data-title', title).attr('data-category', cat);
        const isAsc = $J('#sih-inventory-panel .dropbtn .sortType').hasClass('asc');
        SortItem(isAsc, cat);
        $J('#sih-inventory-panel #sort-types-content').toggleClass('show');
      });

      // Close the dropdown menu if the user clicks outside of it
      window.onclick = (event) => {
        if (!event.target.matches('.dropdown .caret')) {
          $J('.dropdown-content').removeClass('show');
        }
      };

      if (g_bViewingOwnProfile) {
        ModifySellingFunctions();
      }

      ModifyDescriptionFunction();
      AddDialogHTML();
      SetupAcceptAllGifts();

      if (window.extprice) {
        var divRight = $J(`
              <div class="sih-functions-panel">
                <div style="display: flex; align-items: center;">
                  <button id="cb_ExternalPrices">${SIHLang.showpriceproviders}</button>
                  <div class="spinner" style="display: none; margin-left: 5px; width: 16px; height: 16px; background: url(//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif) no-repeat; background-size: 16px;"></div>
                </div>
                <div id="provider_list"></div>
              </div>
            `);

        divRight.find('#cb_ExternalPrices').click((e) => {
          const { currentTarget } = e;
          const providersList = $J('.sih-functions-panel').find('#provider_list');
          providersList.toggleClass('show');
          if (providersList.hasClass('show')) $J(currentTarget).text(SIHLang.hidepriceproviders);
          else $J(currentTarget).text(SIHLang.showpriceproviders);
        });

        $J('#inventory_pagecontrols').after(divRight);
        if (g_ActiveInventory && g_ActiveInventory.appid) {
        }

        // watch for incoming # urls
        $J(window).on('hashchange', function () {
          OnLocationChange(null, window.location.hash);
        });
      }
      if (window.inventoryprice) {
        $J('.games_list_tab').on('click', function () {
          $J('#steamPrice, #providerPrice').find('.priceValue').text('----');
        });

        let isRequestPricesSteamTotal = false;
        $J(document).on('click', '#invValue', function () {
          const $total = $J('#steamPrice .priceValue');
          $J('#steamPrice, #providerPrice')
            .find('.priceValue')
            .text(`${SIHLang.loading || ''}`);

          const calc = () => {
            let sum = 0;
            $J(`.inventory_ctn:visible div.item.app${g_ActiveInventory.appid}`).each((idx, elem) => {
              sum = sum + (elem.rgItem.extprice || 0);
            });

            const loadPriceFromHtml = (price, fromCurrencyCode, toCurrencyCode) => {
              const mprice_formated = (SIH?.CurrencyService?.getPriceFromCurrency(
                price,
                toCurrencyCode,
                fromCurrencyCode
              )).text;
              $total.text(mprice_formated);
            };

            if (ExchangeRates._rates) {
              loadPriceFromHtml(sum, SteamBySihSource._getCurrencyCodeSteam(), currencyId);
            } else {
              ExchangeRates.GetRate(() => {
                loadPriceFromHtml(sum, SteamBySihSource._getCurrencyCodeSteam(), currencyId);
              });
            }
          };

          if ([730, 578080, 570, 753].includes(g_ActiveInventory.appid)) {
            SteamBySihSource.GetPrices(
              g_ActiveInventory.appid,
              { market: 'Steam' },
              true,
              () => {
                calc();
              },
              false,
              true
            );
          }

          const providerCode = $J('#cb_provider').val();
          const source = ExternalPrices[g_ActiveInventory.appid].apis.find(
            (x) => x.name.toLowerCase() === providerCode
          );
          source.api.GetPriceTotal(
            g_ActiveInventory.appid,
            {
              market: source.name,
              currencies: [],
              nameMarkerForApi: source.nameForApi,
              marketSort: source.sort,
            },
            false,
            () => {
              let price = 0;
              let priceTemplate = '';
              $J(`.inventory_ctn:visible div.item.app${g_ActiveInventory.appid}`).each((idx, elem) => {
                if (elem.rgItem) {
                  price += elem.rgItem.priceNumber || 0;
                  if (elem.rgItem.priceTemplate) {
                    priceTemplate = elem.rgItem.priceTemplate;
                  }
                }
              });

              $J('#providerPrice .priceValue').text(priceTemplate.replace('$price', price.toFixed(2)));
            }
          );

          return false;
        });
        // -------------------------
      }
      if (window.tradableinfo) {
        $J(document).on('click', '#tradable-msg-holder .hide-msg', function () {
          $J(this).parent().remove();
        });
        showNonTradableItems();
      }
      if (window.simplyinvent) {
        ModifyGamesTabs();
      }
      if (window.gpdelayscc) {
        PriceQueue._successDelay = window.gpdelayscc;
      }
      if (window.gpdelayerr) {
        PriceQueue._failureDelay = window.gpdelayerr;
      }

      statInventoryPage.register.oldInterface();
    }, 100);
  }
}

const waitFor = (delay = 0) => new Promise((resolve) => setTimeout(resolve, delay));

if (typeof BShouldSuppressFades == 'undefined') {
  BShouldSuppressFades = function () {
    return false;
  };
}

var checkPrice = function () {
  var currentIdx = $J('#iteminfo0').is(':visible') ? 0 : 1;
  var name = $J('#iteminfo' + currentIdx + '_item_name').text();
  getLowestPriceHandler();
};

var mediumPrice = 0;
var mediumName = '';

var getStickerCount = function () {
  let timer = null;
  if (+g_ActiveInventory.appid === 730) {
    const totalActiveInventoryCount = g_ActiveInventory?.g_sihItemsElements
      ? g_ActiveInventory.g_sihItemsElements.length
      : g_ActiveInventory?.m_rgChildInventories
        ? Object.values(g_ActiveInventory.m_rgChildInventories).reduce((acc, inventory) => acc + inventory.m_cItems, 0)
        : g_ActiveInventory.m_cItems;

    //TODO: УБРАТЬ КОСТЫЛИ, СДЕЛАТЬ КАКУЮ-ТО ФУНКЦИЮ, КОГДА ОТРЕДЕРЕЛИСЬ ВСЕ ПРЕДМЕТЫ
    timer = setInterval(() => {
      const $itemPriceContainer = $J(`.inventory_ctn:visible .item.app${g_ActiveInventory.appid}`).find('.item-info');
      if (totalActiveInventoryCount === $itemPriceContainer.length) {
        clearInterval(timer);
        SIH?.stickerCount?.RenderStickerCount();
      }
    }, 100);
  }
};

var getSetLink = function (d, sItem, isGenuine) {
  var itname = d.market_hash_name || d.value;
  var setLink =
    window.location.protocol +
    '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
    g_strCountryCode +
    '&currency=' +
    currencyId +
    '&market_hash_name=' +
    (isGenuine ? 'Genuine%20' : '') +
    encodeURIComponent(itname);
  d.setLink = setLink;
  d.isinset = true;
  if (cachePrices[setLink] && cachePrices[setLink].lowestPrice) {
    d.app_data.price = cachePrices[setLink].lowestPrice;
    d.app_data.market_hash_name = cachePrices[setLink].market_hash_name;
    d.app_data.owned = cachePrices[setLink].owned;

    if (sItem === g_ActiveInventory.selectedItem.description) {
      // Возможно тут нужно делать обновление дескрипшена
    }
    return;
  } else {
    cachePrices[setLink] = { market_hash_name: (isGenuine ? 'Genuine ' : '') + itname };
    var exp = new RegExp('.*' + cachePrices[setLink].market_hash_name.replace('The ', '(The )?') + '$');
    $J.each(g_ActiveInventory.rgInventory, function () {
      if (exp.test(this.market_hash_name)) {
        cachePrices[setLink].market_hash_name = this.market_hash_name;
        cachePrices[setLink].owned = true;
        return false;
      }
    });
    d.app_data.market_hash_name = cachePrices[setLink].market_hash_name;
    if (!d.value.startsWith('<a href=')) {
      d.app_data.owned = cachePrices[setLink].owned;
      d.value =
        '<a href="https://steamcommunity.com/market/listings/' +
        sItem.appid +
        '/' +
        cachePrices[setLink].market_hash_name +
        '" target="_blank" >' +
        d.value +
        '</a>';
    }
    // Возможно тут нужно делать обновление дескрипшена
  }

  return;
};

var getMediumPrice = function (sItem) {
  if (!sItem.market_hash_name) {
    sItem.market_hash_name = sItem.name;
  }
  var itemLink =
    window.location.protocol +
    '//steamcommunity.com/market/priceoverview/?appid=' +
    sItem.appid +
    '&country=' +
    g_strCountryCode +
    '&currency=' +
    currencyId +
    '&market_hash_name=' +
    encodeURIComponent(sItem.market_hash_name);
  mediumName = sItem.market_hash_name;
  PriceQueue.GetPrice({
    method: 'GET',
    url: itemLink,
    success: function (response) {
      if (response.success) {
        mediumPrice = response.lowest_price;
      }
    },
  });
};

var getGiftPrice = function (gitem) {
  var appIdExp = /http:\/\/store.steampowered.com\/app\/(\d+)\//;
  var storeLink = gitem.description.actions[0].link;
  var appid = appIdExp.exec(storeLink)[1];
  $J('.dd_price').text('Loading...');
  RequestCacher.get({
    url: window.location.protocol + '//store.steampowered.com/api/appdetails?appids=' + appid,
    crossDomain: true,
  })
    .then(function (res) {
      if (res && res[appid] && res[appid].success) {
        var price_overview = res[appid].data.price_overview;
        var strPrice = '';
        if (price_overview.discount_percent > 0) {
          strPrice =
            price_overview.final / 100 + ' (-' + price_overview.discount_percent + ') ' + price_overview.currency;
        } else {
          strPrice = price_overview.final / 100 + ' ' + price_overview.currency;
        }
        $J('.dd_price').html(strPrice);
      }
    })
    .catch(function () {
      $J('.dd_price').text('Error');
    });
};

const checkWeapon = (tags) =>
  tags.find((x) => x.category.toUpperCase() === 'WEAPON' || x.category.toUpperCase() === 'EXTERIOR');

// Check if item marketable or will be marketable soon
const checkIfItemWillBeMarketable = () => {
  return $J('#iteminfo1_item_owner_descriptors .descriptor').length;
};

function getLowestPriceHandler(gitem, callback, isSale = false) {
  const sItem = gitem || g_ActiveInventory.selectedItem;
  if (
    !sItem ||
    (!sItem.description?.market_hash_name && !(sItem.description.market_hash_name = sItem.description.name))
  )
    return;

  if (sItem.appid == 753 && !sItem.description.marketable && !checkIfItemWillBeMarketable()) return;

  const cc = g_strCountryCode || getStoreRegionCountryCode() || g_rgWalletInfo.wallet_country;
  const encodedName = encodeURIComponent(sItem.description.market_hash_name);
  const itemLink = `${location.protocol}//steamcommunity.com/market/priceoverview/?appid=${sItem.appid}&market_hash_name=${encodedName}`;
  const itemLinkW = itemLink;

  assignCachedPrices(sItem, itemLink, '');
  assignCachedPrices(sItem, itemLinkW, 'W');

  let isGenuine = sItem.description.tags?.some((tag) => tag.category === 'Quality' && tag.internal_name === 'genuine');

  if (!sItem.description.descriptions) sItem.description.descriptions = [{ type: 'html', value: '' }];

  const floatIndex = sItem.description.descriptions.findIndex((desc) => desc.isFloat);
  if (floatIndex > -1) sItem.description.descriptions.splice(floatIndex, 1);

  const isWeapon = checkWeapon(sItem.description.tags);
  const isStack = Array.isArray(sItem.groupInventories) && sItem.groupInventories.length > 1;

  if (+sItem.appid === 730 && !isStack && isWeapon && sItem.description.actions?.length) {
    sItem.description.descriptions.unshift({
      isFloat: true,
      type: 'html',
      value: makeFloatButtonHTML(),
    });
  }

  if (window.agp_gem && sItem.description.type !== 'Rare Inscribed Gem' && sItem.appid == 570) {
    sItem.description.descriptions.forEach((d) => {
      if (!d.app_data?.is_itemset_name && !d.app_data?.price && !d.app_data?.limited) {
        getSetLink(d, sItem.description, isGenuine);
      }
      d.insgems = [];
      applyGemPattern(d, cc, 'Inscribed ', insGemExp);
      applyGemPattern(d, cc, 'Kinetic: ', kinGemExp);
      applyGemPattern(d, cc, 'Rune%20of%20the%20Duelist%20Indomitable', masGemExp, true);
      applyGemPattern(d, cc, 'Foulfell Shard', corGemExp, true);
      applyGemPattern(d, cc, 'Ethereal: ', ethGemExp);
      applyGemPattern(d, cc, 'Prismatic: ', priGemExp);
      if (!d.insgems.length) delete d.insgems;
    });
  }

  if (!sItem.description.marketable && callback && itemLinkW === itemLink) {
    callback(sItem);
    if (!checkIfItemWillBeMarketable()) return;
  }

  injectCountDescription(sItem);

  const freshEnough = Date.now() - (sItem.description.priceDateMs || 0) < +window.priceUpdateTime;
  if (sItem.description.lowestPrice && freshEnough) {
    if (g_bViewingOwnProfile && (!sItem.countGroupInventory || sItem.countGroupInventory === 1)) {
      const strMarketName = GetMarketHashName(sItem.description);
      SIH?.inventoryUtils?.LoadQuickSellForInventoryItem(strMarketName);
      SIH?.inventoryUtils?.LoadInstantSellForInventoryItem(sItem);
    }
    PriceQueue.GenPriceDescription(sItem.description);
    if (callback && itemLinkW === itemLink) callback(sItem);
    return;
  }

  PriceQueue.GetPrice({
    method: 'GET',
    url: itemLink,
    contextId: +sItem.contextid,
    success(response) {
      if (!response.success) return;
      if (/SOLD!/i.test(response.lowest_price)) console.log(itemLink, response);
      updateCachedPrices(sItem, response, itemLink);
      PriceQueue.GenPriceDescription(sItem.description);
      if (itemLinkW === itemLink) {
        sItem.description.lowestPriceW = response.lowest_price;
        sItem.description.nofeePriceW = response.median_price;
        sItem.description.providerName = response.providerName;
        if (callback) callback(sItem);
      }
    },
    error() {},
  });

  function assignCachedPrices(sItem, itemLink, suffix) {
    const cache = cachePrices[itemLink];
    if (cache?.nofeePrice) {
      sItem.description[`nofeePrice${suffix}`] = cache.nofeePrice;
      sItem.description[`lowestPrice${suffix}`] = cache.lowestPrice;
      sItem.description[`providerName${suffix}`] = cache.providerName;
      if (!suffix) {
        sItem.description.priceDateMs = cache.priceDateMs;
        sItem.description.transport = cache.transport;
      }
    } else {
      cachePrices[itemLink] = { market_hash_name: sItem.description.market_hash_name, owned: true };
    }
  }

  function updateCachedPrices(sItem, response, itemLink) {
    const cache = cachePrices[itemLink];
    cachePrices[itemLink] = {
      ...cache,
      lowestPrice: (sItem.description.lowestPrice = response.lowest_price),
      nofeePrice: (sItem.description.nofeePrice = response.median_price),
      priceDateMs: (sItem.description.priceDateMs = response.priceDateMs),
      transport: (sItem.description.transport = response.transport),
      volume: (sItem.description.volume = response.volume),
      providerName: (sItem.description.providerName = response.providerName),
    };
  }

  function injectCountDescription(sItem) {
    const hasCountDesc = sItem.description.descriptions.some((x) => x.iscount);
    if (!hasCountDesc) {
      const similarCount = g_bViewingOwnProfile
        ? `(<a href="javascript:selectSimilar(${sItem.classid})">${SIHLang.selectall}</a>)`
        : '';
      sItem.description.descriptions.unshift({
        iscount: true,
        type: 'html',
        value: `${SIHLang.numowned}: <i style="color: rgb(153, 204, 255); font-size: 16px">${sItem.description.useCountMarketHashName}</i> ${similarCount}`,
      });
    }
  }

  function makeFloatButtonHTML() {
    return `
    <div class="float_block">
      <a class="item_market_action_button item_market_action_button_green floatbutton" href="javascript:void(0);">
        <span class="item_market_action_button_edge item_market_action_button_left"></span>
        <span class="item_market_action_button_contents">${SIHLang.market.getfloat}</span>
        <span class="item_market_action_button_edge item_market_action_button_right"></span>
        <span class="item_market_action_button_preload"></span>
      </a>
      <div class="spinner"></div>
    </div>
  `;
  }

  function applyGemPattern(d, cc, gemPrefix, regex, isStatic = false) {
    let match,
      gidx = d.insgems.length;
    while ((match = regex.exec(d.value))) {
      const gemName = isStatic ? gemPrefix : gemPrefix + match[1];
      const gemLink = `${location.protocol}//steamcommunity.com/market/priceoverview/?appid=570&country=${cc}&currency=${currencyId}&market_hash_name=${gemName}`;
      d.insgems.push({ name: gemName });

      PriceQueue.GetPrice({
        method: 'GET',
        url: gemLink,
        pars: { gemidx: gidx },
        success(response, $this) {
          if (response.success) {
            d.insgems[$this.gemidx].lowestPrice = response.lowest_price;
            d.insgems[$this.gemidx].nofeePrice = response.median_price;
            if (g_ActiveInventory.selectedItem === sItem) {
              // Возможно тут нужно делать обновление дескрипшена
            }
          }
        },
        error() {},
      });
      gidx++;
    }
  }
}

var getLowestPriceHandlerV2 = function (rgItem, isFirst = false) {
  let promise = new Promise(async (resolve, reject) => {
    rgItem = rgItem || g_ActiveInventory.selectedItem;

    if (!rgItem.description.lowestPrice) {
      SIH?.inventoryUtils?.CopyDuplicateInventory(rgItem);
    }

    // if (rgItem.description.lowestPrice) {
    // resolve(rgItem);
    // } else {
    if (!isFirst) {
      await sleep(3000);
    }

    const strMarketName = GetMarketHashName(rgItem.description);
    const currencyCode = g_rgWalletInfo['wallet_currency'] || currencyId || 1;

    new Ajax.Request('https://steamcommunity.com/market/priceoverview/', {
      method: 'get',
      parameters: {
        country: g_strCountryCode,
        currency: currencyCode,
        appid: rgItem.appid,
        market_hash_name: strMarketName,
      },
      onSuccess: function () {
        resolve(rgItem);
      },
      onFailure: function () {
        reject(rgItem);
      },
      sihData: {
        rgItem: rgItem,
        isSellInventory: true,
      },
    });
    // }
  });

  return promise
    .then((res) => {
      return { err: null, data: res };
    })
    .catch((err) => {
      return { err, data: null };
    });
};

var selectSimilar = function (marketHashName) {
  selectmode = true;
  if (!selectmode) $J('#Lnk_Sellmulti').trigger('click');

  const isGroupInventory = g_inventoryData[g_ActiveInventory.appid].isGroupInventory;

  const isIncludeTradeLocked = $J('#include_tradelocked_checkbox').is(':checked');
  const isSteamInventory = +g_ActiveInventory.appid === 753;

  $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
    if (
      (isSteamInventory && isIncludeTradeLocked && el.rgItem.description.market_hash_name === marketHashName) ||
      (el.rgItem.description.marketable && el.rgItem.description.market_hash_name === marketHashName)
    ) {
      if (isIncludeTradeLocked && isSteamInventory) {
        $J('.sih_inventory_panel').find('.sih_turn_info_gems_inventory_button').show();
      }

      if (isGroupInventory) {
        $J(el).parent().find('.selectedSell').remove();
        $J(el).addClass('group_inventory_master_selected_sell');
        el.rgItem.groupInventories.forEach((item, i) => {
          item.isSelectedForSell = true;
          addSell(el, item, i);
        });
        SIH?.inventoryGroup?.loadGroupInventoryDialog();
      } else {
        g_ActiveInventory.LoadItemImage($J(el));
        $J(el).addClass('selectedSell');
      }
    }
  });

  var itC = $J('.selectedSell').length;
  if (itC > 0) {
    $J('#Lnk_ShowSellMulti').html(itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item);
    $J('#Lnk_ShowSellMulti').show();
    if (g_ActiveInventory.appid == 753) {
      $J('#Lnk_TurnIntoGems').show();
      $J('#Lnk_SendGifts').show();
    }
  }

  sellBtn();

  const $container = $J('.sih_inventory_panel');
  $container.find('.sih_cancel_select_all_inventory_button').show();
  $container.find('.sih_select_inventory_button').hide();
  $container.find('.sale_container .go_sale_button').css({ display: 'flex' });
  $container.find('.sale_container .info_container').css({ display: 'flex' });
  $container.find('#include_tradelocked_checkbox').checkboxradio();
  $container.find('#sih-check-gem-prices').checkboxradio();

  return false;
};

var setGemPrice = function (sItem, gemName, gemType, callback) {
  var gemLink =
    window.location.protocol +
    '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
    g_strCountryCode +
    '&currency=1&market_hash_name=' +
    gemName;
  PriceQueue.GetPrice({
    method: 'GET',
    url: gemLink,
    success: function (response, textStatus, jqXHR) {
      var lp = 0,
        nfp = 0;
      if (response.success) {
        lp = response.lowest_price;
        var pp = /([\d\.,]+)/.exec(
          lp
            .replace(/\&#\d+;/g, '')
            .replace(' p&#1091;&#1073;.', '')
            .replace(/,/g, '.')
        )[1];
        sItem.extimatePrice[gemName] = pp;
        callback(sItem);
      }
    },
    error: function () {},
  });
};

var imgRex = /<img.*?src="([^"]+?)"[^>]*>/g,
  imgRex2 = /background-image: url\(([^\)]+?)\)/g;

var recalTotal = function () {
  var totalWithoutFee = 0;
  var totalWithFee = 0;
  $J('.queue-item-container:visible').each(function (idx, elem) {
    totalWithoutFee += elem.rgItem.description.sellerPrice;
    totalWithFee += elem.rgItem.description.buyerPrice;
  });

  $J('.queue-total-price .without-fee').html(
    v_currencyformat(totalWithoutFee, GetCurrencyCode(g_rgWalletInfo.wallet_currency))
  );
  $J('.queue-total-price .with-fee').html(
    v_currencyformat(totalWithFee, GetCurrencyCode(g_rgWalletInfo.wallet_currency))
  );
};

// Grind: show queue
var ShowQueue = async function (goo) {
  lastHistoryMarketHashName = null;
  SIH?.confirmModal?.loadConfirm();

  $J('div.queue-container').remove();
  var selectedItems = $J('.selectedSell');

  selectedItems.sort(function (a, b) {
    var rgItemA = a.rgItem,
      rgItemB = b.rgItem;

    if (rgItemA.description.market_hash_name == rgItemB.description.market_hash_name) {
      return 0;
    } else if (rgItemA.description.market_hash_name < rgItemB.description.market_hash_name) {
      return -1;
    } else {
      return 1;
    }
  });

  if (!goo) {
    var rgItem = selectedItems[0].rgItem;
    g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
    g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
    SellItemDialog.m_bWaitingOnServer = false;
    SellItemDialog.Show(rgItem);
  }

  var div = $J('<div class="queue-container">');
  var rightDiv = $J('<div class="queue-right-panel">');
  div.append(rightDiv);

  var cdiv = $J('<div class="scrollbar-inner">');

  QuickSellAllFeature.addButton(cdiv);

  div.append(cdiv);

  selectedItems.each(function () {
    var rgItem = null;
    if (
      !(rgItem = this.rgItem) ||
      (!rgItem.description.marketable && !goo) ||
      (goo == '1' && (rgItem.appid != 753 || rgItem.contextid != 6))
    ) {
      $J(this).removeClass('selectedSell');
      return true;
    }
    var container = $J('<div class="queue-item-container" data-id="' + rgItem.assetid + '">');
    container.append('<a href="#" class="queue-item-remove" title="Remove from queue">&#x2212;</a>');
    var img = '';
    if (rgItem.fraudwarnings) {
      img +=
        '<img src="https://steamcommunity-a.akamaihd.net/public/images/sharedfiles/icons/icon_warning.png" height="16" />';
    }
    if (rgItem.description.descriptions && rgItem.description.descriptions.length) {
      var mm = null;
      for (var i = 0; i < rgItem.description.descriptions.length; i++) {
        while (
          (mm = imgRex.exec(rgItem.description.descriptions[i].value)) != null ||
          (mm = imgRex2.exec(rgItem.description.descriptions[i].value)) != null
        ) {
          img += '<img src="' + mm[1] + '" height="16"/>';
        }
      }
    }
    if (img.length > 0) {
      container.append('<div class="item-bagde">' + img + '</div>');
    }
    var item = $J('<div class="queue-item">');
    item.css('border-color', '#' + rgItem.description.name_color);

    if (window.show_inventory_rarity_color && rgItem && rgItem.description && rgItem.description.tags) {
      window.InventoryItemRarity.colorizeItem(rgItem, item, window.show_phase_color);
    }

    if ($J(this).find('.item_equipped').length) {
      SIH?.AppendElementToItemHeader(item, 'equipped');
    }

    if ($J(this).find('.item_intrade').length) {
      SIH?.AppendElementToItemHeader(item, 'intrade');
    }
    /* if (window.extmasslisting && rgItem.extprice) {
     var extpricetag = $J('<div class="p-price"></div>');
     extpricetag.prop('title', rgItem.extprice_provider);
     extpricetag.text(v_currencyformat(rgItem.extprice * 100, GetCurrencyCode(typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo.wallet_currency : 1)));
     item.append(extpricetag);
   }*/

    const itemImage = $J(this).find('img').clone();
    itemImage.css({ 'max-width': '96px', 'max-height': '96px' });
    item.append(itemImage);
    container[0].rgItem = rgItem;
    container.append(item);
    AddItemHoverToElement(item[0], rgItem);
    cdiv.append(container);
  });

  const itemCount = $J('.selectedSell').length;
  if (itemCount === 0) {
    if (goo == '1') {
      GrindDialog.Dismiss();
    } else {
      SellItemDialog.Dismiss();
    }
    $J('div.queue-container').remove();
    $J('#Lnk_ShowSellMulti').hide();
    $J('#Lnk_TurnIntoGems').hide();
    $J('#Lnk_SendGifts').hide();
    $J('#Lnk_Unpack').hide();

    return false;
  } else {
    $J('#Lnk_ShowSellMulti').html(itemCount > 1 ? SIHLang.sellnitem.replace('$1', itemCount) : SIHLang.sell1item);
  }

  rightDiv.append(`<div class="queue-panel">
        <div class="queue-item-count">
            <span>${SIHLang.queue.items}</span>
            <span>${$J('.selectedSell').length}</span>
        </div>
    </div>
    <div class="queue-panel">
        <div class="queue-total-price">
            <span class="">${SIHLang.queue.withfee}</span>
            <span class="with-fee" title="Total buyer will pay"></span>
            <span class="">${SIHLang.queue.withoutfee}</span>
            <span class="without-fee" title="Total will recieve"></span>
        </div>
    </div>`);
  rightDiv.append(`<div class="queue-panel">
        <div class="queue-remove-panel">
            <div class="block-title">${SIHLang.queue.removeitem}</div>
            <input type="text" class="num" id="txt_remove_queue" />
            <button class="btnControl btnGreen" id= "bt_lower">${SIHLang.queue.removelower}</button>
            <button class="btnControl btnGreen" id= "bt_higher">${SIHLang.queue.removehigher}</button>
            <button class="btnControl btnGreen" id= "bt_intrade">${SIHLang.queue.removeintrade}</button>
            <button class="btnControl btnGreen" id= "bt_removeequipped">${SIHLang.queue.removeequipped}</button>
        </div>
    </div>`);
  rightDiv.append(`<div class="queue-panel">
        <div class="queue-sort-panel">
            <div class="block-title">${SIHLang.sort.sortitem}</div>
            <button class="btnControl btnGreen" id="bt_sort_price">${SIHLang.sort.price} <span class="market_sort_arrow"></span></button>
        </div>
    </div>`);

  div.find('#bt_lower, #bt_higher').click(function (e) {
    var operator = $J(this).attr('id') === 'bt_lower' ? -1 : 1;
    var pricetocompare = getPriceAsInt($J('#txt_remove_queue').val());
    if (isNaN(pricetocompare)) return false;
    $J('.queue-item-container:visible').each(function (idx, elem) {
      var item = elem.rgItem;
      if (item && (item.description.lowestPriceW || item.extprice)) {
        var price = item.description.lowestPriceW ? getPriceAsInt(item.description.lowestPriceW) : item.extprice || 0;
        if (price * operator > pricetocompare * operator) {
          $J(elem).find('.queue-item-remove').trigger('click');
        }
      }
    });
    return false;
  });

  div.find('#bt_intrade').click(function (e) {
    $J('.queue-item-container:visible').each(function (idx, elem) {
      if ($J(elem).find('.item_intrade').length) {
        $J(elem).find('.queue-item-remove').trigger('click');
      }
    });
    setTimeout(function () {
      recalTotal();
    }, 100);
    return false;
  });

  div.find('#bt_removeequipped').click(function (e) {
    $J('.queue-item-container:visible').each(function (idx, elem) {
      if ($J(elem).find('.item_equipped').length) {
        $J(elem).find('.queue-item-remove').trigger('click');
      }
    });
    setTimeout(function () {
      recalTotal();
    }, 100);
    return false;
  });

  div.find('#bt_sort_price').click(function (e) {
    if (isSorting) {
      return false;
    }
    isSorting = true;
    var order = 1;
    $this = $J(this);
    if ($this.find('.market_sort_arrow').is(':contains("▲")')) {
      order = -1;
      $this.find('.market_sort_arrow').text('▼');
    } else {
      $this.find('.market_sort_arrow').text('▲');
    }

    var $rows = div.find('div:has(>.queue-item-container:visible)'),
      $rowsli = $rows.children('.queue-item-container:visible');

    $rowsli.sort(function (a, b) {
      var rgIa = a.rgItem,
        rgIb = b.rgItem;

      if (!rgIa) return order;
      if (!rgIb) return order * -1;

      var an =
          typeof rgIa.description.lowestPriceW == 'undefined'
            ? rgIa.extprice || 0
            : getPriceAsInt(rgIa.description.lowestPriceW),
        bn =
          typeof rgIb.description.lowestPriceW == 'undefined'
            ? rgIb.extprice || 0
            : getPriceAsInt(rgIb.description.lowestPriceW);

      if (an == bn) {
        an = rgIa.market_hash_name;
        bn = rgIb.market_hash_name;
      }

      if (an > bn) {
        return 1 * order;
      }
      if (an < bn) {
        return -1 * order;
      }
      return 0;
    });

    $rowsli.detach().appendTo($rows);

    var rgItem = $J('.queue-item-container:visible')[0].rgItem;
    g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
    g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
    UpdateSellItem(rgItem);

    isSorting = false;
    return false;
  });

  $J('body').append(div);
  $J(cdiv).scrollbar();

  qTotalPrice = 0;
  qTotalBuyerPrice = 0;
  if (goo) {
    GetQueueGoo();
  } else {
    const { isAutoAjust = false } = LocalStorageJSON.get('SIH_PROFILE_INVENTORY') || {};
    if (isAutoAjust) {
      GetQueuePrice();
      PriceQueue.UpdateHandler = ContinueListing;
      var rgItem1 = $J('.queue-item-container')[0].rgItem;
      g_ActiveInventory.SelectItem(null, rgItem1.element, rgItem1);
      g_ActiveInventory.EnsurePageActiveForItem(rgItem1.element);
      // updateInfoWindow(rgItem1);
    }
  }
};

var qTimer = null;
var qTotalPrice = 0;
var qTotalBuyerPrice = 0;
let isSorting = false;

const GetQueuePrice = function (cb = () => {}) {
  isSorting = false;
  if (qTimer) window.clearTimeout(qTimer);

  const items = $J('.queue-item-container:not(:has(>span.price))').get();

  items.sort((a, b) => {
    const nameA = a.rgItem.description.market_hash_name;
    const nameB = b.rgItem.description.market_hash_name;
    return nameA.localeCompare(nameB);
  });

  for (let i = 0; i < items.length; i++) {
    const rgItem = items[i].rgItem;

    if (window.extmasslisting && rgItem.extprice) {
      const inputValue = getPriceAsInt(String(rgItem.extprice));
      if (inputValue > 0 && Number.isInteger(inputValue)) {
        const { buyerPrice, sellerPrice, formattedSellerPrice } = calculateFeeInfo(inputValue, rgItem);

        rgItem.description.buyerPrice = buyerPrice;
        rgItem.description.sellerPrice = sellerPrice;

        qTotalPrice += buyerPrice;
        qTotalBuyerPrice += sellerPrice;

        updateTotalPrices();
        appendPriceTag($J(items[i]), rgItem.extprice, formattedSellerPrice);
      }
      continue;
    }

    getLowestPriceHandler(
      rgItem,
      function (item) {
        if (item && item.description.lowestPriceW) {
          const inputValue = getPriceAsInt(item.description.lowestPriceW);
          if (inputValue > 0 && Number.isInteger(inputValue)) {
            const { buyerPrice, sellerPrice, formattedSellerPrice } = calculateFeeInfo(inputValue, item);

            item.description.buyerPrice = buyerPrice;
            item.description.sellerPrice = sellerPrice;

            const $container = $J(`.queue-item-container[data-id="${item.assetid}"]`);
            appendPriceTag($container, item.description.lowestPriceW, formattedSellerPrice);

            qTotalPrice += buyerPrice;
            qTotalBuyerPrice += sellerPrice;

            updateTotalPrices();
            cb();
          }
        } else {
          $J(`#${item.appid}_${item.contextid}_${item.assetid}.selectedSell`).removeClass('selectedSell');
          $J(`.queue-item-container[data-id="${item.assetid}"]`).remove();

          const count = $J('.inventory_page .selectedSell').length;
          if (count <= 0) {
            SellItemDialog.Dismiss();
            $J('#Lnk_ShowSellMulti, #Lnk_TurnIntoGems, #Lnk_SendGifts, #Lnk_Unpack').hide();
            return false;
          }

          $J('.queue-item-count span:last').text(count);
          $J('#Lnk_ShowSellMulti').text(count > 1 ? SIHLang.sellnitem.replace('$1', count) : SIHLang.sell1item);

          const nextItem = $J('.queue-item-container')[0]?.rgItem;
          if (nextItem) {
            g_ActiveInventory.SelectItem(null, nextItem.element, nextItem);
            g_ActiveInventory.EnsurePageActiveForItem(nextItem.element);
            UpdateSellItem(nextItem);
          }

          cb();
        }
      },
      true
    );

    function updateTotalPrices() {
      const currencyCode = GetCurrencyCode(g_rgWalletInfo.wallet_currency);
      $J('.queue-total-price .with-fee').text(v_currencyformat(qTotalPrice, currencyCode));
      $J('.queue-total-price .without-fee').text(v_currencyformat(qTotalBuyerPrice, currencyCode));
    }

    function appendPriceTag($container, displayPrice, tooltipPrice) {
      const priceTag = $J('<span class="price"></span>').html(displayPrice).attr('title', tooltipPrice);
      $container.append(priceTag);
    }

    function calculateFeeInfo(amount, item) {
      const publisherFee = window.PriceUtils.publisherFee(item, g_rgWalletInfo);
      const feeInfo = CalculateFeeAmount(amount, publisherFee);
      const sellerAmount = amount - feeInfo.fees;
      const formattedSellerPrice = v_currencyformat(
        sellerAmount,
        GetCurrencyCode(currencyId || g_rgWalletInfo.wallet_currency)
      );
      return { buyerPrice: amount, sellerPrice: sellerAmount, formattedSellerPrice };
    }
  }
};

let GET_GOO_VALUE_MAX_RETRIES = 20;
var GetQueueGoo = async function (retryNum = GET_GOO_VALUE_MAX_RETRIES) {
  try {
    isSorting = false;
    if (qTimer) window.clearTimeout(qTimer);
    var it = $J('.queue-item-container:not(:has(>span.price))');
    if (it.length > 0) {
      var rgItem = it[0].rgItem;

      if (rgItem.goo_value === undefined) {
        var strActionURL = g_strProfileURL + '/ajaxgetgoovalue/';

        const data = await $J.get(strActionURL, {
          sessionid: g_sessionID,
          appid: getAppIdFromTags(rgItem.description.tags),
          assetid: rgItem.assetid,
          contextid: rgItem.contextid,
        });

        rgItem.goo_value = +data.goo_value;
      }

      if (rgItem.goo_value > 0) {
        var pp = $J('<span class="price"></span>');
        pp.html(rgItem.goo_value);
        pp.attr('title', rgItem.goo_value);

        $J(it[0]).append(pp);

        qTotalPrice += parseInt(rgItem.goo_value);
        $J('.queue-total-price .with-fee').html(qTotalPrice);
        $J('.queue-total-price .without-fee').text('gems');
      } else {
        const { appid, contextid } = it[0].rgItem;
        const cellId = $J(it[0]).data().id;

        $J(`#${appid}_${contextid}_${cellId}.selectedSell`).removeClass('selectedSell');

        var itC = selectedItemsQty(); // Check if there is more then 0 elements in queue
        if (itC <= 0) {
          GrindDialog.Dismiss();
          $J('#Lnk_ShowSellMulti').hide();
          $J('#Lnk_TurnIntoGems').hide();
          $J('#Lnk_SendGifts').hide();
          $J('#Lnk_Unpack').hide();
          return false;
        }

        var rgItem1 = $J('.queue-item-container')[0].rgItem;
        g_ActiveInventory.SelectItem(null, rgItem1.element, rgItem1);
        g_ActiveInventory.EnsurePageActiveForItem(rgItem1.element);
        UpdateSellItem(rgItem1);
        $J('#Lnk_ShowSellMulti').html(itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item);
        $J(it[0]).remove();

        // Grind: show alert 'no items'
        const itemsToGrind = itemToGrindQty();
        $J('.queue-item-count span:last').html(itemsToGrind);

        if (!GrindDialog.m_bIsDismissed && itemsToGrind <= 0) {
          GrindDialog.SetMessage(SIHLang.noitemstoconvertintogems);
        }
      }

      window.setTimeout(() => GetQueueGoo(), 50);
    }
  } catch (error) {
    console.log('GetQueueGoo: error', error);
    if (retryNum >= 0) {
      return window.setTimeout(() => GetQueueGoo(retryNum - 1), 150);
    }
    console.log('GetQueueGoo: error stop retries. Steam server responds with errors.');
  }
};

var SetQueueTotal = function () {
  qTotalPrice = 0;
  qTotalBuyerPrice = 0;
};

var getAppIdFromTags = function (tags) {
  var appId = null;
  var appName = '';
  tags.map(function (item) {
    if (item.category.toLowerCase() === 'game') appName = item.internal_name;
  });
  var matched = appName.match(/app_(\d+)/);
  if (matched) {
    appId = matched[1];
  }
  return appId;
};

// Grind: GrindNextItem
const itemToGrindQty = () => $J('.queue-item.economy_item_hoverable:visible').length;
const selectedItemsQty = () => $J('.inventory_page .selectedSell').length;

var GrindNextItem = async function () {
  const itemsToGrind = itemToGrindQty();
  const selectedItems = selectedItemsQty();

  if (itemsToGrind === 0) {
    // there is no elements to grind
    if (selectedItems === 0) {
      // there is no selected elements
      $J('#Lnk_ShowSellMulti').hide();
      $J('#Lnk_TurnIntoGems').hide();
      $J('#Lnk_SendGifts').hide();
      $J('#Lnk_Unpack').hide();
    }

    GrindDialog.Dismiss();

    ReloadCommunityInventory(g_ActiveInventory.selectedItem.assetid);
    SIH?.RecalculateRefillBalanceButton();
    $J('.sih_cancel_select_all_inventory_button').trigger('click');
  } else if (itemsToGrind > 0 && !GrindDialog.m_bIsDismissed) {
    $J('.queue-item-count span:last').html(itemsToGrind);
    $J('#Lnk_ShowSellMulti').html(itemsToGrind > 1 ? SIHLang.sellnitem.replace('$1', itemsToGrind) : SIHLang.sell1item);
    const visibleItemsList = $J('.queue-item-container:visible');

    if (!visibleItemsList || !visibleItemsList[0]) {
      return;
    }

    const rgItem = visibleItemsList[0].rgItem;
    g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
    g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);

    if (rgItem.goo_value) {
      var rgAJAXParams = {
        sessionid: g_sessionID,
        appid: getAppIdFromTags(rgItem.description.tags),
        assetid: rgItem.assetid,
        contextid: rgItem.contextid,
        goo_value_expected: rgItem.goo_value,
      };
      strActionURL = g_strProfileURL + '/ajaxgrindintogoo/';

      try {
        await $J.post(strActionURL, rgAJAXParams);

        g_ActiveInventory.selectedItem.description.marketable = 0;
        $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
        $J(g_ActiveInventory.selectedItem.element).data('selling', true);
        $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
        $J('div.queue-item-container[data-id=' + g_ActiveInventory.selectedItem.assetid + ']').hide(200, () =>
          setTimeout(() => {
            GrindNextItem();
          }, 100)
        );
      } catch (error) {
        console.error('GrindNextItem: an error occured', error);
        $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
        $J(g_ActiveInventory.selectedItem.element).data('selling', true);
        $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
        $J('div.queue-item-container[data-id=' + g_ActiveInventory.selectedItem.assetid + ']').hide(200, () =>
          setTimeout(() => {
            GrindNextItem();
          }, 100)
        );
      }
    }
  } else {
    GrindDialog.Dismiss();
  }
};

function GrindIntoGoo(appid, contextid, itemid) {
  var rgAJAXParams = {
    sessionid: g_sessionID,
    appid: appid,
    assetid: itemid,
    contextid: contextid,
  };
  var strActionURL = g_strProfileURL + '/ajaxgetgoovalue/';

  $J.get(strActionURL, rgAJAXParams)
    .done(function (data) {
      var $Content = $J(data.strHTML);
      var strDialogTitle = data.strTitle;
      ShowConfirmDialog(strDialogTitle, $Content).done(function () {
        strActionURL = g_strProfileURL + '/ajaxgrindintogoo/';
        rgAJAXParams.goo_value_expected = data.goo_value;

        $J.post(strActionURL, rgAJAXParams)
          .done(function (data) {
            ShowAlertDialog(strDialogTitle, data.strHTML);
            ReloadCommunityInventory(itemid);

            SIH?.RecalculateRefillBalanceButton();
          })
          .fail(function (xhr) {
            if (xhr.responseJSON && xhr.responseJSON.message) {
              ShowAlertDialog('Action Failed', xhr.responseJSON.message);
            } else {
              ShowAlertDialog(
                'Action Failed',
                'There was an error communicating with the network. Please try again later.'
              );
            }
          });
      });
    })
    .fail(function (xhr) {
      if (xhr.responseJSON && xhr.responseJSON.message) {
        ShowAlertDialog('Action Failed', xhr.responseJSON.message);
      } else {
        ShowAlertDialog('Action Failed', 'There was an error communicating with the network. Please try again later.');
      }
    });
}

/**
 * Модуль для добавления кнопки мгновенной продажи в список действий элемента инвентаря
 */
const QuickSellForInventoryItem = (({
  window,
  SellItemDialog,
  g_rgWalletInfo,
  CreateMarketActionButton,
  g_sessionID,
  CalculateFeeAmount,
  CalculateAmountToSendForDesiredReceivedAmount,
  GetCurrencyCode,
}) => {
  const btnId = 'quicksellbtn';
  const createSellItemButton = (item, sellingPrice, isShowTooltip, differenceCents, data) => {
    const $btn = /* HTML */ $J(`<a class="steam-new-btn-style" href="javascript:void(0);" id="${btnId}">
      ${SIHLang.quicksell.replace('$1', sellingPrice)}
    </a>`);

    const deltaFormatted = v_currencyformat(
      Math.abs(window.fastdelta) * 100,
      GetCurrencyCode(g_rgWalletInfo.wallet_currency)
    );
    const diffFormatted = v_currencyformat(differenceCents, GetCurrencyCode(g_rgWalletInfo.wallet_currency));

    if (isShowTooltip) {
      $btn.append(/* HTML */ `
        <span id="sih-steam-commmision-tooltip" style="margin-left: 5px; margin-top: 2px;" title="">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M13.6666 6.99992C13.6666 3.31792 10.682 0.333252 6.99998 0.333252C3.31798 0.333252 0.333313 3.31792 0.333313 6.99992C0.333313 10.6819 3.31798 13.6666 6.99998 13.6666C10.682 13.6666 13.6666 10.6819 13.6666 6.99992ZM6.99998 3.66659C7.17679 3.66659 7.34636 3.73682 7.47138 3.86185C7.59641 3.98687 7.66665 4.15644 7.66665 4.33325V7.66659C7.66665 7.8434 7.59641 8.01297 7.47138 8.13799C7.34636 8.26301 7.17679 8.33325 6.99998 8.33325C6.82317 8.33325 6.6536 8.26301 6.52858 8.13799C6.40355 8.01297 6.33331 7.8434 6.33331 7.66659V4.33325C6.33331 4.15644 6.40355 3.98687 6.52858 3.86185C6.6536 3.73682 6.82317 3.66659 6.99998 3.66659ZM6.33331 9.66659C6.33331 9.48977 6.40355 9.32021 6.52858 9.19518C6.6536 9.07016 6.82317 8.99992 6.99998 8.99992H7.00531C7.18212 8.99992 7.35169 9.07016 7.47672 9.19518C7.60174 9.32021 7.67198 9.48977 7.67198 9.66659C7.67198 9.8434 7.60174 10.013 7.47672 10.138C7.35169 10.263 7.18212 10.3333 7.00531 10.3333H6.99998C6.82317 10.3333 6.6536 10.263 6.52858 10.138C6.40355 10.013 6.33331 9.8434 6.33331 9.66659Z"
              fill="white"
            />
          </svg>
        </span>
      `);
    }

    $btn.find('#sih-steam-commmision-tooltip').tooltip({
      content: $J(
        /* HTML */ `<div class="sih-global">
          <div class="column">
            <span> ${SIHLang.quick_sell_error_tooltip_1.replace('$delta', deltaFormatted)} </span>
            <span>${SIHLang.quick_sell_error_tooltip_2.replace('$diff', diffFormatted)}</span>
          </div>
        </div>`
      ),
      position: {
        my: 'left top',
        at: 'left+10 bottom',
      },
    });

    $btn.click(() => {
      $btn.append(
        `<img src="${window.location.protocol}//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working..." style="height: 22px;margin-left: 5px;">`
      );
      SellItemDialog.m_item = item;

      $J.ajax({
        url: 'https://steamcommunity.com/market/sellitem/',
        type: 'POST',
        data,
        crossDomain: true,
        xhrFields: { withCredentials: true },
      })
        .done((responseJSON) => SellItemDialog.OnSuccess({ responseJSON }))
        .fail((jqxhr) => {
          console.error('Error...', jqxhr);

          // jquery doesn't parse json on fail
          SellItemDialog.OnFailure({ responseJSON: $J.parseJSON(jqxhr.responseText) });
        });

      return false;
    });
    return $btn;
  };
  const calculatePrices = (item) => {
    let buyerPrice = item.description.buyerPrice || getPriceAsInt(item.description.lowestPriceW);

    let targetBuyerPrice = buyerPrice + Math.floor(window.fastdelta * 100);

    const ppct = parseFloat(g_rgWalletInfo['wallet_publisher_fee_percent_default'] ?? 0.1);
    const spct = parseFloat(g_rgWalletInfo['wallet_fee_percent'] ?? 0.05);

    const minBuyerPrice = GetTotalWithFees(g_rgWalletInfo.wallet_market_minimum, ppct, spct, g_rgWalletInfo);

    if (targetBuyerPrice < minBuyerPrice) {
      targetBuyerPrice = buyerPrice;
    }

    let sellerPrice = 0;
    let finalBuyerPrice = 0;

    const MAX_ITERATIONS = 10000;
    let iterations = 0;

    let adjustedBuyerPrice = targetBuyerPrice;

    while (iterations < MAX_ITERATIONS) {
      sellerPrice = GetItemPriceFromTotal(adjustedBuyerPrice, g_rgWalletInfo);

      finalBuyerPrice = GetTotalWithFees(sellerPrice, ppct, spct, g_rgWalletInfo);

      if (finalBuyerPrice <= targetBuyerPrice) {
        break;
      }

      adjustedBuyerPrice--;
      iterations++;
    }

    const buyerPriceFormatted = v_currencyformat(finalBuyerPrice, GetCurrencyCode(g_rgWalletInfo.wallet_currency));

    return {
      price: sellerPrice,
      sellingPrice: buyerPriceFormatted,
      isShowTooltip: finalBuyerPrice !== targetBuyerPrice,
      differenceCents: buyerPrice - finalBuyerPrice,
    };
  };

  return {
    addButton(item) {
      const $container = $J(
        '.inventory_page_right div._1NBFz9qQu7S4tSVNyypXBZ._1i6AhxSEgz1FAUyiEt1Xsk._3JCkAyd9cnB90tRcDLPp4W._38cfDT7owcq-7PHlx-Bx2j._3nHL7awgK1Qei1XivGvHMK > ._2YzOLNBx6TonKU0Zmp20l4:has(button)'
      );
      // Удалить ранее добавленую кнопку быстрой продажи
      this.removeButton();

      const { price, sellingPrice, isShowTooltip, differenceCents } = calculatePrices(item);

      // Параметры запроса к API Steam
      const data = {
        sessionid: g_sessionID,
        appid: item.appid,
        contextid: item.contextid,
        assetid: item.assetid,
        amount: 1,
        price,
      };
      // Создание кнопки и ее добавление на html-страницу
      // Вместо `item` отправляем его копию, чтобы избежать подмены элемента во время продажи
      $container.append(createSellItemButton({ ...item }, sellingPrice, isShowTooltip, differenceCents, data));
    },
    removeButton() {
      const $container = $J(
        '.inventory_page_right div._1NBFz9qQu7S4tSVNyypXBZ._1i6AhxSEgz1FAUyiEt1Xsk._3JCkAyd9cnB90tRcDLPp4W._38cfDT7owcq-7PHlx-Bx2j._3nHL7awgK1Qei1XivGvHMK > ._2YzOLNBx6TonKU0Zmp20l4:has(button)'
      );
      $container.find(`#${btnId}`).remove();
    },
  };
})({
  window,
  SellItemDialog,
  g_rgWalletInfo,
  CreateMarketActionButton,
  g_sessionID,
  CalculateFeeAmount,
  CalculateAmountToSendForDesiredReceivedAmount,
  GetCurrencyCode,
});

var ModifyDescriptionFunction = function () {
  SIH?.itemDescription?.ModifySteamReactRender();
  SIH?.itemDescription?.ModifySteamPriceOverview();
};

var ModifyItemDisplay = function () {
  UserYou.OnLoadInventoryComplete = function (transport, appid, contextid) {
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
                '</i>' +
                (g_bViewingOwnProfile
                  ? ' (<a href="javascript:selectSimilar(' + rgItem.classid + ')">Select all</a>)'
                  : ''),
            });
          }
        }
      }

      // if (appid == 570) {
      //   $J.ajax({
      //     url: 'https://api.steampowered.com/IEconItems_570/GetPlayerItems/v0001/',
      //     strSteamId: this.strSteamId,
      //     data: {
      //       SteamID: this.strSteamId,
      //       key: apiKey,
      //     },
      //     success: function (data) {
      //       if (!apiItems[this.strSteamId]) {
      //         apiItems[this.strSteamId.toString()] = {};
      //       }
      //
      //       if (data && data.result && data.result.status == 1) {
      //         apiItems[this.strSteamId][appid] = data.result.items;
      //         $J.each(apiItems[this.strSteamId][appid], function (i, o) {
      //           var elIt = $J('div.item[id=item570_2_' + o.id + ']');
      //           if (o.equipped) {
      //             elIt.addClass('item-equipped');
      //             elIt.each(function () {
      //               this.rgItem.equipped = true;
      //             });
      //           }
      //           elIt.each(function () {
      //             this.rgItem.defindex = o.defindex;
      //           });
      //         });
      //       }
      //     },
      //     error: function () {},
      //   });
      // }
      // else if (appid == 440) {
      //   $J.ajax({
      //     url: 'https://api.steampowered.com/IEconItems_440/GetPlayerItems/v0001/',
      //     strSteamId: this.strSteamId,
      //     data: {
      //       SteamID: this.strSteamId,
      //       key: apiKey,
      //     },
      //     success: function (data) {
      //       if (!apiItems[this.strSteamId]) {
      //         apiItems[this.strSteamId.toString()] = {};
      //       }
      //
      //       if (data && data.result && data.result.status == 1) {
      //         apiItems[this.strSteamId][appid] = data.result.items;
      //         $J.each(apiItems[this.strSteamId][appid], function (i, o) {
      //           var elIt = $J('div.item[id=item440_2_' + o.id + ']');
      //           if (o.equipped) {
      //             elIt.addClass('item-equipped');
      //             elIt.each(function () {
      //               this.rgItem.equipped = true;
      //             });
      //           }
      //           elIt.each(function () {
      //             this.rgItem.defindex = o.defindex;
      //             this.rgItem.apivalue = o;
      //           });
      //         });
      //       }
      //       if (TF2BP && TF2BP.SetPrices) {
      //         TF2BP.SetPrices(appid);
      //       }
      //     },
      //     error: function () {},
      //   });
      // }

      if (window.extprice) {
        // SetupExternalDropdown(g_ActiveInventory.appid);
        if (ExternalPrices[appid]) {
          var lastAPI = GetCookie('lastext_' + appid);
          if (lastAPI != null) {
            lastAPI = parseInt(lastAPI);
          } else {
            lastAPI = 0;
          }
          $J.each(ExternalPrices[appid].apis, function (idx, el) {
            if (this.api && this.api.GetPrices) {
              this.api.GetPrices(appid, inventory.rgInventory, idx == lastAPI);
            }
          });
        }
      }
    } else {
      this.OnInventoryLoadFailed(transport, appid, contextid);
      return;
    }

    this.ShowInventoryIfActive(appid, contextid);
    $J(window).trigger('resize.DynamicInventorySizing');

    $J.each(itemsInTrades, function () {
      var it = this;
      if (it.appid == appid) {
        var elIt = $J(`div.item[id=${it.appid}_${it.context}_${it.id}]`);
        elIt.addClass('item-in-trade');
      }
    });

    if (g_bIsTrading) {
      RedrawCurrentTradeStatus();
    }
  };
};

var numberOfRetries = 0,
  maxRetries = 10;
var dopplerPhaseName = {
  421: 'Phase 4',
  420: 'Phase 3',
  419: 'Phase 2',
  418: 'Phase 1',
  417: 'Black Pearl',
  416: 'Sapphire',
  415: 'Ruby',
};

var SortItem = function (asc, cat = 'price') {
  var order = asc ? 1 : -1;
  var sortFunc = function (a, b) {
    const aobj = a[0].rgItem;
    const bobj = b[0].rgItem;

    let an;
    let bn;
    switch (cat) {
      case 'blocking':
        an =
          aobj?.blockExpiredAt || aobj?.tradeProtectionExpiredAt
            ? aobj.blockExpiredAt || aobj.tradeProtectionExpiredAt
            : 0;
        bn =
          bobj?.blockExpiredAt || bobj?.tradeProtectionExpiredAt
            ? bobj.blockExpiredAt || bobj.tradeProtectionExpiredAt
            : 0;
        break;
      case 'price':
        an = aobj && aobj.extprice !== undefined ? aobj.extprice : 0;
        bn = bobj && bobj.extprice !== undefined ? bobj.extprice : 0;
        break;

      case 'float':
        an = aobj && aobj.floatvalue !== undefined ? aobj.floatvalue : 1 * order;
        bn = bobj && bobj.floatvalue !== undefined ? bobj.floatvalue : 1 * order;
        break;
      case 'gems':
        an = aobj && aobj.extprice_v2 !== undefined ? +aobj.extprice_v2 : 0;
        bn = bobj && bobj.extprice_v2 !== undefined ? +bobj.extprice_v2 : 0;
        break;
      case 'sticker':
        an = aobj && aobj.stickersArr !== undefined ? aobj.totalStickerPrice : -1;
        bn = bobj && bobj.stickersArr !== undefined ? bobj.totalStickerPrice : -1;
        break;
      case 'charm':
        an = aobj && aobj.keychain !== undefined ? aobj.keychain.price : -1;
        bn = bobj && bobj.keychain !== undefined ? bobj.keychain.price : -1;
        break;
      default:
        an = aobj.description.market_hash_name;
        bn = bobj.description.market_hash_name;
        break;
    }

    if (an === bn) {
      an = aobj.description.market_hash_name;
      bn = bobj.description.market_hash_name;
    }

    if (an === bn) {
      an = a.assetid;
      bn = b.assetid;
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
    g_ActiveInventory.m_rgChildInventories[6].m_rgItemElements.sort(sortFunc);
  } else if (g_ActiveInventory?.m_rgContextIds?.length) {
    g_ActiveInventory.g_sihItemsElements = [];

    Object.values(g_ActiveInventory.m_rgChildInventories).forEach((inventory) => {
      inventory.m_rgItemElements.forEach((itemHolder) => {
        const foundedCachedItem = g_ActiveInventory.g_sihItemsElements.find(
          (cachedItemHolder) => cachedItemHolder?.[0]?.rgItem?.assetid === itemHolder[0].rgItem.assetid
        );

        if (!foundedCachedItem) {
          g_ActiveInventory.g_sihItemsElements.push(itemHolder);
        }
      });
    });

    g_ActiveInventory.g_sihItemsElements.sort(sortFunc);

    g_ActiveInventory.m_rgChildInventories[2].m_rgItemElements = g_ActiveInventory.g_sihItemsElements;

    CAppwideInventory.prototype.GetPageItems = function (iPage) {
      var iStart = iPage * INVENTORY_PAGE_ITEMS;
      var iCur = iStart;
      var cHandled = 0;
      var iEnd = iStart + INVENTORY_PAGE_ITEMS;
      var rgItems = [];

      for (var iContext = 0; iContext < this.m_rgContextIds.length; iContext++) {
        var contextid = this.m_rgContextIds[iContext];
        if (+contextid === 16) continue;

        var inventory = this.m_rgChildInventories[contextid];

        // Skip this context if this page contains no items from it
        if (inventory.GetCountTotalItems() <= iCur) {
          iCur -= inventory.GetCountTotalItems();
          cHandled += inventory.GetCountTotalItems();
          continue;
        }

        cHandled += iCur;

        for (var iItem = iCur; iItem < inventory.GetCountTotalItems() && cHandled < iEnd; iItem++) {
          var $ItemHolder = inventory.GetItemElement(iItem);
          rgItems.push($ItemHolder);
          cHandled++;
        }

        iCur = 0;
        if (cHandled >= iEnd) break;
      }

      return rgItems;
    };

    CAppwideInventory.prototype.LayoutPages = function () {
      this.EnsureChildInventoriesReady();

      this.m_$Inventory.children().detach();

      this.m_rgPages = [];

      if (g_bEnableDynamicSizing) {
        this.m_SingleResponsivePage.hide();
        this.m_rgPages = [this.m_SingleResponsivePage];
      } else {
        var iPage = 0;
        this.m_rgPages.push(new CPage(this, iPage++));
        var cPageItemsRemaining = INVENTORY_PAGE_ITEMS;

        var bAnyMissing = false;
        for (var iContext = 0; iContext < this.m_rgContextIds.length; iContext++) {
          var contextid = this.m_rgContextIds[iContext];

          if (+contextid === 16) continue;
          var inventory = this.m_rgChildInventories[contextid];

          inventory.EnsureItemHoldersCreated();

          for (var iItem = 0; iItem < inventory.m_rgItemElements.length; iItem++) {
            if (cPageItemsRemaining-- <= 0) {
              this.m_rgPages.push(new CPage(this, iPage++));
              cPageItemsRemaining = INVENTORY_PAGE_ITEMS - 1;
            }
          }
        }
      }

      this.m_cPages = this.m_rgPages.length;

      this.m_bNeedsRepagination = false;
      this.SetActivePage(this.m_iCurrentPage);
    };

    CInventory.prototype.EnsureItemHoldersCreated = function () {
      if (this.m_bNeedsItemHolders && this.m_rgItemElements.length) {
        for (var iItem = 0; iItem < this.m_rgItemElements.length; iItem++) {
          if (this.m_rgItemElements[iItem] == null) {
            this.m_rgItemElements[iItem] = this.CreateEmptyItemHolder(Math.floor(iItem / INVENTORY_PAGE_ITEMS));
          }
        }

        this.m_bNeedsItemHolders = false;
      }

      if (g_ActiveInventory.contextid === 0) {
        this.m_cItems = this.m_rgItemElements.length;
      }

      if (this.m_rgItemElements.length != this.m_cItems) {
        this.m_bNeedsRepagination = true;

        if (this.m_rgItemElements.length < this.m_cItems) {
          while (
            this.m_rgItemElements.length < this.m_cItems &&
            this.m_rgItemElements.length < INVENTORY_PAGE_ITEMS * 3
          ) {
            //|| g_bEnableDynamicSizing) )
            var $ItemHolder = this.CreateEmptyItemHolder(
              Math.floor(this.m_rgItemElements.length / INVENTORY_PAGE_ITEMS)
            );
            this.m_rgItemElements.push($ItemHolder);
          }

          // the rest are created lazilly
          while (this.m_rgItemElements.length < this.m_cItems) {
            this.m_rgItemElements.push(null);
          }
        } else {
          if (+g_ActiveInventory.contextid !== 0) {
            // count went down - unexpected but just handle it.  it shouldn't be possible to load past the item count, so
            //	these should be empty elements we're removing
            this.m_rgItemElements = this.m_rgItemElements.slice(0, this.m_cItems);
          }
        }
      }
    };
  } else {
    g_ActiveInventory.m_rgItemElements.sort(sortFunc);
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

  g_ActiveInventory.m_bFullyLoaded = true;

  for (let i = 0; i < g_ActiveInventory.m_cPages; i++) {
    try {
      g_ActiveInventory.m_rgPages[i].GetElement();
      g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
      g_ActiveInventory.PreloadPageImages(i);
    } catch (err) {}
  }
};

var ModifyGamesTabs = function () {
  var numberOfGames = $J('.games_list_tabs a.games_list_tab').length;
  var cIdx = $J('.games_list_tabs a.games_list_tab').index($J('.games_list_tabs .active'));

  if (numberOfGames > 10) {
    var divCont = $J('<div class="holder">');
    var divCtrl = $J('<div class="tab-controls">');
    var children = $J('.games_list_tabs').children().remove();
    divCont.append(children);
    divCtrl.append('<a href="#" class="tab-up">up</a><a href="#" class="tab-down">down</a>');
    divCtrl.find('.tab-up').click(function () {
      divCont.stop();

      var cPos = parseInt(divCont.scrollTop() / 56) * 56;
      divCont.animate({ scrollTop: cPos - 112 }, 500);
      return false;
    });
    divCtrl.find('.tab-down').click(function () {
      divCont.stop();
      var cPos = parseInt(divCont.scrollTop() / 56) * 56;
      divCont.animate({ scrollTop: cPos + 112 }, 500);
      return false;
    });
    $J('.games_list_tabs').append(divCont);
    $J('.games_list_tabs').append(divCtrl);
    if (cIdx > 5) {
      divCont.animate({ scrollTop: cIdx * 56 }, 500);
    }
  }
};

var loadPriceHistory = function (rgItem) {
  if (lastHistoryMarketHashName === GetMarketHashName(rgItem.description)) return;

  lastHistoryMarketHashName = GetMarketHashName(rgItem.description);

  // Load price history
  $J('#pricehistory_container').show();
  $J('#pricehistory').hide();
  $J('#pricehistory_throbber').show();
  $J('#pricehistory_notavailable').hide();
  new Ajax.Request(`${window.location.protocol}//steamcommunity.com/market/pricehistory/`, {
    method: 'get',
    parameters: {
      appid: rgItem.appid,
      market_hash_name: GetMarketHashName(rgItem.description),
    },
    onSuccess: function (transport) {
      SellItemDialog.OnPriceHistorySuccess(transport);
    },
    onFailure: function (transport) {
      SellItemDialog.OnPriceHistoryFailure(transport);
    },
  });
};

var updateInfoWindow = function (item) {
  SellItemDialog.m_item = item;
  var elItem = $('market_sell_dialog_item');
  if (item.description.name_color) elItem.style.borderColor = '#' + item.description.name_color;
  if (item.description.background_color) elItem.style.backgroundColor = '#' + item.description.background_color;

  var elItemImage = $('market_sell_dialog_item_img');
  if (item.description.is_stackable) {
    elItemImage.src = ImageURL(item.description.icon_url, '96f', '58f');
  } else {
    elItemImage.src = ImageURL(item.description.icon_url, '96f', '96f');
  }

  SellItemDialog.m_strName = GetEscapedNameForItem(item);
  $('market_sell_dialog_item_name').update(SellItemDialog.m_strName);
  $('market_sell_quantity_available_amt').update(item.amount);

  if (item.description.name_color) {
    $('market_sell_dialog_item_name').style.color = '#' + item.description.name_color;
  } else {
    $('market_sell_dialog_item_name').style.color = '';
  }

  if (item.appid && g_rgAppContextData[item.appid]) {
    var rgAppData = g_rgAppContextData[item.appid];
    $('market_sell_dialog_game_icon').src = rgAppData.icon;
    $('market_sell_dialog_game_icon').alt = rgAppData.name;
    $('market_sell_dialog_game_name').update(rgAppData.name);
    $('market_sell_dialog_item_type').update(item.description.type);
    $('market_sell_dialog_game_info').show();
  } else {
    $('market_sell_dialog_game_info').hide();
  }

  if (item.amount == 1) {
    $('market_sell_quantity_input').disable();

    $('market_sell_quantity_label').hide();
    $('market_sell_quantity_input').hide();
    $('market_sell_quantity_available').hide();
  } else {
    $('market_sell_quantity_label').show();
    $('market_sell_quantity_input').show();
    $('market_sell_quantity_available').show();
  }

  if ($J('#pricehistory_container').is(':visible')) loadPriceHistory(item);
};

var UpdateSellItem = function (item) {
  if ($J('#ck_autoadjust').is(':checked')) {
    if (item.description.lowestPriceW === undefined && !isSorting) {
      SellItemDialog.b_isInterupted = true;
      return false;
    }
    recalcPrice(item);
  }

  updateInfoWindow(item);
  return true;
};

const createAdjustErrorMessage = (price, difference) => {
  const priceStr = v_currencyformat(price, GetCurrencyCode(g_rgWalletInfo.wallet_currency));
  const differenceStr = v_currencyformat(difference, GetCurrencyCode(g_rgWalletInfo.wallet_currency));
  return `Внимание! Steam выставит цену <b>${priceStr}</b>, что на <b>${differenceStr}</b> ниже ожидаемой!`;
};

const adjustErrorMessage = {
  /**
   * Show price difference warning
   */
  show() {
    if (window.show_price_difference_warning) {
      $J('#adjust-error-message').addClass('active');
    }
  },
};

const adjustInput = {
  /**
   * Returns value of `adjust` input.
   * Math.trunc применяется для отсечения малых дробных долей, которые добавлял parseFloat при парсинге некоторых значений.
   * Например, parseFloat("-X") мог вернуть -X.0000000000000001
   */
  getValue() {
    // Не стоит сохранять в переменную $J('#Txt_adjust'), поскольку периодически данный контрол (как и другие) пересоздается,
    // ссылка быстро устареет
    return Math.trunc($J('#Txt_adjust').val() * 100) / 100;
  },
  /**
   * Set new value to `adjust` input
   * @param {float} value - value
   */
  setValue(value) {
    $J('#Txt_adjust').val(value);
  },
  /**
   * Returns true if feeature is on, false - when off
   */
  isActive() {
    return $J('#ck_autoadjust').prop('checked');
  },
};

const QuickSellAllFeature = {
  isRunning: false,

  addButton(container) {
    container.append('<a href="#" id="bt_quick_sell">Quick sell all</a>');
  },

  init() {
    $J(document).on('click', '#bt_quick_sell', () => this.run());
  },

  run() {
    const itemsAmount = $J('.queue-item-container:visible').length;

    if (itemsAmount !== 0) {
      this.isRunning = true;
      document.getElementById('bt_quick_sell').innerText = 'Selling...';
      document.getElementById('market_sell_dialog_accept_ssa').checked = true;

      if (!$J('#ck_autoaccept').is(':checked')) {
        document.getElementById('ck_autoaccept').click();
        document.getElementById('ck_autoaccept').checked = true;
      }

      adjustInput.setValue(0);

      if (!$J('#ck_autoadjust').is(':checked')) {
        document.getElementById('ck_autoadjust').click();
        document.getElementById('ck_autoadjust').checked = true;
      }

      recalcPrice();

      // QuickSell: auto accept selling dialog
      document.getElementById('market_sell_dialog_accept').click();
      document.getElementById('market_sell_dialog_ok').click();
    }

    return false;
  },

  finish() {
    this.isRunning = false;
  },
};

/**
 * Calculate and redraw price of the item
 * taking into account the `autoadjust` features (sell dialog and `Quick sell difference` config item)
 * @param {object} item Steam object: inventory item
 */
var recalcPrice = function (item) {
  // QuickSell: recalc price
  const $sellerPrice = $J('#market_sell_currency_input');
  const $buyerPrice = $J('#market_sell_buyercurrency_input');

  var rgItem = item || g_ActiveInventory.selectedItem;

  // Зануление полей "Вы получите", "Покупатель заплатит"
  $sellerPrice.val(v_currencyformat(0, GetCurrencyCode(g_rgWalletInfo.wallet_currency)));
  $buyerPrice.val(v_currencyformat(0, GetCurrencyCode(g_rgWalletInfo.wallet_currency)));

  // Проверка, указана ли цена в экземпляре элемента инвентаря
  if (rgItem.description.lowestPriceW === undefined && rgItem.description.buyerPrice === undefined) return;

  let targetBuyerPrice, info, sellerPrice, finalBuyerPrice;

  // Расчет комиссии площадки
  // var publisherFee = window.PriceUtils.publisherFee(rgItem, g_rgWalletInfo);

  // Расчен стоимости для покупателя
  buyerPrice = rgItem.description.buyerPrice || getPriceAsInt(rgItem.description.lowestPriceW);
  originalBuyerPrice = buyerPrice;

  // Расчет стоимости для покупателя
  targetBuyerPrice = CalculateSellingPrice(buyerPrice);

  const ppct = parseFloat(g_rgWalletInfo['wallet_publisher_fee_percent_default'] ?? 0.1);
  const spct = parseFloat(g_rgWalletInfo['wallet_fee_percent'] ?? 0.05);
  const minBuyerPrice = GetTotalWithFees(g_rgWalletInfo.wallet_market_minimum, ppct, spct, g_rgWalletInfo);

  if (targetBuyerPrice < minBuyerPrice) {
    targetBuyerPrice = buyerPrice;
  }

  const MAX_ITERATIONS = 10000;
  let iterations = 0;

  let adjustedBuyerPrice = targetBuyerPrice;

  while (iterations < MAX_ITERATIONS) {
    sellerPrice = GetItemPriceFromTotal(adjustedBuyerPrice, g_rgWalletInfo);

    finalBuyerPrice = GetTotalWithFees(sellerPrice, ppct, spct, g_rgWalletInfo);

    if (finalBuyerPrice <= targetBuyerPrice) {
      break;
    }

    adjustedBuyerPrice--;
    iterations++;
  }

  // Расчет комиссии
  // info = CalculateFeeAmount(calculateBuyerPrice, publisherFee);

  // Стоимость для покупателя из-за ошибок округления может быть несколько ниже (после опубликования в маркете),
  // чем расчетная buyerPrice.
  // Если buyerPrice выше, то необходимо использовать алгоритм расчета Steam.
  // const steamPriceForBuyer = window.PriceUtils.steamBuyerPrice(sellerPrice, publisherFee, g_rgWalletInfo);
  // if (steamPriceForBuyer < buyerPrice) {
  //   buyerPrice = steamPriceForBuyer;
  // }

  // GetItemPriceFromTotal(sellerPrice, g_rgWalletInfo);

  // В соответствующих полях ввода показываем пользователю расчетные значения цен
  $sellerPrice.val(v_currencyformat(sellerPrice, GetCurrencyCode(g_rgWalletInfo.wallet_currency)));
  $buyerPrice.val(v_currencyformat(finalBuyerPrice, GetCurrencyCode(g_rgWalletInfo.wallet_currency)));
  SellItemDialog.m_nConfirmedQuantity = +rgItem.amount;
  SellItemDialog.m_nConfirmedPrice = sellerPrice;
};

const setSellingType = (e, selType) => {
  $J('.tabs button').each((idx, elem) => {
    $J(elem).removeClass('active');
  });
  $J(e.currentTarget || e.target).addClass('active');

  const localInventory = JSON.parse(localStorage.getItem('SIH_PROFILE_INVENTORY')) || {};

  if (selType === 'auto') {
    // Корректировка скроллов модального окна
    setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
    $J('#div_multi').show();

    $J('#Txt_confirm-percent').val(localInventory.confirmDifferentPercent || 30);

    if (typeof localInventory.isShowConfirm === 'undefined' || localInventory.isShowConfirm) {
      $J('#ck_showconfirm').prop('checked', true);
      localInventory.isShowConfirm = true;
      localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));
    } else {
      $J('#ck_showconfirm').prop('checked', false);
    }

    if (localInventory.isAutoAjust) {
      $J('#ck_autoadjust').prop('checked', true);
      $J('#auto-confirm-row').addClass('disabled');
      localInventory.isAutoAjust = true;
      localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));

      $J('#market_sell_currency_input, #market_sell_buyercurrency_input').prop('disabled', true);
      $J('#Txt_adjust, #cb_adtype').prop('disabled', false);

      let iterationCount = 0;

      const timerInterval = setInterval(() => {
        iterationCount++;
        //Check item on price or max 4 sec response from steam api
        if (
          (g_ActiveInventory.selectedItem.description.lowestPriceW !== undefined &&
            g_ActiveInventory.selectedItem.description.buyerPrice !== undefined) ||
          iterationCount >= 20
        ) {
          clearInterval(timerInterval);
          recalcPrice();
        }
      }, 200);
    } else {
      $J('#auto-confirm-row').removeClass('disabled');
      $J('#ck_autoadjust').prop('checked', false);

      $J('#market_sell_currency_input, #market_sell_buyercurrency_input').prop('disabled', false);
      $J('#Txt_adjust, #cb_adtype').prop('disabled', true);
    }
  } else {
    $J('#ck_autoadjust').prop('checked', false);
    $J('#market_sell_currency_input, #market_sell_buyercurrency_input').prop('disabled', false);
    $J('#Txt_adjust, #cb_adtype').prop('disabled', true);
    $J('#div_multi').hide();
    adjustErrorMessage.show();
  }
  $J('#market_sell_dialog_accept_ssa').prop(
    'checked',
    typeof localInventory.isAcceptSSA === 'undefined' || localInventory.isAcceptSSA
  );
  $J('#ck_autoaccept').prop('checked', selType === 'auto');
};

// QuickSell: ModifySellingFunctions
var ModifySellingFunctions = function () {
  SellItemDialog.orgOnSuccess = SellItemDialog.OnSuccess;
  SellItemDialog.orgOnFailure = SellItemDialog.OnFailure;
  SellItemDialog.newOnSuccess = function (transport) {
    // QuickSell: newOnSuccess
    const soldItem = SellItemDialog.m_item;
    this.m_bWaitingForUserToConfirm = false;
    this.m_bWaitingOnServer = false;
    // Handle response

    if (transport.responseJSON) {
      $('market_headertip_itemsold_itemname').update(this.m_strName);
      if (this.m_item.description.name_color) {
        $('market_headertip_itemsold_itemname').style.color = '#' + this.m_item.description.name_color;
      } else {
        $('market_headertip_itemsold_itemname').style.color = '';
      }

      $J(soldItem.element).removeClass('selectedSell');
      $J(soldItem.element).css('opacity', '0.3');
      $J(soldItem.element).data('selling', true);

      // Hide Selling Item dialog window
      $J('div.queue-item-container[data-id=' + soldItem.assetid + ']').hide(200, function () {
        var items = $J('.queue-item-container:visible');
        var itC = items.length;
        if (itC > 0) {
          $J('.queue-item-count span:last').html(itC);
          var nextItem = items.has('span.price')[0] || items[0];
          $J('#Lnk_ShowSellMulti').html(itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item);
          var rgItem = nextItem.rgItem;

          const { isAutoAjust = false } = LocalStorageJSON.get('SIH_PROFILE_INVENTORY');

          if (!rgItem.description.lowestPriceW && isAutoAjust) {
            setTimeout(() => {
              SellItemDialog.newOnSuccess(transport);
            }, 500);
            return;
          }

          updateInfoWindow(rgItem);
          g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
          g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);

          if (!UpdateSellItem(rgItem)) return;

          if ($J('#ck_autoaccept').is(':checked')) {
            if ($J('#market_sell_dialog').is(':visible')) {
              // QuickSell: SELL ITEM (auto selling, Quick sell all). OnConfirmationAccept sends POST request!
              window.setTimeout(
                () =>
                  SellItemDialog.OnConfirmationAccept({
                    stop: () => {},
                  }),
                window.delaylistings
              );
            }
          } else {
            var $marketSellDialogOk = $('market_sell_dialog_ok');
            $marketSellDialogOk.show();
            $marketSellDialogOk.setOpacity('0');
            $marketSellDialogOk.fade({ duration: 0.25, from: 0, to: 1 });
            var $marketSellDialogBack = $('market_sell_dialog_back');
            $marketSellDialogBack.show();
            $marketSellDialogBack.setOpacity('0');
            $marketSellDialogBack.fade({ duration: 0.25, from: 0, to: 1 });
            $('market_sell_dialog_throbber').fade({ duration: 0.25 });
          }
        }
      });

      // All items have been sold
      if ($J('.selectedSell').length <= 0) {
        SellItemDialog.Dismiss();
        $J('.item.selectedSell').removeClass('selectedSell');
        $J('.similar-item').removeClass('similar-item');
        $J('.sih_cancel_select_all_inventory_button').trigger('click');
        $J('#Lnk_Cancel').hide();
        $J('#Lnk_ShowSellMulti').hide();
        $J('#Lnk_TurnIntoGems').hide();
        $J('#Lnk_SendGifts').hide();
        $J('#Lnk_Unpack').hide();
        selectmode = false;
        SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
        $J('.item_market_actions').text('');
        // Finish "Quick sell all" if it has been running
        QuickSellAllFeature.finish();
      }
    } else {
      this.DisplayError('There was a problem listing your item. Refresh the page and try again.');
    }
  };

  SellItemDialog.orgShow = SellItemDialog.Show;

  SellItemDialog.Show = function (item) {
    SellItemDialog.orgShow(item);
    SellItemDialog.m_modal.m_fnOnDismiss = function () {
      PriceQueue.StopQueue();
      $J('div.queue-container').remove();
      $J('#manualsell').click();
      //HideHover();
    };
  };

  SellItemDialog.newOnFailure = function (transport) {
    this.m_bWaitingOnServer = false;

    var queue = Effect.Queues.get('global');
    queue.each(function (effect) {
      effect.cancel();
    });

    var $marketSellDialogOk = $('market_sell_dialog_ok');
    $marketSellDialogOk.show();
    $marketSellDialogOk.setOpacity('0');
    $marketSellDialogOk.fade({ duration: 0.25, from: 0, to: 1 });
    var $marketSellDialogBack = $('market_sell_dialog_back');
    $marketSellDialogBack.show();
    $marketSellDialogBack.setOpacity('0');
    $marketSellDialogBack.fade({ duration: 0.25, from: 0, to: 1 });
    $('market_sell_dialog_throbber').fade({ duration: 0.25 });

    if (transport.responseJSON && transport.responseJSON.message) {
      this.DisplayError(transport.responseJSON.message);
      // var errMsgList = [
      //   'Лот с этим предметом уже ожидает вашего согласия на продажу. Подтвердите или отмените его.',
      //   'You already have a listing for this item pending confirmation. Please confirm or cancel the existing listing.',
      //   'The item specified is no longer in your inventory or is not allowed to be traded on the Community Market.',
      // ];
      // if (errMsgList.indexOf(transport.responseJSON.message) === -1) {
      //   if (
      //     $J('#ck_autoaccept').is(':checked') &&
      //     transport.responseJSON.message.indexOf('exceed the maximum wallet balance') < 0
      //   ) {
      //     // QuickSell: SELL ITEM
      //     window.setTimeout(
      //       () =>
      //         SellItemDialog.OnConfirmationAccept({
      //           stop: () => {},
      //         }),
      //       window.delaylistings
      //     );
      //   }
      // } else {
      $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
      $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
      $J(g_ActiveInventory.selectedItem.element).data('selling', true);
      $J('.queue-item-container[data-id="' + g_ActiveInventory.selectedItem.assetid + '"]')
        .find('.queue-item-remove ')
        .trigger('click');
      $J('#market_sell_dialog_skip').trigger('click');
      // }
      // } else {
      //   this.DisplayError('There was a problem listing your item. Refresh the page and try again.');
      // }
    }
  };

  $J('#filter_options').after(
    '<div id="control-panel">' +
      '<label for="Ck_NoReload" style="margin-left: 12px; display: none"><input type="checkbox" name="Ck_NoReload" checked="checked" id="Ck_NoReload" /><span data-lang="noreload">No inventory reloading when sell item</span></label>' +
      '</div>'
  );

  if (window.selectallbuttons) $J('#Lnk_Sellall').show();
  else $J('#Lnk_Sellall').hide();

  const walletCurrencyStepIncrement = (+g_rgWalletInfo['wallet_currency_increment'] || 1) / 100;

  $J('.market_dialog_content:has(#market_sell_dialog_input_area)').before(`
        <div class="tabs">
            <button id="manualsell" onclick="setSellingType(event, 'manual')" class="active">${SIHLang.queue.manualsell}</button>
            <button id="autosell" onclick="setSellingType(event, 'auto')">${SIHLang.queue.autosell}</button>
        </div>
    `);
  $J('#marker_sell_dialog_terms').prop('style', 'width:600px;float:none');
  $J('#market_sell_dialog_accept_ssa_label').after(
    `<div id="div_multi" style="display:none">
        <input hidden type="checkbox" id="ck_autoaccept"><br/>
        <span>${SIHLang.selling_delay}</span>
        <input type="number" step="1" id="Txt_selling-delay" value="${window.delaylistings || 200}"/>
        <span>${SIHLang.millisec}</span>
        <br>
        <br>
        <label for="ck_autoadjust">
            <input type="checkbox" id="ck_autoadjust" checked>
            <span>${SIHLang.autoadjust}</span>
        </label>
        <input type="number" step="${walletCurrencyStepIncrement}" title="adjust amount" id="Txt_adjust" value="-${walletCurrencyStepIncrement}" disabled />
        <select id="cb_adtype" disabled><option value="1">Value</option><option value="2">Percentage</option></select><br/><br/>
        <label for="ck_showconfirm" id="auto-confirm-row">
            <input type="checkbox" id="ck_showconfirm" checked>
            <span>${SIHLang.showconfirm_text}</span>
            <input type="number" step="1" id="Txt_confirm-percent" value="30"/>
            <span>%</span>
            <span id="showconfirm_tooltip" title="${SIHLang.showconfirm_tooltip}"></span>
        </label>
        <p id="adjust-error-message" title="${SIHLang.adjusterrormessagetooltip}">${SIHLang.adjust_error_message}</p>
    </div>`
  );

  $J('.market_dialog_bottom_buttons').prepend(
    '<a id="market_sell_dialog_skip" href="#" class="btn_green_white_innerfade btn_medium_wide" style="float: left; display: none;"><span>Skip</span></a>'
  );
  // QuickSell: skip item
  $J('#market_sell_dialog_skip').click(function () {
    var items = $J('.queue-item-container:visible');
    var nextItem = items.has('span.price')[0] || items[0];
    const rgItem = nextItem.rgItem;
    $J('#market_sell_dialog_error').hide();

    // QuickSell: set new selectedItem element
    g_ActiveInventory.selectedItem = rgItem;
    SellItemDialog.m_item = rgItem;

    // Load price history
    $J('#pricehistory_container').hide();
    $J('#pricehistory').hide();
    $J('#pricehistory_notavailable').hide();

    // QuickSell: skipping
    console.log('Skipping this item');
    setTimeout(function () {
      document.getElementById('market_sell_dialog_ok').click();
    }, 500);
    $J(this).hide();
  });

  // выбираем целевой элемент
  var target = document.getElementById('market_sell_dialog_confirm_buttons');

  // создаём экземпляр MutationObserver
  var observer = new MutationObserver(function (mutations) {
    const isVisible = $J('#market_sell_dialog_ok').is(':visible');
    $J('#div_multi input[type=checkbox], #Txt_adjust, #cb_adtype').prop('disabled', isVisible);
    if (isVisible) {
      $J('#price_history_refresh, .tabs').hide();
      // HERE: CSS
    } else {
      $J('#price_history_refresh, .tabs').show();
      if (!reqPriceHistory) loadPriceHistory(g_ActiveInventory.selectedItem);
    }
    reqPriceHistory = !isVisible;
  });

  // конфигурация нашего observer:
  var config = { attributes: true };

  // передаём в качестве аргументов целевой элемент и его конфигурацию
  observer.observe(target, config);

  SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;

  $J('#Ck_NoReload').click(function () {
    if ($J(this).is(':checked')) {
      SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;
    } else {
      SellItemDialog.OnSuccess = SellItemDialog.orgOnSuccess;
    }
  });
  $J('#Txt_adjust, #cb_adtype').change(function (e) {
    if (e.target.id === 'cb_adtype') {
      if ($J('#cb_adtype').val() === '2') {
        $J('#Txt_adjust').prop('step', 0.01);
        $J('#Txt_adjust').val(-0.01);
      } else {
        const walletCurrencyStepIncrement = (+g_rgWalletInfo['wallet_currency_increment'] || 1) / 100;

        $J('#Txt_adjust').prop('step', walletCurrencyStepIncrement);
        $J('#Txt_adjust').val(-walletCurrencyStepIncrement);
      }
    }

    if (e.target.id === 'Txt_adjust' && e.target.value === '') {
      e.target.value = 0;
    }

    recalcPrice();
  });

  $J('#market_sell_dialog_accept_ssa').change(function () {
    const isChecked = $J(this).prop('checked');

    const localInventory = JSON.parse(localStorage.getItem('SIH_PROFILE_INVENTORY')) || {};
    localInventory.isAcceptSSA = isChecked;
    localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));
  });
  $J('#ck_autoadjust').change(function () {
    const isChecked = $J(this).prop('checked');
    $J('#market_sell_currency_input, #market_sell_buyercurrency_input').prop('disabled', isChecked);
    $J('#Txt_adjust, #cb_adtype').prop('disabled', !isChecked);

    const localInventory = JSON.parse(localStorage.getItem('SIH_PROFILE_INVENTORY')) || {};
    localInventory.isAutoAjust = isChecked;
    localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));

    $J('#auto-confirm-row').toggleClass('disabled');

    if (!isChecked) {
      const walletCurrencyStepIncrement = (+g_rgWalletInfo['wallet_currency_increment'] || 1) / 100;

      adjustInput.setValue(-walletCurrencyStepIncrement);
      $J('#market_sell_currency_input').val(0);
      $J('#market_sell_buyercurrency_input').val(0);
    } else {
      if (
        g_ActiveInventory.selectedItem.description.buyerPrice &&
        g_ActiveInventory.selectedItem.description.sellerPrice
      ) {
        recalcPrice();
      } else {
        GetQueuePrice((cb) => {
          if ($J('#ck_autoadjust').is(':checked')) {
            recalcPrice();
          }
        });
      }
    }
  });
  $J('#ck_showconfirm').change(function () {
    const isChecked = $J(this).prop('checked');

    if (!isChecked) {
      $J('#Txt_confirm-percent').prop('disabled', true);
    } else {
      $J('#Txt_confirm-percent').prop('disabled', false);
    }

    const localInventory = JSON.parse(localStorage.getItem('SIH_PROFILE_INVENTORY')) || {};
    localInventory.isShowConfirm = isChecked;
    localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));
  });

  $J('#Txt_confirm-percent').change(function () {
    const $thisInput = $J(this);

    if (!checkValidationConfirmPercent(+$thisInput.val())) {
      if (+$thisInput.val() > 100) {
        $thisInput.val(100);
      } else if (+$thisInput.val() < 5) {
        $thisInput.val(5);
      }
    }

    if ($thisInput.val().length > 3) {
      $thisInput.val($thisInput.val().slice(0, 3));
    }

    const localInventory = JSON.parse(localStorage.getItem('SIH_PROFILE_INVENTORY')) || {};
    localInventory.confirmDifferentPercent = $thisInput.val();
    localStorage.setItem('SIH_PROFILE_INVENTORY', JSON.stringify(localInventory));
  });

  $J('#Txt_selling-delay').change(function () {
    const $thisInput = $J(this);
    const value = +$thisInput.val();

    if (value > 100000) {
      $thisInput.val(100000);
    } else if (value < 0) {
      $thisInput.val(0);
    }

    window.delaylistings = +$thisInput.val();
    chrome.runtime.sendMessage(
      SIHID,
      { type: 'BACKGROUND_SET_SYNC_STORAGE', data: { key: 'delaylistings', value: +$thisInput.val() } },
      () => {}
    );
  });

  $J('#Lnk_Sellmulti').click(function () {
    selectmode = !selectmode;
    if (selectmode) {
      SIH?.inventoryGroup?.loadInventorySelectionFromInventoryGroup();
      $J('#Lnk_Cancel').show();
      $J('#Ck_NoReload').prop('checked', true);
      SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;
      SellItemDialog.OnFailure = SellItemDialog.newOnFailure;
      loadRightInventoryPanel();
    } else {
      CancelSelectAll();
      $J('#Lnk_Cancel').hide();
      $J('#Lnk_ShowSellMulti').hide();
      $J('#Lnk_TurnIntoGems').hide();
      $J('#Lnk_SendGifts').hide();
      $J('#Lnk_Unpack').hide();
      SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
    }
    $J('.item.selectedSell').removeClass('selectedSell');
    $J('.similar-item').removeClass('similar-item');

    return false;
  });
  $J('#Lnk_Sellall').click(function () {
    $J('#Lnk_Cancel').show();

    $J('#Ck_NoReload').prop('checked', true);
    $J('.equiped').remove();
    $J('.review').remove();

    $J('div[id^="inventory_"]:visible.inventory_ctn').each(function (i) {
      var $visiblePage = $J(this).find('.inventory_page:visible');
      $visiblePage.find('div.item:visible').each(function (i) {
        if (!$J(this).hasClass('selectedSell')) {
          if (this.rgItem && (this.rgItem.description.marketable || this.rgItem.description.appid == 753)) {
            const isStack = Array.isArray(this.rgItem.groupInventories) && this.rgItem.groupInventories.length > 1;
            if (isStack) {
              const elem = this.rgItem.element;
              $J(elem).parent().find('.selectedSell').remove();
              $J(elem).addClass('group_inventory_master_selected_sell');
              this.rgItem.groupInventories.forEach((item, i) => {
                addSell(elem, item, i);
              });
            } else {
              $J(this).addClass('selectedSell');
            }
          }
        }
      });
    });

    sellBtn();

    selectmode = true;
    SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;
    SellItemDialog.OnFailure = SellItemDialog.newOnFailure;

    loadRightInventoryPanel();
    return false;
  });
  $J('#Lnk_ShowSellMulti').click(async function () {
    // Корректировка скроллов модального окна
    $J('.newmodal_content').css({ 'box-sizing': 'border-box' });

    if ($J('.selectedSell').length > 0) {
      $J('#div_multi input[type=checkbox]').prop('disabled', false);
      $J('.tabs').show();
      if ($J('#ck_autoaccept').prop('checked')) $J('.tabs button:last').click();
      else $J('.tabs button:first').click();
      await ShowQueue();
    }
    return false;
  });
  // Grind: onclick
  $J('#Lnk_TurnIntoGems').click(async function () {
    if ($J('.selectedSell').length > 0) {
      GrindDialog.Show();
      await ShowQueue(1);
    }
    return false;
  });
  $J('#Lnk_SendGifts').click(function () {
    var url = '';
    $J('.selectedSell').each(function () {
      var rgItem = this.rgItem;
      if (rgItem.appid == 753 && rgItem.contextid == 1) {
        var isSent = false;
        var msgSent = '';
        // проверяем чтобы gift не был отправлен ранее
        if (rgItem.description.owner_descriptions && Array.isArray(rgItem.description.owner_descriptions)) {
          var re = new RegExp('<a href=.*://steamcommunity.com/.* data-miniprofile="\\d+">.*</a>'); // ссылка на профиль получателя
          isSent = rgItem.description.owner_descriptions.some(function (desc) {
            var res = re.test(desc.value);
            if (res) msgSent = rgItem.name + ': ' + desc.value.replace(/<[^>]*>/g, ''); // текст сообщения что gift был уже отправлен пользователю
            return res;
          });
        }
        if (!isSent) {
          url += rgItem.assetid + '/';
        } else {
          alert(msgSent);
        }
      }
    });

    if (url != '') {
      url = 'https://store.steampowered.com/checkout/sendgift/' + url + g_steamID;
      window.location.href = url;
    } else {
      $J('#Lnk_SendGifts').hide();
    }
    return false;
  });

  $J('#Lnk_Unpack').click(function () {
    const $rgCards = [];
    const reqData = [];
    const CARDS_PER_BOOSTER_PACK = 3;

    $J('.selectedSell').each(function (idx, elem) {
      const rgItem = elem.rgItem;
      const market_hash_name = rgItem.description.market_hash_name;
      if (rgItem.appid == 753 && rgItem.contextid == 6 && market_hash_name.toUpperCase().endsWith('BOOSTER PACK')) {
        reqData.push({
          appid: rgItem.description.market_fee_app,
          communityitemid: rgItem.assetid,
          sessionid: g_sessionID,
        });
      }
    });
    var submitUrl = `${g_strProfileURL}/ajaxunpackbooster/`;
    if (reqData.length) {
      Promise.all(
        reqData.map((data) => new Promise((resolve, reject) => $J.post(submitUrl, data).then(resolve).fail(reject)))
      )
        .then((respValues) => {
          var $Content = $J('<div/>', { class: 'booster_unpack_dialog' });

          var $TitleArea = $J('<div/>', { class: 'booster_unpack_title' });
          $Content.append($TitleArea);

          var $PostUnpackActions = $J('<div/>', { class: 'booster_unpack_actions post_unpack' });

          var $BtnClose = $J('<div/>', { class: 'btn_grey_white_innerfade btn_medium booster_unpack_closebtn' });
          $BtnClose.append($J('<span/>').text('Close'));
          $PostUnpackActions.append($BtnClose);

          respValues.map((respData, idx) => {
            if (respData.rgItems && respData.rgItems.length > 0) {
              var $CardArea = $J('<div/>', { class: 'booster_unpack_cardarea cardarea' + (idx + 1) });
              for (let i = 0; i < CARDS_PER_BOOSTER_PACK; i += 1) {
                var item = respData.rgItems[i];
                var $Card = $J('<div/>', { class: 'booster_unpack_card card_front card' + (i + 1) });
                var $Img = $J('<img/>', { class: 'booster_unpack_card_image', src: item.image });
                var $CardTitle = $J('<div/>', { class: 'booster_unpack_card_title' }).text(item.name);
                var $CardSeries = $J('<div/>', { class: 'booster_unpack_card_title' }).text(
                  'Series %s'.replace(/%s/, item.series)
                );
                $Card.append($Img, $CardTitle, $CardSeries);
                $CardArea.append($Card);
              }
              $Content.append($CardArea);
            }
          });

          $Content.append($PostUnpackActions);
          var Modal = ShowDialog('Unpacking booster pack', $Content, { bExplicitDismissalOnly: true });
          $BtnClose.click(function () {
            Modal.Dismiss();
          });
          Modal.GetContent().find('.newmodal_close').fadeIn(500);
          Modal.SetDismissOnBackgroundClick(true);
          ReloadCommunityInventory();
        })
        .catch((reason) => {
          console.log(reason);
          ShowAlertDialog(
            'Unpacking booster pack',
            'Sorry, there was a problem unpacking some booster pack.  It may have already been unpacked.  Please try again later.'
          );
          ReloadCommunityInventory();
        });
    }
  });
  $J(document).on('click', '#Lnk_Cancel', function () {
    CancelSelectAll();
    return false;
  });
  $J(document).on('click', '.queue-item-remove', function () {
    var p = $J(this).parent('.queue-item-container');
    var rgItemOrg = p[0].rgItem;
    $J(rgItemOrg.element).removeClass('selectedSell');

    if (Array.isArray(rgItemOrg.groupInventories) && rgItemOrg.groupInventories.length > 0) {
      rgItemOrg.isSelectedForSell = false;
      rgItemOrg.groupInventories.find((x) => x.itemIndex === rgItemOrg.itemIndex).isSelectedForSell = false;
      SIH?.inventoryGroup?.loadGroupInventoryDialog();
    }

    p.hide(100);
    var items = $J('.selectedSell');
    var itC = items.length;
    if (itC <= 0) {
      if (selectmode) {
        $J('.select_inventory_container').find('.sih_cancel_select_all_inventory_button').trigger('click');
      }
      SellItemDialog.Dismiss();
      $J('#Lnk_ShowSellMulti').hide();
      $J('#Lnk_TurnIntoGems').hide();
      $J('#Lnk_SendGifts').hide();
      $J('#Lnk_Unpack').hide();
      return false;
    }

    items.sort(function (a, b) {
      var rgItemA = a.rgItem,
        rgItemB = b.rgItem;

      if (rgItemA.description.market_hash_name == rgItemB.description.market_hash_name) {
        return 0;
      } else if (rgItemA.description.market_hash_name < rgItemB.description.market_hash_name) {
        return -1;
      } else {
        return 1;
      }
    });

    var nextItem = items.has('span.price')[0] || items[0];
    var rgItem = nextItem.rgItem;

    g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
    g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
    $J('.queue-item-count span:last').html(itC);
    updateInfoWindow(rgItem);
    if (adjustInput.isActive()) {
      recalcPrice(rgItem);
    }
    setTimeout(recalTotal, 200);
    $J('#Lnk_ShowSellMulti').html(itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item);
    return false;
  });

  $J('#showconfirm_tooltip').tooltip();
};

const checkValidationConfirmPercent = function (num) {
  return isNaN(num) ? false : 5 <= num && num <= 100 ? true : false;
};
var AddDialogHTML = function () {
  // BUY SET
  var dialog =
    '<div id="market_buyset_dialog" class="market_modal_dialog" style="display: none; z-index: 1001; position: absolute; width: 90%; top: 100px !important">' +
    '<div class="market_dialog_title sih_market_dialog_title">' +
    '<span id="market_buyset_dialog_title" data-lang="buymissing">Buy missing parts</span>' +
    '<span class="market_dialog_cancel">' +
    '<a id="market_buyset_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
    '</span>' +
    '</div>' +
    '<div class="market_dialog_contents sih_market_dialog_contents">' +
    '<div class="market_dialog_content_frame">' +
    '<div class="market_dialog_content">' +
    '<div class="market_dialog_iteminfo">' +
    '<div id="lstParts" class="market_content_block market_home_listing_table market_home_main_listing_table market_listing_table"></div>' +
    '</div>' +
    '</div>' +
    '<div class="market_dialog_content_separator"></div>' +
    '<div class="market_dialog_content market_dialog_content_dark sih_market_dialog_content">' +
    '<div class="market_sell_dialog_input_area">' +
    '<a id="market_buyset_dialog_reload" href="javascript:void(0);" class="btn_green_white_innerfade btn_small_wide"><span data-lang="tradingcards.reload">Reload list</span></a>' +
    '<div>&nbsp;<br /><br /></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
  dialog +=
    '<div id="hover" style="display: none; z-index: 1001">' +
    '<div class="shadow_ul"></div><div class="shadow_top"></div><div class="shadow_ur"></div><div class="shadow_left"></div><div class="shadow_right"></div><div class="shadow_bl"></div><div class="shadow_bottom"></div><div class="shadow_br"></div>		<div class="inventory_iteminfo hover_box shadow_content" id="iteminfo_clienthover">' +
    '<div class="item_desc_content" id="hover_content">' +
    '<div class="item_desc_icon">' +
    '<div class="item_desc_icon_center">' +
    '<img id="hover_item_icon" src="' +
    window.location.protocol +
    '//steamcommunity-a.akamaihd.net/public/images/trans.gif" alt="" />' +
    '</div>' +
    '</div>' +
    '<div class="item_desc_description">' +
    '<h1 class="hover_item_name" id="hover_item_name"></h1>' +
    '<div class="fraud_warning" id="hover_fraud_warnings"></div>' +
    '<div class="item_desc_game_info" id="hover_game_info">' +
    '<div class="item_desc_game_icon">' +
    '<img id="hover_game_icon" src="' +
    window.location.protocol +
    '//steamcommunity-a.akamaihd.net/public/images/trans.gif" alt="" />' +
    '</div>' +
    '<div id="hover_game_name" class="ellipsis"></div>' +
    '<div id="hover_item_type" class=""></div>' +
    '</div>' +
    '<div class="item_desc_descriptors" id="hover_item_descriptors">' +
    '</div>' +
    '<div class="item_desc_descriptors" id="hover_item_owner_descriptors">' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="hover_arrow_left" id="hover_arrow_left">' +
    '<div class="hover_arrow_inner"></div>' +
    '</div>' +
    '<div class="hover_arrow_right" id="hover_arrow_right">' +
    '<div class="hover_arrow_inner"></div>' +
    '</div>' +
    '</div>';
  dialog +=
    '<div id="market_getexp_dialog" class="market_modal_dialog" style="display: none;">' +
    '<div class="market_dialog_title sih_market_dialog_title">' +
    '<span id="market_getexp_dialog_title" data-lnag="">Generate custom button expression</span>' +
    '<span class="market_dialog_cancel">' +
    '<a id="market_getexp_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
    '</span>' +
    '</div>' +
    '<div class="market_dialog_contents sih_market_dialog_contents">' +
    '<div class="market_dialog_content_frame">' +
    '<div class="market_dialog_content">' +
    '<div>' +
    '<div class="tags-container"></div>' +
    '<div class="tag-textbox"><input type="text" style="width:100%" id="market_getexp_dialog_exptext" /></div>' +
    '</div>' +
    '</div>' +
    '<div class="market_dialog_content_separator"></div>' +
    '<div class="market_dialog_content market_dialog_content_dark sih_market_dialog_content">' +
    '<div class="market_sell_dialog_input_area">' +
    '<a id="market_getexp_dialog_gen" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Generate</span></a>' +
    '<div>&nbsp;<br /><br /></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
  dialog +=
    '<div id="market_grind_dialog" class="market_modal_dialog" style="display: none;">' +
    '<div class="market_dialog_title sih_market_dialog_title">' +
    '<span id="market_grind_dialog_title" data-lang="turngems">Turn into gems</span>' +
    '<span class="market_dialog_cancel">' +
    '<a id="market_grind_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
    '</span>' +
    '</div>' +
    '<div class="market_dialog_contents sih_market_dialog_contents">' +
    '<div class="market_dialog_content_frame">' +
    '<div class="market_dialog_content">' +
    '<div>' +
    '<div class="tags-container">Did you want to convert these items into Gems? It cannot be undone.</div>' +
    '</div>' +
    '</div>' +
    '<div class="market_dialog_content_separator"></div>' +
    '<div class="market_dialog_content market_dialog_content_dark sih_market_dialog_content">' +
    '<div class="market_sell_dialog_input_area">' +
    '<a id="market_grind_dialog_grind" href="#" class="btn_green_white_innerfade btn_small_wide"><span>OK</span></a>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
  $J('body').append(dialog);
};

/**
 * Calculate item selling price
 * aking into account the `autoadjust` features (sell dialog and `Quick sell difference` config item)
 *
 * @param {number} basePrice base item price
 */
var CalculateSellingPrice = function (basePrice) {
  let calPrice = basePrice;

  // Шаг изменения цены
  const adjust = adjustInput.getValue();

  if ($J('#cb_adtype').val() === '2') {
    // Шаг выражен в процентах
    let per = Math.round((basePrice * adjust) / 100);

    if (per == 0 && adjust != 0) {
      per = adjust < 0 ? -1 : 1;
    }
    calPrice = basePrice + per;
  } else {
    // Шаг выражен в денежных единицах
    calPrice = basePrice + Math.floor(adjust * 100);
  }

  // Применение настройки "Разница при быстрой продаже", если она включена и если не активирована ф-я `autoadjust`
  if (adjust === 0 && QuickSellAllFeature.isRunning && typeof window.fastdelta !== 'undefined') {
    calPrice += Math.floor(window.fastdelta * 100);
  }

  // Если цена стала не положительной, то возвращаем ее к изначальному значению
  if (calPrice <= 0) calPrice = basePrice;
  return calPrice;
};

var ContinueListing = function () {
  if (!SellItemDialog.b_isInterupted) return;

  console.log('Resume listing');

  var firstItem = $J('.queue-item-container:has(>span.price):visible');
  if (firstItem.length == 0) return;
  var rgItem = firstItem[0].rgItem;
  SellItemDialog.b_isInterupted = false;

  if (!UpdateSellItem(rgItem)) return;

  if ($J('#ck_autoaccept').is(':checked')) {
    if ($J('#market_sell_dialog').is(':visible')) {
      // QuickSell: SELL ITEM
      window.setTimeout(
        () =>
          SellItemDialog.OnConfirmationAccept({
            stop: () => {},
          }),
        window.delaylistings
      );
    }
  }
};

var SetupAcceptAllGifts = function () {
  if ($J('#tabcontent_pendinggifts .pending_gift').length == 0) return;
  var divCnt = $J('<div style="padding: 20px" />');
  var AcceptAllGifts = $J(
    '<a href="#" class="btn_darkblue_white_innerfade btn_medium new_trade_offer_btn"><span>Add all to my Steam Gift Inventory</span></a>'
  ); // CreateMarketActionButton('yellow', '#', 'Add all to my Steam Gift Inventory');
  divCnt.append(AcceptAllGifts);

  $J(AcceptAllGifts).click(function (e) {
    e.preventDefault();
    var giftIds = [];
    $J('#tabcontent_pendinggifts .pending_gift > div[id^="pending_gift_"]').each(function () {
      var thisID = $J(this).attr('id');
      var giftID = thisID.substring(13);
      giftIds.push(giftID);
      ShowAcceptGiftOptions(giftID);
      DoAcceptGift(giftID, false);
    });
  });

  $J('#tabcontent_pendinggifts .pending_gifts_header').after(divCnt);
};

BuySetDialog = {
  m_bInitialized: false,
  m_oItemsToBuy: [],
  m_fnDocumentKeyHandler: null,

  Initialize: function () {
    $('market_buyset_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
    $('market_buyset_dialog_reload').observe('click', this.OnReload.bindAsEventListener(this));

    var $marketBuysetDialog = $('market_buyset_dialog');
    $marketBuysetDialog.style.visibility = 'hidden';
    $marketBuysetDialog.show();
    // TODO: Slider
    $marketBuysetDialog.hide();
    $marketBuysetDialog.style.visibility = '';

    this.m_bInitialized = true;
  },

  Show: function (items) {
    if (!this.m_bInitialized) {
      this.Initialize();
    }
    if (items.length == 0) {
      return;
    }

    m_oItemsToBuy = items;
    this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
    $(document).observe('keydown', this.m_fnDocumentKeyHandler);
    // BUY SET
    showModal('market_buyset_dialog', true);
    this.OnReload({
      stop: () => {},
    });
  },

  OnCancel: function (event) {
    this.Dismiss();
    event.stop();
  },

  Dismiss: function () {
    $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
    hideModal('market_buyset_dialog');
    if (this.m_modal) this.m_modal.Dismiss();
  },

  OnAccept: function (event) {
    event.stop();
  },

  OnReload: function (event) {
    event.stop();

    // BUY SET
    $J('#lstParts').html(
      '<img src="' +
        window.location.protocol +
        '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" class="loading" alt="Working...">'
    );

    for (let i = 0; i < m_oItemsToBuy.length; i++) {
      getSteamItemRender(m_oItemsToBuy[i], 0);
    }

    const divInfoBlock = $J('#market_buyset_dialog_reload').siblings('div');
    divInfoBlock.css('height', '32px');
    divInfoBlock.css('line-height', '32px');
    divInfoBlock.css('text-align', 'right');
    divInfoBlock.html(`Updated at: ${new Date().toLocaleTimeString()}<br><br>`);
  },

  OnDocumentKeyPress: function (event) {
    if (event.keyCode == Event.KEY_ESC) {
      this.Dismiss();
      event.stop();
    }
  },
};

function getSteamItemRender(it, counter) {
  $J.ajax({
    method: 'GET',
    cache: false,
    url: `${it.link}/render/?start=0&count=5&country=${g_rgWalletInfo.wallet_country}&language=${g_strLanguage}&currency=${g_rgWalletInfo.wallet_currency}`,
  }).then(function (data) {
    $J('#lstParts').find('img.loading').remove();

    if (data.success) {
      let itemDiv;
      const listDiv = $J(`<div>${data.results_html}</div>`);

      listDiv.find('.market_listing_row').each((idx, elem) => {
        const lowest = $J(elem).find('span.market_listing_price_with_fee').text();

        if (!/SOLD!/i.test(lowest)) {
          itemDiv = $J(elem);
          return false;
        }
      });
      if (itemDiv) {
        $J('#lstParts').append(itemDiv);
        $J('#lstParts').find('.market_listing_table_header').remove();

        itemDiv.find('a.item_market_action_button').each(function () {
          const $row = $J(this).parents('.market_listing_row');
          const match = buyingExp.exec($J(this).attr('href'));

          if (match) {
            $J(this).attr('href', 'javascript:void(0);');
            $J(this).click(function () {
              $J(this).hide();
              const obj = {
                listingid: match[1],
                appid: match[2],
                contextid: match[3],
                id: match[4],
              };

              const rgListing = data.listinginfo[obj.listingid];
              $row
                .find('.market_listing_buy_button')
                .append(
                  '<img src="' +
                    window.location.protocol +
                    '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">'
                );

              $J.ajax({
                url: 'https://steamcommunity.com/market/buylisting/' + obj.listingid,
                type: 'POST',
                data: {
                  sessionid: g_sessionID,
                  currency: g_rgWalletInfo.wallet_currency,
                  subtotal: rgListing.converted_price,
                  fee: rgListing.converted_fee,
                  total: rgListing.converted_price + rgListing.converted_fee,
                  quantity: 1,
                },
                crossDomain: true,
                xhrFields: { withCredentials: true },
              })
                .done(function () {
                  if ($row.is(':visible')) {
                    $row.find('.market_listing_buy_button').text('Success');
                  } else {
                    alert('Success');
                  }
                })
                .fail(function (jqxhr) {
                  $row.find('.market_listing_buy_button img').remove();
                  const responseText = $J.parseJSON(jqxhr.responseText);

                  if (responseText && responseText.message) {
                    alert(responseText.message);
                  }
                });
              return false;
            });
          }
        });
      } else {
        // BUY SET: not in trade
        const appId = g_ActiveInventory.selectedItem.appid;
        const defaultImageUrl =
          (data && data.app_data && data.app_data[appId] && data.app_data[appId].icon) ||
          'https://steamcommunity-a.akamaihd.net/public/images/skin_1/forum_topicicon_locked.png';

        $J('#lstParts').append(`
          <div class="market_listing_row market_recent_listing_row">
              <div class="market_listing_item_img_container">
                  <img
                      src="${defaultImageUrl}"
                      class="market_listing_item_img"
                      alt=""
                  >
              </div>
              <div class="market_listing_price_listings_block">
                  <div class="market_listing_right_cell buyset_out_of_order">
                      ${SIHLang.buysetoutofstock}
                  </div>
              </div>
              <div class="market_listing_item_name_block">
                  <span id="listing_3326435656380760115_name" class="market_listing_item_name" style="color: #D2D2D2;">
                      ${it.name}
                  </span>
                  <br>
                  <span class="market_listing_game_name">Dota 2</span>
              </div>
              <div style="clear: both;"></div>
          </div>
        `);
      }
    } else {
      if (counter < 3) {
        getSteamItemRender(it, ++counter);
      }
    }
  });
}
// Grind: GrindDialog
GrindDialog = {
  m_bInitialized: false,
  m_bIsDismissed: true,
  m_fnDocumentKeyHandler: null,
  m_modal: null,
  m_elDialogContent: null,

  Initialize: function () {
    $('market_grind_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
    $('market_grind_dialog_grind').observe('click', this.OnGrind.bindAsEventListener(this));

    this.m_elDialogContent = $('market_grind_dialog');

    this.m_elDialogContent.style.visibility = 'hidden';
    this.m_elDialogContent.show();
    // TODO: Slider
    this.m_elDialogContent.hide();
    this.m_elDialogContent.style.visibility = '';

    this.m_bInitialized = true;
  },

  Show: function () {
    if (!this.m_bInitialized) this.Initialize();

    this.SetMessage();
    this.m_bIsDismissed = false;
    this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
    $(document).observe('keydown', this.m_fnDocumentKeyHandler);
    this.m_modal = new CModal($J(this.m_elDialogContent));
    this.m_modal.m_fnBackgroundClick = () => {
      if (this.m_modal.BIsActiveModal() && this.m_modal.m_bDismissOnBackgroundClick) {
        this.Dismiss();
      }
    };
    this.m_modal.Show();
  },

  OnCancel: function (event) {
    this.Dismiss();
    event.stop();
  },

  Dismiss: function () {
    $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);

    if (this.m_modal) this.m_modal.Dismiss();
    this.m_bIsDismissed = true;
    $J('div.queue-container').remove();
  },

  OnAccept: function (event) {
    event.stop();
  },

  // Grind: confirm
  OnGrind: function (event) {
    event.stop();
    GrindNextItem();
  },

  OnDocumentKeyPress: function (event) {
    if (event.keyCode == Event.KEY_ESC) {
      this.Dismiss();
      event.stop();
    }
  },

  // Grind: SetMessage
  SetMessage(message = false) {
    $J('#market_grind_dialog .tags-container').html(message || SIHLang.confirmitemconversionintogems);
  },
};

GenExpDialog = {
  m_bInitialized: false,
  m_oItem: null,
  m_fnDocumentKeyHandler: null,

  Initialize: function () {
    $('market_getexp_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
    $('market_getexp_dialog_gen').observe('click', this.OnGenerate.bindAsEventListener(this));

    var $marketGetexpDialog = $('market_getexp_dialog');
    $marketGetexpDialog.style.visibility = 'hidden';
    $marketGetexpDialog.show();
    // TODO: Slider
    $marketGetexpDialog.hide();
    $marketGetexpDialog.style.visibility = '';
    $J('#market_getexp_dialog_exptext').click(function () {
      $J(this).select();
    });
    this.m_bInitialized = true;
  },

  Show: function (item) {
    if (!this.m_bInitialized) this.Initialize();
    if (!item) return;
    this.m_oItem = item;
    this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
    $(document).observe('keydown', this.m_fnDocumentKeyHandler);
    this.CreateList();
    showModal('market_getexp_dialog', true);
  },

  CreateList: function () {
    var container = $J('#market_getexp_dialog .tags-container');
    container.empty();
    for (var i = 0; i < this.m_oItem.length; i++) {
      var tag = this.m_oItem[i];
      var ck = $J('<input type="checkbox" checked="checked" id="ck_tag_' + tag.internal_name + '"/>');
      ck.data('exp', tag);
      container.append(ck);
      container.append(' ' + tag.localized_category_name + ': ' + tag.localized_tag_name + '<br />');
    }
    this.OnGenerate({
      stop: function () {},
    });
  },

  OnCancel: function (event) {
    this.Dismiss();
    event.stop();
  },

  Dismiss: function () {
    $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
    hideModal('market_getexp_dialog');

    if (this.m_modal) this.m_modal.Dismiss();
  },

  OnGenerate: function (event) {
    event.stop();
    var container = $J('#market_getexp_dialog .tags-container');
    var exp = '';
    var cats = [];
    container.find('input[type=checkbox]').each(function () {
      if ($J(this).prop('checked')) {
        var tag = $J(this).data('exp');
        if (cats.indexOf(tag.category) >= 0) return;
        exp += ',"' + tag.category + '":"' + tag.internal_name + '"';
        cats.push(tag.category);
      }
    });
    if (exp.length > 0) exp = '{' + exp.substring(1) + '}';
    $J('#market_getexp_dialog_exptext').val(exp);
    $J('#market_getexp_dialog_exptext').select();
  },

  OnDocumentKeyPress: function (event) {
    if (event.keyCode == Event.KEY_ESC) {
      this.Dismiss();
      event.stop();
    }
  },
};

function hasExternalPricesAPI(appid) {
  return Object.keys(ExternalPrices).includes(appid.toString());
}

const updateInventoryProviders = () => {
  const providersCombobox = $J('#cb_provider');
  let allCurrentSources = ExternalPrices[g_ActiveInventory.appid].apis.map((it) => it.name.toLowerCase());
  if (+g_ActiveInventory.appid === 730) {
    allCurrentSources = allCurrentSources.filter((x) => ['csgobackpack', 'steamanalyst'].includes(x));
  }
  const providersData = window.PROVIDERS_LIST.filter(
    (x) => allCurrentSources.includes(x.id) && !['backpacktf'].includes(x.id)
  );
  providersCombobox.find('option').remove();
  providersData.forEach((it) => {
    providersCombobox.append(`<option value="${it.id}">${it.title}</option>`);
  });
  providersCombobox.val(allCurrentSources[0]);
};

const floatQueue = [];
const GetFloat = (link, isForce = false) => {
  link = link.replace('%owner_steamid%', g_ActiveUser.strSteamId);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(SIHID, { type: 'BACKGROUND_GET_WEAR_VALUE', data: { link, isForce } }, (respData) => {
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
    floatQueue.map(({ element, link }) =>
      GetFloat(link).then((data) => {
        const $curItem = $J(element);
        if (!$curItem.find('.item-info .float-value').length) {
          const { rgItem } = $curItem[0];
          rgItem.floatvalue = data.iteminfo.floatvalue;
          rgItem.paintseed = data.iteminfo.paintseed;
          rgItem.paintindex = data.iteminfo.paintindex;
          rgItem.origin = data.iteminfo.origin;
          rgItem.stickers = data.iteminfo.stickers;
          rgItem.keychains = data.iteminfo.keychains;
          rgItem.globalRatingPos = data.iteminfo.globalRatingPos;
          rgItem.localRatingPos = data.iteminfo.localRatingPos;

          $curItem.find('.item-info .float-data').append(/* HTML */ `
            <div class="item_row item_row__transparent">
              <span>${SIH?.phaseOfItems?.GetRatingPos(rgItem)}</span
              ><span class="paintseed">${data.iteminfo.paintseed}</span>
            </div>
            <div class="item_row item_row__value">
              <span class="float-value">${data.iteminfo.floatvalue.toFixed(13)}</span>
            </div>
          `);
        }
      })
    )
  ).then(async (res) => {
    await SIH?.itemDescription?.LoadCachedFloatValueInDesctiption();
  });

  floatQueue.length = 0;
};

const GetFloatValues = () => {
  $J('.inventory_ctn:visible .item.app730').each((idx, elem) => {
    const $curItem = $J(elem);
    const tags = elem.rgItem.description.tags;
    if (tags) {
      const isWeapon = checkWeapon(tags);
      if ($curItem.find('.group_inventory_flag').length === 0 && isWeapon) {
        const {
          element,
          assetid,
          appid,
          description: { actions, market_hash_name },
          floatvalue = null,
        } = elem.rgItem;
        if (isWeapon && actions !== undefined && !floatvalue) {
          const action = actions[0];
          const actionLink = action.link
            .replace('%assetid%', assetid)
            .replace('%owner_steamid%', g_ActiveUser.strSteamId);
          floatQueue.push({ assetid, element, link: actionLink });
        } else if (floatvalue) {
          if (!$curItem.find('.item-info .float-data .item_row').length) {
            $curItem.find('.item-info .float-data').append(/* HTML */ `
              <div class="item_row item_row__transparent">
                <span>${SIH?.phaseOfItems?.GetRatingPos(elem.rgItem)}</span
                ><span class="paintseed">${elem.rgItem.paintseed}</span>
              </div>
              <div class="item_row item_row__value">
                <span class="float-value">${elem.rgItem.floatvalue.toFixed(13)}</span>
              </div>
            `);
          }
        }
      }
    }
  });
  processFloatQueue();
};

var SetupExternalDropdown = function (appid, isRefresh = false) {
  const selectedProvidersCounter =
    (limit = MAX_NUM_PROVIDERS_CAN_BE_CHOSEN, qty = 0) =>
    (checked) => {
      qty += checked ? 1 : -1;
      if (qty <= limit) {
        return true;
      }
      qty = limit;
      return false;
    };

  const createProviderListStateChangeHandler = (
    (counter, duration = 1e4) =>
    (listContainer, _timer = null) =>
    (checked = true) => {
      clearTimeout(_timer);
      if (counter(checked)) {
        listContainer.removeClass('is-full');
        return true;
      } else {
        listContainer.addClass('is-full');
        _timer = setTimeout(() => {
          listContainer.removeClass('is-full');
          clearTimeout(_timer);
        }, duration);
        return false;
      }
    }
  )(selectedProvidersCounter(), PROWIDERS_LIST_FULL_WARN_DURATION_MS);

  if (ExternalPrices[appid]) {
    // Get favorite sources
    let favSource = GetCookie(`extproviders_${appid}`);
    if (favSource != null) {
      favSource = favSource.split(',');
    } else {
      favSource = [];
    }

    const allCurrentSources = ExternalPrices[appid].apis.map((it) => it.name.toLowerCase());
    const curSources = allCurrentSources.filter((it) => favSource.includes(it));

    $J('.sih-functions-panel').show();
    const providersList = $J('#provider_list');
    providersList.find('.provider-item').remove();
    providersList.find('.warning').remove();

    let cnt = 0;

    const countProviders = createProviderListStateChangeHandler(providersList);
    $J.each(ExternalPrices[appid].apis, (idx, elem) => {
      const it = window.PROVIDERS_LIST.find((x) => x.id === elem.name.toLowerCase());
      const $item = $J(`
                <div class="provider-item" style="color: ${it.color};">
                    <input type="checkbox" id="${it.id}">
                    <label class="provider ${it.id}" for="${it.id}" data-title="${it.title}"></label>
                </div>
            `);

      $item.on('change', `#${it.id}`, (e) => {
        const {
          currentTarget: { id, checked },
        } = e;
        if (!countProviders(checked)) {
          e.currentTarget.checked = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const source = ExternalPrices[appid].apis.find((x) => x.name.toLowerCase() === id);
        if (Array.isArray(source.api.marketsLoaded)) {
          const index = source.api.marketsLoaded.indexOf(id);
          if (index > -1) {
            source.api.marketsLoaded.splice(index, 1);
          }
        }
        if (!checked) $J(`.price_flag.${id}`).remove();
        else {
          $J('.sih-functions-panel .spinner').show();

          source.api.GetPrices(
            appid,
            {
              market: source.name,
              currencies: it.currencies,
              nameMarkerForApi: source.nameForApi,
              marketSort: source.sort,
            },
            false
          );
        }
        favSource = providersList
          .find('input:checked')
          .map((idx, x) => x.id)
          .toArray();
        SetCookie(`extproviders_${appid}`, favSource, 365);
      });

      if (elem.api && elem.api.GetPrices && curSources.includes(it.id)) {
        $J('.sih-functions-panel .spinner').show();

        countProviders();

        let timer = null;
        let iteration = 0;
        let maxIteration = 10;

        timer = setInterval(() => {
          iteration++;

          const renderedItemsLength = $J(`.inventory_ctn:visible .item.app${g_ActiveInventory.appid}`).length;
          const totalInventoryItemsCount = g_ActiveInventory?.m_rgChildInventories
            ? Object.values(g_ActiveInventory.m_rgChildInventories).reduce(
                (acc, inventory) => acc + inventory.m_cItems,
                0
              )
            : g_ActiveInventory.m_cItems;

          if (renderedItemsLength === totalInventoryItemsCount || iteration >= maxIteration) {
            clearInterval(timer);
            cnt += 1;
            elem.api.GetPrices(
              appid,
              {
                market: elem.name,
                currencies: it.currencies,
                nameMarkerForApi: elem.nameForApi,
                marketSort: elem.sort,
                isRefresh,
              },
              cnt === curSources.length
            );
          }
        }, 500);
        $item.find(`#${it.id}`).prop('checked', true);
      }
      providersList.append($item);
    });

    providersList.append(`
            <div class="warning">
                ${SIHLang.maxnumprovidersselectedwarn}
            </div>
        `);
  } else {
    $J('#provider_list .provider-item').remove();
    $J('.sih-functions-panel').hide();
  }
};

var CancelSelectAll = function () {
  $J('.inventory_page .group_inventory_sell_button_container').remove();
  $J(`.inventory_page .inventory_ctn:visible div.item.app${g_ActiveInventory.appid}`).each((idx, elem) => {
    if (elem.rgItem && Array.isArray(elem.rgItem.groupInventories)) {
      elem.rgItem.groupInventories.forEach((item) => {
        item.isSelectedForSell = false;
      });
    }
  });
  $J(
    `.inventory_page .inventory_ctn:visible div.item.app${g_ActiveInventory.appid} .number_selected_inventory`
  ).remove();

  $J('.item').removeClass('group_inventory_master_selected_sell');
  $J('.item.selectedSell').removeClass('selectedSell');
  $J('.similar-item').removeClass('similar-item');

  $J('#Lnk_ShowSellMulti').hide();
  $J('#Lnk_TurnIntoGems').hide();
  $J('#Lnk_SendGifts').hide();
  $J('#Lnk_Unpack').hide();

  var items = $J(g_ActiveInventory.getInventoryElement()).find('div.item.selectedSell');
  items.each(function (idx, elem) {
    $J(elem).removeClass('similar-item').removeClass('selectedSell');
  });

  selectmode = false;
  SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
  $J('#Lnk_Cancel').hide();
  if (g_ActiveInventory.selectedItem) {
    g_ActiveInventory.SelectItem(null, g_ActiveInventory.selectedItem.element, g_ActiveInventory.selectedItem);
  }
};

var CheckItem = function (prefix, item, owner) {
  var cacheId = item.appid + '/' + item.contextid + '/' + item.id;
  var sItem = item || g_ActiveInventory.selectedItem.description;

  if (
    sItem.appid == 753 &&
    sItem.actions &&
    sItem.actions[0].link &&
    sItem.actions[0].link.startsWith('https://store.steampowered.com/app/')
  ) {
    return;
  }

  if (!sItem.market_hash_name) {
    sItem.market_hash_name = sItem.name;
  }

  var itemLink =
    window.location.protocol +
    '//steamcommunity.com/market/priceoverview/?appid=' +
    sItem.appid +
    '&country=' +
    g_strCountryCode +
    '&currency=' +
    currencyId +
    '&market_hash_name=' +
    encodeURIComponent(sItem.market_hash_name);

  RequestCacher.get({
    type: 'GET',
    url: itemLink,
  }).then((response) => {
    if (response.success) {
      cacheItems[cacheId] = response;
      if (response.lowest_price) {
        var lowest_price = response.lowest_price.replace(',', '.').split(' ');
        var price = getPriceAsInt(response.lowest_price);
        if (!isNaN(price)) {
          inventoryPrice += price;
          var formatPrice = v_currencyformat(inventoryPrice * 100, GetCurrencyCode(g_rgWalletInfo.wallet_currency));
          $J('#providerPrice .priceValue').text(formatPrice);
        }
      }
    }
  });
};

function showNonTradableItems() {
  $J('body').append('<div id="tradable-msg-holder">Loading...</div>');

  var nonTradableCounter = 0;
  var tradableDates = [];
  var assets = [];
  var gameData = getUserGames();
  var counter = 0;
  var dataSize = gameData.length;

  function getGameInfo() {
    if (counter >= dataSize) return;

    RequestCacher.get({
      url: `${location.origin}${location.pathname}json/${gameData[counter].id}/${gameData[counter].param}`,
    })
      .then(function (res) {
        if (res.success) {
          var items = res.rgDescriptions;
          for (var i in items) {
            if (!items[i].tradable && items[i].cache_expiration !== undefined) {
              var tradableDate = new Date(items[i].cache_expiration).getTime();
              var time = Math.floor(tradableDate / 1000);
              Object.keys(res.rgInventory).forEach((itemID) => {
                const invItem = res.rgInventory[itemID];
                if (`${invItem.classid}_${invItem.instanceid}` === i) {
                  nonTradableCounter += 1;
                  assets.push({
                    appid: items[i].appid,
                    name: items[i].market_hash_name || items[i].market_name || items[i].name,
                  });
                }
              });
              tradableDates.push(parseInt(time));
            }
          }
        }

        if (++counter === dataSize) {
          if (nonTradableCounter) {
            tradableDates.sort();
            $J('#tradable-msg-holder').html(
              makeItemsInfoMessage(nonTradableCounter, tradableDates[0], tradableDates[tradableDates.length - 1])
            );
            getNonTradableItemsPrice(assets);
          } else {
            $J('#tradable-msg-holder').text('All items are tradable.');
            setTimeout(function () {
              $J('#tradable-msg-holder').remove();
            }, 5000);
          }
        } else {
          getGameInfo();
        }
      })
      .catch((err) => {
        console.error(JSON.stringify(err));
        getGameInfo();
      });
  }

  getGameInfo();
}

function getUserGames() {
  var apps = [730, 570, 440],
    data = [];

  $J('.games_list_tab').each(function () {
    var gameId = this.getAttribute('href').substr(1);
    var param = apps.indexOf(parseInt(gameId)) !== -1 ? 2 : 1;
    data.push({ id: gameId, param: param });
  });

  return data;
}

function getNonTradableItemsPrice(assets) {
  PriceQueue._successDelay = 3000;
  var totalPrice = 0;
  var size = assets.length;

  for (var i = 0; i < size; ++i) {
    var itemLink =
      window.location.protocol +
      '//steamcommunity.com/market/priceoverview/?appid=' +
      assets[i].appid +
      '&country=' +
      g_strCountryCode +
      '&currency=' +
      currencyId +
      '&market_hash_name=' +
      encodeURIComponent(assets[i].name);

    PriceQueue.GetPrice({
      method: 'get',
      url: itemLink,
      success: function (res) {
        if (res.success && res.lowest_price) {
          totalPrice += getPriceAsInt(res.lowest_price);
          var formatPrice = v_currencyformat(totalPrice * 100, GetCurrencyCode(g_rgWalletInfo.wallet_currency));
          $J('#tradable-msg-holder .non-tradable-total').text(formatPrice);
        }
      },
      error: function () {},
    });
  }
}

function makeItemsInfoMessage(count, timeStart, timeEnd) {
  return `<span class="msg">${count} ${SIHLang.nontradable.counter}.
        <br/>${SIHLang.nontradable.startdate}: ${timeStart ? formatDate(timeStart) : 'UNKNOWN'}.
        <br/>${SIHLang.nontradable.lastdate}: ${timeEnd ? formatDate(timeEnd) : 'UNKNOWN'}.
        <br/>${SIHLang.nontradable.totalprice}: <span class="non-tradable-total"></span></span>
        <span class="hide-msg">x</span>`;
}

async function getFloat(link, isForce = false) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(SIHID, { type: 'BACKGROUND_GET_WEAR_VALUE', data: { link, isForce } }, function (data) {
      resolve(data);
    });
  });
}

function findDate(str) {
  var time = 0;
  try {
    if (str.toLowerCase().indexOf('tradable after') !== -1) {
      var value = str.replace(taradableStrExp, '');
      if (value.indexOf('[date]') !== -1) {
        time = /\d+/.exec(value)[0];
      } else {
        var tradableDate = new Date(value).getTime();
        time = Math.floor(tradableDate / 1000);
      }
    }
  } catch (err) {}
  return time;
}

var InventoryUtils =
  InventoryUtils ||
  (() => {
    // Delay promise function
    const onNextTick = (delay = 0) => new Promise((r) => setTimeout(r, delay));

    return (inventory) => ({
      ready() {
        let cb;
        return new Promise((resolve) => {
          if (inventory.m_bFullyLoaded) return resolve();

          cb = ((r) => async () => {
            await onNextTick(); // wait until inventory changes will be applied === run next line of code in the next tick
            inventory.m_bFullyLoaded && r();
          })(resolve);

          inventory.AddOnItemsLoadedCallback(cb);
        }).then(() => inventory.RemoveOnItemsLoadedCallback(cb));
      },
      nav: {
        prevPage() {
          inventory.PreviousPage();
        },
        nextPage() {
          inventory.NextPage();
        },
        page(iNextPage) {
          const iCurPage = inventory.m_iCurrentPage;

          if (iCurPage === iNextPage || iNextPage < 0 || iNextPage > inventory.m_cPages - 1) return;

          if (!inventory.m_$Inventory.hasClass('paging_transition')) {
            const isForward = iCurPage < iNextPage;
            const nPageWidth = inventory.m_$Inventory.children('.inventory_page:first').width();
            const translation = (iCurPage - iNextPage) * nPageWidth;

            inventory.PrepPageTransition(nPageWidth, iCurPage, iNextPage);
            inventory.m_$Inventory.css('left', `${isForward ? 0 : -translation}px`);

            inventory.m_$Inventory.animate({ left: isForward ? translation : 0 }, 250, null, function () {
              inventory.FinishPageTransition(iCurPage, iNextPage);
            });
          } else if (inventory.m_$Inventory.hasClass('paging_transition')) {
            inventory.m_fnQueuedPageTransition = (
              (nav, index) => () =>
                nav.page(index)
            )(this, index);
          }
        },
        lastPage() {
          this.page(inventory.m_cPages - 1);
        },
        firstPage() {
          this.page(0);
        },
      },
    });
  })();

// Shows badges on inventory item' cards with information about date of trade unlocking
var ItemTreadLocks =
  ItemTreadLocks ||
  (() => {
    // Cache lifetime for fetchAdditionalData service
    const DATA_CACHE_LIFETIME = 1000 * 60 * 3; // 3 minutes

    // Calculate badge text
    const badgeText = (diff) => {
      if (!diff) {
        return false;
      }

      let { days, hours } = diff;

      let badge = '';
      if (days) {
        badge = `${days}D`;
      } else {
        if (hours > 16) {
          badge = '1D';
        } else if (hours <= 16 && hours > 8) {
          badge = '16H';
        } else if (hours <= 8 && hours > 1) {
          badge = '8H';
        } else {
          badge = '1H';
        }
      }

      return badge;
    };

    // Calculate time to unlocking (in days and hours)
    const timeToUnlock = (date) => {
      if (!date) {
        return false;
      }

      const hours = Math.ceil((date.getTime() - Date.now()) / 1000 / 60 / 60);
      const days = Math.ceil(hours / 24);

      return { days, hours };
    };

    // Render badge for the specified inventory item
    const renderItem = (item, badge, type) => {
      // WARNING: do not uncomment the next line (for testing purposes only)
      //item.append('<div class="slot_app_fraudwarning"></div>')

      // Move right element .slot_app_fraudwarning
      item.addClass('with-trade-block');

      item.find('.trade-lock-badge').remove();
      // Render trade-lock badge
      SIH?.AppendElementToItemHeader(item, type, badge);
    };

    // Render badges for locked inventory items
    const updateInventoryItems = (items, additionalData) => {
      if (!items || !items.length || !Object.keys(additionalData || {}).length) {
        return;
      }

      items.each(function (index, el) {
        const item = this.rgItem;
        const { classid, instanceid } = item.description;
        const { cache_expiration, tradable, marketable, sealed, owner_descriptions, type } =
          additionalData[`${classid}_${instanceid}`] || {};

        item.en_type = type;

        if (cache_expiration) {
          // add data about expiration date into each inventory item
          item.blockExpiredAt = new Date(cache_expiration).getTime() || undefined;

          const badge = badgeText(timeToUnlock(new Date(cache_expiration)));

          if (!badge || !window.show_trade_unlock_date_badge) {
            return;
          }

          const locked = !tradable || !marketable;

          renderItem($J(el), badge, locked ? 'trade_lock_time' : 'not_visible_time');
        }

        if (sealed) {
          const { tradeProtectedExpiredAt, tradeProtectedUntilStr } = getTimeProtect(owner_descriptions);

          item.tradeProtectionExpiredAt = tradeProtectedExpiredAt;

          const badge = badgeText(timeToUnlock(new Date(tradeProtectedUntilStr)));

          if (!badge || !window.show_trade_unlock_date_badge) {
            return;
          }

          SIH?.AppendElementToItemHeader($J(el), 'protectedBadge');

          renderItem($J(el), badge, 'protected_time');
        }
      });
    };

    const getTimeProtect = (owner_descriptions) => {
      const tradeProtectedUntilInfo =
        (owner_descriptions &&
          owner_descriptions.filter(
            (d) =>
              d.type === 'html' &&
              d.value.startsWith(
                '⇆ This item is trade-protected and cannot be consumed, modified, or transferred until'
              )
          )[0]) ||
        undefined;

      const tradeProtectedUntilStr = tradeProtectedUntilInfo
        ? tradeProtectedUntilInfo.value.match(
            /⇆ This item is trade-protected and cannot be consumed, modified, or transferred until (.+)/
          )[1]
        : undefined;

      return {
        tradeProtectedUntilStr,
        tradeProtectedExpiredAt: new Date(tradeProtectedUntilStr).getTime() || undefined,
      };
    };

    return {
      add: async () => {
        try {
          await InventoryUtils(g_ActiveInventory).ready();

          const { appid } = g_ActiveInventory;
          const data = g_inventoryData[appid].profile;

          updateInventoryItems($J(`.inventory_ctn:visible div.item.app${appid}`), data.rgDescriptions);
        } catch (error) {
          console.error('ItemTreadLocks: fail -', error.message);
        }
      },
      badgeText,
      timeToUnlock,
      getTimeProtect,
    };
  })();

var statInventoryPage =
  statInventoryPage ||
  (() => {
    const register = (adLocation) => {
      // const timeout = setTimeout(() => {
      //   clearTimeout(timeout)
      //
      //   const data = {
      //     adId: 4,
      //     partner: 'sih',
      //     action: 'show',
      //     adLocation
      //   };
      //
      //   chrome.runtime.sendMessage(SIHID, {type: "AD_HIT_STORE", data});
      // }, 500)
    };

    return {
      register: {
        newInterface: () => register('new-inventory-page'),
        oldInterface: () => register('inventory-page'),
      },
    };
  })();
