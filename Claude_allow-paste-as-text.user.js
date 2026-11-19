// ==UserScript==
// @name        Claude paste as text
// @version     1.0
// @description Allows for pasting longer text snippets directly into the chat input by bypassing the 4096-byte threshold that converts pasted text into an attachment card.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://claude.ai/*
// @run-at      document-idle
// @grant       none
// @icon        https://www.google.com/s2/favicons?domain=claude.ai
// ==/UserScript==

(function () {
  'use strict';

  document.addEventListener('paste', (e) => {
    const editor = document.querySelector('.tiptap.ProseMirror[data-testid="chat-input"]');
    if (!editor || !editor.contains(document.activeElement) && document.activeElement !== editor) return;

    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    // Only intercept pastes that would hit the 4096-byte threshold
    const size = new Blob([text]).size;
    if (size < 4096) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    editor.focus();
    // execCommand is deprecated but currently the only supported method to insert text
    document.execCommand('insertText', false, text);
  }, true);
})();