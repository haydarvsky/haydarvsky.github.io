# مدرستي — haydarvsky.github.io/madrasa/

أداةُ المعلّم: التحضيرات (PDF بالصفِّ والفصلِ الدراسي) + متابعةُ المتعلّمين (غياب/مشاركة/خروج/سلوك/ملاحظات) + لوحاتُ قياسٍ تُصدَّرُ PDF + الجدولُ الأسبوعي.

- `index.html` تطبيقُ صفحةٍ واحدة بتوجيهِ هاش: `#/` اليوم · `#/prep/<10|11|12>/<1|2>` · `#/classes` · `#/class/<id>` (يومي) · `#/class/<id>/students` · `#/class/<id>/report` · `#/student/<cls>/<sid>` · `#/schedule` · `#/settings`
- `js/fb.js` Auth + Firestore عبر REST (مشروع vak-quiz-96d5f). `?demo=1` وضعٌ محليٌّ ببذرةٍ تجريبية.
- `js/charts.js` أعمدةٌ مكدَّسةٌ أسبوعية + تقويم. `js/app.js` الواجهات.
- التحضيرات: `data/prep.json` + `prep/<صف>/<فصل>/<ملف>.pdf` — تُرفَعُ من الصفحةِ برمزِ GitHub (`hv_token`) عبر `/admin/js/gh-api.js`، أو تُوضَعُ يدوياً وتُضافُ إلى prep.json.
- فايرستور: `sc_meta/settings` (الفصولُ الدراسية، الجدول، الحصص) · `sc_classes/{id}` (الفصلُ وطلابُه) · `sc_days/{cls}_{YYYY-MM-DD}` (تسجيلاتُ يومٍ لفصل). القواعدُ في `قواعد-فايرستور.txt`.
