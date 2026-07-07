const assert = require('assert');
const {
  loadCourseOfferings,
  validateCourseOfferings,
  getPublicOfferings
} = require('../../lib/course-offerings');

const loaded = loadCourseOfferings();
assert.strictEqual(loaded.validation.ok, true, loaded.validation.errors.join('\n'));

const publicData = getPublicOfferings(loaded);
assert.strictEqual(publicData.retake_policy.price, 3200);
assert.strictEqual(publicData.retake_policy.currency, 'TWD');
for (const offering of publicData.offerings) {
  if (offering.status === 'pending_confirmation') {
    assert.strictEqual(offering.date_time, null);
    assert.strictEqual(offering.end_date_time, null);
    assert.strictEqual(offering.price, null);
    assert.strictEqual(offering.venue, null);
    assert.strictEqual(offering.display_note, '待確認');
  }
  if (offering.status === 'available_now') {
    assert.strictEqual(offering.date_time, null);
    assert.strictEqual(offering.end_date_time, null);
    assert.notStrictEqual(offering.price, null);
    assert.strictEqual(offering.display_note, '可直接開通');
  }
  if (offering.status === 'date_confirmed_price_pending') {
    assert.ok(offering.date_time);
    assert.ok(offering.end_date_time);
    assert.strictEqual(offering.price, null);
    assert.strictEqual(offering.display_note, '日期已確認，金額待確認');
  }
}
assert(publicData.offerings.some((offering) => offering.course_name === '成交地圖' && offering.price === 11000));
assert(publicData.offerings.some((offering) => offering.course_name === '超級銷冠系統' && offering.price === null));

const invalidPending = JSON.parse(JSON.stringify(loaded));
invalidPending.offerings[0].status = 'pending_confirmation';
invalidPending.offerings[0].price = 12000;
const invalidPendingResult = validateCourseOfferings(invalidPending);
assert.strictEqual(invalidPendingResult.ok, false);
assert(invalidPendingResult.errors.some((error) => error.includes('pending offering cannot contain')));

const invalidConfirmed = JSON.parse(JSON.stringify(loaded));
invalidConfirmed.verified_by = 'PENDING_USER_CONFIRMATION';
invalidConfirmed.offerings[0].status = 'confirmed';
invalidConfirmed.offerings[0].date_time = '2026-08-01T09:00:00+08:00';
invalidConfirmed.offerings[0].end_date_time = '2026-08-01T18:00:00+08:00';
invalidConfirmed.offerings[0].price = 12000;
invalidConfirmed.offerings[0].currency = 'TWD';
invalidConfirmed.offerings[0].venue = '台北';
const invalidConfirmedResult = validateCourseOfferings(invalidConfirmed);
assert.strictEqual(invalidConfirmedResult.ok, false);
assert(invalidConfirmedResult.errors.some((error) => error.includes('cannot use pending verifier')));

console.log('PASS\nCOURSE-OFFERINGS-SCHEMA: PASS\nPUBLIC-OFFERINGS: PASS\nRETAKE-POLICY: PASS\nPENDING-REDACTION: PASS\nAVAILABLE-NOW: PASS\nDATE-CONFIRMED-PRICE-PENDING: PASS\nINVALID-PENDING-COMMERCIAL-INFO: PASS\nCONFIRMED-REQUIRES-VERIFIER: PASS');
