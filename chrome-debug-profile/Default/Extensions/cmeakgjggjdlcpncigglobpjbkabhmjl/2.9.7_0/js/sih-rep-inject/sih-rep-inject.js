const actualCode = [`window.SIHID = '${chrome.runtime.id}'`].join('\r\n');

document.documentElement.setAttribute('onreset', actualCode);
document.documentElement.dispatchEvent(new CustomEvent('reset'));
document.documentElement.removeAttribute('onreset');
