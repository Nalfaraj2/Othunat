import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/PublicLayout'

const heading = { color: 'var(--idh-navy-900)' }
const body = { color: 'var(--idh-ink-2)' }

export default function TermsPage() {
  return (
    <PublicLayout>
      <h1 className="text-2xl font-extrabold" style={heading}>
        الشروط والأحكام
      </h1>
      <p className="text-sm" style={body}>
        آخر تحديث: ٢ أكتوبر ٢٠٢٦. باستخدامك تطبيق "إذونات" فإنك توافقين على الشروط التالية.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ١. طبيعة الخدمة
      </h2>
      <p className="text-sm" style={body}>
        "إذونات" أداة شخصية لمساعدتك على حساب وتتبّع أذونات العمل الخاصة بك (الرصيد الشهري، عدد
        الأذونات، مواعيدها). التطبيق أداة مساعدة وليس نظامًا رسميًا لوزارة التربية، والقيم المعروضة
        اجتهادية بناءً على البيانات التي تُدخلينها — يبقى السجل الرسمي المعتمد لدى جهة عملك هو
        المرجع النهائي عند أي تعارض.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٢. حسابك
      </h2>
      <ul className="list-disc pr-5 text-sm space-y-1" style={body}>
        <li>أنتِ مسؤولة عن دقة البيانات التي تُدخلينها (الأوقات، التواريخ).</li>
        <li>أنتِ مسؤولة عن سرّية كلمة المرور الخاصة بحسابك.</li>
        <li>يحق لك حذف حسابك في أي وقت من صفحة "حسابي".</li>
      </ul>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٣. الاشتراك المدفوع (عند التفعيل)
      </h2>
      <ul className="list-disc pr-5 text-sm space-y-1" style={body}>
        <li>الاشتراك سنوي، يُجدَّد تلقائيًا ما لم تُلغيه قبل نهاية المدة.</li>
        <li>يُدار الدفع والتجديد والإلغاء بالكامل عبر إعدادات حساب App Store أو Google Play الخاص بك.</li>
        <li>لا نحتفظ ببيانات بطاقتك البنكية ولا نصل إليها.</li>
      </ul>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٤. حدود المسؤولية
      </h2>
      <p className="text-sm" style={body}>
        نبذل قصارى جهدنا لضمان دقة الحسابات، لكن التطبيق يُقدَّم "كما هو" دون ضمانات. لسنا مسؤولين
        عن أي قرار إداري أو نتيجة تنبني على الاعتماد الحصري على أرقام التطبيق دون مراجعة السجل الرسمي.
      </p>

      <h2 className="text-lg font-bold pt-2" style={heading}>
        ٥. التعديلات
      </h2>
      <p className="text-sm" style={body}>
        قد نُحدّث هذه الشروط من وقت لآخر. الاستمرار باستخدام التطبيق بعد أي تحديث يُعد موافقة على
        الشروط الجديدة.
      </p>

      <p className="text-sm pt-2" style={body}>
        راجعي أيضًا{' '}
        <Link to="/privacy" className="font-bold" style={{ color: 'var(--idh-navy-500)' }}>
          سياسة الخصوصية
        </Link>
        .
      </p>
    </PublicLayout>
  )
}
