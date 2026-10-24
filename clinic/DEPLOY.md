# النشر على Vercel

المشروع متجهّز بالكامل لهيكل Vercel، بس محتاج خطوة ربط واحدة من حسابك.

---

## ⚠️ خطوة مطلوبة منك (مرة واحدة)

الطريقة الرسمية هي **ربط GitHub**:

1. افتح [vercel.com/account/login-connections](https://vercel.com/account/login-connections)
2. عند **GitHub** اضغط **Connect**
3. امنح الصلاحية للريبو `3boalazm/DR-Osama-Shoier`

بعدها بقى أي `git push` على أي فرع بيتنشر تلقائيًا كـ Preview، و`main` كـ Production.
من غير أي خطوة يدوية تانية.

> **إعداد المشروع لازم يكون صح من أول مرة** — وإلا الـ build فشل. راجع
> «الطريقة الأولى» بالأسفل: **Root Directory = `clinic/prototype`** و
> **Project Name = `prototype-shaeer`** و**Build Command** فاضي.
> لو اتساب بـ `Command "npm run build" exited with 1`، شوف قسم
> [«🚨 لو شفت…»](#-لو-شفت-command-npm-run-build-exited-with-1-في-ال-build-log).

---

## الطريقة الأولى — استيراد الريبو من لوحة Vercel (موصى بها)

1. افتح [vercel.com/new](https://vercel.com/new)
2. اختار ريبو **DR-Osama-Shoier**
3. اضبط الإعدادات دي **قبل** الضغط على Deploy:

| الإعداد | القيمة |
| --- | --- |
| **Project Name** | `prototype-shaeer` |
| **Root Directory** | `clinic/prototype` |
| **Framework Preset** | `Other` |
| **Build Command** | *(اتركه فاضي)* |
| **Output Directory** | *(اتركه فاضي)* |
| **Install Command** | *(اتركه فاضي)* |

4. اضغط **Deploy**

النتيجة: الموقع بيطلع على `https://prototype-shaeer.vercel.app`

> **ليه اسم المشروع مهم؟** الكود نفسه بيفترض الرابط `prototype-shaeer.vercel.app`
> — في `twa-manifest.json` (الـ `host` بتاع تطبيق أندرويد) وفي خطوات الـ TWA في
> `prototype/ANDROID.md`. لو اسم المشروع مختلف، الموقع هيشتغل بس **رابط التثبيت
> على الموبايل هيكون غلط**. لو المشروع موجود باسم تاني، غيّر `host` في
> `twa-manifest.json` مع كل الروابط في `ANDROID.md`.

> مفيش build ولا dependencies — الملفات الثابتة تُخدم من الجذر،
> وملفات `api/*.js` بتتحوّل تلقائيًا لـ Serverless Functions.

## 🚨 لو شفت `Command "npm run build" exited with 1` في الـ build log

ده **مش** خطأ في واجهة الحجز. معناه إن **Root Directory اترك على جذر الريبو**،
فـ Vercel بنى الـ Easy!Appointments نفسه (مش الـ prototype) — وبنى الحزمة اللي
في `package.json` في الجذر، و`gulp build` بتاعها بيحتاج Docker عشان يعمل
`composer install` جوه `php-fpm`:

```
[20:10:20] Starting 'archive'...
/bin/sh: line 1: docker: command not found
[20:10:20] 'archive' errored after 172 ms
```

**السبب:** جذر الريبو هو تطبيق PHP، ومفيش PHP ولا Docker على builders لـ Vercel.

**الحل:** راجع إعدادات المشروع واضبط **Root Directory = `clinic/prototype`**،
و**Build Command** فاضي. بعد التعديل انشر من جديد.

> **جذر الريبو هو Easy!Appointments (PHP) — واللي بيتنشر هو `clinic/prototype`
> بس.** الاتنين مختلفين تمامًا: واحد تطبيق PHP، والتاني ملفات ثابتة + أربع دوال
> serverless.

---

## ⚠️ حاجتين لازم تتظبط مرة واحدة من لوحة Vercel

### ١. إلغاء حماية النشر (عشان الموقع يفتح لأي حد)

المشروع الجديد على Vercel بيجي عليه **Vercel Authentication** مفعّل، وده بيعرض
شاشة تسجيل دخول Vercel لأي زائر. يعني المرضى مش هيقدروا يشوفوا الصفحة،
و**التطبيق مش هيتثبت** على موبايلهم.

`Settings → Deployment Protection → Vercel Authentication → Disabled`

### ٢. تأكيد إن نوع المشروع «Other» مش «Node»

لو Vercel شاف `package.json` جنب `server.js`، بيعتبر المشروع سيرفر Node وبياخد
`server.js` كنقطة دخول — في الصفحة الرئيسية تشتغل ملف المتصفح جوه دالة serverless
وتطلع خطأ. عشان كده فيه `.vercelignore` بيستثني `package.json` و`server.js`
و`tools/` من الرفع، و`framework: null` في `vercel.json`.

**علامة إن ده حصل:** في الـ build log تلاقي
`Build complete — Using server.js as the root entrypoint`.
لو ظهر، راجع `.vercelignore` الأول.

---

`vercel.json` جاهز في `clinic/prototype` وبيظبط حاجتين:
- **يمنع الوصول** لـ `server.js` و`package.json` و`lib/` و`tools/` (404 بدل تحميل الكود).
- **كاش صحيح** لـ `manifest.webmanifest` و`sw.js` (بدون كاش للـ service worker
  عشان التحديثات توصل فورًا) وأيقونات الـ PWA بصلاحية سنة.

### 🚨 لو شوفت `500 FUNCTION_INVOCATION_FAILED`

شوف الـ **اسم الحقل `deploymentId`** في اللوج، وقارنه بآخر نشرة ناجحة.

كل نشرة ليها رابط ثابت خاص بيها زي `prototype-<hash>-aboalazm.vercel.app`،
والرابط ده **مش بيتحدث أبدًا**. فلو نشرة قديمة كانت بايظة (زي اللي كان Vercel
بيعامل فيها `app.js` كسيرفر)، فالرابط بتاعها هيفضل 500 للأبد.

**استخدم الرابط الرئيسي بس:** `https://prototype-shaeer.vercel.app`

ولو فيه Service Worker قديم عالق في المتصفح: افتح
`Settings → Site data` أو استخدم نافذة خاصة (incognito) مرة واحدة.

### فحص سريع للنشرة

```bash
node clinic/prototype/tools/smoke.js https://prototype-shaeer.vercel.app
```

بيفحص ٧٤ حاجة: إن الصفحة نفسها شغالة (مش دالة بتقع)، كل ملف ثابت ونوعه،
إن الملفات الداخلية محجوبة، الـ manifest وأيقوناته، والـ API بيرد فعلاً.
وبيفرّق بين `500` (دالة بتقع) وشاشة تسجيل دخول Vercel (حماية النشر).

### التحقق بعد النشر (PWA)

```bash
curl -sI https://<project>.vercel.app/manifest.webmanifest | grep -i content-type
curl -sI https://<project>.vercel.app/sw.js | grep -i service-worker
curl -s -o /dev/null -w '%{http_code}\n' https://<project>.vercel.app/server.js   # لازم 404
curl -s -o /dev/null -w '%{http_code}\n' https://<project>.vercel.app/icons/icon-512.png  # 200
```

بعدها افتح الموقع على **HTTPS** من الموبايل → هيظهر زر **«ثبّت التطبيق»**
في الهيدر، وأندروید كمان هيعرض بانر التثبيت التلقائي.
> التثبيت وservice worker **مش بيشتغلوا** على `http` أو `file://` — لازم localhost أو HTTPS.

---

## الطريقة التانية — Vercel CLI

من جذر الريبو:

```bash
cd clinic/prototype
npx vercel login
npx vercel --prod
```

أول مرة هيسألك:

```
Set up and deploy? → Y
Which scope? → حسابك
Link to existing project? → N
Project name? → prototype-shaeer
In which directory is your code located? → ./
Want to modify these settings? → N
```

---

## الطريقة التالتة — GitHub Actions (بدون ربط الحساب)

لو عايز نشر تلقائي بصلاحية محدودة، ضيف `VERCEL_TOKEN` في
`Settings → Secrets → Actions` ثم استخدم الـ workflow ده:

```yaml
name: Deploy booking UI
on:
  push:
    branches: [main]
    paths: ['clinic/prototype/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g vercel@latest
      - run: vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: clinic/prototype
```

---

## متغيّر بيئة اختياري

| المتغيّر | الافتراضي | الغرض |
| --- | --- | --- |
| `ALLOWED_ORIGIN` | `*` | تحديد الدومين المسموح له بالاتصال. اضبطه على `https://osamashaeer.com` قبل التشغيل الحقيقي. |

من لوحة Vercel: `Settings → Environment Variables`.

---

## التحقق بعد النشر

```bash
curl -s https://<project>.vercel.app/api/clinic | head -c 120
```

لازم ترجّع JSON فيه `clinic` و`services`. لو رجّع 404 يبقى الـ Root Directory غلط.

---

## ⚠️ حدود النسخة المنشورة

- `api/register` بيحفظ الحجوزات **في الذاكرة** — بتضيع مع كل cold start.
  لازم يتوصل بـ MySQL بتاعة Easy!Appointments أو Vercel Postgres قبل التشغيل الفعلي.
- بيانات المرضى الصحية على سيرفرات Vercel = **نقل بيانات خارج مصر**، وده محتاج
  تصريح من مركز حماية البيانات (قانون ١٥١/٢٠٢٠). للعرض والتجربة فقط؛
  التشغيل الحقيقي يبقى على سيرفر داخل مصر.
