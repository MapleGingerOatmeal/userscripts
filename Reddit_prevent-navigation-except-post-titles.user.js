// ==UserScript==
// @name        Reddit - Prevent navigation except for post titles
// @version     1.0
// @description Prevent clicks within the main Reddit feed from navigating to posts unless the post title is clicked directly.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://www.reddit.com/*
// @run-at      document-start
// @grant       GM_addStyle
// @icon        https://www.google.com/s2/favicons?domain=reddit.com
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
    shreddit-feed shreddit-post > a[slot="full-post-link"] {
      display: none !important;
    }
    shreddit-feed shreddit-post {
      cursor: default !important;
    }
    shreddit-feed shreddit-post a[slot="title"] {
      display: inline !important;
    }
    shreddit-feed shreddit-spoiler {
      pointer-events: auto !important;
    }
  `);

  document.addEventListener('click', e => {
    const path = e.composedPath();

    const postIndex = path.findIndex(el => el.tagName === 'SHREDDIT-POST');
    if (postIndex === -1) return;
    if (!path.some(el => el.tagName === 'SHREDDIT-FEED')) return;

    const beforePost = path.slice(0, postIndex);

    const spoiler = beforePost.find(el => el.tagName === 'SHREDDIT-SPOILER');
    if (spoiler) {
      e.preventDefault();
      const root = spoiler.shadowRoot;
      if (root && !root.querySelector('style[data-revealed-cursor]')) {
        const style = document.createElement('style');
        style.dataset.revealedCursor = '';
        style.textContent = '.outer.revealed { cursor: default !important; }';
        root.appendChild(style);
      }
      return;
    }

    const isInteractive = beforePost.some(el => {
      if (!el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'a' || tag === 'button') return true;
      if (el.getAttribute?.('role') === 'button') return true;
      return false;
    });

    if (isInteractive) return;

    e.stopPropagation();
    e.preventDefault();
  }, true);
})();