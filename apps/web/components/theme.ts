export const THEME_STORAGE_KEY = "lexnexus-theme";

export const themeInitScript = `
  (function () {
    try {
      var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
      var theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;
