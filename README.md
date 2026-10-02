# إذونات (Idhonat)

نظام حساب وإدارة أذونات الموظفين. React + TypeScript + Vite + Tailwind CSS v4 + Supabase +
Capacitor (iOS/Android).

## الحالة الحالية

**كل المراحل الثمانية منفّذة بالكود.** الجزء الوحيد المتبقي هو خطوات يدوية خارجية ما أقدر أسويها
نيابة عنك (حسابات سحابية، رفع للمتجرين) — موضّحة أدناه.

| المرحلة | الحالة |
|---|---|
| ١. قاعدة البيانات + المصادقة + منطق الأذونات | ✅ الكود جاهز — **يحتاج مشروع Supabase حقيقي منك لاختباره** |
| ٢. الواجهات بهوية Idhonat-Brand-Kit | ✅ جاهزة، رُوجعت بصريًا |
| ٣. تغليف Capacitor (iOS + Android) | ✅ المنصتان مضافتان، تحتاج Xcode/Android Studio كاملين للبناء الفعلي |
| ٤. أيقونات + splash screens | ✅ من حزمة العلامة التجارية مباشرة |
| ٥. الخصوصية والشروط + حذف الحساب | ✅ صفحات `/privacy` و `/terms` + حذف حساب فعلي |
| ٦. الاشتراك السنوي (RevenueCat) | ✅ الكود جاهز — **يحتاج حسابات App Store/Play/RevenueCat حقيقية** |
| ٧. لوحة الأدمن | ✅ إعدادات + اشتراكات + تقييمات + رابط أخطاء |
| ٨. التجهيز للنشر | 📋 راجعي [`STORE_SUBMISSION.md`](STORE_SUBMISSION.md) |

## التشغيل محليًا

1. أنشئي مشروع Supabase جديد على [supabase.com](https://supabase.com) (خطوة يدوية، ما أقدر أنشئ
   حساب سحابي نيابة عنك).
2. انسخي `.env.example` إلى `.env.local` وعبّي القيم المطلوبة (Supabase إلزامي، RevenueCat وSentry اختياريان).
3. اربطي المشروع بـ Supabase CLI وادفعي كل الـ migrations بالترتيب:
   ```bash
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   ```
   (أو الصقي محتوى كل ملف بمجلد `supabase/migrations/` بالترتيب الرقمي في SQL Editor بلوحة Supabase.)
4. **مهم — الـ SQL ما تم اختباره فعليًا على قاعدة بيانات حقيقية** (هذه البيئة ماعندها Postgres/Docker
   محليًا). بعد الدفع، جربي:
   - تسجيل حساب فعلي → صف `profiles` يُنشأ تلقائيًا (Trigger `on_auth_user_created`).
   - تسجيل الدخول بالرقم المدني (RPC `get_email_by_civil_id`).
   - إضافة إذن → `duration_minutes` يُحسب صح و`monthly_balances` يتحدث فورًا.
   - الإذن الخامس بنفس الشهر يُرفض من قاعدة البيانات.
   - حذف الحساب (RPC `delete_my_account`) يمسح كل شي فعليًا.
   - لجعل حساب أدمن: `update profiles set role = 'admin' where civil_id = '...'` يدويًا من SQL Editor.
5. شغّلي التطبيق:
   ```bash
   npm install
   npm run dev
   ```

## تشغيل نسخة الجوال (iOS / Android)

المنصتان مضافتان مسبقًا (`ios/` و `android/`). بعد أي تعديل بالكود:
```bash
npm run build && npx cap sync
```
ثم لفتح المشروع الأصلي:
```bash
npx cap open ios      # يحتاج Xcode كامل (مو فقط Command Line Tools)
npx cap open android  # يحتاج Android Studio
```

## بنية المشروع

```
src/
  lib/supabaseClient.ts        عميل Supabase
  types/database.ts            أنواع TypeScript مطابقة للجداول
  services/authService.ts      تسجيل دخول/تسجيل/تغيير كلمة مرور/حذف حساب بالرقم المدني
  services/permissionsService.ts   إضافة/عرض/إلغاء الأذونات + المرفقات + الرصيد الشهري
  services/subscriptionService.ts  RevenueCat (native فقط)
  services/adminService.ts     إعدادات النظام + الاشتراكات + التقييمات (للأدمن)
  services/reviewService.ts    إرسال تقييم داخل التطبيق
  brand/                       tokens.css و Button.tsx وIcon.tsx وخطوط Tajawal (من حزمة العلامة)
  hooks/useAuth.tsx            حالة الجلسة (Session)
  pages/                       كل شاشات التطبيق + admin/
supabase/
  migrations/                  المخطط الكامل بالترتيب: 0001 أساس → 0002 تخزين → 0003 حذف حساب
                                → 0004 اشتراكات → 0005 لوحة أدمن وإعدادات قابلة للتعديل
  functions/revenuecat-webhook/  يستقبل أحداث RevenueCat ويحدّث جدول subscriptions
ios/ android/                  مشروعا Capacitor الأصليان (مُضافان للـ git)
brand-kit/                     حزمة العلامة التجارية الكاملة كما استُلمت
```

## ملاحظة على منطق الحساب (قابل للتعديل من لوحة الأدمن الآن)

الدوام الرسمي الافتراضي: دخول `06:55` → نهاية `13:05` (٦ ساعات و١٠ دقائق)، وإذن آخر الدوام يحسب
نهاية دوام مرنة بين `06:55` و `07:40`. هذي القيم صارت بجدول `app_settings` وتتعدّل من `/admin`
بدون أي تعديل بالكود — أول شهر يتغيّر فيه الإعداد يُطبَّق على الحسابات الجديدة فقط.

## متغيرات البيئة الاختيارية

- `VITE_REVENUECAT_IOS_KEY` / `VITE_REVENUECAT_ANDROID_KEY`: بدونها، صفحة `/subscription` تعمل
  لكن تعرض "غير مفعّل" دائمًا.
- `VITE_SENTRY_DSN`: بدونه، مراقبة الأخطاء معطّلة (لا كراش تتبّع، لا تأثير على باقي التطبيق).

## المتبقي (خطوات يدوية خارجية فقط)

راجعي [`STORE_SUBMISSION.md`](STORE_SUBMISSION.md) للقائمة الكاملة: حسابات Apple/Google/RevenueCat،
بناء وتوقيع فعلي للتطبيقين، استضافة `/privacy` و `/terms` على رابط عام، ولقطات الشاشة والوصف.
