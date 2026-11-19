// ==UserScript==
// @name        Reddit Subreddit Wiki Button
// @version     1.0
// @description Adds a Wiki button to subreddit masthead between Join button and overflow menu
// @author	    MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       https://www.reddit.com/r/*
// @run-at      document-idle
// @icon		    https://www.redditstatic.com/shreddit/assets/favicon/192x192.png
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'wiki-button';

  function getSubredditName() {
    const match = window.location.pathname.match(/^\/r\/([^\/]+)/);
    return match ? match[1] : null;
  }

  function createWikiButton(subredditName) {
    const wikiUrl = `https://www.reddit.com/r/${subredditName}/wiki/index/`;

    const button = document.createElement('a');
    button.id = BUTTON_ID;
    button.href = wikiUrl;
    button.setAttribute('rpl', '');
    button.className = `
            no-underline hover:no-underline active:no-underline
            whitespace-nowrap nd:h-[40px] leading-[40px]
            button-medium ps-[var(--rem10)] pe-[var(--rem14)]
            button-bordered
            items-center justify-center
            button inline-flex
        `.replace(/\s+/g, ' ').trim();

    button.textContent = 'Wiki';

    return button;
  }

  function setButtonDisabled(button, disabled) {
    if (disabled) {
      button.style.opacity = '0.4';
      button.style.pointerEvents = 'none';
      button.removeAttribute('href');
      button.title = 'No wiki available for this subreddit';
    } else {
      button.style.opacity = '';
      button.style.pointerEvents = '';
      button.title = '';
    }
  }

  function checkWikiExists(subredditName, callback) {
    fetch(`/r/${subredditName}/wiki/index.json`, { credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) {
          return response.json()
            .then(json => ({ exists: false, reason: json?.reason }))
            .catch(() => ({ exists: false, reason: null }));
        }
        return response.json().then(json => {
          const content = json?.data?.content_md;
          const isWikiPage = json?.kind === 'wikipage';
          return { exists: isWikiPage && typeof content === 'string' && content.trim().length > 0 };
        });
      })
      .then(result => callback(result.exists, result.reason))
      .catch(() => callback(false, null));
  }

  function injectButton() {
    const subredditName = getSubredditName();
    if (!subredditName) return;

    const onWikiPage = /^\/r\/[^\/]+\/wiki(\/|$)/.test(window.location.pathname);

    const headerButtons = document.querySelector('shreddit-subreddit-header-buttons');
    if (!headerButtons) return;

    const createPostButton = document.querySelector('a[data-testid="create-post"]');
    if (createPostButton) {
      const textSpan = createPostButton.querySelector('.flex.items-center.gap-xs');
      if (textSpan) textSpan.style.display = 'none';
      createPostButton.style.paddingLeft = 'var(--rem10)';
      createPostButton.style.paddingRight = 'var(--rem10)';
      createPostButton.style.minWidth = 'unset';
      const iconSpan = createPostButton.querySelector('.flex.me-xs');
      if (iconSpan) iconSpan.style.marginRight = '0';
    }

    const shadowRoot = headerButtons.shadowRoot;
    if (!shadowRoot) return;

    if (shadowRoot.getElementById(BUTTON_ID)) return;

    const flexContainer = shadowRoot.querySelector('.flex.items-center.gap-sm');
    if (!flexContainer) return;

    const overflowControl = flexContainer.querySelector('shreddit-subreddit-overflow-control');
    if (!overflowControl) return;

    const button = createWikiButton(subredditName);

    const wrapper = document.createElement('span');
    wrapper.id = BUTTON_ID + '-wrapper';
    wrapper.appendChild(button);

    flexContainer.insertBefore(wrapper, overflowControl);

    if (onWikiPage) {
      setButtonDisabled(button, true);
      button.title = '';
    } else {
      checkWikiExists(subredditName, function (exists, reason) {
        setButtonDisabled(button, !exists);
        if (!exists) {
          const messages = {
            WIKI_DISABLED: 'Wiki disabled by moderators',
            MAY_NOT_VIEW: 'Wiki is restricted',
            PAGE_NOT_CREATED: 'No wiki page exists'
          };
          button.title = messages[reason] || 'No wiki available for this subreddit';
        }
      });
    }
  }

  function init() {
    injectButton();

    const observer = new MutationObserver(function () {
      clearTimeout(observer.timeout);
      observer.timeout = setTimeout(injectButton, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    let lastUrl = location.href;
    new MutationObserver(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(injectButton, 500);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();