var __webpack_exports__ = {};
// Scrap images from a page
// Calling by popup.js

(function (_window$frameElement) {
  var ID_SCRAPING_FRAME = 'bbf98b9d-7a7f-48fb-a5b2-03c45332969e';

  // ignore iframe for scraping (initIframeScraper.js)
  if (window !== window.top && ((_window$frameElement = window.frameElement) === null || _window$frameElement === void 0 ? void 0 : _window$frameElement.id) === ID_SCRAPING_FRAME) return;

  /**
   * Convert SVG text into base64 text
   * @param svgText - SVG tag in string format
   * @return {string} - base64 version of SVG
   */
  function svgToBase64(svgText) {
    return "data:image/svg+xml;base64,".concat(btoa(svgText));
  }

  /**
   * Finds all elements referenced by the SVG and includes them in the SVG
   * @param {SVGElement} svg - SVG element
   * @returns {string} - Full SVG with external references included
   */
  function getCompleteSVGString(svg) {
    // Clone the SVG to avoid changing the original
    var svgClone = svg.cloneNode(true);
    var referencedIds = new Set();

    // Function to extract ID from URL (e.g. url(#myId) -> myId)
    function extractIdFromUrl(url) {
      if (!url) return null;
      var match = url.match(/url\(['"]?#([^'")]+)['"]?\)/);
      return match ? match[1] : null;
    }

    // Function to extract ID from href/xlink:href
    function extractIdFromHref(href) {
      if (!href) return null;
      return href.startsWith('#') ? href.substring(1) : href;
    }

    // Collect all the IDs referenced by the SVG
    function collectReferencedIds(element) {
      // Checking href and xlink:href
      var href = element.getAttribute('href') || element.getAttribute('xlink:href');
      if (href && href.startsWith('#')) {
        // Replaces xlink:href with href, as the link becomes internal
        element.removeAttribute('xlink:href');
        element.setAttribute('href', href);
        var id = extractIdFromHref(href);
        if (id) referencedIds.add(id);
      }

      // Checking styles for url(#id)
      var style = element.getAttribute('style') || '';
      var styleUrlId = extractIdFromUrl(style);
      if (styleUrlId) referencedIds.add(styleUrlId);

      // Checking computed styles
      try {
        var computedStyle = window.getComputedStyle(element);
        var clipPath = computedStyle.clipPath;
        var mask = computedStyle.mask;
        var filter = computedStyle.filter;
        [clipPath, mask, filter].forEach(function (prop) {
          if (prop && prop !== 'none') {
            var _id = extractIdFromUrl(prop);
            if (_id) referencedIds.add(_id);
          }
        });
      } catch (e) {
        // Ignoring computed styles errors
      }

      // Recursively check child elements
      Array.from(element.children).forEach(function (child) {
        collectReferencedIds(child);
      });
    }
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Collecting all links from the cloned SVG
    collectReferencedIds(svgClone);

    // Find all elements referenced by SVG
    var referencedElements = [];
    referencedIds.forEach(function (id) {
      // Finding an element in a document
      var element = document.getElementById(id);
      if (element && element !== svg && !svg.contains(element)) {
        // Clone an element to include it in the SVG
        var clonedElement = element.cloneNode(true);
        // Make sure the clone has an ID
        clonedElement.setAttribute('id', id);
        referencedElements.push(clonedElement);
      }
    });

    // If there are external links, add them to <defs>
    if (referencedElements.length > 0) {
      var defs = svgClone.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgClone.insertBefore(defs, svgClone.firstChild);
      }

      // Add all found elements to defs
      referencedElements.forEach(function (elem) {
        // We check if such an element already exists in defs
        if (!defs.querySelector("#".concat(elem.id))) {
          defs.appendChild(elem);
        }
      });
    }
    return svgClone.outerHTML;
  }
  var imageManager = {
    imageType: {
      IMG: 'IMG',
      TEXT: 'TEXT',
      LINK: 'LINK',
      INPUT_IMG: 'INPUT_IMG',
      BACKGROUND: 'BACKGROUND',
      DATAURL: 'DATAURL'
    },
    imgList: [],
    getImages: function getImages() {
      this.imgList = [];
      var imgs = document.getElementsByTagName('img');
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var newImg = new Image();
        newImg.src = img.src;
        var width = 0;
        var height = 0;
        width = parseInt(img.naturalWidth);
        height = parseInt(img.naturalHeight);
        nwidth = parseInt(newImg.width);
        nheight = parseInt(newImg.height);
        width = nwidth > width ? nwidth : width;
        height = nheight > height ? nheight : height;
        this.addImg(imageManager.imageType.IMG, img.src, width, height);
      }
      imgs = document.images;
      if (imgs && imgs.length > 0) {
        for (var i = 0; i < imgs.length; i++) {
          try {
            var img = imgs[i];
            var newImg = new Image();
            newImg.src = img.currentSrc;
            var width = 0;
            var height = 0;
            width = parseInt(img.naturalWidth);
            height = parseInt(img.naturalHeight);
            nwidth = parseInt(newImg.width);
            nheight = parseInt(newImg.height);
            width = nwidth > width ? nwidth : width;
            height = nheight > height ? nheight : height;
            newImg = null;
            this.addImg(imageManager.imageType.IMG, img.currentSrc, width, height);
          } catch (e) {}
        }
      }
      try {
        imgs = imageManager.querySelectorAllShadows('img');
        if (imgs && imgs.length > 0) {
          for (var i = 0; i < imgs.length; i++) {
            try {
              var img = imgs[i];
              var newImg = new Image();
              newImg.src = img.currentSrc;
              var width = 0;
              var height = 0;
              width = parseInt(img.naturalWidth);
              height = parseInt(img.naturalHeight);
              nwidth = parseInt(newImg.width);
              nheight = parseInt(newImg.height);
              width = nwidth > width ? nwidth : width;
              height = nheight > height ? nheight : height;
              newImg = null;
              this.addImg(imageManager.imageType.IMG, img.currentSrc, width, height);
            } catch (e) {}
          }
        }
      } catch (e) {
        // experimental feature lets catch everything
      }
      var sources = document.getElementsByTagName('source');
      if (sources && sources.length > 0) {
        for (var i = 0; i < sources.length; i++) {
          try {
            var source = sources[i];
            if (!source.srcset) continue;
            var newImg = new Image();
            newImg.src = source.srcset;
            var width = parseInt(newImg.naturalWidth);
            var height = parseInt(newImg.naturalHeight);
            nwidth = parseInt(newImg.width);
            nheight = parseInt(newImg.height);
            width = nwidth > width ? nwidth : width;
            height = nheight > height ? nheight : height;
            this.addImg(imageManager.imageType.IMG, newImg.src, width, height);
            newImg = null;
          } catch (e) {}
        }
      }
      var srcsets = document.querySelectorAll('img[srcset]');
      if (srcsets && srcsets.length > 0) {
        for (var i = 0; i < srcsets.length; i++) {
          try {
            var img = srcsets[i];
            if (!img.srcset) continue;
            var srcset = img.srcset.split(', ');
            for (var j = 0; j < srcset.length; j++) {
              try {
                var src = srcset[j];
                src = src.substring(0, src.indexOf(' ') != -1 ? src.indexOf(' ') : src.length);
                var newImg = new Image();
                newImg.src = src;
                src = newImg.src;
                var width = parseInt(newImg.naturalWidth);
                var height = parseInt(newImg.naturalHeight);
                nwidth = parseInt(newImg.width);
                nheight = parseInt(newImg.height);
                width = nwidth > width ? nwidth : width;
                height = nheight > height ? nheight : height;
                newImg = null;
                console.log("adding img from srcset: ".concat(src, " w: ").concat(width, " h:").concat(height));
                this.addImg(imageManager.imageType.IMG, src, width, height);
              } catch (e) {
                console.error('cannot add image of srcset: ');
              }
            }
          } catch (e) {}
        }
      }
      var inputs = document.getElementsByTagName('input');
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var type = input.type;
        if (type.toUpperCase() == 'IMAGE') {
          var src = input.src;
          this.addImg(imageManager.imageType.INPUT_IMG, src, 0, 0);
        }
      }
      var links = document.getElementsByTagName('a');
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var href = link.href;
        if (href.endsWith('.jpg') || href.endsWith('.jpeg') || href.endsWith('.bmp') || href.endsWith('.ico') || href.endsWith('.gif') || href.endsWith('.png')) {
          this.addImg(imageManager.imageType.LINK, href, 0, 0);
        }
      }
      var svgs = document.getElementsByTagName('svg');
      for (var i = 0; i < svgs.length; i++) {
        var svg = svgs[i];
        var svgString = getCompleteSVGString(svg);
        var dataUrl = svgToBase64(svgString);
        this.addImg(imageManager.imageType.DATAURL, dataUrl, 0, 0);
      }
      var url;
      var B = [];
      var A = document.getElementsByTagName('*');
      A = B.slice.call(A, 0, A.length);
      while (A.length) {
        url = imageManager.deepCss(A.shift(), 'background-image');
        try {
          if (url && url != 'none') {
            var re = /url\(['"]?([^")]+)/g;
            var matches;
            while ((matches = re.exec(url)) != null) {
              var src = matches[1];
              if (src && imageManager.arrayIndexOf(B, src) == -1) {
                var newImg = new Image();
                newImg.src = src;
                src = newImg.src;
                this.addImg(imageManager.imageType.BACKGROUND, src, 0, 0);
              }
            }
          }
        } catch (e) {
          console.error('cannot add image background-image');
        }
      }
      url, B = [], A = document.getElementsByTagName('*');
      A = B.slice.call(A, 0, A.length);
      while (A.length) {
        url = imageManager.deepCss(A.shift(), 'background');
        try {
          if (url && url != 'none') {
            var re = /url\(['"]?([^")]+)/g;
            var matches;
            while ((matches = re.exec(url)) != null) {
              var src = matches[1];
              if (src && imageManager.arrayIndexOf(B, src) == -1) {
                var newImg = new Image();
                newImg.src = src;
                src = newImg.src;
                this.addImg(imageManager.imageType.BACKGROUND, src, 0, 0);
              }
            }
          }
        } catch (e) {
          console.error('cannot add image background-image');
        }
      }
      try {
        var urls = document.body.innerHTML.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?//=]*)/gi).filter(function (itm, i, a) {
          return i == a.indexOf(itm);
        });
        for (var i = 0; i < urls.length; i++) if (urls[i].match(/.*(\.png|\.svg|\.jpg|\.gif|\.jpeg|\.bmp|\.ico|\.webp|\.tif|\.apng|\.jfif|\.pjpeg|\.pjp).*/i) != null) this.addImg(imageManager.imageType.LINK, urls[i], 0, 0);
      } catch (e) {
        console.log("getImages error retreiving images by url: ".concat(e));
      }
      // move popup into html of the page
      /* https://github.com/mitchas/Keyframes.app/tree/master/Keyframes.app%20(Extension)/js
      $.get(chrome.extension.getURL('popup.html'), function (data) {
        debugger;
        $("body").append(data);
      });
      */
      return this.imgList;
    },
    addImg: function addImg(d, f, c, a) {
      this.imgList.push({
        type: d,
        src: f,
        width: c,
        height: a
      });
    },
    getUniqueImagesSrcs: function getUniqueImagesSrcs() {
      var images = imageManager.getImages();
      var imagesStrArray = new Array();
      for (var i = 0; i < images.length; i++) {
        imagesStrArray[imagesStrArray.length] = images[i].src;
      }
      var uniques = imagesStrArray.reverse().filter(function (e, i, arr) {
        return arr.indexOf(e, i + 1) === -1;
      }).reverse();
      return uniques;
    },
    deepCss: function deepCss(who, css) {
      if (!who || !who.style) return '';
      var sty = css.replace(/\-([a-z])/g, function (a, b) {
        return b.toUpperCase();
      });
      if (who.currentStyle) {
        return who.style[sty] || who.currentStyle[sty] || '';
      }
      var dv = document.defaultView || window;
      return who.style[sty] || dv.getComputedStyle(who, '').getPropertyValue(css) || '';
    },
    arrayIndexOf: function arrayIndexOf(array, what, index) {
      index = index || 0;
      var L = array.length;
      while (index < L) {
        if (array[index] === what) return index;
        ++index;
      }
      return -1;
    },
    querySelectorAllShadows: function querySelectorAllShadows(selector) {
      var el = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
      // recurse on childShadows
      var childShadows = Array.from(el.querySelectorAll('*')).map(function (el) {
        return el.shadowRoot;
      }).filter(Boolean);

      // console.log('[querySelectorAllShadows]', selector, el, `(${childShadows.length} shadowRoots)`);

      var childResults = childShadows.map(function (child) {
        return imageManager.querySelectorAllShadows(selector, child);
      });

      // fuse all results into singular, flat array
      var result = Array.from(el.querySelectorAll(selector));
      return result.concat(childResults).flat();
    }
  };
  var result = {
    images: imageManager.getUniqueImagesSrcs(),
    title: document.title,
    isTop: window.top == window.self,
    origin: window.location.origin
  };
  try {
    result.isArc = getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-title');
  } catch (e) {
    // empty string
  }
  return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VTY3JhcGVyLmpzIiwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFBQTs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQUE7QUFDQTtBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFBQTs7QUFHQTs7QUFFQTtBQUFBO0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFHQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaW1hZ2V5ZS8uL3NyYy9sZWdhY3kvaW1hZ2VTY3JhcGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFNjcmFwIGltYWdlcyBmcm9tIGEgcGFnZVxuLy8gQ2FsbGluZyBieSBwb3B1cC5qc1xuXG4oKCkgPT4ge1xuICBjb25zdCBJRF9TQ1JBUElOR19GUkFNRSA9ICdiYmY5OGI5ZC03YTdmLTQ4ZmItYTViMi0wM2M0NTMzMjk2OWUnO1xuXG4gIC8vIGlnbm9yZSBpZnJhbWUgZm9yIHNjcmFwaW5nIChpbml0SWZyYW1lU2NyYXBlci5qcylcbiAgaWYgKHdpbmRvdyAhPT0gd2luZG93LnRvcCAmJiB3aW5kb3cuZnJhbWVFbGVtZW50Py5pZCA9PT0gSURfU0NSQVBJTkdfRlJBTUUpIHJldHVybjtcblxuICAvKipcbiAgICogQ29udmVydCBTVkcgdGV4dCBpbnRvIGJhc2U2NCB0ZXh0XG4gICAqIEBwYXJhbSBzdmdUZXh0IC0gU1ZHIHRhZyBpbiBzdHJpbmcgZm9ybWF0XG4gICAqIEByZXR1cm4ge3N0cmluZ30gLSBiYXNlNjQgdmVyc2lvbiBvZiBTVkdcbiAgICovXG4gIGZ1bmN0aW9uIHN2Z1RvQmFzZTY0KHN2Z1RleHQpIHtcbiAgICByZXR1cm4gYGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJHtidG9hKHN2Z1RleHQpfWA7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgYWxsIGVsZW1lbnRzIHJlZmVyZW5jZWQgYnkgdGhlIFNWRyBhbmQgaW5jbHVkZXMgdGhlbSBpbiB0aGUgU1ZHXG4gICAqIEBwYXJhbSB7U1ZHRWxlbWVudH0gc3ZnIC0gU1ZHIGVsZW1lbnRcbiAgICogQHJldHVybnMge3N0cmluZ30gLSBGdWxsIFNWRyB3aXRoIGV4dGVybmFsIHJlZmVyZW5jZXMgaW5jbHVkZWRcbiAgICovXG4gIGZ1bmN0aW9uIGdldENvbXBsZXRlU1ZHU3RyaW5nKHN2Zykge1xuICAgIC8vIENsb25lIHRoZSBTVkcgdG8gYXZvaWQgY2hhbmdpbmcgdGhlIG9yaWdpbmFsXG4gICAgY29uc3Qgc3ZnQ2xvbmUgPSBzdmcuY2xvbmVOb2RlKHRydWUpO1xuICAgIGNvbnN0IHJlZmVyZW5jZWRJZHMgPSBuZXcgU2V0KCk7XG5cbiAgICAvLyBGdW5jdGlvbiB0byBleHRyYWN0IElEIGZyb20gVVJMIChlLmcuIHVybCgjbXlJZCkgLT4gbXlJZClcbiAgICBmdW5jdGlvbiBleHRyYWN0SWRGcm9tVXJsKHVybCkge1xuICAgICAgaWYgKCF1cmwpIHJldHVybiBudWxsO1xuICAgICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goL3VybFxcKFsnXCJdPyMoW14nXCIpXSspWydcIl0/XFwpLyk7XG4gICAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XG4gICAgfVxuXG4gICAgLy8gRnVuY3Rpb24gdG8gZXh0cmFjdCBJRCBmcm9tIGhyZWYveGxpbms6aHJlZlxuICAgIGZ1bmN0aW9uIGV4dHJhY3RJZEZyb21IcmVmKGhyZWYpIHtcbiAgICAgIGlmICghaHJlZikgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gaHJlZi5zdGFydHNXaXRoKCcjJykgPyBocmVmLnN1YnN0cmluZygxKSA6IGhyZWY7XG4gICAgfVxuXG4gICAgLy8gQ29sbGVjdCBhbGwgdGhlIElEcyByZWZlcmVuY2VkIGJ5IHRoZSBTVkdcbiAgICBmdW5jdGlvbiBjb2xsZWN0UmVmZXJlbmNlZElkcyhlbGVtZW50KSB7XG4gICAgICAvLyBDaGVja2luZyBocmVmIGFuZCB4bGluazpocmVmXG4gICAgICBjb25zdCBocmVmID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCBlbGVtZW50LmdldEF0dHJpYnV0ZSgneGxpbms6aHJlZicpO1xuICAgICAgaWYgKGhyZWYgJiYgaHJlZi5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgLy8gUmVwbGFjZXMgeGxpbms6aHJlZiB3aXRoIGhyZWYsIGFzIHRoZSBsaW5rIGJlY29tZXMgaW50ZXJuYWxcbiAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3hsaW5rOmhyZWYnKTtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcblxuICAgICAgICBjb25zdCBpZCA9IGV4dHJhY3RJZEZyb21IcmVmKGhyZWYpO1xuICAgICAgICBpZiAoaWQpIHJlZmVyZW5jZWRJZHMuYWRkKGlkKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2tpbmcgc3R5bGVzIGZvciB1cmwoI2lkKVxuICAgICAgY29uc3Qgc3R5bGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3R5bGUnKSB8fCAnJztcbiAgICAgIGNvbnN0IHN0eWxlVXJsSWQgPSBleHRyYWN0SWRGcm9tVXJsKHN0eWxlKTtcbiAgICAgIGlmIChzdHlsZVVybElkKSByZWZlcmVuY2VkSWRzLmFkZChzdHlsZVVybElkKTtcblxuICAgICAgLy8gQ2hlY2tpbmcgY29tcHV0ZWQgc3R5bGVzXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IHsgY2xpcFBhdGggfSA9IGNvbXB1dGVkU3R5bGU7XG4gICAgICAgIGNvbnN0IHsgbWFzayB9ID0gY29tcHV0ZWRTdHlsZTtcbiAgICAgICAgY29uc3QgeyBmaWx0ZXIgfSA9IGNvbXB1dGVkU3R5bGU7XG5cbiAgICAgICAgW2NsaXBQYXRoLCBtYXNrLCBmaWx0ZXJdLmZvckVhY2gocHJvcCA9PiB7XG4gICAgICAgICAgaWYgKHByb3AgJiYgcHJvcCAhPT0gJ25vbmUnKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IGV4dHJhY3RJZEZyb21VcmwocHJvcCk7XG4gICAgICAgICAgICBpZiAoaWQpIHJlZmVyZW5jZWRJZHMuYWRkKGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBJZ25vcmluZyBjb21wdXRlZCBzdHlsZXMgZXJyb3JzXG4gICAgICB9XG5cbiAgICAgIC8vIFJlY3Vyc2l2ZWx5IGNoZWNrIGNoaWxkIGVsZW1lbnRzXG4gICAgICBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGRyZW4pLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICBjb2xsZWN0UmVmZXJlbmNlZElkcyhjaGlsZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzdmdDbG9uZS5zZXRBdHRyaWJ1dGUoJ3htbG5zJywgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyk7XG5cbiAgICAvLyBDb2xsZWN0aW5nIGFsbCBsaW5rcyBmcm9tIHRoZSBjbG9uZWQgU1ZHXG4gICAgY29sbGVjdFJlZmVyZW5jZWRJZHMoc3ZnQ2xvbmUpO1xuXG4gICAgLy8gRmluZCBhbGwgZWxlbWVudHMgcmVmZXJlbmNlZCBieSBTVkdcbiAgICBjb25zdCByZWZlcmVuY2VkRWxlbWVudHMgPSBbXTtcbiAgICByZWZlcmVuY2VkSWRzLmZvckVhY2goaWQgPT4ge1xuICAgICAgLy8gRmluZGluZyBhbiBlbGVtZW50IGluIGEgZG9jdW1lbnRcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50ICE9PSBzdmcgJiYgIXN2Zy5jb250YWlucyhlbGVtZW50KSkge1xuICAgICAgICAvLyBDbG9uZSBhbiBlbGVtZW50IHRvIGluY2x1ZGUgaXQgaW4gdGhlIFNWR1xuICAgICAgICBjb25zdCBjbG9uZWRFbGVtZW50ID0gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgY2xvbmUgaGFzIGFuIElEXG4gICAgICAgIGNsb25lZEVsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICAgICAgcmVmZXJlbmNlZEVsZW1lbnRzLnB1c2goY2xvbmVkRWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgZXh0ZXJuYWwgbGlua3MsIGFkZCB0aGVtIHRvIDxkZWZzPlxuICAgIGlmIChyZWZlcmVuY2VkRWxlbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgbGV0IGRlZnMgPSBzdmdDbG9uZS5xdWVyeVNlbGVjdG9yKCdkZWZzJyk7XG4gICAgICBpZiAoIWRlZnMpIHtcbiAgICAgICAgZGVmcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnZGVmcycpO1xuICAgICAgICBzdmdDbG9uZS5pbnNlcnRCZWZvcmUoZGVmcywgc3ZnQ2xvbmUuZmlyc3RDaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbGwgZm91bmQgZWxlbWVudHMgdG8gZGVmc1xuICAgICAgcmVmZXJlbmNlZEVsZW1lbnRzLmZvckVhY2goZWxlbSA9PiB7XG4gICAgICAgIC8vIFdlIGNoZWNrIGlmIHN1Y2ggYW4gZWxlbWVudCBhbHJlYWR5IGV4aXN0cyBpbiBkZWZzXG4gICAgICAgIGlmICghZGVmcy5xdWVyeVNlbGVjdG9yKGAjJHtlbGVtLmlkfWApKSB7XG4gICAgICAgICAgZGVmcy5hcHBlbmRDaGlsZChlbGVtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN2Z0Nsb25lLm91dGVySFRNTDtcbiAgfVxuXG4gIHZhciBpbWFnZU1hbmFnZXIgPSB7XG4gICAgaW1hZ2VUeXBlOiB7XG4gICAgICBJTUc6ICdJTUcnLFxuICAgICAgVEVYVDogJ1RFWFQnLFxuICAgICAgTElOSzogJ0xJTksnLFxuICAgICAgSU5QVVRfSU1HOiAnSU5QVVRfSU1HJyxcbiAgICAgIEJBQ0tHUk9VTkQ6ICdCQUNLR1JPVU5EJyxcbiAgICAgIERBVEFVUkw6ICdEQVRBVVJMJyxcbiAgICB9LFxuICAgIGltZ0xpc3Q6IFtdLFxuICAgIGdldEltYWdlcygpIHtcbiAgICAgIHRoaXMuaW1nTGlzdCA9IFtdO1xuICAgICAgbGV0IGltZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGltZyA9IGltZ3NbaV07XG4gICAgICAgIHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgbmV3SW1nLnNyYyA9IGltZy5zcmM7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIHZhciBoZWlnaHQgPSAwO1xuICAgICAgICB3aWR0aCA9IHBhcnNlSW50KGltZy5uYXR1cmFsV2lkdGgpO1xuICAgICAgICBoZWlnaHQgPSBwYXJzZUludChpbWcubmF0dXJhbEhlaWdodCk7XG4gICAgICAgIG53aWR0aCA9IHBhcnNlSW50KG5ld0ltZy53aWR0aCk7XG4gICAgICAgIG5oZWlnaHQgPSBwYXJzZUludChuZXdJbWcuaGVpZ2h0KTtcbiAgICAgICAgd2lkdGggPSBud2lkdGggPiB3aWR0aCA/IG53aWR0aCA6IHdpZHRoO1xuICAgICAgICBoZWlnaHQgPSBuaGVpZ2h0ID4gaGVpZ2h0ID8gbmhlaWdodCA6IGhlaWdodDtcbiAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5JTUcsIGltZy5zcmMsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgfVxuICAgICAgaW1ncyA9IGRvY3VtZW50LmltYWdlcztcbiAgICAgIGlmIChpbWdzICYmIGltZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGltZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGltZyA9IGltZ3NbaV07XG4gICAgICAgICAgICB2YXIgbmV3SW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgICAgICBuZXdJbWcuc3JjID0gaW1nLmN1cnJlbnRTcmM7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSAwO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IDA7XG4gICAgICAgICAgICB3aWR0aCA9IHBhcnNlSW50KGltZy5uYXR1cmFsV2lkdGgpO1xuICAgICAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoaW1nLm5hdHVyYWxIZWlnaHQpO1xuICAgICAgICAgICAgbndpZHRoID0gcGFyc2VJbnQobmV3SW1nLndpZHRoKTtcbiAgICAgICAgICAgIG5oZWlnaHQgPSBwYXJzZUludChuZXdJbWcuaGVpZ2h0KTtcbiAgICAgICAgICAgIHdpZHRoID0gbndpZHRoID4gd2lkdGggPyBud2lkdGggOiB3aWR0aDtcbiAgICAgICAgICAgIGhlaWdodCA9IG5oZWlnaHQgPiBoZWlnaHQgPyBuaGVpZ2h0IDogaGVpZ2h0O1xuICAgICAgICAgICAgbmV3SW1nID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuYWRkSW1nKGltYWdlTWFuYWdlci5pbWFnZVR5cGUuSU1HLCBpbWcuY3VycmVudFNyYywgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgaW1ncyA9IGltYWdlTWFuYWdlci5xdWVyeVNlbGVjdG9yQWxsU2hhZG93cygnaW1nJyk7XG4gICAgICAgIGlmIChpbWdzICYmIGltZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdmFyIGltZyA9IGltZ3NbaV07XG4gICAgICAgICAgICAgIHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgbmV3SW1nLnNyYyA9IGltZy5jdXJyZW50U3JjO1xuICAgICAgICAgICAgICB2YXIgd2lkdGggPSAwO1xuICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgICAgd2lkdGggPSBwYXJzZUludChpbWcubmF0dXJhbFdpZHRoKTtcbiAgICAgICAgICAgICAgaGVpZ2h0ID0gcGFyc2VJbnQoaW1nLm5hdHVyYWxIZWlnaHQpO1xuICAgICAgICAgICAgICBud2lkdGggPSBwYXJzZUludChuZXdJbWcud2lkdGgpO1xuICAgICAgICAgICAgICBuaGVpZ2h0ID0gcGFyc2VJbnQobmV3SW1nLmhlaWdodCk7XG4gICAgICAgICAgICAgIHdpZHRoID0gbndpZHRoID4gd2lkdGggPyBud2lkdGggOiB3aWR0aDtcbiAgICAgICAgICAgICAgaGVpZ2h0ID0gbmhlaWdodCA+IGhlaWdodCA/IG5oZWlnaHQgOiBoZWlnaHQ7XG4gICAgICAgICAgICAgIG5ld0ltZyA9IG51bGw7XG4gICAgICAgICAgICAgIHRoaXMuYWRkSW1nKGltYWdlTWFuYWdlci5pbWFnZVR5cGUuSU1HLCBpbWcuY3VycmVudFNyYywgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBleHBlcmltZW50YWwgZmVhdHVyZSBsZXRzIGNhdGNoIGV2ZXJ5dGhpbmdcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNvdXJjZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc291cmNlJyk7XG4gICAgICBpZiAoc291cmNlcyAmJiBzb3VyY2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgICAgICBpZiAoIXNvdXJjZS5zcmNzZXQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIG5ld0ltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgbmV3SW1nLnNyYyA9IHNvdXJjZS5zcmNzZXQ7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUludChuZXdJbWcubmF0dXJhbFdpZHRoKTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludChuZXdJbWcubmF0dXJhbEhlaWdodCk7XG4gICAgICAgICAgICBud2lkdGggPSBwYXJzZUludChuZXdJbWcud2lkdGgpO1xuICAgICAgICAgICAgbmhlaWdodCA9IHBhcnNlSW50KG5ld0ltZy5oZWlnaHQpO1xuICAgICAgICAgICAgd2lkdGggPSBud2lkdGggPiB3aWR0aCA/IG53aWR0aCA6IHdpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0gbmhlaWdodCA+IGhlaWdodCA/IG5oZWlnaHQgOiBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLmFkZEltZyhpbWFnZU1hbmFnZXIuaW1hZ2VUeXBlLklNRywgbmV3SW1nLnNyYywgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICBuZXdJbWcgPSBudWxsO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3Jjc2V0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZ1tzcmNzZXRdJyk7XG4gICAgICBpZiAoc3Jjc2V0cyAmJiBzcmNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcmNzZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBpbWcgPSBzcmNzZXRzW2ldO1xuICAgICAgICAgICAgaWYgKCFpbWcuc3Jjc2V0KSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IHNyY3NldCA9IGltZy5zcmNzZXQuc3BsaXQoJywgJyk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNyY3NldC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBzcmMgPSBzcmNzZXRbal07XG4gICAgICAgICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZygwLCBzcmMuaW5kZXhPZignICcpICE9IC0xID8gc3JjLmluZGV4T2YoJyAnKSA6IHNyYy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICBuZXdJbWcuc3JjID0gc3JjO1xuICAgICAgICAgICAgICAgIHNyYyA9IG5ld0ltZy5zcmM7XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VJbnQobmV3SW1nLm5hdHVyYWxXaWR0aCk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KG5ld0ltZy5uYXR1cmFsSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBud2lkdGggPSBwYXJzZUludChuZXdJbWcud2lkdGgpO1xuICAgICAgICAgICAgICAgIG5oZWlnaHQgPSBwYXJzZUludChuZXdJbWcuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB3aWR0aCA9IG53aWR0aCA+IHdpZHRoID8gbndpZHRoIDogd2lkdGg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gbmhlaWdodCA+IGhlaWdodCA/IG5oZWlnaHQgOiBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgbmV3SW1nID0gbnVsbDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgYWRkaW5nIGltZyBmcm9tIHNyY3NldDogJHtzcmN9IHc6ICR7d2lkdGh9IGg6JHtoZWlnaHR9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5JTUcsIHNyYywgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjYW5ub3QgYWRkIGltYWdlIG9mIHNyY3NldDogJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlucHV0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5wdXQgPSBpbnB1dHNbaV07XG4gICAgICAgIGNvbnN0IHsgdHlwZSB9ID0gaW5wdXQ7XG4gICAgICAgIGlmICh0eXBlLnRvVXBwZXJDYXNlKCkgPT0gJ0lNQUdFJykge1xuICAgICAgICAgIHZhciB7IHNyYyB9ID0gaW5wdXQ7XG4gICAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5JTlBVVF9JTUcsIHNyYywgMCwgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpbmtzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbGluayA9IGxpbmtzW2ldO1xuICAgICAgICBjb25zdCB7IGhyZWYgfSA9IGxpbms7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBocmVmLmVuZHNXaXRoKCcuanBnJykgfHxcbiAgICAgICAgICBocmVmLmVuZHNXaXRoKCcuanBlZycpIHx8XG4gICAgICAgICAgaHJlZi5lbmRzV2l0aCgnLmJtcCcpIHx8XG4gICAgICAgICAgaHJlZi5lbmRzV2l0aCgnLmljbycpIHx8XG4gICAgICAgICAgaHJlZi5lbmRzV2l0aCgnLmdpZicpIHx8XG4gICAgICAgICAgaHJlZi5lbmRzV2l0aCgnLnBuZycpXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMuYWRkSW1nKGltYWdlTWFuYWdlci5pbWFnZVR5cGUuTElOSywgaHJlZiwgMCwgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IHN2Z3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3ZnJyk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN2Z3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc3ZnID0gc3Znc1tpXTtcbiAgICAgICAgY29uc3Qgc3ZnU3RyaW5nID0gZ2V0Q29tcGxldGVTVkdTdHJpbmcoc3ZnKTtcbiAgICAgICAgY29uc3QgZGF0YVVybCA9IHN2Z1RvQmFzZTY0KHN2Z1N0cmluZyk7XG4gICAgICAgIHRoaXMuYWRkSW1nKGltYWdlTWFuYWdlci5pbWFnZVR5cGUuREFUQVVSTCwgZGF0YVVybCwgMCwgMCk7XG4gICAgICB9XG4gICAgICBsZXQgdXJsO1xuICAgICAgbGV0IEIgPSBbXTtcbiAgICAgIGxldCBBID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKTtcbiAgICAgIEEgPSBCLnNsaWNlLmNhbGwoQSwgMCwgQS5sZW5ndGgpO1xuICAgICAgd2hpbGUgKEEubGVuZ3RoKSB7XG4gICAgICAgIHVybCA9IGltYWdlTWFuYWdlci5kZWVwQ3NzKEEuc2hpZnQoKSwgJ2JhY2tncm91bmQtaW1hZ2UnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodXJsICYmIHVybCAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgIHZhciByZSA9IC91cmxcXChbJ1wiXT8oW15cIildKykvZztcbiAgICAgICAgICAgIHZhciBtYXRjaGVzO1xuICAgICAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gcmUuZXhlYyh1cmwpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHZhciBzcmMgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICBpZiAoc3JjICYmIGltYWdlTWFuYWdlci5hcnJheUluZGV4T2YoQiwgc3JjKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICBuZXdJbWcuc3JjID0gc3JjO1xuICAgICAgICAgICAgICAgIHNyYyA9IG5ld0ltZy5zcmM7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5CQUNLR1JPVU5ELCBzcmMsIDAsIDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignY2Fubm90IGFkZCBpbWFnZSBiYWNrZ3JvdW5kLWltYWdlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdXJsLCAoQiA9IFtdKSwgKEEgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpKTtcbiAgICAgIEEgPSBCLnNsaWNlLmNhbGwoQSwgMCwgQS5sZW5ndGgpO1xuICAgICAgd2hpbGUgKEEubGVuZ3RoKSB7XG4gICAgICAgIHVybCA9IGltYWdlTWFuYWdlci5kZWVwQ3NzKEEuc2hpZnQoKSwgJ2JhY2tncm91bmQnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodXJsICYmIHVybCAhPSAnbm9uZScpIHtcbiAgICAgICAgICAgIHZhciByZSA9IC91cmxcXChbJ1wiXT8oW15cIildKykvZztcbiAgICAgICAgICAgIHZhciBtYXRjaGVzO1xuICAgICAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gcmUuZXhlYyh1cmwpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHZhciBzcmMgPSBtYXRjaGVzWzFdO1xuICAgICAgICAgICAgICBpZiAoc3JjICYmIGltYWdlTWFuYWdlci5hcnJheUluZGV4T2YoQiwgc3JjKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdJbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICBuZXdJbWcuc3JjID0gc3JjO1xuICAgICAgICAgICAgICAgIHNyYyA9IG5ld0ltZy5zcmM7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5CQUNLR1JPVU5ELCBzcmMsIDAsIDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignY2Fubm90IGFkZCBpbWFnZSBiYWNrZ3JvdW5kLWltYWdlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVybHMgPSBkb2N1bWVudC5ib2R5LmlubmVySFRNTFxuICAgICAgICAgIC5tYXRjaCgvaHR0cHM/OlxcL1xcLyh3d3dcXC4pP1stYS16QS1aMC05QDolLl9cXCt+Iz1dezIsMjU2fVxcLlthLXpdezIsNH1cXGIoWy1hLXpBLVowLTlAOiVfXFwrLn4jPy8vPV0qKS9naSlcbiAgICAgICAgICAuZmlsdGVyKChpdG0sIGksIGEpID0+IGkgPT0gYS5pbmRleE9mKGl0bSkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVybHMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdXJsc1tpXS5tYXRjaChcbiAgICAgICAgICAgICAgLy4qKFxcLnBuZ3xcXC5zdmd8XFwuanBnfFxcLmdpZnxcXC5qcGVnfFxcLmJtcHxcXC5pY298XFwud2VicHxcXC50aWZ8XFwuYXBuZ3xcXC5qZmlmfFxcLnBqcGVnfFxcLnBqcCkuKi9pLFxuICAgICAgICAgICAgKSAhPSBudWxsXG4gICAgICAgICAgKVxuICAgICAgICAgICAgdGhpcy5hZGRJbWcoaW1hZ2VNYW5hZ2VyLmltYWdlVHlwZS5MSU5LLCB1cmxzW2ldLCAwLCAwKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGdldEltYWdlcyBlcnJvciByZXRyZWl2aW5nIGltYWdlcyBieSB1cmw6ICR7ZX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIG1vdmUgcG9wdXAgaW50byBodG1sIG9mIHRoZSBwYWdlXG4gICAgICAvKiBodHRwczovL2dpdGh1Yi5jb20vbWl0Y2hhcy9LZXlmcmFtZXMuYXBwL3RyZWUvbWFzdGVyL0tleWZyYW1lcy5hcHAlMjAoRXh0ZW5zaW9uKS9qc1xuICAgICQuZ2V0KGNocm9tZS5leHRlbnNpb24uZ2V0VVJMKCdwb3B1cC5odG1sJyksIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQoZGF0YSk7XG4gICAgfSk7XG4gICAgKi9cbiAgICAgIHJldHVybiB0aGlzLmltZ0xpc3Q7XG4gICAgfSxcbiAgICBhZGRJbWcoZCwgZiwgYywgYSkge1xuICAgICAgdGhpcy5pbWdMaXN0LnB1c2goe1xuICAgICAgICB0eXBlOiBkLFxuICAgICAgICBzcmM6IGYsXG4gICAgICAgIHdpZHRoOiBjLFxuICAgICAgICBoZWlnaHQ6IGEsXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGdldFVuaXF1ZUltYWdlc1NyY3MoKSB7XG4gICAgICBjb25zdCBpbWFnZXMgPSBpbWFnZU1hbmFnZXIuZ2V0SW1hZ2VzKCk7XG4gICAgICBjb25zdCBpbWFnZXNTdHJBcnJheSA9IG5ldyBBcnJheSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaW1hZ2VzU3RyQXJyYXlbaW1hZ2VzU3RyQXJyYXkubGVuZ3RoXSA9IGltYWdlc1tpXS5zcmM7XG4gICAgICB9XG4gICAgICBjb25zdCB1bmlxdWVzID0gaW1hZ2VzU3RyQXJyYXlcbiAgICAgICAgLnJldmVyc2UoKVxuICAgICAgICAuZmlsdGVyKChlLCBpLCBhcnIpID0+IGFyci5pbmRleE9mKGUsIGkgKyAxKSA9PT0gLTEpXG4gICAgICAgIC5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gdW5pcXVlcztcbiAgICB9LFxuICAgIGRlZXBDc3Mod2hvLCBjc3MpIHtcbiAgICAgIGlmICghd2hvIHx8ICF3aG8uc3R5bGUpIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHN0eSA9IGNzcy5yZXBsYWNlKC9cXC0oW2Etel0pL2csIChhLCBiKSA9PiBiLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgaWYgKHdoby5jdXJyZW50U3R5bGUpIHtcbiAgICAgICAgcmV0dXJuIHdoby5zdHlsZVtzdHldIHx8IHdoby5jdXJyZW50U3R5bGVbc3R5XSB8fCAnJztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGR2ID0gZG9jdW1lbnQuZGVmYXVsdFZpZXcgfHwgd2luZG93O1xuICAgICAgcmV0dXJuIHdoby5zdHlsZVtzdHldIHx8IGR2LmdldENvbXB1dGVkU3R5bGUod2hvLCAnJykuZ2V0UHJvcGVydHlWYWx1ZShjc3MpIHx8ICcnO1xuICAgIH0sXG4gICAgYXJyYXlJbmRleE9mKGFycmF5LCB3aGF0LCBpbmRleCkge1xuICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuICAgICAgY29uc3QgTCA9IGFycmF5Lmxlbmd0aDtcbiAgICAgIHdoaWxlIChpbmRleCA8IEwpIHtcbiAgICAgICAgaWYgKGFycmF5W2luZGV4XSA9PT0gd2hhdCkgcmV0dXJuIGluZGV4O1xuICAgICAgICArK2luZGV4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH0sXG4gICAgcXVlcnlTZWxlY3RvckFsbFNoYWRvd3Moc2VsZWN0b3IsIGVsID0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgLy8gcmVjdXJzZSBvbiBjaGlsZFNoYWRvd3NcbiAgICAgIGNvbnN0IGNoaWxkU2hhZG93cyA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbCgnKicpKVxuICAgICAgICAubWFwKGVsID0+IGVsLnNoYWRvd1Jvb3QpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG5cbiAgICAgIC8vIGNvbnNvbGUubG9nKCdbcXVlcnlTZWxlY3RvckFsbFNoYWRvd3NdJywgc2VsZWN0b3IsIGVsLCBgKCR7Y2hpbGRTaGFkb3dzLmxlbmd0aH0gc2hhZG93Um9vdHMpYCk7XG5cbiAgICAgIGNvbnN0IGNoaWxkUmVzdWx0cyA9IGNoaWxkU2hhZG93cy5tYXAoY2hpbGQgPT4gaW1hZ2VNYW5hZ2VyLnF1ZXJ5U2VsZWN0b3JBbGxTaGFkb3dzKHNlbGVjdG9yLCBjaGlsZCkpO1xuXG4gICAgICAvLyBmdXNlIGFsbCByZXN1bHRzIGludG8gc2luZ3VsYXIsIGZsYXQgYXJyYXlcbiAgICAgIGNvbnN0IHJlc3VsdCA9IEFycmF5LmZyb20oZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoY2hpbGRSZXN1bHRzKS5mbGF0KCk7XG4gICAgfSxcbiAgfTtcblxuICBjb25zdCByZXN1bHQgPSB7XG4gICAgaW1hZ2VzOiBpbWFnZU1hbmFnZXIuZ2V0VW5pcXVlSW1hZ2VzU3JjcygpLFxuICAgIHRpdGxlOiBkb2N1bWVudC50aXRsZSxcbiAgICBpc1RvcDogd2luZG93LnRvcCA9PSB3aW5kb3cuc2VsZixcbiAgICBvcmlnaW46IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4sXG4gIH07XG5cbiAgdHJ5IHtcbiAgICByZXN1bHQuaXNBcmMgPSBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZSgnLS1hcmMtcGFsZXR0ZS10aXRsZScpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW1wdHkgc3RyaW5nXG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufSkoKTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==