// ==UserScript==
// @name        Claude - Prevent keyoard hijacking
// @version     1.0
// @description Prevents Claude.ai from intercepting the Firefox keyboard shortcut Ctrl+Shift+I for opening the devtools.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://claude.ai/*
// @run-at      document-start
// @grant       none
// @icon        https://www.google.com/s2/favicons?domain=claude.ai
// ==/UserScript==

(function () {
  'use strict';

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.stopImmediatePropagation();
    }
  }, true);
})();