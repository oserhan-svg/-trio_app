var expMarketHashName = /market_hash_name=([^&]+)/;
var expCountryCode = /country=([^&]+)/;
var expCurrencyID = /currency=([^&]+)/;
var expAppID = /appid=([^&]+)/;
let TRADES_TXT = null;
const loadingTotalSteamPrice = [];

if (!window.SIHID) window.SIHID = 'cmeakgjggjdlcpncigglobpjbkabhmjl';

const STEAM_BY_SIH_SUPPORTED_APPS = [570, 730, 252490, 218620, 322330, 753, 578080, 440];
const SKINS_REFILL_SUPPORT_APPS = [753];

// Константа на случай, если API недоступен.
const STEAM_BY_SIH_SUPPORTED_CURRENCIES = {
  currencies: [1, 3, 5],
  defaultCurrency: 1,
};

let tf2Quality = {};

setTimeout(() => {
  $J.getJSON(`chrome-extension://${window.SIHID}/assets/json/tf2_quality.json`, function (data) {
    tf2Quality = data;
  });
}, 500);

var PriceQueue = {
  _currentURL: '',
  _numberOfErrors: 0,
  _currentError: 0,
  _isRunning: false,
  _isInit: false,
  _successDelay: 3000,
  _failureDelay: 30000,
  _queue: {},
  _urls: [],
  _cache: {},
  _currentproviderIdx: 0,
  _numberOfRepetitions: 0,
  _contextIds: [],

  _rebuildURL: function (url) {
    var _appid = expAppID.exec(url)[1];
    var _marketHashName = expMarketHashName.exec(url)[1];

    url = 'appid=' + _appid + '&market_hash_name=' + _marketHashName;
    return url;
  },
  GetPrice: function (options) {
    if (!PriceQueue._isInit) {
      PriceQueue.Init();
    }

    const start = () => {
      if (!PriceQueue._queue[options.url]) {
        PriceQueue._queue[options.url] = { url: options.url, handlers: [], pars: [] };
        if (options.insert) {
          PriceQueue._urls.unshift(options.url);
          if (options?.contextId) {
            PriceQueue._contextIds.unshift(options.contextId);
          }
        } else {
          PriceQueue._urls.push(options.url);
          if (options?.contextId) {
            PriceQueue._contextIds.push(options.contextId);
          }
        }
      }

      PriceQueue._queue[options.url].handlers.push(options.success);
      PriceQueue._queue[options.url].pars.push(options.pars || null);
      PriceQueue.StartQueue();
      PriceQueue.UpdateLabels();
    };

    options.url = PriceQueue._rebuildURL(options.url);

    if (PriceQueue._cache[options.url]) {
      const cache = PriceQueue._cache[options.url];
      const diffDatePrice = Date.now() - (cache.response.priceDateMs || 0);
      if (diffDatePrice < +window.priceUpdateTime) {
        options.success(cache.response, options.pars);
      } else {
        start();
      }
    } else {
      start();
    }
  },
  getCookie(strCookieName) {
    var rgMatches = document.cookie.match('(^|; )' + strCookieName + '=([^;]*)');
    if (rgMatches && rgMatches[2]) return rgMatches[2];
    else return null;
  },
  _getCurrencyCodeSteam() {
    return typeof g_rgWalletInfo != 'undefined' && g_rgWalletInfo.wallet_currency;
  },
  _getCountryCodeSteam() {
    return typeof g_rgWalletInfo != 'undefined' && g_rgWalletInfo.wallet_country;
  },
  _setSteamPrice(response, url, providerName) {
    const { lowest_price } = response;
    const appid = expAppID.exec(url)[1];

    if (STEAM_BY_SIH_SUPPORTED_APPS.includes(+appid)) {
      if (providerName !== 'SihPriceOverview' && ExternalPrices[appid] !== undefined && lowest_price !== undefined) {
        const name = expMarketHashName.exec(url)[1];

        if (+currencyId === 5 && lowest_price.match(/руб./)) {
          chrome.runtime.sendMessage(SIHID, {
            type: 'BACKGROUND_SET_USER_STEAM_PRICE',
            data: {
              app_id: appid,
              steamid: g_steamID,
              hash_name: name.replace('(', '%28').replace(')', '%29'),
              prices: [
                {
                  price: getPriceAsInt(lowest_price) / 100,
                  count: 1,
                },
              ],
            },
          });
        }
      }
    } else {
      console.warn(`SteamBySIH: app ${appid} not supported`); // eslint-disable-line
    }
  },
  PricesProviders: [
    {
      name: 'SteamOverviewPrice',
      numberOfRepetitions: 2,
      isApiUseCurrency: true,
      getprice: function (appid, market_hash_name) {
        const currencyCode = PriceQueue._getCurrencyCodeSteam() || PriceQueue.getCookie('steamCurrencyId') || 1;
        const countryCode = PriceQueue._getCountryCodeSteam() || 'US';

        var cacheURL = 'appid=' + appid + '&market_hash_name=' + market_hash_name;
        var url =
          window.location.protocol +
          '//steamcommunity.com/market/priceoverview/?appid=' +
          appid +
          '&country=' +
          countryCode +
          '&currency=' +
          currencyCode +
          '&market_hash_name=' +
          market_hash_name;

        $J.ajax({
          method: 'GET',
          url,
          cacheURL,
          success: function (response, textStatus, jqXHR) {
            PriceQueue._generalHandler.success(response, this.cacheURL, 'SteamOverviewPrice');
          },
          error: PriceQueue._generalHandler.error,
          complete: PriceQueue._generalHandler.complete,
        });
      },
    },
    // {
    //   name: 'SteamSearchPrice',
    //   numberOfRepetitions: 2,
    //   isApiUseCurrency: false,
    //   getprice: function (appid, market_hash_name) {
    //
    //     var cacheURL = 'appid=' + appid + '&market_hash_name=' + market_hash_name;
    //     var url = window.location.protocol + `//steamcommunity.com/market/search/render/?query=name:${market_hash_name}&start=0&count=10&norender=1`;
    //
    //     $J.ajax({
    //       method: "GET",
    //       url,
    //       cacheURL,
    //       success: function (response, textStatus, jqXHR) {
    //         if (response.success && Array.isArray(response.results) && response.results.length > 0) {
    //           market_hash_name = decodeURIComponent(market_hash_name);
    //           const inventory = response.results.find(x => x.asset_description.market_hash_name === market_hash_name);
    //           if (inventory && inventory.sell_price_text) {
    //
    //             let _response = {success: true};
    //             _response.volume = 0;
    //             _response.lowest_price = inventory.sell_price_text;
    //             _response.median_price = 0;
    //
    //             PriceQueue._generalHandler.success(_response, this.cacheURL, 'SteamSearchPrice');
    //           } else {
    //             PriceQueue._generalHandler.error();
    //           }
    //         } else {
    //           PriceQueue._generalHandler.error();
    //         }
    //       },
    //       error: PriceQueue._generalHandler.error,
    //       complete: PriceQueue._generalHandler.complete
    //     });
    //   }
    // },
    //TODO: WITHOUT BANS
    // {
    //   name: 'SteamListingPrice',
    //   numberOfRepetitions: 1,
    //   isApiUseCurrency: true,
    //   getprice: function (appid, market_hash_name) {
    //
    //     const currencyCode = PriceQueue._getCurrencyCodeSteam() || PriceQueue.getCookie('steamCurrencyId') || 1;
    //     const countryCode = PriceQueue._getCountryCodeSteam() || 'US';
    //
    //     var cacheURL = 'appid=' + appid + '&market_hash_name=' + market_hash_name;
    //     var url = window.location.protocol + '//steamcommunity.com/market/listings/' + appid + '/' + market_hash_name + '/render/?start=0&count=5&country=' + countryCode + '&currency=' + currencyCode;
    //
    //     $J.ajax({
    //       method: "GET",
    //       url: url,
    //       cacheURL: cacheURL,
    //       success: function (response, textStatus, jqXHR) {
    //         if (response && response.success && response.listinginfo) {
    //           var pprice1, pprice2;
    //           var $html = $J(response.results_html);
    //           var $priceBlock = $html.find('.market_table_value');
    //           var $curItem;
    //           $priceBlock.each(function (idx, elem) {
    //             var lowest = $J(elem).find('span.market_listing_price_with_fee').text();
    //             if (!/SOLD!/i.test(lowest)) {
    //               $curItem = $J(elem);
    //               pprice1 = $curItem.find('span.market_listing_price_with_fee').text();
    //               pprice2 = $curItem.find('span.market_listing_price_without_fee').text();
    //               return false;
    //             } else {
    //               console.log('SOLD', elem);
    //             }
    //           });
    //
    //           var _response = {success: true};
    //           if (response.total_count > 1) {
    //             _response.volume = response.total_count;
    //           }
    //           if (pprice1 && pprice1.length > 1) {
    //             _response.lowest_price = pprice1.trim();
    //           }
    //           if (pprice2 && pprice2.length > 1) {
    //             _response.median_price = pprice2.trim();
    //           }
    //
    //           if (pprice1 === undefined) {
    //             PriceQueue._generalHandler.error();
    //           } else {
    //             PriceQueue._generalHandler.success(_response, this.cacheURL, 'SteamListingPrice');
    //           }
    //         } else {
    //           PriceQueue._generalHandler.error(true);
    //         }
    //       },
    //       error: PriceQueue._generalHandler.error,
    //       complete: PriceQueue._generalHandler.complete
    //     });
    //   }
    // },
    {
      name: 'SteamMultiBuy',
      numberOfRepetitions: 2,
      isApiUseCurrency: false,
      getprice: function (appid, market_hash_name, contextId) {
        var cacheURL = 'appid=' + appid + '&market_hash_name=' + market_hash_name;
        var url =
          window.location.protocol +
          `//steamcommunity.com/market/multibuy?appid=${appid}&contextid=${contextId ? contextId : 2}&items[]=${market_hash_name}`;

        $J.ajax({
          method: 'GET',
          url,
          cacheURL,
          success: function (response, textStatus, jqXHR) {
            const $input = $J(response).find('input.market_multi_price');
            if ($input.length) {
              let _response = { success: true };
              _response.volume = 0;
              _response.lowest_price = $input.val();
              _response.median_price = 0;

              PriceQueue._generalHandler.success(_response, this.cacheURL, 'SteamMultiBuy');
            } else {
              PriceQueue._generalHandler.error();
            }
          },
          error: PriceQueue._generalHandler.error,
          complete: PriceQueue._generalHandler.complete,
        });
      },
    },
    /*{
      name: 'SihPriceOverview',
      getprice: function (appid, countryCode, currencyId, market_hash_name) {

        var cacheURL = 'appid=' + appid + '&country=' + countryCode + '&currency=' + currencyId + '&market_hash_name=' + market_hash_name;

        const data = {
          appid,
          market_hash_name: decodeURIComponent(market_hash_name),
          country: countryCode,
          currency: currencyId
        };
        chrome.runtime.sendMessage(SIHID, {type: 'GET_STEAM_PRICES', data}, (res) => {
          if (res && res.success) {
            PriceQueue._generalHandler.success(res, cacheURL, 'SihPriceOverview');
          } else {
            PriceQueue._generalHandler.error(res);
          }
          PriceQueue._generalHandler.complete();
        });
      }
    }*/
  ],
  StopQueue: function () {
    PriceQueue._currentURL = '';
    PriceQueue._numberOfErrors = 0;
    PriceQueue._currentError = 0;
    PriceQueue._urls = [];
    PriceQueue._queue = {};
    PriceQueue._currentproviderIdx = 0;
    PriceQueue._numberOfRepetitions = 0;
    PriceQueue._isRunning = false;
  },
  StartQueue: function () {
    if (PriceQueue._isRunning) return;

    PriceQueue._isRunning = true;
    PriceQueue._currentURL = PriceQueue._urls.shift();
    const currentContextId = PriceQueue._contextIds.shift();
    if (PriceQueue._currentURL !== undefined) {
      const appid = expAppID.exec(PriceQueue._currentURL)[1];
      const marketHashName = expMarketHashName.exec(PriceQueue._currentURL)[1];

      PriceQueue.PricesProviders[PriceQueue._currentproviderIdx].getprice(appid, marketHashName, currentContextId);
    } else {
      PriceQueue._currentError = 0;
      PriceQueue._isRunning = false;
      PriceQueue._generalHandler.complete();
    }
  },
  UpdateHandler: function () {},
  UpdateLabels: function () {
    if (PriceQueue._urls.length == 0) {
      $J('#_priceQueueCont').hide();
    } else {
      $J('#_priceQueueCont').show();
      var hashname = '';
      var m = /market_hash_name=([^&]+)/.exec(PriceQueue._currentURL);
      if (m && m.length > 1) {
        hashname = decodeURI(m[1]);
      }
      $J('#_priceQueueCont .pq-info').html(
        hashname + '<br />' + PriceQueue._urls.length + ' items remain - ' + PriceQueue._currentError + ' errors'
      );
    }
  },
  GenPriceDescription: function (rgItems) {
    if (!rgItems || !rgItems.descriptions) {
      return;
    }

    const showBtnIndex = rgItems.descriptions.findIndex((x) => x.isShowBtn);

    if (showBtnIndex > -1) {
      rgItems.descriptions.splice(showBtnIndex, 1);
    }

    if (!(rgItems.lowestPrice || rgItems.nofeePrice)) {
      if (rgItems.marketable) {
        const btnHtml = `<a href="javascript:void(0)" onclick="loadPriceOverview('${rgItems.market_hash_name}')">${SIHLang.show}`;

        rgItems.descriptions.unshift({
          isShowBtn: true,
          type: 'html',
          value: `<div class="descriptor__show_btn">${SIHLang.steamprice}: ${btnHtml}</div>`,
        });
      }

      return;
    }

    const index = rgItems.descriptions.findIndex((x) => x.isprice);

    if (index > -1) {
      rgItems.descriptions.splice(index, 1);
    }

    var marketLink = `${window.location.protocol}//steamcommunity.com/market/listings/${rgItems.appid}/${encodeURIComponent(rgItems.market_hash_name)}`;

    var ddHtml = `${SIHLang.steamprice}: <a href="${marketLink}" target="_blank" style="color:#FF0" title="${rgItems.nofeePrice}">${rgItems.lowestPrice || rgItems.nofeePrice}`;
    if (rgItems.volume) {
      ddHtml += ` <span style="font-size: 0.9em; font-style: italic">(${rgItems.volume} ${rgItems.volume !== 'Failed to load volume' ? SIHLang.sold24h : ''})</span>`;
    }

    if (mediumPrice && rgItems.market_hash_name !== mediumName) {
      var price = getPriceAsInt(rgItems.lowestPrice),
        mprice = getPriceAsInt(mediumPrice),
        eq = (price / mprice).toFixed(2);

      ddHtml += ' (' + eq + ' ' + mediumName + ')';
    }

    var pdes = {
      isprice: true,
      type: 'html',
      value: `<div class="steam_price">${ddHtml}</div>`,
    };

    rgItems.descriptions.unshift(pdes);
  },
  _generalHandler: {
    success: function (response, url, providerName) {
      response.priceDateMs = Date.now();
      response.transport = {
        responseJSON: response,
        request: {
          url: url,
        },
      };
      PriceQueue._numberOfErrors = 0;

      PriceQueue._setSteamPrice(response, url, providerName);

      response.providerName = providerName;
      PriceQueue._cache[url] = { response: response, providerName: providerName };

      if (PriceQueue._queue[url]) {
        var handlers = PriceQueue._queue[url].handlers;
        var pars = PriceQueue._queue[url].pars;
        for (var i = 0; i < handlers.length; i++) {
          try {
            handlers[i](response, pars[i]);
          } catch (err) {
            console.log(err);
          }
        }
        delete PriceQueue._queue[url];
      }
      $J('#_priceQueueCont .pq-progress')
        .stop()
        .css({ width: '1%' })
        .animate({ width: '100%' }, PriceQueue._successDelay);

      PriceQueue._numberOfRepetitions++;
      if (
        PriceQueue._numberOfRepetitions >=
        PriceQueue.PricesProviders[PriceQueue._currentproviderIdx].numberOfRepetitions
      ) {
        PriceQueue._numberOfRepetitions = 0;
        do {
          PriceQueue._currentproviderIdx++;
          if (PriceQueue._currentproviderIdx >= PriceQueue.PricesProviders.length) {
            PriceQueue._currentproviderIdx = 0;
          }
        } while (
          !PriceQueue._getCurrencyCodeSteam() &&
          !PriceQueue.PricesProviders[PriceQueue._currentproviderIdx].isApiUseCurrency
        );
      }

      window.setTimeout(() => {
        PriceQueue._isRunning = false;
        PriceQueue.StartQueue();
      }, PriceQueue._successDelay);
    },
    error: function (isAppError) {
      PriceQueue._currentError++;
      PriceQueue._currentproviderIdx++;

      if (PriceQueue._currentproviderIdx >= PriceQueue.PricesProviders.length) {
        PriceQueue._currentproviderIdx = 0;
        PriceQueue._numberOfErrors++;

        $J('#_priceQueueCont .pq-progress')
          .stop()
          .css({ width: '1%' })
          .animate({ width: '100%' }, PriceQueue._failureDelay);

        PriceQueue._urls.unshift(PriceQueue._currentURL);

        window.setTimeout(function () {
          PriceQueue._isRunning = false;
          PriceQueue.StartQueue();
        }, PriceQueue._failureDelay);
      } else {
        PriceQueue._urls.unshift(PriceQueue._currentURL);
        PriceQueue._isRunning = false;
        PriceQueue.StartQueue();
      }
    },
    complete: function () {
      if (PriceQueue.UpdateHandler) {
        PriceQueue.UpdateHandler();
      }
      PriceQueue.UpdateLabels();
    },
  },
  Init: function () {
    if (PriceQueue._isInit) {
      return;
    }

    var cnt = $J(
      '<div id="_priceQueueCont" class="pq-container"><div class="pq-timer"><div class="pq-progress">&nbsp;</div></div><div class="pq-info">&nbsp;</div></div>'
    );
    $J('body').append(cnt);
    PriceQueue._isInit = true;
  },
};

/**
 * Возвращает `market_hash_name` элемента инвентаря
 * @param {object} item - объект, содержащий элемент инвентаря
 */
function getItemName(item, market = '') {
  if (market === 'steamlvlup') {
    return (item.rgItem.description || item.rgItem).market_fee_app || null;
  } else {
    return item.rgItem
      ? item.rgItem.market_hash_name ||
          (item.rgItem.description && item.rgItem.description.market_hash_name) ||
          item.rgItem.name
      : null;
  }
}

/**
 * Разбивает массив на массив массивов, размер, которых не превышает `chunkSize`
 * @param {array} arr - исходный массив
 * @param {number} chunkSize - максимальная длина подмассивов
 */
function splitArrayIntoChunks(arr = [], chunkSize = 1) {
  return new Array(Math.ceil(arr.length / chunkSize)).fill().map((_) => arr.splice(0, chunkSize));
}

const MarketplaceSource = {
  _cache: {},
  appIdLoaded: null,
  marketsLoaded: [],
  _getMarketHashNamesInChunks(appid, market, chunkSize = 5000) {
    let names = [];
    const $itemsBlock = !window.location.href.match(/tradeoffers/)
      ? $J('body')
      : $J('.tradeoffer.active_single_trade').length > 0
        ? $J('.tradeoffer.active_single_trade')
        : $J('.tradeoffer');

    $itemsBlock.find(`div.item.app${appid}`).each((idx, elem) => {
      if (elem.rgItem) {
        let name = null;
        if (market === 'steamlvlup') {
          name = (elem.rgItem.description || elem.rgItem).market_fee_app;
        } else {
          name = elem.rgItem.market_hash_name || (elem.rgItem.description && elem.rgItem.description.market_hash_name);
        }
        if (name && !names.includes(name)) {
          if (MarketplaceSource._cache && MarketplaceSource._cache[market] && MarketplaceSource._cache[market][appid]) {
            if (!MarketplaceSource._cache[market][appid][name]) {
              names.push(name);
            }
          } else {
            names.push(name);
          }
        }
      }
    });
    return splitArrayIntoChunks(names, chunkSize);
  },
  _getPrices(data) {
    data.source = 'MarketplaceSource';
    const { appId, items } = data;

    if (SKINS_REFILL_SUPPORT_APPS.includes(+appId) && !data.markets.includes('sihDeposit')) {
      data.markets = [...data.markets, 'sihDeposit'];
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(SIHID, { type: 'GET_PRICES_BY_MARKETPLACES', data }, (response) => {
        if (!response.success) {
          reject(response);
        }

        data.markets.forEach((market) => {
          MarketplaceSource._createPricesHandler(market, appId)(response, items).then(resolve).catch(reject);
        });
      });
    });
  },
  _createPricesHandler:
    (market, appid) =>
    async ({ success, items }, hashNames) => {
      if (success) {
        // Соединяем все предметы с ценой и без цены
        const result = hashNames.reduce(
          (acc, val) => ({
            ...acc,
            [val]: {
              [market]: {
                price: items[val] && items[val][market] ? items[val][market].price : null,
                priceF: items[val] && items[val][market] ? items[val][market].priceF : null,
                priceB: items[val] && items[val][market] ? items[val][market].priceB : null,
              },
            },
          }),
          {}
        );
        // Создаем кеш, если нужно
        if (!MarketplaceSource._cache[market]) {
          MarketplaceSource._cache[market] = {};
        }

        // Кешируем результат ("доливаем" цены "чанка" в кеш не перезаписывая его полностью)
        MarketplaceSource._cache[market][appid] = { ...MarketplaceSource._cache[market][appid], ...result };
      }

      return success;
    },
  _checkForLoader(appId, market, marketHashNamesInChunks, isTradeofferPage) {
    if (isTradeofferPage) {
      this.appIdLoaded = null;
    }

    if (this.appIdLoaded != appId) {
      if (marketHashNamesInChunks.length) {
        this.appIdLoaded = appId;
        this.marketsLoaded = [];
      } else {
        return false;
      }
    }

    if (this.marketsLoaded.includes(market)) {
      return false;
    } else {
      this.marketsLoaded.push(market);
    }

    return true;
  },
  async GetPrices(appId, params, show, callback = () => {}, isDefaultPrice = false) {
    try {
      const isTradeofferPage = isDefaultPrice;

      params.market = params.market.toLowerCase();

      const currencyCode = params.nameMarkerForApi === 'steam' ? 5 : 1;

      const marketHashNamesInChunks = this._getMarketHashNamesInChunks(appId, params.nameMarkerForApi);

      if (marketHashNamesInChunks.length === 0) {
        this.SetPrices(
          appId,
          params.market,
          params.nameMarkerForApi,
          currencyCode,
          params.marketSort,
          false,
          isDefaultPrice
        );
        if (show) {
          GetEquippedItems();
          GetBookmarkedItems();
        }

        setTimeout(() => {
          callback();
        }, 500);
      }

      if (!params.isRefresh) {
        if (!this._checkForLoader(appId, params.market, marketHashNamesInChunks, isTradeofferPage)) {
          callback();
          return;
        }
      }
      marketHashNamesInChunks.forEach((marketHashNames) => {
        const data = {
          appId,
          currency: currencyCode,
          markets: [params.nameMarkerForApi],
          items: marketHashNames,
        };

        this._getPrices(data)
          .then(() => {
            this.SetPrices(
              appId,
              params.market,
              params.nameMarkerForApi,
              currencyCode,
              params.marketSort,
              false,
              isDefaultPrice
            );

            if (show) {
              GetEquippedItems();
              GetBookmarkedItems();
            }

            callback();
          })
          .catch((error) => {
            console.warn(error);
            callback();
          });
      });

      if (marketHashNamesInChunks.length === 0) {
        $J('.sih-functions-panel .spinner').hide();
        callback();
      }

      if (show) {
        GetItemsInTrades();
      }
    } catch (error) {
      console.warn('MarketplaceSource.GetPrices: error', error);
    }
  },
  async GetPriceTotal(appId, params, show, callback = () => {}) {
    try {
      params.market = params.market.toLowerCase();

      const currencyCode = params.nameMarkerForApi === 'steam' ? 5 : 1;

      const marketHashNamesInChunks = this._getMarketHashNamesInChunks(appId, params.nameMarkerForApi);

      let totalPrice = 0;
      if (marketHashNamesInChunks.length === 0) {
        this.SetPrices(appId, params.market, params.nameMarkerForApi, currencyCode, params.marketSort, true);

        setTimeout(() => {
          callback();
        }, 500);
      }

      marketHashNamesInChunks.forEach((marketHashNames, i) => {
        const data = {
          appId,
          currency: currencyCode,
          markets: [params.nameMarkerForApi],
          items: marketHashNames,
        };

        this._getPrices(data)
          .then(() => {
            this.SetPrices(appId, params.market, params.nameMarkerForApi, currencyCode, params.marketSort, true);

            if (marketHashNamesInChunks.length === i + 1) {
              callback();
            }
          })
          .catch((error) => {
            console.warn(error);
            callback(totalPrice);
          });
      });
    } catch (error) {
      console.warn('MarketplaceSource.GetPricesV2: error', error);
    }
  },
  SetPrices(appId, market, nameMarkerForApi, currencyCode, marketSort, isTotalPrice = false, isDefaultPrice) {
    if (!MarketplaceSource._cache[nameMarkerForApi] || !MarketplaceSource._cache[nameMarkerForApi][appId]) return;

    const data = MarketplaceSource._cache[nameMarkerForApi][appId];
    const marketHashNames = Object.keys(MarketplaceSource._cache[nameMarkerForApi][appId]);
    $J('.sih-functions-panel .spinner').hide();

    const $itemsBlock = !window.location.href.match(/tradeoffers/)
      ? $J('body')
      : $J('.tradeoffer.active_single_trade').length > 0
        ? $J('.tradeoffer.active_single_trade')
        : $J('.tradeoffer');
    $itemsBlock.find(`div.item.app${appId}`).each((idx, elem) => {
      if (!elem.rgItem) return;

      const marketHashName =
        getItemName(elem, nameMarkerForApi) !== null ? getItemName(elem, nameMarkerForApi).toString() : null;
      if (marketHashName && marketHashNames.includes(marketHashName)) {
        const $elem = $J(elem);
        let $prices = $elem.find('.p-price');

        if (isTotalPrice) {
          elem.rgItem.priceNumber = 0;
          elem.rgItem.extprice_v2 = 0;
          elem.rgItem.extprice_provider_v2 = market;
        } else {
          if (
            data &&
            data[marketHashName] &&
            data[marketHashName][nameMarkerForApi] &&
            data[marketHashName][nameMarkerForApi].price
          ) {
            elem.rgItem.extprice = 0;
            elem.rgItem.extprice_provider = market;
          }

          if (!$prices.length) {
            $prices = $J('<div class="p-price">');
            if ($elem.find('.item-info').length) {
              $elem.find('.item-info').append($prices);
            } else {
              $elem.append($prices);
            }
          } else if (!isDefaultPrice) {
            if (typeof PROVIDERS_LIST === 'undefined') {
              $prices.find('.price_flag').remove();
            } else {
              $prices.find(`.price_flag.${market}`).remove();
            }
          }
        }

        if (
          data &&
          data[marketHashName] &&
          data[marketHashName][nameMarkerForApi] &&
          (data[marketHashName][nameMarkerForApi].price || data[marketHashName][nameMarkerForApi].tradePrice)
        ) {
          let price = 0;
          if (['csmoney_trade'].includes(market)) {
            price = data[marketHashName][nameMarkerForApi].tradePrice;
          } else if (['steamlvlup'].includes(nameMarkerForApi)) {
            const desc = elem.rgItem.description || elem.rgItem;
            const card = desc.tags.find((x) => x.category === 'cardborder');
            if (card === undefined) {
              price = data[marketHashName][nameMarkerForApi].priceB;
            } else {
              const isFoil = card.internal_name === 'cardborder_1' ? true : false;

              price = isFoil
                ? data[marketHashName][nameMarkerForApi].priceF
                : data[marketHashName][nameMarkerForApi].price;
            }
          } else {
            price = data[marketHashName][nameMarkerForApi].price;
          }

          if (price) {
            if (isDefaultPrice) {
              $J($prices)
                .find('.price_flag')
                .each((index, element) => {
                  if (!$J(element).hasClass('original')) {
                    $J(element).remove();
                  }
                });
            }

            const loadPriceFromHtml = (market, price, fromCurrencyCode, toCurrencyCode, marketSort) => {
              let priceFormat = '';
              let priceTemplate = '';

              if (market === 'steamlvlupgems') {
                if (isTotalPrice) {
                  elem.rgItem.extprice_v2 = price * 1000;
                  priceTemplate = `$price gems`;
                } else {
                  elem.rgItem.extprice = price * 1000;
                  priceFormat = { text: `${elem.rgItem.extprice} gems` };
                }
              } else {
                priceFormat = SIH?.CurrencyService?.getPriceFromCurrency(price, toCurrencyCode, fromCurrencyCode);
                priceTemplate = priceFormat.template;
                if (isTotalPrice) {
                  elem.rgItem.extprice_v2 = priceFormat.price;
                } else {
                  elem.rgItem.extprice = priceFormat.price;
                }
              }

              if (isTotalPrice) {
                elem.rgItem.priceNumber = elem.rgItem.extprice_v2;
                elem.rgItem.priceTemplate = priceTemplate;
              } else {
                if ($prices.find(`.price_flag.${market}`).length === 0) {
                  $prices.append(
                    `<div class="price_flag ${market}" data-sort="${marketSort}" data-price="${priceFormat.text}">`
                  );
                }

                const markets = Array.from($prices.find(`.price_flag`)).sort(
                  (a, b) => +$J(a).data('sort') - +$J(b).data('sort')
                );
                $prices.empty().append(...markets);
              }
            };

            if (ExchangeRates._rates) {
              loadPriceFromHtml(market, price, currencyCode, currencyId, marketSort);
            } else {
              ExchangeRates.GetRate(() => {
                loadPriceFromHtml(market, price, currencyCode, currencyId, marketSort);
              });
            }
          }
        } else {
          $J($prices)
            .find('.price_flag')
            .each((index, element) => {
              if (!$J(element).hasClass('original')) {
                $J(element).addClass('default');
              }
            });
        }
      }
    });
  },
};

const SteamLvlUpSource = {
  _cache: {},
  appIdLoaded: null,
  marketsLoaded: [],
  GetPrices: (appid, items, show) => {
    const { market } = items;
    const MARKET_NAME = 'steamlvlup';
    const data = { appid, market: MARKET_NAME };

    chrome.runtime.sendMessage(SIHID, { type: 'GET_EXTERNAL_PRICES', data }, (res) => {
      if (res.success) {
        SteamLvlUpSource._cache = res.prices;
        SteamLvlUpSource.SetPrices(appid, market, items.marketSort);
        SteamLvlUpSource.appIdLoaded = null;
      }

      if (show) {
        GetEquippedItems();
        GetItemsInTrades();
        GetBookmarkedItems();
      }
    });
  },
  SetPrices: async (appid, market, marketSort) => {
    try {
      $J('.sih-functions-panel .spinner').hide();
      var items = $J(`div.item.app${appid}`);
      var crate = await ExchangeRates.GetCurrentRateAsync(currencyId);

      items.each((idx, elem) => {
        elem.rgItem.extprice = 0;

        const $elem = $J(elem);

        const desc = elem.rgItem.description || elem.rgItem;
        const market_fee_app = desc.market_fee_app;
        const card = desc.tags.find((x) => x.category === 'cardborder');
        if (card === undefined) return;

        const is_foil = card.internal_name === 'cardborder_1' ? true : false;

        if (typeof g_ActiveInventory.LoadItemImage == 'function') g_ActiveInventory.LoadItemImage($elem);

        let $prices = $elem.find('.p-price');
        if (!$prices.length) {
          $prices = $J('<div class="p-price">');
          if ($elem.find('.item-info').length) {
            $elem.find('.item-info').append($prices);
          } else {
            $elem.append($prices);
          }
        }

        if (typeof PROVIDERS_LIST === 'undefined') $prices.find('.price_flag').remove();
        else $prices.find(`.price_flag.${market}`).remove();

        if (SteamLvlUpSource._cache && SteamLvlUpSource._cache[market_fee_app]) {
          const mprice = is_foil
            ? SteamLvlUpSource._cache[market_fee_app].pf
            : SteamLvlUpSource._cache[market_fee_app].p;
          if (mprice) {
            elem.rgItem.extprice_provider = market;
            if (market === 'steamlvlup') {
              elem.rgItem.extprice = Math.round(mprice * crate) / 1000;
              const mprice_formated = v_currencyformat(elem.rgItem.extprice * 100, GetCurrencyCode(currencyId));
              $prices.append(
                `<div class="price_flag ${market}" data-sort="${marketSort}" data-price="${mprice_formated}" title="${market}">`
              );
            } else {
              $prices.append(
                `<div class="price_flag ${market}" data-sort="${marketSort}" data-price="${mprice} gems" title="${market}">`
              );
            }
            const markets = Array.from($prices.find(`.price_flag`)).sort(
              (a, b) => +$J(a).data('sort') - +$J(b).data('sort')
            );
            $prices.empty().append(...markets);
          }
        }
      });
    } catch (error) {
      console.warn('SteamLvlUpSource.SetPrices: error', error);
    }
  },
};

const SteamBySihSource = {
  _cache: {},
  appIdLoaded: null,
  marketsLoaded: [],
  _getCurrencyCodeSteam() {
    return +(typeof g_rgWalletInfo != 'undefined' && g_rgWalletInfo['wallet_currency']
      ? g_rgWalletInfo['wallet_currency']
      : 1);
  },
  _checkForLoader(appId, market, marketHashNamesInChunks, isTradeofferPage) {
    if (isTradeofferPage) {
      this.appIdLoaded = null;
    }

    if (this.appIdLoaded != appId) {
      if (marketHashNamesInChunks.length) {
        this.appIdLoaded = appId;
        this.marketsLoaded = [];
      } else {
        return false;
      }
    }

    if (this.marketsLoaded.includes(market)) {
      return false;
    } else {
      this.marketsLoaded.push(market);
    }

    return true;
  },
  GetSupportedCurrencies: async (appid) => {
    const cacheKey = 'supportedCurrencies';
    if (SteamBySihSource._cache[cacheKey]) {
      if (SteamBySihSource._cache[cacheKey][appid]) {
        return SteamBySihSource._cache[cacheKey][appid];
      }
    } else {
      SteamBySihSource._cache[cacheKey] = {};
    }

    // const result = await new Promise((resolve) => {
    //   chrome.runtime.sendMessage(
    //     SIHID,
    //     {type: 'GET_STEAM_BY_SIH_CURRENCY', data: {appid}},
    //     resolve
    //   )
    // });

    // if (result && result.success) {
    //   SteamBySihSource._cache[cacheKey][appid] = result.data;
    //   setTimeout(() => {
    //     delete SteamBySihSource._cache[cacheKey][appid];
    //   }, 1000 * 60 * 60);
    //   return SteamBySihSource._cache[cacheKey][appid];
    // } else {
    //   console.warn(`SteamBySIH: GetSupportedCurrencies request failed`); // eslint-disable-line
    // }

    return STEAM_BY_SIH_SUPPORTED_CURRENCIES;
  },
  GetPrices: async (
    appid,
    items,
    show,
    callback = () => {},
    showPrice = true,
    isTotalPrice = false,
    isTradeofferPage = false
  ) => {
    try {
      if (!STEAM_BY_SIH_SUPPORTED_APPS.includes(+appid)) {
        callback();
        throw new Error(`SteamBySIH: app ${appid} not supported`);
      }

      const market = items.market.toLowerCase();

      // Запрос поддерживаемых сервисом валют
      const keyCurrency = `CURRENCY_${appid}`;
      if (!SteamBySihSource._cache[keyCurrency]) {
        SteamBySihSource._cache[keyCurrency] = await SteamBySihSource.GetSupportedCurrencies(appid);
      }

      // Параметры запроса цен
      const data = { appid, market, currency: SteamBySihSource._getCurrencyCodeSteam() };

      if (!SteamBySihSource._cache[market]) {
        SteamBySihSource._cache[market] = {};
      }

      // Разбиваем массив имен на "чанки" по 100 элементов
      const namesChunks = await SteamBySihSource._getInventoryItemNamesInChunks(appid, market);

      if (namesChunks.length === 0 && SteamBySihSource._cache && SteamBySihSource._cache[market][appid]) {
        await SteamBySihSource.SetPrices(
          appid,
          market,
          Object.keys(SteamBySihSource._cache[market][appid]),
          showPrice,
          items.marketSort
        );

        if (show) {
          GetEquippedItems();
          GetBookmarkedItems();
        }

        setTimeout(() => {
          callback();
        }, 500);
      }

      if (!items.isRefresh) {
        if (!isTotalPrice) {
          if (!SteamBySihSource._checkForLoader(appid, market, namesChunks, isTradeofferPage)) {
            callback();
            return;
          }
        }
      }

      if (loadingTotalSteamPrice.findIndex((data) => data.market === market && +data.appid === +appid) === -1) {
        if (isTotalPrice) {
          loadingTotalSteamPrice.push({ market: data.market, appid: data.appid });
        }
      } else {
        callback();
        return;
      }

      const promises = [];

      namesChunks.forEach((names, i) => {
        promises.push(
          SteamBySihSource._getPrices({ ...data, names }, true)
            .then(async (success) => {
              if (success) {
                // Рисуем цены на элементах инвентаря
                await SteamBySihSource.SetPrices(appid, market, names, showPrice, items.marketSort);
              }

              if (show) {
                GetEquippedItems();
                GetBookmarkedItems();
              }
              if (namesChunks.length === i + 1) {
                callback();
              }
            })
            .catch((error) => console.warn('SteamBySihSource.GetPrices: error', error))
        );
      });

      Promise.all(promises).then(() => {
        const start_index = loadingTotalSteamPrice.findIndex(
          (data) => data.market === market && +data.appid === +appid
        );
        if (start_index !== -1) {
          loadingTotalSteamPrice.splice(start_index, 1);
        }
      });

      if (namesChunks.length === 0) {
        $J('.sih-functions-panel .spinner').hide();
        callback();
      }

      if (show) {
        GetItemsInTrades();
      }
    } catch (error) {
      console.warn('SteamBySihSource.GetPrices: error', error); // eslint-disable-line
    }
  },
  SetPrices: (appid, market, lastChangedItemNames = [], showPrice, marketSort) => {
    $J('.sih-functions-panel .spinner').hide();
    const checkChunkOnly = !!lastChangedItemNames.length;
    const $itemsBlock = !window.location.href.match(/tradeoffers/)
      ? $J('body')
      : $J('.tradeoffer.active_single_trade').length > 0
        ? $J('.tradeoffer.active_single_trade')
        : $J('.tradeoffer');

    $itemsBlock.find(`div.item.app${appid}`).each((idx, elem) => {
      const item_hash_name = getItemName(elem);

      // Обновить только те элементы, цены которых загружены
      // if (checkChunkOnly && !lastChangedItemNames.includes(item_hash_name)) {
      //   return;
      // }
      elem.rgItem.extprice = 0;

      if (SteamBySihSource._cache[market] && SteamBySihSource._cache[market][appid]) {
        const mprice = SteamBySihSource._cache[market][appid][item_hash_name];
        const $elem = $J(elem);

        if (typeof g_ActiveInventory?.LoadItemImage == 'function') g_ActiveInventory.LoadItemImage($elem);

        let $prices = $elem.find('.p-price'); // prices div
        if (!$prices.length) {
          // добавляем контейнер для цен, если нужно
          $prices = $J('<div class="p-price">');
          if ($elem.find('.item-info').length) {
            $elem.find('.item-info').append($prices);
          } else {
            $elem.append($prices);
          }
        }

        if (typeof PROVIDERS_LIST === 'undefined') {
          $J($prices)
            .find('.price_flag')
            .each((index, element) => {
              if (!$J(element).hasClass('original')) {
                $J(element).remove();
              }
            });
        } else {
          const $priceMarket = $prices.find(`.price_flag.${market}`);
          showPrice = showPrice || $priceMarket.length > 0;
          $priceMarket.remove(); // remove current `market` price
        }

        // Если цена элемента получена, то добавляем ее в список цен элемента
        if (mprice) {
          // Если цены на элемент собираются, но еще ни одного раза не была зарегистрирована, то отображаем `n/a`
          if (mprice.price) {
            // иначе отображаем цену с тултипом, в котором указана дата последней регистрации цены
            elem.rgItem.extprice = mprice.price / 100;
            elem.rgItem.extprice_provider = market;
            if (showPrice) {
              const loadPriceFromHtml = (market, price, fromCurrencyCode, toCurrencyCode, marketSort, date) => {
                const mprice_formated = (SIH?.CurrencyService?.getPriceFromCurrency(
                  price,
                  toCurrencyCode,
                  fromCurrencyCode
                )).text;
                $prices.append(
                  `<div class="price_flag ${market}" data-sort="${marketSort}" data-price="${mprice_formated}" title="${market}: ${new Date(date).toLocaleString()}">`
                );

                const markets = Array.from($prices.find(`.price_flag`)).sort(
                  (a, b) => +$J(a).data('sort') - +$J(b).data('sort')
                );
                $prices.empty().append(...markets);
              };

              if (ExchangeRates._rates) {
                loadPriceFromHtml(
                  market,
                  elem.rgItem.extprice,
                  SteamBySihSource._getCurrencyCodeSteam(),
                  currencyId,
                  marketSort,
                  mprice.date
                );
              } else {
                ExchangeRates.GetRate(() => {
                  loadPriceFromHtml(
                    market,
                    elem.rgItem.extprice,
                    SteamBySihSource._getCurrencyCodeSteam(),
                    currencyId,
                    marketSort,
                    mprice.date
                  );
                });
              }
            }
          }
        }
      }
    });
  },
  _getInventoryItemNamesInChunks: async (appid, market, chunkSize = 100) => {
    // Получаем имена элементов активного инвентаря
    let descs = g_ActiveInventory?.m_rgDescriptions || g_ActiveInventory?.rgInventory || {};

    if (Object.keys(descs).length === 0 || descs === null) {
      const $itemsBlock = !window.location.href.match(/tradeoffers/)
        ? $J('body')
        : $J('.tradeoffer.active_single_trade').length > 0
          ? $J('.tradeoffer.active_single_trade')
          : $J('.tradeoffer');

      $itemsBlock.find(`div.item.app${appid}`).each((idx, elem) => {
        if (elem.rgItem) {
          descs[idx] = elem.rgItem;
        }
      });
    }

    const names = Object.keys(descs)
      .filter((key) => {
        if (SteamBySihSource._cache && SteamBySihSource._cache[market][appid]) {
          const findIndex = Object.keys(SteamBySihSource._cache[market][appid]).findIndex(
            (cache_hash_name) =>
              cache_hash_name === descs[key].market_hash_name ||
              (descs[key].description && cache_hash_name === descs[key].description.market_hash_name)
          );
          if (findIndex === -1) {
            return descs[key].market_hash_name || (descs[key].description && descs[key].description.market_hash_name);
          }
        } else {
          return descs[key].market_hash_name || (descs[key].description && descs[key].description.market_hash_name);
        }
      })
      .map((key) => descs[key].market_hash_name || descs[key].description.market_hash_name);

    // Разбиваем массив имен на "чанки" по `chunkSize` элементов
    return splitArrayIntoChunks(names, chunkSize);
  },
  _getPrices: (data, currencySupported) => {
    return new Promise((resolve, reject) => {
      const { market, appid } = data;
      chrome.runtime.sendMessage(SIHID, { type: 'GET_STEAM_BY_SIH_PRICES', data }, (response) =>
        SteamBySihSource._createPricesHandler(market, appid, currencySupported)(response).then(resolve).catch(reject)
      );
    });
  },
  _createPricesHandler:
    (market, appid, currencySupported) =>
    async ({ success, data }) => {
      if (success) {
        const crate = await ExchangeRates.GetCurrentRateAsync(currencyId);

        // Создаем кеш, если нужно
        if (!SteamBySihSource._cache[market]) {
          SteamBySihSource._cache[market] = {};
        }

        // Конвертируем цены из валюты по умолчанию в местную, если цены были запрошены в валюте по умолчанию
        if (!currencySupported) {
          Object.keys(data || {}).forEach((name) => {
            // Не забываем, что цены могут отсутствовать (еще не было получено ни одной цены)
            data[name].price = data[name].price === '' ? '' : Math.round(data[name].price * crate * 100) / 100;
          });
        }
        // Кешируем результат ("доливаем" цены "чанка" в кеш не перезаписывая его полностью)
        SteamBySihSource._cache[market][appid] = { ...SteamBySihSource._cache[market][appid], ...data };
      }

      return success;
    },
};

var TF2BP = {
  name: 'backpacktf',
  _cache: {},

  GetPrices: function (appid, items, show, callback = () => {}) {
    chrome.runtime.sendMessage(SIHID, { type: 'TF2BP' }, function (e) {
      if (e.success) {
        TF2BP._cache = e.prices;
        TF2BP.SetPrices(appid);
      }
      if (show) {
        GetEquippedItems();
        GetItemsInTrades();
        GetBookmarkedItems();
      }
      callback();
    });
  },
  SetPrices: function (appid) {
    $J('.sih-functions-panel .spinner').hide();
    if (appid != 440) return;

    var items = $J('div.item.app' + appid);
    var strangeModifiers = [
      'Strange Specialized Killstreak ',
      'Strange Professional Killstreak ',
      'Strange ',
      'Vintage ',
      'The ',
      'Genuine ',
    ];

    var prepareData = function (sItem) {
      if (sItem && sItem.description !== undefined) {
        var desc = sItem.description;
        sItem.tradable = desc.tradable;
        var qualityName;
        desc.tags.map(function (tag) {
          if (tag.category.toLowerCase() == 'quality') qualityName = tag.internal_name;
        });
        sItem.app_data = { quality: tf2Quality[qualityName] };
        sItem.market_hash_name = desc.market_hash_name;
        sItem.apivalue = { attributes: desc.attributes };
      }
      return sItem;
    };

    items.each(function () {
      this.rgItem = prepareData(this.rgItem);

      if (
        !this.rgItem ||
        (!this.rgItem.description && !this.rgItem.tradable) ||
        (this.rgItem.description && !this.rgItem.description.tradable)
      )
        return;

      this.rgItem.extprice = 0;

      var nprice = 0,
        quality = this.rgItem.app_data.quality,
        tradable = this.rgItem.tradable ? 'Tradable' : 'Untradable',
        craftable = 'Craftable',
        priceindex = 0;
      var name = GetMarketHashName(this.rgItem.description || this.rgItem);
      if (TF2BP._cache[name] === undefined) {
        for (var i = 0; i < strangeModifiers.length; i++) {
          if (name.indexOf(strangeModifiers[i]) == 0 && TF2BP._cache[name.substr(strangeModifiers[i].length)]) {
            name = name.substr(strangeModifiers[i].length);
            break;
          }
        }
      }

      var isUnusual = false;
      if (name.indexOf('Unusual ') == 0) {
        isUnusual = true;
        name = name.substr(8);
        if (this.rgItem.apivalue && this.rgItem.apivalue.attributes) {
          for (var iidx = 0; iidx < this.rgItem.apivalue.attributes.length; iidx++) {
            if (this.rgItem.apivalue.attributes[iidx].defindex == 134) {
              priceindex = this.rgItem.apivalue.attributes[iidx].float_value;
              break;
            }
          }
        }
      }

      if (!priceindex && name.indexOf('#') !== -1) {
        priceindex = name.substr(name.indexOf('#') + 1).trim();
      }

      if (name.indexOf('Series') !== -1) {
        name = name.substr(0, name.indexOf('Series')).trim();
      }

      var $elem = $J(this);
      let $prices = $elem.find('.p-price');
      if (!$prices.length) {
        $prices = $J('<div class="p-price">');
        if ($elem.find('.item-info').length) {
          $elem.find('.item-info').append($prices);
        } else {
          $elem.append($prices);
        }
      }

      if (typeof PROVIDERS_LIST === 'undefined') $prices.find(`.price_flag`).remove();
      else $prices.find(`.price_flag.backpacktf`).remove();

      if (
        TF2BP._cache[name] &&
        TF2BP._cache[name].prices &&
        TF2BP._cache[name].prices[quality] &&
        TF2BP._cache[name].prices[quality][tradable] &&
        TF2BP._cache[name].prices[quality][tradable][craftable] &&
        TF2BP._cache[name].prices[quality][tradable][craftable][priceindex]
      ) {
        var iprice = TF2BP._cache[name].prices[quality][tradable][craftable][priceindex];
        this.rgItem.extcrr = iprice.currency;
        this.rgItem.extprice = iprice.value;

        $prices.append(
          `<div class="price_flag backpacktf" data-price="${iprice.value} ${iprice.currency}" title="backpacktf">`
        );
      }
    });
  },
};

var ExchangeRates = {
  _rates: null,

  GetRate: function (cb = () => {}) {
    chrome.runtime.sendMessage(SIHID, { type: 'exchangerate' }, function (e) {
      if (e && e.success) {
        ExchangeRates._rates = e.data.rates;
        cb(true);
      } else {
        cb(false);
      }
    });
  },
  GetCurrentRate: function () {
    if (currencyId && currencyId > 1 && ExchangeRates._rates != null) {
      var ccode = GetCurrencyCode(currencyId);
      return ExchangeRates._rates[ccode] ? ExchangeRates._rates[ccode] : 1;
    } else {
      return 1;
    }
  },
  /**
   * Запрос курса валюты пользователя к базовой (доллар).
   * Функция гарантирует в случае доступности источника,
   * что курсы валют будут загружены, если этого не произошло ранее.
   * @param {number} currencyId - идентификатор валюты пользователя
   * @param {number} [retries=3] - служебное поле. Количество попыток запроса курса валюты
   */
  GetCurrentRateAsync: function (currencyId, retries = 3) {
    // Попытки закончились
    if (retries <= 0) {
      return Promise.reject(`Cannot get rate for currency "${currencyId}"`);
    }

    return new Promise((resolve, reject) => {
      // Валюта является базовой (доллар)
      if (currencyId === 1) {
        return resolve(1);
      }

      // Курсы валют загружены
      if (ExchangeRates._rates !== null) {
        const rate = ExchangeRates._rates[GetCurrencyCode(currencyId)];

        return typeof rate !== 'undefined'
          ? resolve(rate) // Текущая валюта среди поддерживаемых
          : reject('Not supported currency'); // Текущая валюта не поддерживается
      }

      // Курсы валют не загружены => загружаем, а затем рекурсивно вызываем текущую функцию
      return ExchangeRates.GetRate(() =>
        ExchangeRates.GetCurrentRateAsync(currencyId, retries - 1)
          .then(resolve)
          .catch(reject)
      );
    });
  },
  Format: function (input) {
    if (currencyId && currencyId > 1 && ExchangeRates._rates != null) {
      var ccode = GetCurrencyCode(currencyId);
      if (ExchangeRates._rates[ccode]) {
        input *= ExchangeRates._rates[ccode];
        return v_currencyformat(Math.round(input * 100), ccode);
      } else {
        return v_currencyformat(Math.round(input * 100), 'USD');
      }
    } else {
      return v_currencyformat(Math.round(input * 100), 'USD');
    }
  },
};

var ExternalPrices = {
  // Team Fortress 2
  440: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
      {
        name: 'SIHMarket',
        nameForApi: 'sihmarket',
        api: MarketplaceSource,
        sort: 2,
      },
      {
        name: 'MarketCSGOcom',
        nameForApi: 'csgocom',
        api: MarketplaceSource,
        sort: 6,
      },
      {
        name: 'Waxpeer',
        nameForApi: 'waxpeer',
        api: MarketplaceSource,
        sort: 8,
      },
      {
        name: 'Tradeit',
        nameForApi: 'tradeit',
        api: MarketplaceSource,
        sort: 9,
      },
      {
        name: 'bitskins',
        nameForApi: 'bitskins',
        api: MarketplaceSource,
        sort: 10,
      },
      {
        name: 'Skinbaron',
        nameForApi: 'skinbaron',
        api: MarketplaceSource,
        sort: 15,
      },
      {
        name: 'CsDeal',
        nameForApi: 'csdeal',
        api: MarketplaceSource,
        sort: 18,
      },
      {
        name: 'Dmarket',
        nameForApi: 'dmarket',
        api: MarketplaceSource,
        sort: 20,
      },
      {
        name: 'CS_Trade',
        nameForApi: 'cstrade',
        api: MarketplaceSource,
        sort: 21,
      },
      {
        name: 'Loot_farm',
        nameForApi: 'lootfarm',
        api: MarketplaceSource,
        sort: 22,
      },
      {
        name: 'Mannco',
        nameForApi: 'mannco',
        api: MarketplaceSource,
        sort: 23,
      },
      {
        name: 'Skinport',
        nameForApi: 'skinport',
        api: MarketplaceSource,
        sort: 26,
      },
    ],
  },
  // DOTA 2
  570: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
      {
        name: 'Lisskins',
        nameForApi: 'lisskins',
        api: MarketplaceSource,
        sort: 5,
      },
      {
        name: 'MarketCSGOcom',
        nameForApi: 'csgocom',
        api: MarketplaceSource,
        sort: 6,
      },
      {
        name: 'Tradeit',
        nameForApi: 'tradeit',
        api: MarketplaceSource,
        sort: 9,
      },
      {
        name: 'bitskins',
        nameForApi: 'bitskins',
        api: MarketplaceSource,
        sort: 10,
      },
      {
        name: 'CsDeal',
        nameForApi: 'csdeal',
        api: MarketplaceSource,
        sort: 18,
      },
      {
        name: 'Dmarket',
        nameForApi: 'dmarket',
        api: MarketplaceSource,
        sort: 20,
      },
      {
        name: 'cs_trade',
        nameForApi: 'cstrade',
        api: MarketplaceSource,
        sort: 21,
      },
      {
        name: 'Loot_farm',
        nameForApi: 'lootfarm',
        api: MarketplaceSource,
        sort: 22,
      },
      {
        name: 'Mannco',
        nameForApi: 'mannco',
        api: MarketplaceSource,
        sort: 23,
      },
      {
        name: 'Skinport',
        nameForApi: 'skinport',
        api: MarketplaceSource,
        sort: 26,
      },
      {
        name: 'AvanMarket',
        nameForApi: 'avanmarket',
        api: MarketplaceSource,
        sort: 27,
      },
    ],
  },
  // CS2
  730: {
    apis: [
      {
        name: 'Steam',
        api: MarketplaceSource,
        nameForApi: 'steamLiveSell',
        sort: 1,
      },
      {
        name: 'SIHMarket',
        nameForApi: 'sihmarket',
        api: MarketplaceSource,
        sort: 2,
      },
      {
        name: 'Buff163',
        nameForApi: 'buff163',
        api: MarketplaceSource,
        sort: 3,
      },
      {
        name: 'CSFloat',
        nameForApi: 'csfloat',
        api: MarketplaceSource,
        sort: 4,
      },
      {
        name: 'Lisskins',
        nameForApi: 'lisskins',
        api: MarketplaceSource,
        sort: 5,
      },
      {
        name: 'MarketCSGOcom',
        nameForApi: 'csgocom',
        api: MarketplaceSource,
        sort: 6,
      },
      {
        name: 'WhiteMarket',
        nameForApi: 'whitemarket',
        api: MarketplaceSource,
        sort: 7,
      },
      {
        name: 'Waxpeer',
        nameForApi: 'waxpeer',
        api: MarketplaceSource,
        sort: 8,
      },
      {
        name: 'Tradeit',
        nameForApi: 'tradeit',
        api: MarketplaceSource,
        sort: 9,
      },
      {
        name: 'Bitskins',
        nameForApi: 'bitskins',
        api: MarketplaceSource,
        sort: 10,
      },
      {
        name: 'HaloSkins',
        nameForApi: 'haloskins',
        api: MarketplaceSource,
        sort: 11,
      },
      {
        name: 'Shadowpay',
        nameForApi: 'shadowpay',
        api: MarketplaceSource,
        sort: 13,
      },
      {
        name: 'SkinOut',
        nameForApi: 'skinout',
        api: MarketplaceSource,
        sort: 14,
      },
      {
        name: 'Skinbaron',
        nameForApi: 'skinbaron',
        api: MarketplaceSource,
        sort: 15,
      },
      {
        name: 'Skinsmonkey',
        nameForApi: 'skinsmonkey',
        api: MarketplaceSource,
        sort: 16,
      },
      {
        name: 'SteamAnalyst',
        nameForApi: 'steamanalyst',
        api: MarketplaceSource,
        sort: 17,
      },
      {
        name: 'CsDeal',
        nameForApi: 'csdeal',
        api: MarketplaceSource,
        sort: 18,
      },
      {
        name: 'CSmoneyStore',
        nameForApi: 'csmoneyStore',
        api: MarketplaceSource,
        sort: 19,
      },
      {
        name: 'Dmarket',
        nameForApi: 'dmarket',
        api: MarketplaceSource,
        sort: 20,
      },
      {
        name: 'CS_Trade',
        nameForApi: 'cstrade',
        api: MarketplaceSource,
        sort: 21,
      },
      {
        name: 'Loot_farm',
        nameForApi: 'lootfarm',
        api: MarketplaceSource,
        sort: 22,
      },
      {
        name: 'Mannco',
        nameForApi: 'mannco',
        api: MarketplaceSource,
        sort: 23,
      },
      {
        name: 'SkinPlace',
        nameForApi: 'skinplace',
        api: MarketplaceSource,
        sort: 25,
      },
      {
        name: 'Skinport',
        nameForApi: 'skinport',
        api: MarketplaceSource,
        sort: 26,
      },
      {
        name: 'AvanMarket',
        nameForApi: 'avanmarket',
        api: MarketplaceSource,
        sort: 27,
      },
      {
        name: 'Igxe',
        nameForApi: 'igxe',
        api: MarketplaceSource,
        sort: 28,
      },
      {
        name: 'GamerPay',
        nameForApi: 'gamerpay',
        api: MarketplaceSource,
        sort: 29,
      },
      {
        name: 'GameBoost',
        nameForApi: 'gameboost',
        api: MarketplaceSource,
        sort: 30,
      },
    ],
  },
  // PAYDAY 2
  218620: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Rust
  252490: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
      {
        name: 'SIHMarket',
        nameForApi: 'sihmarket',
        api: MarketplaceSource,
        sort: 2,
      },
      {
        name: 'Lisskins',
        nameForApi: 'lisskins',
        api: MarketplaceSource,
        sort: 5,
      },
      {
        name: 'MarketCSGOcom',
        nameForApi: 'csgocom',
        api: MarketplaceSource,
        sort: 6,
      },
      {
        name: 'Waxpeer',
        nameForApi: 'waxpeer',
        api: MarketplaceSource,
        sort: 8,
      },
      {
        name: 'Tradeit',
        nameForApi: 'tradeit',
        api: MarketplaceSource,
        sort: 9,
      },
      {
        name: 'CsDeal',
        nameForApi: 'csdeal',
        api: MarketplaceSource,
        sort: 18,
      },
      {
        name: 'Dmarket',
        nameForApi: 'dmarket',
        api: MarketplaceSource,
        sort: 20,
      },
      {
        name: 'CS_Trade',
        nameForApi: 'cstrade',
        api: MarketplaceSource,
        sort: 21,
      },
      {
        name: 'Loot_farm',
        nameForApi: 'lootfarm',
        api: MarketplaceSource,
        sort: 22,
      },
      {
        name: 'Mannco',
        nameForApi: 'mannco',
        api: MarketplaceSource,
        sort: 23,
      },
      {
        name: 'Rustskins',
        nameForApi: 'rustskins',
        api: MarketplaceSource,
        sort: 24,
      },
      {
        name: 'Skinport',
        nameForApi: 'skinport',
        api: MarketplaceSource,
        sort: 26,
      },
      {
        name: 'AvanMarket',
        nameForApi: 'avanmarket',
        api: MarketplaceSource,
        sort: 27,
      },
    ],
  },
  // Don't Starve Together
  322330: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Rogue Agent
  843660: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // !Anyway!
  866510: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Unturned
  304930: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Killing Floor 2
  232090: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // PUBG
  578080: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Battalion: Legacy
  489940: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Depth
  274940: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Black Squad
  550650: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Steam Community
  753: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
      {
        name: 'steamlvlup',
        nameForApi: 'steamlvlup',
        api: MarketplaceSource,
        sort: 2,
      },
      {
        name: 'steamlvlupgems',
        nameForApi: 'steamlvlup',
        api: MarketplaceSource,
        sort: 3,
      },
    ],
  },
  //Business Tour
  397900: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Euro Truck Simulator 2
  227300: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Crab Game
  1782210: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Brawl of Ages
  529840: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //American Truck Simulator
  270880: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Golf It!
  571740: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Armello
  290340: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //XERA: Survival
  625340: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Intruder
  518150: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //WARMODE
  391460: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Banana
  2923300: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Cats
  2977660: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //NARAKA: BLADEPOINT
  1203220: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Egg Surprise
  3017120: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Tapple
  3047030: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Primal Carnage: Extinction
  321360: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //EGG
  2784840: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Myth of Empires
  1371580: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Cucumber
  3015610: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Flag Clicker
  2996990: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Hired Ops
  374280: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Anime Collector: Evo
  1464540: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Melon
  3050630: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Banana Shooter
  1949740: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //BLOCKPOST LEGACY
  706990: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Meh
  3065090: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  // Punch!
  3025120: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Creature Clicker - Capture, Train, Ascend!
  529240: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Hero Siege
  269210: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Golf With Your Friends
  431240: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Bananametr
  3013470: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //Space Engineers
  244850: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //#monstercakes
  614910: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //SteamVR
  250820: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
  //→SUMETRICK←
  771950: {
    apis: [
      {
        name: 'Steam',
        nameForApi: 'steamLiveSell',
        api: MarketplaceSource,
        sort: 1,
      },
    ],
  },
};

//TODO: FIX IT
ExchangeRates.GetRate();

const GetBookmarkedItems = () => {
  const appid = g_ActiveInventory?.appid;
  const filteredBookmarkedItems = Object.keys(bookmarkeditems)
    .filter((key) => bookmarkeditems[key].appid == appid)
    .reduce((res, key) => Object.assign(res, { [key]: bookmarkeditems[key] }), {});
  if (!$J.isEmptyObject(filteredBookmarkedItems))
    $J(`div.item.app${appid}[id*=${appid}_]`).each((idx, elem) => {
      const $elem = $J(elem);
      const market_hash_name = GetMarketHashName(elem.rgItem.description || elem.rgItem);
      const bookmarkname = `${appid}/${encodeURIComponent(market_hash_name)}`;
      if (filteredBookmarkedItems[bookmarkname]) {
        if ($elem.find('.item_flag').length) $elem.find('.item_flag').addClass('item_bookmarked');
        else SIH?.AppendElementToItemHeader($elem, 'bookmarked');
      }
    });
};

const GetEquippedItems = () => {
  const appid = g_ActiveInventory?.appid;
  const steamid = g_ActiveUser?.GetSteamId();
  if (appid == 440 || appid == 570) {
    chrome.runtime.sendMessage(SIHID, { type: 'GetPlayerItems', steamid, appid, g_wapit }, function (response) {
      if (response && response.success) {
        Object.keys(response.data).forEach((itemId) => {
          const elIt = $J(`div.item[id*=${itemId}]`);
          if (elIt.length > 0) {
            if (elIt.find('.item_flag').length) elIt.find('.item_flag').addClass('item_equipped');
            else SIH?.AppendElementToItemHeader(elIt, 'equipped');
            elIt[0].rgItem.equipped = true;
          }
        });
      }
    });
  }
};

const sendRequest = (params) => {
  return new Promise((resolve, reject) => $J.ajax(params).done(resolve).fail(reject));
};

const GetItemsInTrades = async () => {
  window.chrome.runtime.sendMessage(SIHID, { type: 'GetLastTrades', data: { activeOnly: true } }, (res) => {
    if (res.success && res.response.trade_offers_sent) {
      $J.each(res.response.trade_offers_sent || [], (i, row) => {
        $J.each(row.items_to_give || [], (idx, item) => {
          const { assetid, appid, contextid, classid, instanceid } = item;
          itemsInTrades.push({ id: assetid, appid, contextid, classid, instanceid });
          const $elem = $J(`div.item[id*=${appid}_${contextid}_${assetid}]`);
          if ($elem.length) {
            if ($elem.find('.item_flag').length) $elem.find('.item_flag').addClass('item_intrade');
            else SIH?.AppendElementToItemHeader($elem, 'intrade');
          }
        });

        $J.each(row.items_to_receive || [], (idx, item) => {
          const { assetid, appid, contextid, classid, instanceid } = item;
          const $elem = $J(`div.item[id*=${appid}_${contextid}_${assetid}]`);
          itemsInTrades.push({ id: assetid, appid, contextid, classid, instanceid });
          if ($elem.length) {
            if ($elem.find('.item_flag').length) $elem.find('.item_flag').addClass('item_intrade');
            else SIH?.AppendElementToItemHeader($elem, 'intrade');
          }
        });
      });
    }

    if (res.success && res.response.trade_offers_received) {
      $J.each(res.response.trade_offers_received || [], (i, row) => {
        $J.each(row.items_to_give || [], (idx, item) => {
          const { assetid, appid, contextid, classid, instanceid } = item;
          const $elem = $J(`div.item[id*=${appid}_${contextid}_${assetid}]`);
          itemsInTrades.push({ id: assetid, appid, contextid, classid, instanceid });
          if ($elem.length) {
            if ($elem.find('.item_flag').length) $elem.find('.item_flag').addClass('item_intrade');
            else SIH?.AppendElementToItemHeader($elem, 'intrade');
          }
        });

        $J.each(row.items_to_receive || [], (idx, item) => {
          const { assetid, appid, contextid, classid, instanceid } = item;
          itemsInTrades.push({ id: assetid, appid, contextid, classid, instanceid });
          const $elem = $J(`div.item[id*=${appid}_${contextid}_${assetid}]`);
          if ($elem.length) {
            if ($elem.find('.item_flag').length) $elem.find('.item_flag').addClass('item_intrade');
            else SIH?.AppendElementToItemHeader($elem, 'intrade');
          }
        });
      });
    }
  });
};

const loadPriceOverview = (name) => {
  SIH?.itemDescription
    ?.LoadPriceSteamInventory(name)
    .then((marketPrice) => {
      if (g_ActiveInventory?.m_rgContextIds?.length) {
        g_ActiveInventory.m_rgContextIds.forEach((contextId) => {
          g_ActiveInventory.m_rgChildInventories[contextId].m_rgItemElements.forEach((item) =>
            updateDescription(item, marketPrice)
          );
        });
      } else {
        g_ActiveInventory.m_rgItemElements.forEach((item) => updateDescription(item, marketPrice));
      }

      if (g_ActiveInventory.selectedItem.description.descriptions === undefined)
        g_ActiveInventory.selectedItem.description.descriptions = [{ type: 'html', value: '' }];

      if (g_inventoryData?.[g_ActiveInventory.appid]?.isLoadFirst) {
        RenderSelectAllSimilarItemsBtn(g_ActiveInventory.selectedItem);
      }
      PriceQueue.GenPriceDescription(g_ActiveInventory.selectedItem.description);

      SIH?.itemDescription?.UpdateReactDescription();
    })
    .catch((error) => {
      const selectedItemDescription = g_ActiveInventory?.selectedItem?.description;

      if (selectedItemDescription) {
        selectedItemDescription.lowestPrice = 'Failed to load price';
        selectedItemDescription.nofeePrice = 'Failed to load price';
        selectedItemDescription.volume = 'Failed to load volume';
      }

      SIH?.itemDescription.FloatInventoryButton(g_ActiveInventory.selectedItem.description);

      if (g_inventoryData?.[g_ActiveInventory.appid]?.isLoadFirst) {
        RenderSelectAllSimilarItemsBtn(g_ActiveInventory.selectedItem);
      }

      PriceQueue.GenPriceDescription(g_ActiveInventory.selectedItem.description);
      SIH?.itemDescription?.UpdateReactDescription();
    });

  function updateDescription(item, marketPrice) {
    const des = item[0].rgItem.description;

    if (des.market_hash_name === name) {
      des.lowestPrice = marketPrice?.lowest_price || 'Failed to load price';
      des.nofeePrice = marketPrice?.median_price || 'Failed to load price';
      des.volume = marketPrice?.volume || 'Failed to load volume';
    }
  }
};
