self.addEventListener('install', function (event) {});

self.addEventListener('activate', function (event) {});

self.addEventListener('fetch', function (event) {
  // console.log('Произведен запрос', event.request.url);
  // Можно добавить здесь логику кэширования ресурсов и обработки событий сети
});

try {
  importScripts('bundle/js/common.js', 'bundle/js/background.js', 'bundleAngular/backgroundAngular.js');
} catch (e) {
  console.error(e);
}
