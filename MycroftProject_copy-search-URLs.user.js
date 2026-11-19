// ==UserScript==
// @name        Copy search URL for Mycroft Project
// @version     1.0
// @description Adds a button to search engine install pages on Mycroft Project to easily copy the search URL to the clipboard.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       https://mycroftproject.com/install-splash.php?id=*
// @run-at      document-start
// @grant       GM_setClipboard
// @grant       GM_addStyle
// @icon        https://www.google.com/s2/favicons?domain=mycroftproject.com
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
    body.extractor-overlay-open {
      user-select: none;
    }
    .extractor-container {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.75em;
    }
    .extractor-wrapper {
      position: relative;
      display: inline-block;
    }
    .split-button-container {
      display: inline-flex;
      vertical-align: middle;
    }
    .extractor-btn {
      padding: 0.5em 1em;
      text-align: center;
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
      border: 1px solid #7a0000;
      background-color: #970000;
      color: #fff;
      font-size: 0.9rem;
      user-select: none;
    }
    .extractor-btn:hover {
      background-color: #7a0000;
    }
    .extractor-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: #970000;
    }
    .copy-btn {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      border-right: none;
    }
    .dropdown-arrow-btn {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      padding: 0.5em 0.6em;
      border-left: 1px solid rgba(0, 0, 0, 0.2);
    }
    .url-overlay {
      display: none;
      position: absolute;
      width: max-content;
      max-width: 450px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 100;
      border-radius: 4px;
      border: 1px solid #ddd;
      margin-top: 5px;
      padding: 0.6em 0.8em;
      background-color: #f9f9f9;
      font-family: monospace;
      font-size: small;
	  font-weight: normal;
      color: #333;
      word-break: break-all;
      box-sizing: border-box;
      user-select: text;
    }
    .url-overlay.show {
      display: block;
    }
  `);

  window.addEventListener('load', () => {
    const mainContent = document.querySelector('#maincontent');
    if (!mainContent) { return; }

    const container = document.createElement('div');
    container.className = 'extractor-container';

    const searchLinkElements = document.querySelectorAll('link[rel="search"][type="application/opensearchdescription+xml"]');
    let enginesFound = 0;

    const h1 = mainContent.querySelector('h1');
    if (h1) {
      h1.style.display = 'flex';
      h1.style.alignItems = 'center';
      h1.style.gap = '1em';
      h1.appendChild(container);
    } else {
      mainContent.prepend(container);
    }

    searchLinkElements.forEach(linkEl => {
      const engineTitle = linkEl.getAttribute('title') || '';
      if (engineTitle.toLowerCase().includes('mycroft')) {
        return;
      }

      enginesFound++;
      const xmlUrl = new URL(linkEl.getAttribute('href'), window.location.href).href;

      fetch(xmlUrl)
        .then(response => response.text())
        .then(xmlText => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "application/xml");
          createEngineButton(xmlDoc, container);
        })
        .catch(error => console.error(`Extractor Error for ${engineTitle}:`, error));
    });

    if (enginesFound === 0) {
      container.remove();
    }
  });

  function createEngineButton(xmlDoc, container) {
    const urlElements = xmlDoc.querySelectorAll('Url[type="text/html"]');
    if (urlElements.length === 0) { return; }

    urlElements.forEach(urlEl => {
      const template = urlEl.getAttribute('template').replace(/{searchTerms}/g, '%s');
      const method = (urlEl.getAttribute('method') || 'GET').toUpperCase();

      const wrapper = document.createElement('div');
      wrapper.className = 'extractor-wrapper';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'split-button-container';

      const copyButton = document.createElement('div');
      copyButton.className = 'extractor-btn copy-btn';
      copyButton.setAttribute('role', 'button');
      copyButton.tabIndex = 0;

      const dropdownButton = document.createElement('div');
      dropdownButton.className = 'extractor-btn dropdown-arrow-btn';
      dropdownButton.textContent = '▾';
      dropdownButton.setAttribute('role', 'button');
      dropdownButton.tabIndex = 0;

      const urlOverlay = document.createElement('div');
      urlOverlay.className = 'url-overlay';

      const copyText = (method === 'POST')
        ? `curl -X POST --data "${Array.from(urlEl.querySelectorAll('Param')).map(p => `${p.getAttribute('name')}=${p.getAttribute('value').replace(/{searchTerms}/g, '%s')}`).join('&')}" "${template}"`
        : template;

      copyButton.textContent = (method === 'POST') ? 'Copy POST cURL' : 'Copy Search URL';
      urlOverlay.textContent = copyText;

      const handleCopy = () => {
        if (copyButton.classList.contains('disabled')) return;

        GM_setClipboard(copyText);
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('disabled');
        dropdownButton.classList.add('disabled');

        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.classList.remove('disabled');
          dropdownButton.classList.remove('disabled');
        }, 1500);
      };

      copyButton.addEventListener('click', handleCopy);
      copyButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy();
        }
      });

      const handleToggle = (e) => {
        e.stopPropagation();
        const currentlyVisible = document.querySelector('.url-overlay.show');
        if (currentlyVisible && currentlyVisible !== urlOverlay) {
          currentlyVisible.classList.remove('show');
        }
        urlOverlay.classList.toggle('show');

        if (urlOverlay.classList.contains('show')) {
          document.body.classList.add('extractor-overlay-open');
        } else {
          document.body.classList.remove('extractor-overlay-open');
        }
      };

      dropdownButton.addEventListener('click', handleToggle);
      dropdownButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle(e);
        }
      });

      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(dropdownButton);
      wrapper.appendChild(buttonContainer);
      wrapper.appendChild(urlOverlay);
      container.appendChild(wrapper);

      const buttonWidth = buttonContainer.offsetWidth;
      urlOverlay.style.minWidth = `${buttonWidth}px`;
    });
  }

  document.addEventListener('click', (e) => {
    const openOverlay = document.querySelector('.url-overlay.show');
    if (openOverlay && !openOverlay.parentElement.contains(e.target)) {
      openOverlay.classList.remove('show');
      document.body.classList.remove('extractor-overlay-open');
    }
  });
})();