import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('./site.js', import.meta.url), 'utf8');

function startPage(savedChoice) {
  const appended = [];
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
        addEventListener(name, listener) { bannerListeners[name] = listener; },
        querySelector() { return { focus() {} }; },
      };
    },
    querySelector(selector) {
      return selector === '.site-footer nav a[href*="privacy"]' ? privacyLink : null;
    },
    querySelectorAll() { return []; },
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
