<h1 align="center">
    <br>
    <img src="https://raw.githubusercontent.com/alextselegidis/easyappointments/develop/logo.png" alt="Easy!Appointments" width="150">
    <br>
    DR-Osama-Shoier
    <br>
</h1>

<h4 align="center">
    نظام حجز مرضى <strong>مستشفى كمال شعير</strong> — مركز الخصوبة وأمراض الذكورة
</h4>

<p align="center">
  <img alt="License" src="https://img.shields.io/github/license/alextselegidis/easyappointments?style=for-the-badge">
  <img alt="Latest Release" src="https://img.shields.io/github/v/release/alextselegidis/easyappointments?style=for-the-badge">
</p>

<p align="center">
  <a href="#the-clinic-layer"><strong>طبقة العيادة</strong></a> •
  <a href="#quick-start"><strong>التشغيل</strong></a> •
  <a href="#structure"><strong>الهيكل</strong></a>
</p>

---

## عن المشروع

ريبو فيه **نظام حجز مرضى أونلاين** لإدارة عيادة **أ.د. أسامة كمال شعير** — أستاذ طب وجراحة
الذكورة بكلية الطب (القصر العيني)، جامعة القاهرة، رئيس جمعية الشرق الأوسط لطب الصحة الجنسية.

العمود الفقري هو **[Easy!Appointments](https://easyappointments.org)** v1.6.1 — مُستضاف ذاتيًا،
يعمل بـ PHP 8.2+ وMySQL، بـ REST API كامل و٤٠+ لغة. وفوقه طبقة `clinic/` فيها:

- **واجهة حجز عربية RTL + إنجليزية** — PWA كامل، mobile-first، قابل للتثبيت على الموبايل.
- **خصوصية من تصميمها** — «إشعارات سرّية» تزيل اسم العيادة والتخصص من كل رسالة تأكيد أو تذكير.
- **امتثال** — موافقة صريحة بنسخة وتاريخ لكل حجز (قانون حماية البيانات الشخصية المصري ١٥١/٢٠٢٠).
- **بحث وتسويق** — ملف تعريفي شامل بالأرقام والأسعار المنشورة ومواعيد العمل.

---

## The Clinic Layer

| الملف | المحتوى |
| --- | --- |
| **[`clinic/README.md`](clinic/README.md)** | ابدأ من هنا — نظرة عامة على طبقة العيادة |
| **[`clinic/research/دوسيه-أسامة-شعير.md`](clinic/research/دوسيه-أسامة-شعير.md)** | الملف التعريفي الشامل: المؤهلات، البحث العلمي، التقنيات المبتكرة، الأسعار، العيادة، الحضور الرقمي |
| **[`clinic/research/دوسيه-أسامة-شعير.html`](clinic/research/دوسيه-أسامة-شعير.html)** | نفس الملف كصفحة HTML جاهزة للطباعة |
| **[`clinic/RESEARCH-AND-RECOMMENDATION.md`](clinic/RESEARCH-AND-RECOMMENDATION.md)** | بحث السوق، مقارنة الخيارات، الالتزام القانوني، خطة التنفيذ |
| **[`clinic/DEPLOY.md`](clinic/DEPLOY.md)** | خطوات النشر على Vercel وإعدادات المشروع المطلوبة |
| **[`clinic/DEPLOY.md`](clinic/DEPLOY.md)** | خطوات النشر على Vercel |
| **[`clinic/prototype/`](clinic/prototype/)** | واجهة الحجز — الكود الكامل |

### المعاينة السريعة

```bash
node clinic/prototype/server.js
# http://localhost:4173
```

أو على الإنترنت: **https://prototype-shaeer.vercel.app**

الصفحات: **الرئيسية** · **الحجز** (٤ خطوات) · **العيادة** · **الخصوصية** — بثلاث لغات
(مصري · خليجي · إنجليزي) وليت/داكن.

---

## Quick Start

### البروتوتايب (واجهة الحجز)

```bash
cd clinic/prototype
npm install          # اختياري — jsdom لسطر الفحص السلوكي بس
npm run dev          # http://localhost:4173
```

### النشر على Vercel

المشروع منشور على **https://prototype-shaeer.vercel.app**.
إعدادات Vercel **لازم** تكون: `Root Directory = clinic/prototype` و`Build Command` فاضي.
تفاصيل كاملة وخطأ `docker: command not found` في [`clinic/DEPLOY.md`](clinic/DEPLOY.md).

### Easy!Appointments (نظام الحجز الكامل)

```bash
docker compose up
# ثم
docker compose exec php-fpm bash
npm install && composer install
npm start
```

أو على سيرفر عادي: Apache أو Nginx + PHP 8.2+ + MySQL. انسخ `config-sample.php` إلى
`config.php` واملأ بيانات الاتصال والموقع، وافتح المتصفح لتبدأ معالج التثبيت.

> **ملاحظة:** البيانات الشخصية للعيادة **مش** داخل Easy!Appointments — هي في طبقة `clinic/`
> أعلى النظام. Easy!Appointments هو العمود الفقري المجرّد.

---

## Structure

```
├── application/  system/  assets/   ← Easy!Appointments v1.6.1 (لم يُعدَّل)
├── docs/                            ← وثائق Easy!Appointments
├── storage/  tests/  docker/         ← البنية التحتية
└── clinic/                          ← كل ما يخصّ عيادة أ.د. أسامة شعير
    ├── README.md
    ├── RESEARCH-AND-RECOMMENDATION.md
    ├── DEPLOY.md
    ├── research/                    ← الملف التعريفي (+ مولّده)
    └── prototype/                   ← واجهة الحجز (PWA)
```

---

## Checks

طبقة العيادة فيها أربع طبقات فحص، والتلاتة الأولى من غير أي اعتماديات:

```bash
cd clinic/prototype
npm run audit         # ٤٢ فحص ثابت: CSS · ترجمة · صفحات · أصول
npm run check:install # ٨٣ فحص جاهزية التثبيت على الأندرويد
npm run smoke         # ٧٤ فحص على نشرة (محلي أو Vercel)
npm run check:ui      # ١٥٠ فحص سلوك في DOM (يحتاج jsdom)
```

---

## Data Sources

كل رقم شخصي في المشروع ده منسوب لمصدره في
[`clinic/research/دوسيه-أسامة-شعير.md`](clinic/research/دوسيه-أسامة-شعير.md) —
الموقع الرسمي، `alrijal.com`، `andrologyexpert.com`، `osamashaeer.com`، Google Scholar،
وVezeeta.

---

## License

- كود Easy!Appointments: GPL-3.0 — [Alex Tselegidis](https://alextselegidis.com)
- طبقة `clinic/` ووثائقها: تحت نفس رخصة GPL-3.0 الموروثة من المشروع الأصلي.

---

## ⚠️ قبل التشغيل الفعلي

1. **الأسعار** في `clinic/prototype/lib/clinic-data.js` قيم محسوبة — العيادة هي اللي تحدّدها.
2. **مواعيد العمل** (الأحد/الثلاثاء/الخميس، ١–٤ مساءً) مأخوذة من الموقع الرسمي — تحتاج تأكيد.
3. **التخزين** — الحجوزات محفوظة في الذاكرة وبتضيع مع كل cold start؛ لازم يتربط بـ MySQL.
4. **نقل البيانات** — النشر على Vercel يعني نقل بيانات صحية خارج مصر. التشغيل الحقيقي
   لازم يكون على سيرفر داخل مصر، وبترخيص من PDPC (قانون ١٥١/٢٠٢٠، م. ١٢).
5. **الموافقة** — يُراجع النص القانوني مع محامٍ قبل أي حجز حقيقي.
