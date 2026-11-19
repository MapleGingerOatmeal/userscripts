// ==UserScript==
// @name        Google Docs - Auto-hide Tabs sidebar
// @version     1.0
// @description Hide the Tabs sidebar in all Google Docs by default.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       https://docs.google.com/document/*
// @run-at      document-idle
// @grant       none
// @icon        https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico
// ==/UserScript==
(function () {
  'use strict';

  function hideSidebarIfVisible() {
    const sidebar = document.querySelector('.navigation-widget');
    if (!sidebar) return false;

    if (!sidebar.classList.contains('navigation-widget-hidden')) {
      const btn = document.querySelector('.navigation-widget-hat-close');
      if (btn) {
        const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
        const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
        btn.dispatchEvent(mouseDown);
        btn.dispatchEvent(mouseUp);
        return true;
      }
    }
    return false;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    if (hideSidebarIfVisible() || attempts++ > 10) {
      clearInterval(interval);
    }
  }, 300);
})();