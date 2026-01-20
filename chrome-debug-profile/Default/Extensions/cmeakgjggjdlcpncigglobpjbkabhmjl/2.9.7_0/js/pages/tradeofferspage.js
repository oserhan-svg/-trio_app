/* global chrome */

const userUrlExp = /<a href="https:\/\/steamcommunity.com\/.+?\/.+?\/">/;
const sessionID = '';
var _tradesTimers = {};
var _openedWins = {};

chrome.storage.sync.get(
  {
    currency: '',
    userUrl: null,
    lang: '',
  },
  function (items) {
    window.currencyId = items.currency !== '' ? items.currency : 1;
    window.userUrl = items.userUrl + (items.userUrl[items.userUrl.length - 1] === '/' ? '' : '/');
    window.userLanguage = items.lang;

    $(function () {
      if (userUrl === null || userUrl === '//steamcommunity.com/my/') {
        $.ajax({
          method: 'get',
          url: 'https://steamcommunity.com/my/',
        }).done(function (response) {
          if ($(response).find('.login_bottom_row_item').length) {
            userSignedOut();
          } else {
            var userUrl = userUrlExp.exec(response)[0].split('"')[1];
            chrome.storage.sync.set({ userUrl: userUrl.split(':')[1] });
            chrome.runtime.sendMessage(window.SIHID, {
              type: 'BACKGROUND_TRADEOFFER_THROUGH_PARSING',
              data: { endPoint: null, txtResponse: null },
            });
          }
        });
      } else {
        chrome.runtime.sendMessage(window.SIHID, {
          type: 'BACKGROUND_TRADEOFFER_THROUGH_PARSING',
          data: { endPoint: null, txtResponse: null },
        });
      }
      chrome.runtime.sendMessage(chrome.runtime.id, { type: 'BACKGROUND_LOGIN_SIH_APP' }, (cb) => {});
    });
  }
);

function userSignedOut() {
  $('#Div_Offers').text('').append(i18next.t('tradeoffers.signedout'));
  // Clear badge text of the extension when user signed out
  chrome.action.setBadgeText({ text: '' });
}
