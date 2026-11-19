// ==UserScript==
// @name        Etsy - Open links in current tab
// @version     1.0
// @description Force links on Etsy to open in the same tab by removing the target attribute.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://*.etsy.com/*
// @run-at      document-start
// @grant       none
// @icon        https://www.etsy.com/favicon.ico
// ==/UserScript==

(function () {
  'use strict';

  const fixLinks = () => {
    // Find any 'a' tag that has a 'target' attribute, regardless of its value
    document.querySelectorAll('a[target]').forEach(link => {
      link.removeAttribute('target');
    });
  };

  const observer = new MutationObserver(fixLinks);

  const config = {
    childList: true,
    subtree: true
  };

  const attachObserver = () => {
    if (document.body) {
      observer.observe(document.body, config);
      fixLinks();
    } else {
      setTimeout(attachObserver, 100);
    }
  };

  attachObserver();
})();