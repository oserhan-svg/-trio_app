window.InventoryItemRarity =
  window.InventoryItemRarity ||
  (() => {
    if (!window.hasOwnProperty('KnifePhaseDetector')) {
      throw new Error('Module KnifePhaseDetector from file `js/knifephasedetector.script.js` is required!');
    }

    const APP_IDS = [730];
    const EXCLUDED_QUALITIES_TO_COLORIZE_BORDER = {
      730: ['tournament', 'genuine', 'unusual', 'unusual_strange', 'strange'],
    };
    const INCLUDED_CATEGORY_TYPES_TO_COLORIZE_BORDER = {
      730: 'Weapon',
    };
    const RARITY_TO_COLORIZE_BACKGROUND = {
      730: ['Rarity_Contraband'],
    };
    const PHASE_TO_COLORIZE_BACKGROUND = {
      ruby: 'ff1600',
      sapphire: '3500fa',
      blackpearl: '000000',
      emerald: '00ff3e',
    };

    let backlight_brightness = '50';

    const percentValueMatching = {
      0: '00',
      25: '40',
      50: '80',
      75: 'BF',
      100: 'FF',
    };

    // Delay promise function
    const onNextTick = (delay = 0) => new Promise((r) => setTimeout(r, delay));

    // Get tags from item object (which is different in the market page)
    const getTags = (item) => item.tags || (item.description && item.description.tags) || [];

    // Get meta from item object (which is different in the market page)
    const getItemMeta = (item) => item.description || item;

    // Check if App is in the list
    const appIsValid = (
      (appList) => (appId) =>
        appList.includes(appId)
    )(APP_IDS);

    // Get background colorization rules
    const getBackgroundColorRules = (
      (rules) => (appId) =>
        rules[appId]
    )(RARITY_TO_COLORIZE_BACKGROUND);

    // Wait until inventory will be ready
    const onInventoryReady = (inventory) => {
      // Trading window has old version of g_ActiveInventory: without AddOnItemsLoadedCallback event handler and different structure of items
      if (window.g_bIsTrading) {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            // Check if inventory ready
            if (!g_ActiveInventory.BIsPendingInventory()) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        });
      }

      // For a new version of g_ActiveInventory
      let cb;
      return new Promise((resolve) => {
        if (inventory.m_rgChildInventories) {
          const hasNotReadyInv = Object.values(inventory.m_rgChildInventories).some((inv) => !inv.m_bFullyLoaded);
          if (!hasNotReadyInv) return resolve();
        }

        if (inventory.m_bFullyLoaded) return resolve();

        cb = ((r) => async () => {
          await onNextTick(); // wait until inventory changes will be applied === run next line of code in the next tick
          inventory.m_bFullyLoaded && r();
        })(resolve);

        inventory.AddOnItemsLoadedCallback(cb);
      }).then(() => inventory.RemoveOnItemsLoadedCallback(cb));
    };

    // Check if item have been excluded from list for border colorization
    const ifExcluded = ((excludedQualities) => (item) => {
      const { appid } = item;
      const tags = getTags(item);

      if (!appIsValid(appid)) {
        return true;
      }
      // Universal (?)(app independable) method: exclude if
      // description.tags.filter(({ category }) => category === 'Quality').map(({ color }) => color).includes(description.name_color)

      const categoryIncluded = INCLUDED_CATEGORY_TYPES_TO_COLORIZE_BORDER[appid].toLowerCase();
      if (!tags.find(({ category }) => category.toLowerCase() === categoryIncluded)) {
        return true;
      }

      return !!tags.find(({ category, internal_name }) => {
        return category === 'Quality' && (excludedQualities[appid] || []).includes(internal_name);
      });
    })(EXCLUDED_QUALITIES_TO_COLORIZE_BORDER);

    // Set color for the item's border
    const setBorderColor = (item, $el = $J(item.element), cb = false) => {
      if (ifExcluded(item)) {
        return false;
      }

      const { name_color } = item;
      const rarityTag = getTags(item).find(({ category }) => category === 'Rarity');
      const borderColor = (rarityTag && rarityTag.color) || name_color;

      if (borderColor) {
        if (typeof cb === 'function') {
          return cb(borderColor);
        }

        $el.css('border-color', `#${borderColor}`);
      }
    };

    // Set background color of the item
    const setBackgroundColor = (item, $el, showPhase, cb = false) => {
      let backgroundColor;

      const tag = getTags(item).find(({ category }) => category === 'Rarity');

      backgroundColor = (tag && tag.color) || false;

      if (backgroundColor) {
        if (typeof cb === 'function') {
          return cb(backgroundColor);
        }

        if (backlight_brightness === '100') {
          $el.addClass('colorized-background__full');
        } else {
          $el.addClass('colorized-background__backlight');
        }

        $el.addClass('colorized-background');
        $el
          .get(0)
          .style.setProperty('--dynamic-color', `#${backgroundColor}${percentValueMatching[backlight_brightness]}`);
      }
    };

    // Colorize inventory
    const colorize = async (showPhase, inventory = g_ActiveInventory) => {
      if (!inventory) {
        return;
      }

      await onInventoryReady(inventory);

      const { appid } = inventory;

      let $elements;

      if (window.location.href.includes('/tradeoffer')) {
        const rgItemElements = g_ActiveInventory.rgChildInventories?.[2]?.rgItemElements?.length
          ? g_ActiveInventory.rgChildInventories[2].rgItemElements
          : g_ActiveInventory.rgItemElements;

        $elements =
          typeof g_ActiveInventory !== 'undefined'
            ? $J(
                rgItemElements.map((item) => {
                  return item;
                })
              )
            : $J(`.inventory_ctn:visible div.item.app${appid}`);
      } else {
        let rgItemElements = [];

        if (g_ActiveInventory?.m_rgChildInventories) {
          Object.values(g_ActiveInventory.m_rgChildInventories).forEach((inventory) => {
            rgItemElements = [...rgItemElements, ...inventory.m_rgItemElements];
          });
        } else {
          rgItemElements = g_ActiveInventory?.m_rgItemElements;
        }

        $elements =
          typeof g_ActiveInventory !== 'undefined'
            ? $J(
                rgItemElements.map((item) => {
                  return item[0];
                })
              )
            : $J(`.inventory_ctn:visible div.item.app${appid}`);
      }

      if (!$elements || !$elements.length) {
        return;
      }

      if (!appIsValid(+appid)) {
        return; // There is nothing to colorize for this application
      }

      chrome.runtime.sendMessage(
        SIHID,
        { type: 'BACKGROUND_GET_SYNC_STORAGE', data: { backlight_brightness: 50 } },
        (response) => {
          backlight_brightness = response.backlight_brightness;

          $elements.each(function () {
            colorizeItem(this.rgItem, $J(this.rgItem.element), showPhase);
          });
        }
      );

      $elements.each(function () {
        SIH?.phaseOfItems?.loadForInventory(this.rgItem, $J(this.rgItem.element));
      });
    };

    // Colorize specified item
    const colorizeItem = (
      item,
      $el,
      showPhase,
      { onBorderColor, onBackGroundColor, disableBorderColorization, disableBackgroundColorization } = {}
    ) => {
      !disableBorderColorization && setBorderColor(item, $el, onBorderColor);
      !disableBackgroundColorization && setBackgroundColor(item, $el, showPhase, onBackGroundColor);
    };

    getPhaseColorByImageUrl = (imageUrl) => {
      const phase = window.KnifePhaseDetector.detectByImageUrl(imageUrl);
      return (phase && PHASE_TO_COLORIZE_BACKGROUND[phase.code]) || false;
    };

    return {
      colorize,
      colorizeItem,
      getPhaseColorByImageUrl,
    };
  })();
