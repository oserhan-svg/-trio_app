document.addEventListener('set-actual-code', (event) => {
  const actualCode = event.detail;

  for (const [key, value] of Object.entries(actualCode)) {
    window[key] = value;
  }
});
