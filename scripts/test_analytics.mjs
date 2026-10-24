import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('./site.js', import.meta.url), 'utf8');

function startPage(savedChoice, footerNavCount = 1) {
  const appended = [];
  const footerNavs = Array.from({ length: footerNavCount }, () => ({
    children: [],
    append(element) { this.children.push(element); },
  }));
  const listeners = {};
  const bannerListeners = {};
  const privacyLink = { href: 'https://example.test/ironveil-site/privacy/' };
  const document = {
    title: 'Ironveil',
    referrer: '',
    currentScript: { src: 'https://example.test/ironveil-site/assets/js/site-a1b2c3d4.js' },
    documentElement: { classList: { add() {} } },
    head: { append(element) { appended.push(element); } },
    body: { append(element) { appended.push(element); } },
    createElement(tagName) {
      return {
        tagName,
        hidden: false,
        setAttribute() {},
        addEventListener(name, listener) {
          if (tagName === 'section') bannerListeners[name] = listener;
        },
        querySelector() { return { focus() {} }; },
      };
    },
    querySelector(selector) {
      if (selector === '.site-footer nav a[href*="privacy"]') return privacyLink;
      if (selector === '.site-footer nav') return footerNavs[0] || null;
      return null;
    },
    querySelectorAll(selector) {
      return selector === '.site-footer nav' ? footerNavs : [];
    },
    addEventListener(name, listener) { listeners[name] = listener; },
  };
  const window = {
    matchMedia() { return { matches: true }; },
  };
  const localStorage = {
    getItem() { return savedChoice; },
    setItem(_key, value) { savedChoice = value; },
  };
  const context = {
    window,
    document,
    localStorage,
    location: { pathname: '/ironveil-site/release/', href: 'https://example.test/ironveil-site/release/' },
    URL,
    URLSearchParams,
    Date,
  };
  vm.runInNewContext(source, context);
  return {
    appended,
    window,
    banner: appended.find((item) => item.tagName === 'section'),
    privacyLink,
    footerNavs,
    clickConsent(value) {
      bannerListeners.click({
        target: { closest: () => ({ dataset: { consent: value } }) },
      });
    },
  };
}

const undecided = startPage(null);
assert.equal(undecided.banner.hidden, false, 'new visitors should see the consent prompt');
assert.ok(undecided.banner.innerHTML.includes(`href="${undecided.privacyLink.href}"`), 'the banner reuses the footer privacy destination under a repository subpath');

for (const footerNavCount of [1, 1, 1, 1, 1, 1, 2]) {
  const page = startPage(null, footerNavCount);
  const controls = page.footerNavs.map((nav) => nav.children.filter((child) => child.className === 'analytics-settings'));
  assert.equal(controls.flat().length, 1, 'every page receives exactly one settings control');
  assert.equal(controls[0][0].tagName, 'button', 'the settings control is a semantic keyboard-accessible button');
  assert.equal(controls[0][0].type, 'button');
  assert.equal(controls[0][0].textContent, 'Analytics settings', 'the settings control has an accessible name');
  assert.ok(controls.slice(1).every((siblings) => siblings.length === 0), 'additional footer navigations remain unchanged');
}
assert.equal(undecided.appended.some((item) => item.tagName === 'script'), false, 'no GA script request is made before consent');
undecided.clickConsent('rejected');
assert.equal(undecided.appended.some((item) => item.tagName === 'script'), false, 'rejecting analytics makes no GA script request');

const accepted = startPage(null);
accepted.clickConsent('accepted');
const gaScript = accepted.appended.find((item) => item.tagName === 'script');
assert.ok(gaScript, 'accepting analytics loads the GA script');
assert.equal(gaScript.src, 'https://www.googletagmanager.com/gtag/js?id=G-TVT4EJPXTV');
accepted.clickConsent('rejected');
accepted.clickConsent('accepted');
const consentUpdates = Array.from(accepted.window.dataLayer)
  .map((call) => Array.from(call))
  .filter(([command, action]) => command === 'consent' && action === 'update')
  .map(([, , settings]) => settings.analytics_storage);
assert.deepEqual(consentUpdates, ['granted', 'denied', 'granted'], 're-accepting after rejection restores analytics consent');
assert.equal(accepted.appended.filter((item) => item.tagName === 'script').length, 1, 're-accepting reuses the loaded GA script');

const remembered = startPage('accepted');
assert.ok(remembered.appended.some((item) => item.tagName === 'script'), 'a previously accepted choice loads GA on the next visit');

const rejectedBefore = startPage('rejected');
assert.equal(rejectedBefore.banner.hidden, true, 'a previously rejected choice keeps the prompt hidden');
assert.equal(rejectedBefore.appended.some((item) => item.tagName === 'script'), false, 'a previously rejected choice makes no GA script request');

console.log('Analytics consent behavior passed.');
