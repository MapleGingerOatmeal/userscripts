// ==UserScript==
// @name        GitHub show all by default
// @version     1.1
// @description When navigating to any GitHub repository's Issues or Discussions pages, display all by default instead of filtering for is:open.
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       *://github.com/*
// @run-at      document-end
// @grant       none
// @icon        https://github.githubassets.com/favicons/favicon-dark.png
// ==/UserScript==

(function () {
	'use strict';

	const issuesDefault = '?q=sort%3Aupdated-desc+is%3Aissue+state%3Aopen+';
	const issuesTarget = '?q=is%3Aissue';
	const discussionsTarget = '?discussions_q=';

	function getRedirectUrl(urlHref) {
		try {
			const urlObj = new URL(urlHref, window.location.origin);

			if (urlObj.pathname.endsWith('/issues')) {
				if (urlObj.search === issuesDefault || urlObj.search === '') {
					return urlObj.pathname + issuesTarget;
				}
			}
			else if (urlObj.pathname.endsWith('/discussions')) {
				if (urlObj.search === '') {
					return urlObj.pathname + discussionsTarget;
				}
			}
			return null;
		} catch (e) {
			return null;
		}
	}

	function rewriteLinks() {
		const links = document.querySelectorAll('a[href]');
		links.forEach(link => {
			if (link.href.includes('/issues/new') || link.href.includes('/discussions/new')) return;

			const newUrl = getRedirectUrl(link.href);
			if (newUrl) {
				link.href = newUrl;
			}
		});
	}

	function checkCurrentPage() {
		const newUrl = getRedirectUrl(window.location.href);
		if (newUrl) {
			window.location.replace(newUrl);
		}
	}

	const observer = new MutationObserver(() => {
		rewriteLinks();
	});

	observer.observe(document.body, { childList: true, subtree: true });

	window.addEventListener('turbo:load', () => {
		checkCurrentPage();
		rewriteLinks();
	});

	checkCurrentPage();
	rewriteLinks();

})();