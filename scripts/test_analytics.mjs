import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('./site.js', import.meta.url), 'utf8');

function startPage(savedChoice) {
  const appended = [];
  const listeners = {};
  const bannerListeners = {};
  const document = {
    title: 'Ironveil',
    referrer: '',
    currentScript: { src: 'https://example.test/ironveil-site/scripts/site.js' },
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
    querySelectorAll() { return []; },
    addEventListener(name, listener) { listeners[name] = listener; },
  };
  const window = {
    IRONVEIL_GA4_MEASUREMENT_ID: 'G-TEST123456',
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
    location: { pathname: '/ironveil-site/', href: 'https://example.test/ironveil-site/' },
    URL,
    URLSearchParams,
    Date,
  };
  vm.runInNewContext(source, context);
  return {
    appended,
    banner: appended.find((item) => item.tagName === 'section'),
    clickConsent(value) {
      bannerListeners.click({
        target: { closest: () => ({ dataset: { consent: value } }) },
      });
    },
  };
}

const undecided = startPage(null);
assert.equal(undecided.banner.hidden, false, 'new visitors should see the consent prompt');
assert.equal(undecided.appended.some((item) => item.tagName === 'script'), false, 'no GA script request is made before consent');
undecided.clickConsent('rejected');
assert.equal(undecided.appended.some((item) => item.tagName === 'script'), false, 'rejecting analytics makes no GA script request');

const accepted = startPage(null);
accepted.clickConsent('accepted');
const gaScript = accepted.appended.find((item) => item.tagName === 'script');
assert.ok(gaScript, 'accepting analytics loads the GA script');
assert.match(gaScript.src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TEST123456$/);

const remembered = startPage('accepted');
assert.ok(remembered.appended.some((item) => item.tagName === 'script'), 'a previously accepted choice loads GA on the next visit');

console.log('Analytics consent behavior passed.');
