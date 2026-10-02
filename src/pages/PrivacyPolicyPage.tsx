import { PublicLayout } from '../components/PublicLayout'

const heading = { color: 'var(--idh-navy-900)' }
const body = { color: 'var(--idh-ink-2)' }

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <h1 className="text-2xl font-extrabold" style={heading}>
        سياسة الخصوصية
      </h1>
      <p className="text-sm" style={body}>
        آخر تحديث: [التاريخ]. تطبيق "إذونات" مخصص لمساعدة الموظفين على حساب وإدارة أذونات العمل
        الخاصة بهم. توضّح هذه السياسة ما نجمعه من بيانات، وكيف نستخدمها، وحقوقك تجاهها.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ١. البيانات التي نجمعها
      </h2>
      <ul className="list-disc pr-5 text-sm space-y-1" style={body}>
        <li>الرقم المدني والاسم الكامل — لإنشاء حسابك والتعرّف عليك داخل النظام.</li>
        <li>البريد الإلكتروني — لأغراض استرجاع كلمة المرور فقط، ولا يُستخدم لتسجيل الدخول.</li>
        <li>سجلات الأذونات (نوع الإذن، التاريخ، وقت الدخول/الخروج، المدة المحسوبة).</li>
        <li>صور إثبات اختيارية ترفقينها بالإذن (مثل صورة توقيع البصمة)، تُخزَّن في مساحة خاصة بك فقط.</li>
        <li>ملاحظات الإذن الطبي، إن أدخلتِها.</li>
        <li>عند تفعيل الاشتراك: حالة الاشتراك وتاريخ انتهائه (لا نطّلع على بيانات بطاقتك البنكية — تُدار بالكامل عبر متجر آبل أو جوجل).</li>
      </ul>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٢. كيف نستخدم بياناتك
      </h2>
      <p className="text-sm" style={body}>
        تُستخدم بياناتك حصرًا لتشغيل خدمة حساب الأذونات: عرض رصيدك الشهري، حساب مدة كل إذن،
        وعرض سجلّك. لا نستخدم بياناتك للإعلانات، ولا نبيعها أو نؤجّرها لأي طرف ثالث.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٣. من يستطيع الوصول إليها
      </h2>
      <p className="text-sm" style={body}>
        بياناتك محمية على مستوى قاعدة البيانات بحيث لا يقدر أي مستخدم آخر (غير المسؤول عند
        الحاجة الفنية) الوصول إليها. مزوّدو الخدمة الذين نعتمد عليهم لتشغيل التطبيق:
      </p>
      <ul className="list-disc pr-5 text-sm space-y-1" style={body}>
        <li><strong>Supabase</strong> — استضافة قاعدة البيانات والملفات والمصادقة.</li>
        <li><strong>Apple / Google</strong> — معالجة الاشتراك عبر App Store / Google Play (عند التفعيل).</li>
        <li><strong>RevenueCat</strong> — إدارة حالة الاشتراك (عند التفعيل)، دون الوصول لبيانات دفعك.</li>
      </ul>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٤. مدة الاحتفاظ بالبيانات
      </h2>
      <p className="text-sm" style={body}>
        نحتفظ ببياناتك طالما حسابك نشط. عند حذف حسابك (من الإعدادات ← "حذف الحساب نهائيًا")، تُحذف
        جميع بياناتك من قاعدة البيانات بشكل نهائي وفوري ولا يمكن استرجاعها.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٥. حقوقك
      </h2>
      <ul className="list-disc pr-5 text-sm space-y-1" style={body}>
        <li>الاطّلاع على بياناتك في أي وقت من داخل التطبيق (لوحة التحكم، السجل، حسابي).</li>
        <li>تعديل اسمك أو كلمة مرورك من صفحة "حسابي".</li>
        <li>حذف حسابك وكل بياناتك نهائيًا من صفحة "حسابي".</li>
      </ul>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٦. الأمان
      </h2>
      <p className="text-sm" style={body}>
        تُنقل جميع البيانات عبر اتصال مشفّر (HTTPS)، وتُطبَّق سياسات وصول صارمة على مستوى قاعدة
        البيانات (Row Level Security) بحيث لا يقدر أي حساب الوصول لبيانات حساب آخر.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٧. التواصل معنا
      </h2>
      <p className="text-sm" style={body}>
        لأي استفسار بخصوص خصوصية بياناتك، تواصلي معنا عبر: [بريد إلكتروني للدعم الفني].
      </p>
    </PublicLayout>
  )
}
