/**
 * Shared clinic data + scheduling logic.
 * Used by both the local dev server and the Vercel serverless functions.
 */

const CLINIC = {
  name: {
    'ar-EG': 'عيادة أ.د. أسامة شعير',
    'ar-SA': 'عيادة أ.د. أسامة شعير',
    en: 'Prof. Osama Shaeer Clinic',
  },
  phone: '01229999120',
  whatsapp: '201229999120',
  address: {
    'ar-EG': 'مستشفى كمال شعير — مركز الخصوبة وأمراض الذكورة، 21 شارع جابر إبن حيان، الدقي، الجيزة',
    'ar-SA': 'مستشفى كمال شعير — مركز الخصوبة وأمراض الذكورة، 21 شارع جابر إبن حيان، الدقي، الجيزة',
    en: 'Kamal Shaeer Hospital — Fertility & Masculinity Diseases Center, 21 Gaber Ibn Hayan St., Dokki, Giza',
  },
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=Kamal+Shoair+Hospital+Fertility+and+Masculinity+Diseases+Center+Dokki+Giza',
  consentVersion: '2026-10-v1',
  // Clinic hours as published on alrijal.com/shop — Sunday, Tuesday and
  // Thursday, one to four in the afternoon, Cairo time.
  workingHours: { start: 13, end: 16 },
  workingDays: [0, 2, 4], // Sunday, Tuesday, Thursday
};

const SERVICES = [
  {
    id: '1',
    duration: 30,
    price: 1500,
    tag: 'popular',
    icon: 'stethoscope',
    name: {
      'ar-EG': 'كشف ذكورة — استشارة أولى',
      'ar-SA': 'كشف ذكورة — استشارة أولى',
      en: 'Andrology consultation — first visit',
    },
    desc: {
      'ar-EG': 'تقييم شامل وتاريخ مرضي وخطة علاج — للمرة الأولى.',
      'ar-SA': 'تقييم شامل وتاريخ مرضي وخطة علاج — لأول مرة.',
      en: 'Comprehensive assessment, medical history and a treatment plan — first visit.',
    },
  },
  {
    id: '2',
    duration: 20,
    price: 1000,
    icon: 'repeat',
    name: {
      'ar-EG': 'استشارة متابعة',
      'ar-SA': 'استشارة متابعة',
      en: 'Follow-up consultation',
    },
    desc: {
      'ar-EG': 'مراجعة النتائج وتعديل الخطة العلاجية للمرضى الحاليين.',
      'ar-SA': 'مراجعة النتائج وتعديل الخطة العلاجية للمرضى الحاليين.',
      en: 'Review results and adjust the treatment plan for existing patients.',
    },
  },
  {
    id: '3',
    duration: 45,
    price: 2500,
    icon: 'scan',
    name: {
      'ar-EG': 'استشارة جراحة الذكورة',
      'ar-SA': 'استشارة جراحة الذكورة',
      en: 'Surgical andrology consultation',
    },
    desc: {
      'ar-EG': 'تقييم ما قبل الجراحة — دعامة العضو الذكري أو تقوس القضيب أو دوالي الخصية.',
      'ar-SA': 'تقييم ما قبل الجراحة — دعامة العضو الذكري أو تقوس القضيب أو دوالي الخصية.',
      en: 'Pre-operative assessment — penile prosthesis, curvature correction or varicocele.',
    },
  },
  {
    id: '4',
    duration: 45,
    price: 2000,
    icon: 'cells',
    name: {
      'ar-EG': 'استشارة تأخر الإنجاب والحقن المجهري',
      'ar-SA': 'استشارة تأخر الإنجاب والحقن المجهري',
      en: 'Fertility & IVF consultation',
    },
    desc: {
      'ar-EG': 'تقييم أسباب تأخر الإنجاب وخطة العلاج أو الحقن المجهري.',
      'ar-SA': 'تقييم أسباب تأخر الإنجاب وخطة العلاج أو الحقن المجهري.',
      en: 'Evaluation of fertility causes and a treatment or IVF plan.',
    },
  },
  {
    id: '5',
    duration: 30,
    price: 2500,
    tag: 'new',
    icon: 'video',
    remote: true,
    name: {
      'ar-EG': 'استشارة عن بُعد (فيديو)',
      'ar-SA': 'استشارة عن بُعد (فيديو)',
      en: 'Video consultation',
    },
    desc: {
      'ar-EG': 'نفس الاستشارة من مكانك — عبر مكالمة فيديو آمنة.',
      'ar-SA': 'نفس الاستشارة من مكانك — عبر مكالمة فيديو آمنة.',
      en: 'The same consultation from home — via a secure video call.',
    },
  },
];

const PROVIDERS = [
  {
    id: '1',
    name: {
      'ar-EG': 'أ.د. أسامة كمال شعير',
      'ar-SA': 'أ.د. أسامة كمال شعير',
      en: 'Prof. Dr. Osama Kamal Shaeer',
    },
    serviceIds: ['1', '2', '3', '4', '5'],
  },
];

/* ── deterministic pseudo-randomness ── */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const pad = n => String(n).padStart(2, '0');

const toDateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* ── availability ── */

/** Is the clinic open on this weekday at all? */
function isWorkingDay(date) {
  return (CLINIC.workingDays || []).includes(date.getDay());
}

function buildSlots(serviceId, dateKey) {
  const service = SERVICES.find(s => s.id === String(serviceId));
  if (!service) return [];

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return [];
  if (!isWorkingDay(date)) return [];

  const slots = [];
  const { start, end } = CLINIC.workingHours;

  for (let minutes = start * 60; minutes + service.duration <= end * 60; minutes += 30) {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    const time = `${pad(hh)}:${pad(mm)}`;

    const r = hash(`${dateKey}|${serviceId}|${time}`);
    const load = r * 0.9 + (mm === 0 ? 0.12 : 0) + (hh >= 18 ? 0.15 : 0);
    if (load < 0.42) continue;

    slots.push({ time, provider_id: PROVIDERS[0].id });
  }

  return slots;
}

/* End of an appointment, derived from the service duration.

   The client must not be trusted to send end_datetime: a wrong value
   becomes a wrong slot length in the clinic's records. */
function slotEndTime(serviceId, time) {
  const service = SERVICES.find(s => s.id === String(serviceId));
  if (!service) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const total = h * 60 + m + service.duration;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function availableDates(serviceId, days = 21) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    out.push({
      date: key,
      available: buildSlots(serviceId, key).length,
      closed: !isWorkingDay(d),
    });
  }

  return out;
}

/* ── booking reference: no service, no specialty, nothing revealing ── */

function makeReference() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/* ── validation (returns an error code, the client translates it) ── */

function normalisePhone(value) {
  return String(value || '').replace(/[\s-]/g, '').replace(/^\+20/, '0');
}

function validateBooking(body) {
  const postData = body.post_data || {};
  const appointment = postData.appointment || {};
  const customer = postData.customer || {};

  if (!appointment.start_datetime || !appointment.service_id) return 'invalid_appointment';
  if (!SERVICES.some(s => s.id === String(appointment.service_id))) return 'invalid_service';
  if (!customer.first_name || String(customer.first_name).trim().length < 2) return 'invalid_name';
  if (!/^01[0-9]{9}$/.test(normalisePhone(customer.phone_number))) return 'invalid_phone';
  if (customer.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) return 'invalid_email';

  // Egypt PDPL art. 12 — explicit written consent is mandatory for health data.
  if (!body.consent || body.consent.accepted !== true) return 'consent_required';
  if (body.consent.version !== CLINIC.consentVersion) return 'consent_stale';

  return null;
}

module.exports = {
  CLINIC,
  SERVICES,
  PROVIDERS,
  buildSlots,
  slotEndTime,
  availableDates,
  makeReference,
  validateBooking,
  normalisePhone,
  toDateKey,
  isWorkingDay,
};
