# قائمة تحقق النشر — App Store و Google Play

هذا الملف يغطي المرحلة ٨ من الخطة. هذه خطوات يدوية بالكامل (حسابات، رفع، مراجعة) ما أقدر أنفّذها
من عندي — لكن الكود والأصول (الأيقونات، الشعار، الخصوصية، حذف الحساب) كلها جاهزة مسبقًا.

---

## قبل أي شي: استضافة حقيقية للتطبيق

المتجرين يطلبون **رابط عام** (مو localhost) لسياسة الخصوصية والشروط، ورابط عام للتطبيق نفسه إذا
تبين نسخة ويب أيضًا. انشري مجلد `dist/` (بعد `npm run build`) على أي استضافة ثابتة تدعم SPA
fallback (كل مسار غير موجود يرجع لـ `index.html`) — مثل Vercel أو Netlify أو Cloudflare Pages.
بعدها روابطك تصير مثلًا:
- `https://your-domain.com/privacy`
- `https://your-domain.com/terms`

---

## المتطلبات الأساسية

- [ ] حساب Apple Developer Program (٩٩$/سنة) — [developer.apple.com](https://developer.apple.com)
- [ ] حساب Google Play Console (٢٥$ لمرة واحدة) — [play.google.com/console](https://play.google.com/console)
- [ ] جهاز Mac فيه Xcode كامل (وليس فقط Command Line Tools) لبناء وأرشفة تطبيق iOS — أو خدمة بناء
      سحابية مثل Codemagic/EAS إذا ما عندك Mac
- [ ] حساب RevenueCat (مجاني للبداية) مربوط بمنتجي الاشتراك من المتجرين (المرحلة ٦)
- [ ] تحديد `appId` النهائي في `capacitor.config.ts` (حاليًا placeholder: `com.idhonat.app`) —
      لازم يطابق Bundle ID في Apple و Package name في Google، ولازم يكون نهائي قبل أول رفع
      (تغييره لاحقًا يعني إعادة إضافة المنصتين من الصفر)

---

## App Store Connect (iOS)

- [ ] إنشاء App ID في Apple Developer portal بنفس `appId`
- [ ] إنشاء التطبيق في App Store Connect، وربط نفس Bundle ID
- [ ] رفع البناء: `npx cap open ios` يفتح Xcode → Archive → Distribute App
- [ ] لقطات شاشة لكل مقاس مطلوب (6.7" و6.5" و5.5" على الأقل)
- [ ] الوصف (عربي/إنجليزي)، الكلمات المفتاحية، رابط الدعم
- [ ] **رابط سياسة الخصوصية** (App Privacy section) + تعبئة Privacy Nutrition Labels بدقة حسب
      البيانات الفعلية المذكورة في [`src/pages/PrivacyPolicyPage.tsx`](src/pages/PrivacyPolicyPage.tsx)
- [ ] التصنيف العمري
- [ ] **In-App Purchase**: أنشئي Auto-Renewable Subscription بسعر أقرب شريحة لـ ١.٠٠٠ د.ك
      (آبل يدعم متجر الكويت بعملة KWD مباشرة)، اربطيها بـ RevenueCat
- [ ] اختبار كامل بحساب Sandbox قبل الإرسال

**نقاط امتثال حرجة (رفض شائع لو فاتت):**
- [ ] بند 3.1.2 — شاشة الاشتراك (`/subscription`) تعرض السعر والمدة ورابط الشروط/الخصوصية **قبل**
      الشراء (منفّذ بالفعل)
- [ ] بند 5.1.1(v) — حذف الحساب متاح من داخل التطبيق مباشرة (`/profile` → منطقة الخطر) (منفّذ بالفعل)

---

## Google Play Console (Android)

- [ ] إنشاء التطبيق، رفع AAB موقّع (`android/` جاهز، يحتاج بناء فعلي عبر Android Studio أو
      `./gradlew bundleRelease` مع مفتاح توقيع Release حقيقي — ما عندي بيئة لتوليده هنا)
- [ ] أيقونة المتجر: `brand-kit/02_App-Icons/Android/play-store-512.png` (جاهزة)
- [ ] Feature Graphic (1024×500) — غير موجود بالحزمة، يحتاج تصميم إضافي
- [ ] لقطات شاشة (هاتف على الأقل)
- [ ] **Data Safety form**: عبّيه بمطابقة تامة لِـ[`src/pages/PrivacyPolicyPage.tsx`](src/pages/PrivacyPolicyPage.tsx)
      (الرقم المدني، الاسم، البريد، سجلات الأذونات، الصور المرفقة)
- [ ] استبيان تصنيف المحتوى
- [ ] **منتج الاشتراك**: أنشئي Subscription بسعر ~١ د.ك في Play Console، اربطيها بـ RevenueCat
- [ ] اختبار عبر Internal Testing track قبل الإصدار العام

---

## اختبار نهائي قبل الإرسال (كلا المنصتين)

- [ ] الأيقونة تظهر صحيحة على الشاشة الرئيسية (لا تشويه، لا خلفية بيضاء غير مقصودة)
- [ ] شاشة splash تظهر بالهوية الصحيحة (كحلي + شعار) قبل تحميل التطبيق
- [ ] طلب إذن الكاميرا/الصور يظهر بالنص العربي الصحيح المُعرَّف في `Info.plist` / `AndroidManifest.xml`
- [ ] تسجيل حساب فعلي → إضافة إذن → الرصيد يتحدث → لا يتجاوز ٤ أذونات
- [ ] حذف الحساب فعليًا (بحساب تجريبي) يمسح كل البيانات
- [ ] اشتراك تجريبي (Sandbox / Internal Testing) ينعكس صح على حالة الاشتراك خلال ثوانٍ
- [ ] `/privacy` و `/terms` مفتوحين على الرابط العام (وليس فقط داخل التطبيق)
