(function () {
  "use strict";

  var inExtension = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

  function pageUrl(path) {
    if (inExtension) { return chrome.runtime.getURL(path); }
    return new URL("../" + path, window.location.href).href;
  }

  function openTab(url) {
    if (inExtension && chrome.tabs) {
      chrome.tabs.create({ url: url });
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  function openWindow(url) {
    if (inExtension && chrome.windows) {
      chrome.windows.create({ url: url, type: "popup", width: 430, height: 720 });
    } else {
      window.open(url, "_blank", "popup,width=430,height=720");
    }
  }

  document.querySelectorAll(".item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.dataset.mode === "tab") {
        openTab(btn.dataset.url);
      } else {
        openWindow(pageUrl(btn.dataset.page));
      }
      if (inExtension) { window.close(); }
    });
  });
})();