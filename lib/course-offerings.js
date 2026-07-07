const fs = require('fs');
const path = require('path');

const OFFERINGS_PATH = path.join(__dirname, '..', 'data', 'course-offerings.json');
const VALID_STATUSES = new Set([
  'pending_confirmation',
  'confirmed',
  'available_now',
  'date_confirmed_price_pending',
  'sold_out',
  'closed',
  'waitlist'
]);
const VALID_COURSES = new Set([
  'liuliang',
  'chengjiao',
  'zhizhi',
  'xiaolu',
  'yanzhi',
  'all_courses_package',
  'super_sales_kl'
]);
const VALID_REGIONS = new Set(['tw', 'my', 'online', 'other']);

function loadCourseOfferings(filePath = OFFERINGS_PATH) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const validation = validateCourseOfferings(raw);
  return {
    ...raw,
    validation,
    public_status: validation.ok ? 'valid' : 'invalid'
  };
}

function validateCourseOfferings(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['root must be object'] };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.updated_at || ''))) {
    errors.push('updated_at must be YYYY-MM-DD');
  }
  if (!data.verified_by) errors.push('verified_by is required');
  if (!data.retake_policy || typeof data.retake_policy !== 'object') {
    errors.push('retake_policy is required');
  } else {
    if (data.retake_policy.price !== 3200) errors.push('retake_policy price must be 3200');
    if (data.retake_policy.currency !== 'TWD') errors.push('retake_policy currency must be TWD');
    if (!data.retake_policy.note) errors.push('retake_policy note is required');
  }
  if (!Array.isArray(data.offerings)) errors.push('offerings must be array');

  for (const offering of data.offerings || []) {
    const prefix = `${offering.course_id || 'UNKNOWN'}:${offering.region || 'UNKNOWN'}`;
    if (!VALID_COURSES.has(offering.course_id)) errors.push(`${prefix} invalid course_id`);
    if (!VALID_REGIONS.has(offering.region)) errors.push(`${prefix} invalid region`);
    if (!VALID_STATUSES.has(offering.status)) errors.push(`${prefix} invalid status`);
    if (!offering.course_name) errors.push(`${prefix} course_name is required`);
    if (!String(offering.signup_url || '').startsWith('https://')) errors.push(`${prefix} signup_url must be https`);

    const hasAnyCommercialInfo = offering.date_time || offering.end_date_time || offering.price !== null || offering.early_bird_price !== null || offering.venue;
    if (offering.status === 'confirmed') {
      if (!offering.date_time) errors.push(`${prefix} confirmed offering requires date_time`);
      if (!offering.end_date_time) errors.push(`${prefix} confirmed offering requires end_date_time`);
      if (offering.price === null || offering.price === undefined) errors.push(`${prefix} confirmed offering requires price`);
      if (!offering.currency) errors.push(`${prefix} confirmed offering requires currency`);
      if (!offering.venue) errors.push(`${prefix} confirmed offering requires venue`);
      if (String(data.verified_by).includes('PENDING')) errors.push(`${prefix} confirmed offering cannot use pending verifier`);
    }
    if (offering.status === 'available_now') {
      if (offering.price === null || offering.price === undefined) errors.push(`${prefix} available_now offering requires price`);
      if (!offering.currency) errors.push(`${prefix} available_now offering requires currency`);
      if (!offering.venue) errors.push(`${prefix} available_now offering requires venue`);
      if (offering.date_time || offering.end_date_time) errors.push(`${prefix} available_now offering cannot contain scheduled date`);
    }
    if (offering.status === 'date_confirmed_price_pending') {
      if (!offering.date_time) errors.push(`${prefix} date_confirmed_price_pending offering requires date_time`);
      if (!offering.end_date_time) errors.push(`${prefix} date_confirmed_price_pending offering requires end_date_time`);
      if (offering.price !== null) errors.push(`${prefix} date_confirmed_price_pending offering cannot contain price`);
      if (offering.early_bird_price !== null) errors.push(`${prefix} date_confirmed_price_pending offering cannot contain early_bird_price`);
      if (!offering.venue) errors.push(`${prefix} date_confirmed_price_pending offering requires venue`);
      if (String(data.verified_by).includes('PENDING')) errors.push(`${prefix} date_confirmed_price_pending offering cannot use pending verifier`);
    }
    if (offering.status === 'pending_confirmation' && hasAnyCommercialInfo) {
      errors.push(`${prefix} pending offering cannot contain date/price/venue`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function getPublicOfferings(data) {
  const source = data || loadCourseOfferings();
  return {
    updated_at: source.updated_at,
    verified_by: source.verified_by,
    status_note: source.status_note,
    retake_policy: source.retake_policy,
    public_status: source.public_status || (source.validation && source.validation.ok ? 'valid' : 'invalid'),
    offerings: (source.offerings || []).map((offering) => {
      if (offering.status === 'pending_confirmation') {
        return {
          course_id: offering.course_id,
          course_name: offering.course_name,
          region: offering.region,
          status: offering.status,
          date_time: null,
          end_date_time: null,
          price: null,
          early_bird_price: null,
          currency: offering.currency || null,
          venue: null,
          signup_url: offering.signup_url,
          display_note: '待確認'
        };
      }
      if (offering.status === 'date_confirmed_price_pending') {
        return {
          course_id: offering.course_id,
          course_name: offering.course_name,
          region: offering.region,
          status: offering.status,
          date_time: offering.date_time,
          end_date_time: offering.end_date_time,
          price: null,
          early_bird_price: null,
          currency: offering.currency || null,
          venue: offering.venue,
          signup_url: offering.signup_url,
          display_note: '日期已確認，金額待確認'
        };
      }
      return {
        course_id: offering.course_id,
        course_name: offering.course_name,
        region: offering.region,
        status: offering.status,
        date_time: offering.date_time,
        end_date_time: offering.end_date_time,
        price: offering.price,
        early_bird_price: offering.early_bird_price,
        currency: offering.currency,
        venue: offering.venue,
        signup_url: offering.signup_url,
        display_note: offering.status === 'available_now' ? '可直接開通' : '已確認'
      };
    })
  };
}

module.exports = {
  loadCourseOfferings,
  validateCourseOfferings,
  getPublicOfferings
};
