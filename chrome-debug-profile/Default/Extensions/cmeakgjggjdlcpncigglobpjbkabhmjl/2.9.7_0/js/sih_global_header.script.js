$J(function () {
  SIH_GLOBAL?.sihGlobalHeader?.navigationMenu?.loadNavigationMenu();

  const matchJoinPage = window.location.href.match(/steampowered.com\/join/);
  if (!matchJoinPage) SIH_GLOBAL?.sihGlobalHeader?.actionMenu?.LoadActionMenu();
  SIH_GLOBAL?.sihGlobalHeader?.adBanners?.RenderAdBanners().then(() => {
    SIH_GLOBAL?.sihGlobalHeader?.sihFeaturesHeader?.RenderHeaderSihFeaturesButton();
    SIH_GLOBAL?.sihGlobalHeader?.sihFeaturesLeftSide?.RenderLeftSideSihFeaturesMenu();
    SIH_GLOBAL?.sihGlobalHeader?.buttonUp?.RenderButtonUp();
  });
});
