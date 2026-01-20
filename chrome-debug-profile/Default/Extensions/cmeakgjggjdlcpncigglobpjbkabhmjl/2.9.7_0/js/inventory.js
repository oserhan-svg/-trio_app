/*global $J, g_ActiveInventory, g_ActiveUser, g_sessionID, UserYou, SellItemDialog*/

var g_isLocalReloadAllInventory = false;
var g_inventoryData = {};
let MAX_RETRIES_ITEMS_INIT = 3;
let retryCount = 0;
let lastRightPanelMarketHashName = null;

// Prototype Steam

if (IS_ENABLED_SIH) {
  SIH?.DetectChangeHeightPageRight();
  chrome.runtime.sendMessage(SIHID, { type: 'BACKGROUND_UPDATE_USER_STATE' }, () => {});

  initRgItems();
  initForm();

  var ShowItemInventoryMaster = ShowItemInventory;
  var ShowItemInventory = (appid, contextid, assetid, bLoadCompleted) => {
    SIH?.HideSIHMarketListing();
    SIH?.HideSkinsRefillBalanceButton();

    if (!g_inventoryData[appid]) {
      g_isLocalReloadAllInventory = false;
      disabledControls(true);
    }
    const res = ShowItemInventoryMaster(appid, contextid, assetid, bLoadCompleted);

    disabledControls(false);

    // if (window.extprice) {
    // SetupExternalDropdown(g_ActiveInventory.appid);
    // }

    rerenderSortButton();

    return res;
  };

  CInventory.prototype.MakeActiveMaster = CInventory.prototype.MakeActive;
  CInventory.prototype.MakeActive = function () {
    if (this.m_bPerformedInitialLoad) {
      loadImprovedInventoryNav();
    }
    this.MakeActiveMaster();
  };

  function ReloadCommunityInventory(itemid) {
    if (typeof UserYou != 'undefined') {
      g_inventoryData[g_ActiveInventory.appid].data.assets = [];
      g_inventoryData[g_ActiveInventory.appid].data.descriptions = [];
      UserYou.ReloadInventory(753, 6, itemid);
    }
  }

  CInventory.prototype.LoadMoreAssetsMaster = CInventory.prototype.LoadMoreAssets;
  CInventory.prototype.LoadMoreAssets = function (count) {
    //It is necessary in order that when you change the tab of the game and do not get all the responses from requests for another game
    if (g_isLocalReloadAllInventory && +this.appid === +g_ActiveInventory.appid) {
      this.m_$Inventory.addClass('loading');

      this.m_owner.ShowLoadingIndicator();

      this.m_bPerformedInitialLoad = true;
      this.m_$Inventory.removeClass('loading');

      this.AddInventoryData(Object.assign({}, g_inventoryData[g_ActiveInventory.appid].data));
      this.m_tsLastError = 0;
      this.HideInventoryLoadError();
      this.m_SingleResponsivePage.EnsurePageItemsCreated();

      if (this.m_parentInventory) this.m_parentInventory.m_SingleResponsivePage.EnsurePageItemsCreated();

      this.m_owner.HideLoadingIndicator();

      for (var i = 0; i < this.m_rgOnItemsLoadedCallbacks.length; i++) this.m_rgOnItemsLoadedCallbacks[i]();

      return null;
    } else {
      return this.LoadMoreAssetsMaster(1000).done(() => {
        loadAllInventory();
      });
    }
  };

  CInventory.prototype.AddInventoryDataMaster = CInventory.prototype.AddInventoryData;
  CInventory.prototype.AddInventoryData = function (data) {
    const appId = +g_ActiveInventory.appid;
    const isActualGamePage = +this.appid === +g_ActiveInventory.appid;

    //Add a cache of items from the request and when changing the game when a long load has already started
    if (!g_isLocalReloadAllInventory || (g_isLocalReloadAllInventory && !isActualGamePage)) {
      g_isLocalReloadAllInventory = false;
      loadInventoryData(data, +this.appid);
    }

    if (!data?.assets) return;

    data.assets.forEach((item) => {
      delete item.groupInventories;
      delete item.countGroupInventory;
    });

    const switcherGroupInventory = ((g_inventoryData || {})[appId] || {}).isGroupInventory;
    let assets = {};
    //Additional checks, selected game tabb and groupings
    if (switcherGroupInventory && isActualGamePage) {
      inventoryAssign(data.assets, g_inventoryData[appId].profile.rgDescriptions);

      data.assets.forEach((item, index) => {
        const key = `${item.profile.marketHashName}_${item.profile.cacheExpiration.date ? 'ce' : ''}_${!SIH?.isAvailableGroup(item) ? index : ''}`;

        if (!assets[key]) {
          assets[key] = [];
        }
        assets[key].push(item);
      });

      data.assets = [];
      for (const i in assets) {
        assets[i].sort((a, b) =>
          (a.profile.cacheExpiration.date || 0) > (b.profile.cacheExpiration.date || 0)
            ? 1
            : (b.profile.cacheExpiration.date || 0) > (a.profile.cacheExpiration.date || 0)
              ? -1
              : 0
        );
        assets[i].forEach((x) => {
          x.countGroupInventory = assets[i].length;
          x.groupInventories = assets[i];
        });
        const item = assets[i][0];
        data.assets.push(item);
      }
      data.total_inventory_count = data.assets.length;
    }

    data.descriptions.forEach((item) => {
      const objs = [kStandardTag_Tradable, kStandardTag_Untradable, kStandardTag_Marketable, kStandardTag_Unmarketable];
      if (Array.isArray(item.tags)) {
        for (const i in objs) {
          const obj = objs[i];
          const ind = item.tags.findIndex((x) => x.internal_name == obj.internal_name && x.category == obj.category);
          if (ind > -1) {
            item.tags.splice(ind, 1);
          }
        }
      }
    });

    this.AddInventoryDataMaster(data);

    //Additional checks, selected game tab and groupings
    if (switcherGroupInventory && isActualGamePage) {
      data.assets.forEach((item) => {
        item.description.useCountMarketHashName = item.countGroupInventory;
      });
      SIH?.inventoryGroup?.loadGroupInventoryDialog();
    }

    //Additional checks, selected game tab
    if (isActualGamePage && [753, 440].includes(appId)) {
      SIH?.RecalculateRefillBalanceButton();
    }

    if (this.m_bFullyLoaded) {
      SIH?.itemCard?.ItemCardModify();
    }
  };

  var InventoryNextPageMaster = InventoryNextPage;
  var InventoryNextPage = () => {
    InventoryNextPageMaster();
    SIH?.inventoryGroup?.loadGroupInventoryDialog();
    SIH?.inventoryGroup?.loadInventorySelectionFromInventoryGroup();
  };

  var InventoryPreviousPageMaster = InventoryPreviousPage;
  var InventoryPreviousPage = () => {
    InventoryPreviousPageMaster();
    SIH?.inventoryGroup?.loadGroupInventoryDialog();
    SIH?.inventoryGroup?.loadInventorySelectionFromInventoryGroup();
  };

  var g_elActions = null;
  var PopulateMarketActionsMaster = PopulateMarketActions;
  var PopulateMarketActions = (elActions, item) => {
    PopulateMarketActionsMaster(elActions, item);
    g_elActions = elActions;

    if (g_bViewingOwnProfile) {
      if (item.countGroupInventory > 1) {
        const $itemMarketActions = $J('#active_inventory_page .item_market_actions');
        $itemMarketActions.find('.item_market_action_button').remove();

        const isWeapon = isUniqueInventory(item.description.tags);
        $itemMarketActions.append(`<div>
                    <button class="group_inventory_select_multiple_for_cell_btn">${SIHLang.selectMultiple}</button>
                    <button class="group_inventory_choose_all_for_cell_btn" style="margin-left: 10px;">${SIHLang.chooseAll}</button>
                    </div>`);

        $itemMarketActions.find('.group_inventory_select_multiple_for_cell_btn').click(function () {
          if (!selectmode) {
            $J('.sih_select_inventory_button').click();
          }
          //GroupInventoryDialog.Show(item.element, isWeapon, true);

          if (isWeapon) {
            SIH?.inventoryGroup?.uniqueInventory.load(item);
          } else {
            SIH?.inventoryGroup?.standardInventory.load(item);
          }
        });

        $itemMarketActions.find('.group_inventory_choose_all_for_cell_btn').click(function () {
          if (!selectmode) {
            $J('.sih_select_inventory_button').click();
          }
          $J(item.element).parent().find('.selectedSell').remove();
          $J(item.element).addClass('group_inventory_master_selected_sell');
          const includeTradelocked = $J('#include_tradelocked_checkbox').is(':checked');

          item.element.rgItem.groupInventories.forEach((data, i) => {
            if (!item.blockExpiredAt && !item.tradeProtectionExpiredAt) {
              data.isSelectedForSell = true;
              addSell(item.element, data, i);
            } else if (includeTradelocked) {
              item.isSelectedForSell = true;
              addSell(item.element, data, i);
            }
          });
          sellBtn();
          SIH?.inventoryGroup?.loadGroupInventoryDialog();
        });
      }
    }

    if (!item.description.marketable && (item.blockExpiredAt || item.tradeProtectionExpiredAt)) {
      new Ajax.Request('https://steamcommunity.com/market/priceoverview/', {
        method: 'get',
        parameters: {
          country: g_strCountryCode,
          currency: typeof g_rgWalletInfo != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1,
          appid: item.appid,
          market_hash_name: GetMarketHashName(item.description),
        },
        onSuccess: () => {},
        onFailure: () => {},
      });
    }
  };

  CInventory.prototype.SelectItemMaster = CInventory.prototype.SelectItem;
  CInventory.prototype.SelectItem = function (event, elItem, rgItem, bUserAction) {
    window.g_sih_isSelectItem = true;
    window.g_sih_selectItem = rgItem;
    window.g_sih_selectItem2 = rgItem;
    return this.SelectItemMaster(event, elItem, rgItem, bUserAction);
  };

  const AjaxMaster = $J.ajax;
  $J.ajax = function (req) {
    return AjaxMaster(req)
      .success((res) => {
        if (req.url.includes('/auction/ajaxgetgoovalueforitemtype')) {
          if (window.g_sih_selectItem2 && res.success) {
            window.g_sih_selectItem2.goo_value = +res.goo_value;
          }
        }

        return res;
      })
      .error((err) => {
        return err;
      });
  };
}

function initRgItems() {
  if (!g_ActiveInventory || !g_ActiveInventory.appid) {
    retryInitRgItems();
    return;
  }

  const items = $J(`.inventory_ctn:visible .item.app${g_ActiveInventory.appid}`);
  if (items.length > 0 && items[0].rgItem) {
    // TODO Временный костыль
    setTimeout(loadRgItems, 700);
  } else {
    retryInitRgItems();
  }

  GetEquippedItems();
  GetItemsInTrades();
  GetBookmarkedItems();
}

function retryInitRgItems() {
  if (retryCount < MAX_RETRIES_ITEMS_INIT - 1) {
    retryCount++;
    setTimeout(initRgItems, 700);
  }
}

function initForm() {
  setTimeout(function () {
    loadForm();
  }, 700);
}

function loadRgItems() {
  g_isLocalReloadAllInventory = false;
  loadAllInventory();
}

function loadForm() {
  disabledControls(true);
}

function loadInventoryData(data, appid) {
  appid = appid || +g_ActiveInventory.appid;

  if (!g_inventoryData[appid]) {
    g_inventoryData[appid] = {
      data: {
        assets: [],
        descriptions: [],
        total_inventory_count: 0,
      },
      profile: {
        rgInventory: [],
        rgDescriptions: [],
      },
      isLoadFirst: false,
      isCheckbox: false,
      isLocalReloadAllInventory: false,
    };
  }

  if (data && Array.isArray(data.assets)) {
    g_inventoryData[appid].data.assets = g_inventoryData[appid].data.assets.concat(data.assets);
  }
  if (data && Array.isArray(data.descriptions)) {
    g_inventoryData[appid].data.descriptions = g_inventoryData[appid].data.descriptions.concat(data.descriptions);
  }

  const totalInventoryItemsCount = g_ActiveInventory?.m_rgChildInventories
    ? Object.values(g_ActiveInventory.m_rgChildInventories).reduce((acc, inventory) => acc + inventory.m_cItems, 0)
    : data.total_inventory_count;

  g_inventoryData[appid].data.total_inventory_count = totalInventoryItemsCount;
}

function loadUseCountMarketHashName() {
  const inventories = g_inventoryData[g_ActiveInventory.appid].data.assets;
  const useCount = {};
  inventories.forEach((item) => {
    const marketHashName = item.description.market_hash_name;

    if (useCount[marketHashName]) {
      useCount[marketHashName] += 1;
    } else {
      useCount[marketHashName] = 1;
    }
  });

  for (const marketHashName in useCount) {
    const items = inventories.filter((x) => x.description.market_hash_name === marketHashName);

    items.forEach((item) => {
      if (item) {
        item.description.useCountMarketHashName = useCount[marketHashName];
      }
    });
  }
}

// Load all inventory
function loadAllInventory() {
  if (!g_inventoryData[g_ActiveInventory.appid]) {
    setTimeout(() => {
      if (g_ActiveInventory?.m_rgContextIds?.length) {
        g_ActiveInventory.m_rgContextIds.forEach((contextId) => {
          const { m_rgAssets, m_rgDescriptions, m_cItems } = g_ActiveInventory.m_rgChildInventories[contextId];

          if (m_rgAssets && m_rgDescriptions) {
            loadInventoryData({
              assets: Object.keys(m_rgAssets).map(function (k) {
                return m_rgAssets[k];
              }),
              descriptions: Object.keys(m_rgDescriptions).map(function (k) {
                return m_rgDescriptions[k];
              }),
              total_inventory_count: m_cItems,
            });
          }
        });
      } else if (g_ActiveInventory.m_rgAssets && g_ActiveInventory.m_rgDescriptions) {
        loadInventoryData({
          assets: Object.keys(g_ActiveInventory.m_rgAssets).map(function (k) {
            return g_ActiveInventory.m_rgAssets[k];
          }),
          descriptions: Object.keys(g_ActiveInventory.m_rgDescriptions).map(function (k) {
            return g_ActiveInventory.m_rgDescriptions[k];
          }),
          total_inventory_count: g_ActiveInventory.m_cItems,
        });
      }
      loadAllInventory();
      return;
    }, 100);
  }

  if (g_inventoryData[g_ActiveInventory.appid] && !g_inventoryData[g_ActiveInventory.appid].isLoadFirst) {
    g_inventoryData[g_ActiveInventory.appid].isLoadFirst = true;
    LoadCompleteAllInventory().then(() => {
      for (let i = 0; i < g_ActiveInventory.m_cPages; i++) {
        g_ActiveInventory.m_rgPages[i].EnsurePageItemsCreated();
        g_ActiveInventory.PreloadPageImages(i);
      }

      loadUseCountMarketHashName();

      if (g_steamID === g_ActiveInventory.m_owner.strSteamId) {
        // LOAD JSON IN MY INVENTORY
        loadProfileInventory(g_steamID).then(() => {
          ItemTreadLocks.add();
          disabledControls(false);
        });
      } else {
        // LOAD JSON IN OTHER INVENTORY
        g_inventoryData[g_ActiveInventory.appid].profile.rgDescriptions = g_ActiveInventory.m_rgDescriptions;
        disabledControls(false);
      }

      loadImprovedInventoryNav();
      // if (window.extprice) {
      // SetupExternalDropdown(g_ActiveInventory.appid);
      // }

      loadRightInventoryPanel(g_ActiveInventory.selectedItem);
      SIH?.interfacePage?.loadTotalPriceSteam();
    });
  }
}

function LoadCompleteAllInventory() {
  return new Promise((resolve, reject) => {
    if (typeof g_ActiveInventory.LoadCompleteInventory == 'function' && !g_ActiveInventory.BIsFullyLoaded()) {
      g_ActiveInventory.LoadCompleteInventory().done(resolve).fail(reject);
    } else {
      resolve();
    }
  });
}

function inventoryAssign(assets, descriptions) {
  assets.forEach((item) => {
    const key = `${item.classid}_${item.instanceid}`;
    for (let descriptionKey in descriptions) {
      const keyLocal = `${descriptions[descriptionKey].classid}_${descriptions[descriptionKey].instanceid}`;
      if (key === keyLocal) {
        item.profile = {
          cacheExpiration: {},
          marketHashName: (descriptions[descriptionKey] || {}).market_hash_name,
        };

        if (descriptions?.[descriptionKey]?.cache_expiration || descriptions?.[descriptionKey]?.owner_descriptions) {
          const { tradeProtectedUntilStr } = ItemTreadLocks.getTimeProtect(
            descriptions?.[descriptionKey]?.owner_descriptions
          );

          item.profile.cacheExpiration.date = new Date(
            tradeProtectedUntilStr || descriptions[descriptionKey].cache_expiration
          );
          item.profile.cacheExpiration.numberBadge = ItemTreadLocks.timeToUnlock(item.profile.cacheExpiration.date);
          item.profile.cacheExpiration.badge = ItemTreadLocks.badgeText(item.profile.cacheExpiration.numberBadge);
        }
      }
    }
  });
}

function loadProfileInventory(steamId) {
  const { appid, contextid, m_owner } = g_ActiveInventory;

  const queueRequest = [];

  if (g_ActiveInventory?.m_rgContextIds?.length) {
    g_ActiveInventory?.m_rgContextIds.forEach((contextId) => {
      const url = `https://steamcommunity.com/profiles/${steamId}/inventory/json/${appid}/${contextId}/`;
      const params = {
        l: 'english',
      };

      queueRequest.push({ url, params });
    });
  } else {
    const url = `https://steamcommunity.com/profiles/${steamId}/inventory/json/${appid}/${+appid === 753 ? 6 : contextid}/`;
    const params = {
      l: 'english',
    };

    queueRequest.push({ url, params });
  }

  return Promise.all(
    queueRequest.map(({ url, params }) => {
      return new Promise((resolve) => {
        $J.get(url, params).done(function (data) {
          if (data.success && g_inventoryData[appid]) {
            for (const [key, value] of Object.entries(data)) {
              if (key !== 'rgDescriptions' && key !== 'rgInventory') {
                g_inventoryData[appid].profile[key] = value;
              } else {
                g_inventoryData[appid].profile[key] = { ...g_inventoryData[appid].profile[key], ...value };
              }
            }
            resolve(data);
          }
        });
      });
    })
  );
}

function improvedInventoryNav() {
  const renderControls = () => {
    // Get navigation controls block
    const controls = $J('#inventory_pagecontrols');

    controls.addClass('inventory_pagecontrols_nav');
    controls.find('.inventory_loading_indicator > img').css({ width: '25px', opacity: 1 });

    // Get prev and next buttons
    const prevButton = controls.find('#pagebtn_previous');
    controls.find('#pagebtn_first').remove();
    prevButton.after(`
            <a class="pagecontrol_element pagebtn disabled" id="pagebtn_first" style="margin-right: 3px;"><<</a>
        `);

    const nextButton = controls.find('#pagebtn_next');
    controls.find('#pagebtn_last').remove();
    nextButton.before(`
            <a class="pagecontrol_element pagebtn" id="pagebtn_last" style="margin-left: 3px;">>></a>
        `);

    // Get new buttons

    const lastButton = controls.find('#pagebtn_last');

    const firstButton = controls.find('#pagebtn_first');
    controls.find('#pageinput_index').remove();
    controls.find('#pagebtn_page').remove();
    // Add "Go to specified page" block
    firstButton.after(`
            <input id="pageinput_index" min="1" class="selectableText filter_search_box nav-page-index" type="number"></input>
            <a id="pagebtn_page" class="pagecontrol_element pagebtn" style="margin-left: 3px; float: left;">Go</a>
        `);

    // Get block's controls
    const pageButton = controls.find('#pagebtn_page');
    const pageIndexInput = controls.find('#pageinput_index');

    // Return all $controls
    return {
      controls,
      prevButton,
      nextButton,
      firstButton,
      lastButton,
      pageButton,
      pageIndexInput,
    };
  };

  const extendUpdatePageCountsMethod = (inventory, controls) => {
    // Store original method
    const { UpdatePageCounts } = inventory;
    const { firstButton, lastButton, pageIndexInput } = controls;

    // Extend method inventory.UpdatePageCounts
    inventory.UpdatePageCounts = () => {
      const { m_iCurrentPage, m_cPages } = inventory;

      if (m_iCurrentPage === 0) {
        firstButton.addClass('disabled');
      } else {
        firstButton.removeClass('disabled');
      }

      if (m_iCurrentPage < m_cPages - 1) {
        lastButton.removeClass('disabled');
      } else {
        lastButton.addClass('disabled');
      }

      pageIndexInput.val(v_numberformat(m_iCurrentPage + 1));

      UpdatePageCounts.call(inventory);
    };
  };

  const initPageIndexInput = (inventory, { pageIndexInput }) => {
    const { m_iCurrentPage, m_cPages } = inventory;

    pageIndexInput.val(m_iCurrentPage + 1);
    pageIndexInput.attr('max', m_cPages);

    pageIndexInput.change(() => {
      const { m_iCurrentPage, m_cPages } = inventory;
      const value = pageIndexInput.val();

      if (!value.length) return pageIndexInput.val(m_iCurrentPage + 1);
      if (value < 1) return pageIndexInput.val(1);
      if (value > m_cPages) return pageIndexInput.val(m_cPages);
    });
  };

  // Adds click handlers for new buttons
  const addEventListeners = (nav, { firstButton, lastButton, pageButton, pageIndexInput }) => {
    firstButton.click(() => nav.firstPage());
    lastButton.click(() => {
      nav.lastPage();
      SIH?.inventoryGroup?.loadGroupInventoryDialog();
      SIH?.inventoryGroup?.loadInventorySelectionFromInventoryGroup();
    });
    pageButton.click(() => {
      nav.page(pageIndexInput.val() - 1);
    });
  };

  try {
    const $controls = renderControls();

    extendUpdatePageCountsMethod(g_ActiveInventory, $controls);
    initPageIndexInput(g_ActiveInventory, $controls);
    addEventListeners(InventoryUtils(g_ActiveInventory).nav, $controls);
  } catch (error) {
    console.error('ImprovedInventoryNav: fail -', error.message);
  }
}

function disabledControls(isDisabled) {
  if (isDisabled) {
    $J('.sih_group_inventory_button').addClass('disabled');
  } else {
    $J('.sih_group_inventory_button').removeClass('disabled');
  }
}

function isUniqueInventory(tags) {
  return tags.find((x) => x.category.toUpperCase() === 'WEAPON' || x.internal_name.toUpperCase() === 'TYPE_HANDS');
}

function addSell(elem, data, index) {
  const newElem = $J(elem).clone(true);
  data.itemIndex = index;
  $(newElem)[0].rgItem = Object.assign({}, data);
  $(newElem)[0].rgItem.element = $(newElem)[0];
  $(newElem).addClass(`selectedSell selectedSell_${index} similar-item group_inventory_selected_sell`);
  $J(elem).after(newElem);
}

async function sellBtn() {
  const itC = $J('.selectedSell').length;
  const isEnabledGemApi = $J('#sih-check-gem-prices').is(':checked');
  const $turnIntoGemsBtn = $J('.sih_inventory_panel .sale_container .sih_turn_info_gems_inventory_button');
  const $gemsLoadingBlock = $J('.sih_inventory_panel .sale_container .sih-loading-block');

  let priceTemplate = '';
  let price = 0;

  for (const elem of $J('.selectedSell').toArray()) {
    const rgItem = elem.rgItem;

    if (!priceTemplate) {
      priceTemplate = rgItem.priceTemplate;
    }
    price += rgItem.extprice || 0;
  }

  if (isEnabledGemApi && +g_ActiveInventory.appid === 753) {
    setTimeout(async () => {
      $J('.sih_inventory_panel .sale_container .sih_turn_info_gems_inventory_button').html(
        SIHLang.inventory.title19.replace('$1', '---')
      );
      let gooValue = 0;
      for (const elem of $J('.selectedSell').toArray()) {
        const rgItem = elem.rgItem;

        if (rgItem.goo_value === undefined) {
          $gemsLoadingBlock.removeClass('hidden');
          $turnIntoGemsBtn.addClass('hidden');

          const strActionURL = `${g_strProfileURL}/ajaxgetgoovalue/`;

          const data = await $J.get(strActionURL, {
            sessionid: g_sessionID,
            appid: getAppIdFromTags(rgItem.description.tags),
            assetid: rgItem.assetid,
            contextid: rgItem.contextid,
          });
          rgItem.goo_value = +(data.goo_value || 0);
        }

        gooValue += rgItem.goo_value ? +rgItem.goo_value : 0;
      }

      $gemsLoadingBlock.addClass('hidden');
      $turnIntoGemsBtn.removeClass('hidden').html(SIHLang.inventory.title19.replace('$1', gooValue));
    }, 500);
  }

  const mpriceFormated = (SIH?.CurrencyService?.getPriceFromCurrency(price, currencyId, currencyId)).text;

  $J('.sih_inventory_panel .sale_container .select_number').html(SIHLang.inventory.title18.replace('$1', itC));
  $J('.sih_inventory_panel .sale_container .select_price').html(mpriceFormated);

  if (itC > 0) {
    $J('#Lnk_ShowSellMulti').html(itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item);

    $J('#Lnk_ShowSellMulti').show();
    if (g_ActiveInventory.appid == 753) {
      $J('#Lnk_TurnIntoGems').show();
      $J('#Lnk_SendGifts').show();
      $J('#Lnk_Unpack').show();
    }
  } else {
    $J('#Lnk_ShowSellMulti').hide();
    $J('#Lnk_TurnIntoGems').hide();
    $J('#Lnk_SendGifts').hide();
    $J('#Lnk_Unpack').hide();
  }
}

function loadImprovedInventoryNav() {
  if (window.show_improved_inventory_nav) {
    improvedInventoryNav();
  }
}

function agpGem(sItem) {
  if (window.agp_gem && sItem.description.type !== 'Rare Inscribed Gem' && sItem.appid == 570) {
    const cc = g_strCountryCode || getStoreRegionCountryCode() || g_rgWalletInfo.wallet_country;
    let isGenuine = false;

    for (let i = 0; i < sItem.description.descriptions.length; i++) {
      let d = sItem.description.descriptions[i];
      if (d.app_data && !d.app_data.is_itemset_name && !d.app_data.price && !d.app_data.limited) {
        getSetLink(d, sItem.description, isGenuine);
      }
      if (d.insgems) {
        break;
      }

      let ematch,
        gidx = 0;
      d.insgems = [];

      while ((ematch = insGemExp.exec(d.value))) {
        let gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Inscribed ' +
          ematch[1];
        d.insgems.push({ name: 'Inscribed ' + ematch[1] });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            let lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      while ((ematch = kinGemExp.exec(d.value))) {
        let gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Kinetic: ' +
          ematch[1];

        d.insgems.push({ name: 'Kinetic: ' + ematch[1] });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            let lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      while ((ematch = masGemExp.exec(d.value))) {
        var gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Rune%20of%20the%20Duelist%20Indomitable';
        d.insgems.push({ name: 'Rune%20of%20the%20Duelist%20Indomitable' });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            var lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      while ((ematch = corGemExp.exec(d.value))) {
        var gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Foulfell Shard';

        d.insgems.push({ name: 'Foulfell Shard' });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            var lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      while ((ematch = ethGemExp.exec(d.value))) {
        var gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Ethereal: ' +
          ematch[1];

        d.insgems.push({ name: 'Ethereal: ' + ematch[1] });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            var lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      while ((ematch = priGemExp.exec(d.value))) {
        var gemLink =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=570&country=' +
          cc +
          '&currency=' +
          currencyId +
          '&market_hash_name=Prismatic: ' +
          ematch[1];

        d.insgems.push({ name: 'Prismatic: ' + ematch[1] });

        PriceQueue.GetPrice({
          method: 'GET',
          url: gemLink,
          pars: { gemidx: gidx },
          success: function (response, $this) {
            var lp = 0,
              nfp = 0;
            if (response.success) {
              lp = response.lowest_price;
              nfp = response.median_price;

              d.insgems[$this.gemidx].lowestPrice = lp;
              d.insgems[$this.gemidx].nofeePrice = nfp;

              if (sItem === g_ActiveInventory.selectedItem) {
                // Возможно тут нужно делать обновление дескрипшена
              }
            }
          },
          error: function () {},
        });
        gidx++;
      }

      if (gidx > 0) {
      } else {
        delete d.insgems;
      }
    }
  }
}

function loadRightInventoryPanel(gitem = null) {
  const sItem = gitem || g_ActiveInventory.selectedItem;

  if (lastRightPanelMarketHashName && lastRightPanelMarketHashName === sItem?.description?.market_hash_name) return;

  lastRightPanelMarketHashName = sItem?.description?.market_hash_name;

  if (sItem?.description?.market_hash_name) {
    SIH?.blockOfMarketplaces?.loadForInventory(
      sItem?.appid.toString(),
      sItem?.description?.market_hash_name.toString(),
      ImageURL(sItem?.description?.icon_url, 96, 96),
      sItem?.description?.name
    );
  }

  if (!sItem) return;

  if (+sItem.appid === 753 && !sItem.description.marketable && !checkIfItemWillBeMarketable()) {
    return;
  }
  if (!sItem.description.market_hash_name) {
    sItem.description.market_hash_name = sItem.description.name;
  }
  let isGenuine = false;

  $J.each(sItem.description.tags, function () {
    isGenuine = isGenuine || (this.category == 'Quality' && this.internal_name == 'genuine');
    if (isGenuine) return false;
  });

  if (sItem.description.descriptions === undefined) sItem.description.descriptions = [{ type: 'html', value: '' }];

  //SIH?.stickerPrices?.load(sItem);

  SIH?.itemDescription.FloatInventoryButton(sItem.description);

  agpGem(sItem);

  if (g_inventoryData?.[g_ActiveInventory.appid]?.isLoadFirst) {
    RenderSelectAllSimilarItemsBtn(sItem);
  }
  PriceQueue.GenPriceDescription(sItem.description);

  SIH?.itemDescription?.UpdateReactDescription();
}

function RenderSelectAllSimilarItemsBtn(sItem) {
  if (!sItem?.description?.descriptions?.length) return;

  const index = sItem.description.descriptions.findIndex((x) => x.iscount);

  if (index > -1) {
    sItem.description.descriptions.splice(index, 1);
  }

  const similarCount = g_bViewingOwnProfile
    ? `(<a class="select-similar-all" data-name="${sItem.description.market_hash_name}">${SIHLang.selectall}</a>)`
    : '';

  if (!sItem?.description?.useCountMarketHashName) return;

  sItem.description.descriptions.unshift({
    iscount: true,
    type: 'html',
    value: `<div class="select_all_inventory">${SIHLang.numowned}: <i style="color: rgb(153, 204, 255); font-size: 16px">${sItem.description.useCountMarketHashName}</i> ${similarCount}</div>`,
  });
}

function SelectAllSimilarItemsBtnInitListener() {
  $J('.select-similar-all').each((index, item) => {
    $J(item).click(function () {
      const $thisItem = $J(this);

      const marketHashName = $thisItem.data('name');

      selectSimilar(marketHashName);
    });
  });
}

function rerenderSortButton() {
  const $container = $J('.sih_inventory_panel');
  const appId = +g_ActiveInventory.appid;

  const $sortTypeBtn = $container.find('.sih_sort_inventory_button').find('.sortType');

  // Set default sort by price
  const $sortByPriceOption = $container.find('.sih_sort_inventory_button #sort-types-content a#price');
  const category = $sortByPriceOption.attr('data-category');
  const title = $sortByPriceOption.text();
  $container.find('.sih_sort_inventory_button .sortType').attr('data-title', title).attr('data-category', category);

  //Set default sort icon
  if ($sortTypeBtn.hasClass('asc')) {
    $sortTypeBtn.removeClass('asc');
    $sortTypeBtn.addClass('no_sort');
  }
  if ($sortTypeBtn.hasClass('desc')) {
    $sortTypeBtn.removeClass('desc');
    $sortTypeBtn.addClass('no_sort');
  }

  //Show/hide not working buttons
  if (+appId === 753) {
    $J('#sort-types-content #gems').show();
  } else {
    $J('#sort-types-content #gems').hide();
  }
  if (+appId !== 730) {
    $J('#sort-types-content #float').hide();
    $J('#sort-types-content #sticker').hide();
    $J('#sort-types-content #charm').hide();
  } else {
    $J('#sort-types-content #float').show();
    $J('#sort-types-content #sticker').show();
    $J('#sort-types-content #charm').show();
  }
}

if (typeof window.fastdelta == 'undefined') window.fastdelta = -0.01;
if (typeof window.delaylistings == 'undefined') window.delaylistings = 200;
if (typeof window.quicksellbuttons == 'undefined') window.quicksellbuttons = true;
if (typeof window.buysetbuttons == 'undefined') window.buysetbuttons = true;

/*let AjaxRequestMaster = Ajax.Request;
Ajax.Request = function (url, data) {
  $J.ajax({
    url: url,
    type: data.method,
    data: data.parameters,
    error: function (error) {
      data.onSuccess(error);
    },
    success: function (response) {
      data.onSuccess({responseJSON: response});
    }
  });
}*/
