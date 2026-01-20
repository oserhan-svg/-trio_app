if (IS_ENABLED_SIH) {
  $J(function () {
    SIH?.RefactorAdvancedSearchDialog();
    SIH?.LoadSteamAppFilters();
    SIH?.RenderCustomPagination();
    SIH?.RenderMarketSideBanner();
  });
}
