import assert from 'node:assert/strict';
import { translations, getTranslation } from './index';
import { languageNames } from '../context/LanguageContext';
import { en } from './en';
import { kn } from './kn';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';

console.log('Running i18n dictionary, completeness, and interpolation tests...');

// 1. Verify all 5 supported languages are present
const expectedLangs = ['en', 'kn', 'hi', 'ta', 'te'] as const;
for (const lang of expectedLangs) {
  assert.ok(translations[lang], `Language '${lang}' must be defined in translations dictionary`);
}
assert.equal(Object.keys(languageNames).length, 5, 'Must have exactly 5 supported languages');
assert.deepEqual(Object.keys(translations).sort(), ['en', 'hi', 'kn', 'ta', 'te']);

// 2. Verify all dictionaries have complete top-level categories
const requiredSections = [
  'common',
  'nav',
  'hero',
  'trust',
  'catalog',
  'productModal',
  'cart',
  'checkout',
  'orders',
  'auth',
  'merchant',
  'chat',
  'recommendations',
  'testimonials',
  'faqs',
  'footer',
] as const;

for (const lang of expectedLangs) {
  const dict = translations[lang];
  for (const section of requiredSections) {
    assert.ok(
      dict[section],
      `Language '${lang}' missing top-level section: '${section}'`
    );
  }
}

// 3. Test getTranslation with interpolation
const itemCountKn = getTranslation('kn', 'cart.itemsCount', { count: 3 });
assert.equal(itemCountKn, '3 ಐಟಂಗಳು ಆಯ್ಕೆಯಾಗಿವೆ', 'Should interpolate {count} into Kannada template');

const itemCountHi = getTranslation('hi', 'cart.itemsCount', { count: 5 });
assert.equal(itemCountHi, '5 आइटम चुने गए', 'Should interpolate {count} into Hindi template');

const itemCountTa = getTranslation('ta', 'cart.itemsCount', { count: 2 });
assert.equal(itemCountTa, '2 பொருட்கள் தேர்ந்தெடுக்கப்பட்டன', 'Should interpolate {count} into Tamil template');

const itemCountTe = getTranslation('te', 'cart.itemsCount', { count: 4 });
assert.equal(itemCountTe, '4 అంశాలు ఎంచుకోబడ్డాయి', 'Should interpolate {count} into Telugu template');

// 4. Test translations across all 5 languages
const enNavCatalog = getTranslation('en', 'nav.buyerDiscovery');
assert.equal(enNavCatalog, 'Buyer Discovery');

const knNavCatalog = getTranslation('kn', 'nav.buyerDiscovery');
assert.equal(knNavCatalog, 'ಖರೀದಿದಾರರ ಅನ್ವೇಷಣೆ');

const hiNavCatalog = getTranslation('hi', 'nav.buyerDiscovery');
assert.equal(hiNavCatalog, 'ग्राहक खोज');

const taNavCatalog = getTranslation('ta', 'nav.buyerDiscovery');
assert.equal(taNavCatalog, 'வாங்குபவர் தேடல்');

const teNavCatalog = getTranslation('te', 'nav.buyerDiscovery');
assert.equal(teNavCatalog, 'కొనుగోలుదారుల అన్వేషణ');

// 5. Test fallback to English or humanized title when a nonexistent key is requested in non-English
const fallbackTest = getTranslation('kn', 'nav.nonExistentKey');
assert.equal(fallbackTest, 'Non Existent Key', 'Should return humanized string if missing in both lang and en');

// 6. Test AI chat greetings across all languages
assert.ok(getTranslation('en', 'chat.initialGreetingBuyer').includes('SellPilot AI'));
assert.ok(getTranslation('kn', 'chat.initialGreetingBuyer').includes('SellPilot AI'));
assert.ok(getTranslation('hi', 'chat.initialGreetingBuyer').includes('SellPilot AI'));
assert.ok(getTranslation('ta', 'chat.initialGreetingBuyer').includes('SellPilot AI'));
assert.ok(getTranslation('te', 'chat.initialGreetingBuyer').includes('SellPilot AI'));

// 7. Verify Manrope typography and script compatibility (scripts are valid non-empty Unicode strings)
assert.ok(kn.hero.badge.length > 0);
assert.ok(hi.hero.badge.length > 0);
assert.ok(ta.hero.badge.length > 0);
assert.ok(te.hero.badge.length > 0);

console.log('✓ All i18n translation completeness, fallback, and interpolation tests passed!');
