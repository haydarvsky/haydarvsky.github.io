// ═══════════ إعدادات صفحة «بيان للألعاب التعليمية» — GoCode ═══════════
const BY_CONFIG = {
  // سعر المادة الواحدة، وسعر الباقة الكاملة (المواد الست)
  PRICE_EACH: 40,
  PRICE_ALL: 200,
  CURRENCY: "د.ك",

  // رابط الدفع (MyFatoorah / Tap / Ottu …) — يظهر زرّه بعد إرسال الطلب.
  // إن كان لكل مبلغٍ رابطٌ مستقل ضعه في PAY_LINKS بالمبلغ: { 40: "…", 80: "…", 200: "…" }
  // ويمكن أن يحمل PAY_URL العلامتين {amount} و{id} فتُستبدلان بالمبلغ ورقم الطلب.
  PAY_URL: "",
  PAY_LINKS: {},

  // قناة استقبال الطلبات: بوت تلقرام يرسل الطلب إلى محادثة واحدة (اختياري).
  TG_TOKEN: "",
  TG_CHAT: "",

  // واتساب GoCode — يُكمَل عليه الطلب إن لم تُضبط قناة تلقرام، ويظهر في التذييل
  WHATSAPP: "",
  INSTAGRAM: "",

  LEVELS: [
    { id: "g1", name: "الأول الابتدائي", short: "أول", stars: 1 },
    { id: "g2", name: "الثاني الابتدائي", short: "ثاني", stars: 2 },
    { id: "g3", name: "الثالث الابتدائي", short: "ثالث", stars: 3 }
  ],

  SUBJECTS: [
    { id: "ar",  name: "اللغة العربية",    icon: "ar",  tint: "#E8435A" },
    { id: "en",  name: "اللغة الإنجليزية", icon: "en",  tint: "#F4762C" },
    { id: "sci", name: "العلوم",           icon: "sci", tint: "#F2A23A" },
    { id: "math",name: "الرياضيات",        icon: "math",tint: "#E8435A" },
    { id: "soc", name: "الاجتماعيات",      icon: "soc", tint: "#F4762C" },
    { id: "isl", name: "التربية الإسلامية", icon: "isl", tint: "#F2A23A" }
  ]
};
