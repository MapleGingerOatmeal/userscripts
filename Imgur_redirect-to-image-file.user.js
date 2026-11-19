// ==UserScript==
// @name        Redirect imgur posts to direct image files
// @version     1.0
// @description Redirects Imgur post pages to the direct image file instead.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://imgur.com/*
// @run-at      document-start
// @grant       none
// @icon        https://s.imgur.com/images/favicon.png
// ==/UserScript==

(function() {
	'use strict';

	const m = location.pathname.match(/^\/([a-zA-Z0-9]{5,10})$/);
	if (m) {
		fetch(location.href)
			.then(r => r.text())
			.then(html => {
				const tag = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
				const url = tag && tag[0].match(/content=["']([^"']+)["']/i);
				if (url && new URL(url[1]).pathname.startsWith('/' + m[1] + '.')) {
					window.stop();
					location.replace(url[1].split('?')[0]);
				}
			});
	}
})();