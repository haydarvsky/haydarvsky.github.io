// نصوص «رحلة المستكشف» باللغتين — كل نصٍّ معرفيٍّ من صفحات كتاب الاجتماعيات للصف العاشر مع رقم صفحته
window.RX = window.RX || {};
RX.TEXT = {
ar: {
  dir: "rtl", lang: "ar",
  app: "رحلة المستكشف", appSub: "الأرض والأثر",
  school: "ثانوية طلحة بن عبيد الله، بنين",
  google: "مجموعة الابتكار من Google، الدرس الريادي الأول",
  district: "منطقة الأحمدي التعليمية، مدينة صباح الأحمد",
  principal: "مدير المدرسة: د. ناصر العازمي",
  teamTitle: "فريق الإبداع",
  team: ["أ. غانم البطي (قيادة الفريق)", "أ. حيدر المعاتيق (تصميم اللعبة)", "أ. يحيى النويعم", "أ. بدر حبيب", "أ. مبارك العجمي"],
  rights: "© ٢٠٢٦ فريق الإبداع، ثانوية طلحة بن عبيد الله، منطقة الأحمدي التعليمية. جميع الحقوق محفوظة.",
  sep: "، ",
  start: "ابدأ الرحلة", cont: "تابع", back: "رجوع", close: "إغلاق", next: "التالي", done: "تم",
  map: "الخريطة", passport: "الجواز", settings: "الإعدادات", guide: "المرشد", real: "المكان الحقيقي",
  land: "الأرض", trace: "الأثر", mission: "مهمّتك", question: "سؤال من الدرس", bookQ: "سؤال الكتاب",
  answer: "أجب", tryAgain: "حاول مرة أخرى", correct: "إجابة صحيحة", wrong: "ليست هذه",
  stampEarned: "نلتَ ختم المحطة", go: "انطلق إلى المحطة", locked: "تُفتح بعد المحطة السابقة",
  station: "المحطة", of: "من", final: "الختام", startSt: "البداية",
  enterVR: "النظارة", cardboard: "الكرتون", board: "السبورة", tablet: "اللوحي",
  mode: "طريقة العرض", language: "اللغة", sound: "الأصوات", narration: "صوت المرشد",
  unlockAll: "فتح كل المحطات (للعرض)", reset: "ابدأ من جديد", credits: "المصادر",
  yourName: "اسم المستكشف", changeAvatar: "صورة الشخصية من Gemini", printPassport: "اطبع الجواز",
  guideTitle: "مرشد الرحلة", guideLink: "اسأل «مرشد الرحلة» في Gemini",
  guideNote: "المرشد يعطيك تلميحاً لا إجابة.",
  illustrative: "مشهد توضيحي",
  exag: "الارتفاعات مضخّمة رأسياً للوضوح",
  dragHint: "اسحب للنظر حولك", gyroHint: "حرّك الجهاز للنظر حولك", gazeHint: "ثبّت النظر على الزر لاختياره",
  loading: "جارٍ تحميل الأرض الحقيقية…",
  coords: "الإحداثيات",
  listen: "استمع", playAgain: "أعد",
  lockedToast: "أكمل المحطة السابقة أولاً",
  credText: [
    "الارتفاعات: SRTM عبر بلاطات Terrarium (Mapzen/AWS Open Data).",
    "صور القمر الصناعي: Sentinel-2 cloudless 2023 من EOX IT Services GmbH (بيانات Copernicus Sentinel المعدّلة 2023)، CC BY-NC-SA 4.0.",
    "الحدود والسواحل: Natural Earth.",
    "المحتوى: كتاب الاجتماعيات للصف العاشر «دولة الكويت المسيرة والكيان» ٢٠٢٦/٢٠٢٧، ص٣٧–٤١ وص٩١–٩٩.",
    "المعابد والآثار والأواني مجسّمات توضيحية، لا مسوح أثرية."
  ],
  stations: {
    start: {
      kicker: "البداية، غرفة الخرائط", title: "الخريطة المائلة", sub: "ص٩٥، شكل (٤) ص٣٨",
      land: "هذه خريطة الكويت المجسّمة، مبنيّة من بيانات ارتفاعٍ حقيقية. قبل أن تبدأ رحلتك فكّر: إذا هطل المطر على الكويت، فإلى أين يجري؟",
      trace: "طبقة «الأثر» تُظهر المناطق الأثرية والتاريخية في دولة الكويت كما في شكل (٤) ص٣٨، فوق معالم السطح.",
      mission: "أسقِط المطر على الخريطة وراقب اتجاه جريانه، ثم شغّل طبقة «الأثر».",
      steps: ["أسقِط المطر", "شغّل طبقة الأثر", "أجب عن السؤال"],
      rain: "أسقِط المطر", layerLand: "معالم السطح", layerTrace: "المواقع الأثرية",
      conclusion: "«يتميز سطح الأرض في دولة الكويت بصفة عامة بالانبساط والاستواء… وينحدر السطح تدريجياً من الغرب إلى الشرق باتجاه الخليج العربي» ص٩٥",
      slope: "ينحدر السطح من الغرب إلى الشرق",
      q: "إلى أين جرى المطر على الخريطة؟",
      choices: [
        ["نحو الشرق، باتجاه الخليج العربي", 1, "صحيح: السطح ينحدر تدريجياً من الغرب إلى الشرق باتجاه الخليج العربي (ص٩٥)."],
        ["نحو الغرب، باتجاه وادي الباطن", 0, "راقب القطرات مرة أخرى: أين تختفي؟"],
        ["بقي في مكانه لأن السطح مستوٍ تماماً", 0, "السطح منبسط في عمومه، لكن فيه انحدار بسيط هو أبرز خصائصه (ص٩٥)."]
      ],
      hint: "تابع قطرةً واحدة من غرب الخريطة حتى تختفي. (ص٩٥)",
      intro: "أهلاً بك أيها المستكشف. أمامك خريطة الكويت من بيانات ارتفاعٍ حقيقية."
    },
    sabiya: {
      kicker: "المحطة ١ من ٥", title: "الصبية", sub: "حضارة العُبيد، الألف السادس ق.م",
      era: "الألف السادس ق.م", pages: "الأرض ص٩٨، الأثر ص٣٨–٣٩",
      land: "أنت على الساحل الشمالي لجون الكويت. ومن أشكال الساحل هنا رأس الصبية وخور الصبية؛ والأخوار ممرّات مائية ضيقة تمتد من البحر إلى داخل اليابسة (ص٩٨).",
      trace: "كشفت التنقيبات الأثرية في منطقة الصبية عن آثار تعود إلى حقبة العُبيد، التي تُعد من أقدم المستوطنات الحضرية في منطقة الخليج العربي خلال الألف السادس قبل الميلاد. ومن أبرز الشواهد المنازل المستطيلة والأفران والأواني الفخارية (ص٣٨–٣٩).",
      place: "تقف في موقع «بحرة ١» الأثري في الصبية.",
      mission: "أزِح الرمل عن موقع التنقيب حتى تظهر أساسات المنزل، ثم اجمع كِسَر الفخار الخمس لتعيد تركيب الإناء.",
      steps: ["أزِح الرمل عن الموقع", "اجمع كِسَر الفخار", "أجب عن سؤال الدرس"],
      brush: "امسح الرمل بالمؤشّر", found1: "ظهرت أساسات منزلٍ مستطيل وفرن", found2: "اكتمل الإناء الفخاري",
      shard: "كِسرة فخار",
      q: "ما الذي تدل عليه المنازل والأفران والأواني عن حياة الإنسان في الصبية؟",
      choices: [
        ["أنه عرف الاستقرار وتنظيم حياته اليومية", 1, "«تشير المكتشفات الأثرية المادية إلى أن الإنسان في تلك الفترة عرف الاستقرار وتنظيم حياته اليومية» ص٣٩."],
        ["أنه كان دائم الترحال لا يستقر في مكان", 0, "من يبني منزلاً من غرف وفرناً لا يرحل كل يوم."],
        ["أنه سكن الصبية بعد ظهور الإسلام", 0, "حقبة العُبيد في الألف السادس قبل الميلاد (ص٣٩)."]
      ],
      hint: "انظر إلى ما كشفته: منزلٌ بغرف، وفرن، وإناء. هل يبني هذا من يرحل كل يوم؟ (ص٣٩)",
      stamp: "حضارة العُبيد", env: "coast"
    },
    failaka: {
      kicker: "المحطة ٢ من ٥", title: "جزيرة فيلكا", sub: "إيكاروس، القرن الرابع ق.م",
      era: "القرن الرابع ق.م", pages: "الأرض ص٩٧، الأثر ص٣٩",
      land: "فيلكا من جزر دولة الكويت التسع، وكانت مأهولة بالسكان، وأسهم موقعها في دعم النشاط البحري والتجاري والملاحة والصيد (ص٩٧).",
      trace: "عُرفت جزيرة فيلكا باسم «إيكاروس» في العصر الهلنستي، بعد وصول تأثيرات فتوحات الإسكندر المقدوني إلى المنطقة في القرن الرابع قبل الميلاد. وكشفت التنقيبات معابد ذات طابع معماري يوناني، ونقوشاً وكتابات أثرية، وتماثيل (ص٣٩).",
      place: "تقف في الركن الجنوبي الغربي من الجزيرة، حيث موقع القلعة الهلنستية.",
      mission: "حرّك مقبض الزمن من أطلال اليوم إلى المعبد كما كان، ثم ابحث عن الأعمدة والنقش.",
      steps: ["أعد المعبد بمقبض الزمن", "اكتشف الأعمدة", "اكتشف النقش", "أجب عن سؤال الدرس"],
      now: "أطلال اليوم", then: "إيكاروس، القرن ٤ ق.م", slider: "مقبض الزمن",
      columns: "الأعمدة", columnsInfo: "أعمدة على الطراز اليوناني، شاهدٌ على «معابد ذات طابع معماري يوناني» (ص٣٩).",
      inscr: "النقش", inscrInfo: "حجرٌ عليه كتابة بحروف يونانية، شاهدٌ على «نقوش وكتابات أثرية» (ص٣٩). النص المنقوش هنا توضيحي.",
      q: "علّل: لماذا أصبحت جزيرة فيلكا مركزاً حضارياً يعكس التواصل بين حضارات الشرق والغرب؟",
      choices: [
        ["لأنها تأثرت بالحضارة اليونانية بعد فتوحات الإسكندر، وموقع أرض الكويت جعلها منطقة تواصل بين الحضارات", 1, "صحيح (ص٣٩): التأثر بالحضارة اليونانية، والموقع الاستراتيجي الذي جعل أرض الكويت حلقة وصل بين الشعوب."],
        ["لأنها أكبر الجزر الكويتية مساحة", 0, "أكبر الجزر الكويتية مساحة بوبيان (ص٩٧)."],
        ["لأنها أعلى نقطة في الكويت", 0, "فيلكا جزيرة منخفضة؛ أعلى النقاط في الغرب (ص٩٦)."]
      ],
      hint: "ابحث في المعبد عن طرازٍ جاء من الغرب، ثم تذكّر أين تقع الجزيرة. (ص٣٩)",
      stamp: "إيكاروس", env: "coast"
    },
    wara: {
      kicker: "المحطة ٣ من ٥", title: "تل وارة", sub: "يوم أوارة، ما قبل الإسلام",
      era: "ما قبل الإسلام", pages: "الأرض ص٩٥–٩٦، الأثر ص٤٠",
      land: "من التلال الجنوبية في الكويت تل وارة وتلال برقان. والتلال أراضٍ مرتفعة عمّا يحيط بها، لكنها أقل ارتفاعاً من الجبال (ص٩٦). وإلى الشمال الشرقي هضبة الأحمدي: أرضٌ مرتفعة سطحها منبسط وتمتد لمساحة واسعة، ويبلغ ارتفاعها ١٢٥–١٣٧ م تقريباً (ص٩٥).",
      trace: "ارتبطت منطقة أوارة (وارة حالياً) بأيام العرب المشهورة: يوم أوارة الأول بين المنذر بن ماء السماء وقبيلة بكر بن وائل، ويوم أوارة الثاني بين بني تميم وعمرو بن هند ملك الحيرة، وورد ذكرها في الشعر العربي الإسلامي (ص٤٠).",
      place: "تقف على أقرب تلٍّ منفرد إلى موضع وارة في شكل (٤): يرتفع نحو ٤٠ م عمّا حوله.",
      verse1: "وَلَسْنا بِذَبْحِ الجَيْشِ يَوْمَ أُوارَةٍ", verse2: "وَلَمْ يَسْتَبِحْنا عامِرٌ وَقَنابِلُهْ",
      poet: "جرير، شكل (٦) ص٤٠",
      mission: "استمع إلى بيت جرير، ثم التفت إلى الشمال الشرقي نحو هضبة الأحمدي، وقارن بين ما تقف عليه وما تراه.",
      steps: ["استمع إلى بيت جرير", "اعثر على هضبة الأحمدي", "قارن مقطع الارتفاع", "أجب عن سؤال الدرس"],
      ahmadi: "هضبة الأحمدي", ahmadiDist: "٢١ كم، ١٢٥–١٣٧ م (ص٩٥)",
      youHere: "أنت هنا: تل، ١١٧ م",
      profileTitle: "مقطع ارتفاع حقيقي: من تل وارة إلى هضبة الأحمدي",
      profileHill: "التل: ارتفاع حادّ في رقعة صغيرة", profilePlateau: "الهضبة: مرتفعٌ واسع",
      q: "فرّق بين التل والهضبة بما رأيته في المحطة.",
      choices: [
        ["التل أرض مرتفعة عمّا يحيط بها في رقعة صغيرة، والهضبة أرض مرتفعة سطحها منبسط وتمتد لمساحة واسعة", 1, "صحيح: هذا تعريفا الكتاب (ص٩٥–٩٦)، وهو ما أظهره المقطع."],
        ["التل منخفض تتجمع فيه مياه الأمطار، والهضبة أرض رملية تكوّنها الرياح", 0, "هذان تعريفا الخبرة والكثبان الرملية (ص٩٧)."],
        ["لا فرق بينهما؛ كلاهما من أشكال الساحل", 0, "التلال والهضاب من مظاهر السطح الصحراوية (ص٩٥–٩٦)."]
      ],
      hint: "في المقطع، قارن عرض المرتفع لا ارتفاعه وحده. (ص٩٥–٩٦)",
      stamp: "يوم أوارة", env: "desert"
    },
    kazma: {
      kicker: "المحطة ٤ من ٥", title: "كاظمة", sub: "ذات السلاسل، ١٢هـ / ٦٣٣م",
      era: "١٢هـ / ٦٣٣م", pages: "الأرض ص٩٦، ٩٨، الأثر ص٤٠",
      land: "تقف على حافة جال الزور، وهو حافة صخرية تمتد بمحاذاة الساحل الشمالي الغربي لجون الكويت (ص٩٦). وتحتك خليج كاظمة الذي يتفرّع من جون الكويت غرباً (ص٩٨).",
      trace: "برزت في العصر الإسلامي أهمية منطقة كاظمة التي كانت منطلقاً للفتوحات الإسلامية نحو العراق وبلاد فارس، كما شهدت معركة ذات السلاسل عام ١٢هـ الموافق ٦٣٣م بقيادة الصحابي الجليل خالد بن الوليد رضي الله عنه ضد جيش الدولة الساسانية بقيادة هرمز بن أردشير (ص٤٠).",
      place: "حافة جال الزور: نحو ١٤٠ م، والماء تحتك على بُعد نحو ٤ كم.",
      mission: "شغّل خريطة المعركة على أرض كاظمة نفسها، ثم اكتشف الاتجاهين اللذين انطلقت نحوهما الفتوحات.",
      steps: ["شغّل خريطة المعركة", "اكتشف الاتجاهين", "أجب عن سؤال الدرس"],
      play: "شغّل خريطة المعركة",
      armyA: "جيش المسلمين", armyAsub: "بقيادة خالد بن الوليد ؓ",
      armyB: "جيش الدولة الساسانية", armyBsub: "بقيادة هرمز بن أردشير",
      battle: "ذات السلاسل، ١٢هـ / ٦٣٣م",
      toIraq: "نحو العراق", toPersia: "نحو بلاد فارس",
      noFigures: "لا تُجسَّد الشخصيات في هذه المحطة، وتُعرض المعركة رموزاً على الخريطة.",
      q: "علّل: لماذا كانت كاظمة منطلقاً للفتوحات الإسلامية نحو العراق وبلاد فارس؟",
      choices: [
        ["لموقع أرض الكويت بين شبه الجزيرة العربية والعراق وبلاد فارس", 1, "صحيح: «موقع أرض الكويت بين شبه الجزيرة العربية والعراق وبلاد فارس أكسبها أهمية كبيرة منذ القدم» ص٤٠."],
        ["لأنها أعلى نقطة في الكويت", 0, "أعلى النقاط في غرب الكويت؛ وكاظمة على الساحل (ص٩٦، ٩٨)."],
        ["لأنها جزيرة بعيدة عن اليابسة", 0, "كاظمة على اليابسة عند خليج كاظمة (ص٩٨)."]
      ],
      hint: "انظر إلى ما يحيط بالكويت: من الشمال؟ ومن الشرق؟ (ص٤٠)",
      stamp: "ذات السلاسل", env: "coast"
    },
    shaqaya: {
      kicker: "المحطة ٥ من ٥", title: "الشقايا", sub: "معجم البلدان، ياقوت الحموي",
      era: "القرن السابع الهجري", pages: "الأرض ص٩٦، الأثر ص٤٠، نشاط (١) ص٩٩",
      land: "في الغرب ترتفع الأرض، ويمتد سهل الدبدبة في الجزء الغربي والجنوبي، ووادي الباطن بمحاذاة الحدود الغربية. والوديان مجارٍ مائية قديمة نشأت بفعل جريان مياه الأمطار الغزيرة، ثم جفّت مع مرور الزمن (ص٩٦).",
      trace: "أشار المؤرخ والجغرافي ياقوت الحموي في كتابه «معجم البلدان» إلى عدد من المواقع القديمة في أرض الكويت، مثل السيدان (السادة حالياً)، والشجي (الشقايا حالياً)، وحومان (حومة حالياً)، والدو (الدبدبة حالياً) (ص٤٠).",
      place: "تقف على أعلى نقطة داخل حدود الكويت في بيانات الارتفاع: نحو ٢٩٩ م، وتحتك وادي الباطن.",
      mission: "طابق أسماء ياقوت القديمة بأماكنها اليوم، ثم استدعِ المطر وراقب وادي الباطن.",
      steps: ["طابق الأسماء الأربعة", "استدعِ المطر", "أجب عن سؤال الكتاب"],
      matchTitle: "أسماء «معجم البلدان»", matchHelp: "اختر اسماً قديماً، ثم اختر مكانه اليوم على الخريطة.",
      old: { sadah: "السيدان", shaqaya: "الشجي", huma: "حومان", dibdiba: "الدو" },
      now: { sadah: "السادة", shaqaya: "الشقايا", huma: "حومة", dibdiba: "الدبدبة" },
      rain: "استدعِ المطر", wadi: "وادي الباطن", highest: "أعلى نقطة، ٢٩٩ م",
      flood: "جرى الماء في الوادي الجاف",
      q: "ماذا سيحدث للأودية الجافة في المناطق الصحراوية عند هطول أمطار غزيرة عليها؟",
      choices: [
        ["تجري فيها المياه من جديد، لأنها مجارٍ مائية قديمة نشأت بفعل جريان مياه الأمطار الغزيرة", 1, "صحيح: الوديان «مجارٍ مائية قديمة نشأت بفعل جريان مياه الأمطار الغزيرة» ص٩٦ — نشاط (١) ص٩٩."],
        ["تتحوّل إلى كثبان رملية", 0, "الكثبان تتكوّن بفعل الرياح لا الأمطار (ص٩٧)."],
        ["لا يتغيّر فيها شيء لأنها جافة", 0, "راقب الوادي بعد المطر مرة أخرى."]
      ],
      hint: "تذكّر تعريف الوديان: كيف نشأت أول مرة؟ (ص٩٦)",
      stamp: "معجم البلدان", env: "desert"
    },
    final: {
      kicker: "الختام", title: "خريطتي", sub: "نشاط (١) و(٢) ص٤١، نشاط (٣) ص٩٩",
      land: "عُدتَ إلى غرفة الخرائط ومعك خمسة أختام. الآن تثبت ما تعلّمته على الخريطة.",
      trace: "", mission: "حدّد المواقع على الخريطة، ورتّب أختامك على خط الزمن، ثم أجب عن سؤال الكتاب.",
      steps: ["حدّد المواقع الثلاثة", "رتّب الأختام زمنياً", "أجب عن سؤال الكتاب"],
      place1: "اختر رمزاً، ثم انقر مكانه على الخريطة (نشاط ١ ص٤١)",
      sym: { ubaid: "حضارة العُبيد", hellen: "الحضارة الهلنستية", wara: "وارة" },
      placed: "في مكانه الصحيح", farAway: "ليس هنا؛ راجع شكل (٤) ص٣٨",
      order: "رتّب الأختام من الأقدم إلى الأحدث", orderHelp: "انقر الأختام بالترتيب الزمني.",
      orderOk: "خط الزمن صحيح", orderBad: "ليس هذا الأقدم بعد",
      q: "ما الأدلة التي تؤكد على عراقة الجذور الحضارية والعربية والإسلامية لأرض الكويت؟ اختر كل ما ينطبق.",
      multi: [
        ["آثار حقبة العُبيد في الصبية: منازل مستطيلة وأفران وأوانٍ فخارية", 1],
        ["معابد ونقوش وتماثيل الحضارة الهلنستية في جزيرة فيلكا", 1],
        ["ارتباط أوارة بأيام العرب، وذكرها في الشعر العربي", 1],
        ["كثبان أم نقا الرملية", 0],
        ["معركة ذات السلاسل في كاظمة", 1],
        ["مواضع ذكرها ياقوت الحموي في «معجم البلدان»", 1],
        ["منخفض أم الرمم", 0]
      ],
      check: "تحقّق", multiOk: "أحسنت: هذه شواهد عراقة أرض الكويت (ص٤٠).", multiBad: "راجع اختياراتك: بعضها من مظاهر السطح لا من الشواهد الحضارية.",
      complete: "اكتمل جوازك!", completeSub: "عُد الآن إلى كتابك: نفّذ نشاط (١) ص٤١ على خريطة الكتاب، ونشاط (٣) ص٩٩.",
      hint: "الشاهد الحضاري أثرٌ تركه الإنسان، لا شكلٌ صنعته الطبيعة. (ص٣٨)"
    }
  },
  features: {
    batin: "وادي الباطن", zour: "جال الزور", rawd: "خبرة الروضتين", aish: "خبرة أم العيش", naqa: "كثبان أم نقا",
    rimam: "منخفض أم الرمم", liyah: "تلال اللياح", maru: "تلال كراع المرو", dibdiba: "سهل الدبدبة", adan: "سهل العدان",
    ahmadi: "هضبة الأحمدي", burgan: "تل برقان", bay: "جون الكويت", ard: "رأس الأرض", abdulla: "خور عبد الله",
    bubiyan: "جزيرة بوبيان", failaka: "جزيرة فيلكا", gulf: "الخليج العربي"
  },
  hist: { sabiya: "الصبية", failaka: "فيلكا", wara: "وارة (أوارة)", kazma: "كاظمة", shaqaya: "الشقايا (الشجي)",
          sadah: "السادة (السيدان)", huma: "حومة (حومان)", dibdiba: "الدبدبة (الدو)" }
},

en: {
  dir: "ltr", lang: "en",
  app: "The Explorer's Journey", appSub: "Land & Legacy",
  school: "Talha bin Obaidullah Secondary School (Boys)",
  google: "Google Innovation Group · Pioneering Lesson 1",
  district: "Al-Ahmadi Educational District, Sabah Al-Ahmad City",
  principal: "School principal: Dr. Nasser Al-Azmi",
  teamTitle: "Creativity Team",
  team: ["Ghanem Al-Batti (team lead)", "Haydar Almaateeq (game design)", "Yahya Al-Nuwaiem", "Bader Habib", "Mubarak Al-Ajmi"],
  rights: "© 2026 Creativity Team, Talha bin Obaidullah Secondary School, Al-Ahmadi Educational District. All rights reserved.",
  sep: ", ",
  start: "Start the journey", cont: "Continue", back: "Back", close: "Close", next: "Next", done: "Done",
  map: "Map", passport: "Passport", settings: "Settings", guide: "Guide", real: "Real place",
  land: "Land", trace: "Legacy", mission: "Your mission", question: "Lesson question", bookQ: "Textbook question",
  answer: "Answer", tryAgain: "Try again", correct: "Correct", wrong: "Not this one",
  stampEarned: "Station stamp earned", go: "Go to station", locked: "Unlocks after the previous station",
  station: "Station", of: "of", final: "Finale", startSt: "Start",
  enterVR: "Headset", cardboard: "Cardboard", board: "Board", tablet: "Tablet",
  mode: "View mode", language: "Language", sound: "Sounds", narration: "Guide voice",
  unlockAll: "Unlock all stations (demo)", reset: "Start over", credits: "Sources",
  yourName: "Explorer's name", changeAvatar: "Character image from Gemini", printPassport: "Print passport",
  guideTitle: "Journey Guide", guideLink: "Ask the “Journey Guide” Gem in Gemini",
  guideNote: "The guide gives a hint, not the answer.",
  illustrative: "Illustrative scene",
  exag: "Heights vertically exaggerated for clarity",
  dragHint: "Drag to look around", gyroHint: "Move the device to look around", gazeHint: "Hold your gaze on a button to select it",
  loading: "Loading the real terrain…",
  coords: "Coordinates",
  listen: "Listen", playAgain: "Replay",
  lockedToast: "Finish the previous station first",
  credText: [
    "Elevation: SRTM via Terrarium tiles (Mapzen / AWS Open Data).",
    "Satellite imagery: Sentinel-2 cloudless 2023 by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2023), CC BY-NC-SA 4.0.",
    "Borders and coastlines: Natural Earth.",
    "Content: Grade 10 Social Studies, “State of Kuwait: Journey and Entity” 2026/2027, pp. 37–41 and 91–99.",
    "Temples, ruins and pottery are illustrative models, not archaeological surveys."
  ],
  stations: {
    start: {
      kicker: "Start · Map room", title: "The Tilted Map", sub: "p. 95 · Fig. (4) p. 38",
      land: "This is a 3D map of Kuwait built from real elevation data. Before you set off, think: if rain fell on Kuwait, where would it flow?",
      trace: "The “Legacy” layer shows Kuwait's archaeological and historical sites from Fig. (4) p. 38, over the landforms.",
      mission: "Drop rain on the map and watch which way it flows, then switch on the “Legacy” layer.",
      steps: ["Drop the rain", "Switch on the Legacy layer", "Answer the question"],
      rain: "Drop rain", layerLand: "Landforms", layerTrace: "Historic sites",
      conclusion: "“Kuwait's surface is generally flat… and slopes gradually from west to east toward the Arabian Gulf” (p. 95)",
      slope: "The surface slopes from west to east",
      q: "Where did the rain flow on the map?",
      choices: [
        ["East, toward the Arabian Gulf", 1, "Correct: the surface slopes gradually from west to east toward the Gulf (p. 95)."],
        ["West, toward Wadi Al-Batin", 0, "Watch the drops again: where do they disappear?"],
        ["Nowhere, the surface is perfectly flat", 0, "It is generally flat, but its gentle slope is its key feature (p. 95)."]
      ],
      hint: "Follow one drop from the west of the map until it disappears. (p. 95)",
      intro: "Welcome, explorer. In front of you is Kuwait, built from real elevation data."
    },
    sabiya: {
      kicker: "Station 1 of 5", title: "As-Sabiyah", sub: "Ubaid culture · 6th millennium BC",
      era: "6th millennium BC", pages: "Land p. 98 · Legacy pp. 38–39",
      land: "You are on the northern shore of Kuwait Bay. Coastal forms here include Ras As-Sabiyah (cape) and Khor As-Sabiyah; a khor is a narrow inlet reaching from the sea into the land (p. 98).",
      trace: "Excavations at As-Sabiyah uncovered remains from the Ubaid period, one of the oldest urban settlements in the Gulf, in the 6th millennium BC. The main evidence: rectangular houses, ovens and pottery (pp. 38–39).",
      place: "You are standing at the Bahra 1 archaeological site in As-Sabiyah.",
      mission: "Brush the sand off the dig until the house foundations appear, then collect the five potsherds to rebuild the pot.",
      steps: ["Brush away the sand", "Collect the potsherds", "Answer the lesson question"],
      brush: "Brush the sand with the pointer", found1: "Rectangular house foundations and an oven", found2: "The pot is complete",
      shard: "Potsherd",
      q: "What do the houses, ovens and pottery tell us about life in As-Sabiyah?",
      choices: [
        ["People had settled down and organised their daily life", 1, "“The finds show that people at that time knew settlement and organised their daily lives” (p. 39)."],
        ["People were always on the move and never settled", 0, "People who build multi-room houses and ovens do not move every day."],
        ["People lived there after the rise of Islam", 0, "The Ubaid period is the 6th millennium BC (p. 39)."]
      ],
      hint: "Look at what you uncovered: a house with rooms, an oven, a pot. Would nomads build this? (p. 39)",
      stamp: "Ubaid culture", env: "coast"
    },
    failaka: {
      kicker: "Station 2 of 5", title: "Failaka Island", sub: "Ikaros · 4th century BC",
      era: "4th century BC", pages: "Land p. 97 · Legacy p. 39",
      land: "Failaka is one of Kuwait's nine islands. It was inhabited, and its location supported seafaring, trade, navigation and fishing (p. 97).",
      trace: "Failaka was known as “Ikaros” in the Hellenistic age, after the influence of Alexander the Great's conquests reached the region in the 4th century BC. Excavations revealed Greek-style temples, inscriptions and statues (p. 39).",
      place: "You are at the island's south-west corner, the site of the Hellenistic fortress.",
      mission: "Move the time slider from today's ruins to the temple as it once stood, then find the columns and the inscription.",
      steps: ["Rebuild the temple with the time slider", "Discover the columns", "Discover the inscription", "Answer the lesson question"],
      now: "Ruins today", then: "Ikaros · 4th c. BC", slider: "Time slider",
      columns: "Columns", columnsInfo: "Greek-style columns: evidence of “temples with Greek architecture” (p. 39).",
      inscr: "Inscription", inscrInfo: "A stone with Greek letters: evidence of “inscriptions and ancient writings” (p. 39). The text shown is illustrative.",
      q: "Why did Failaka become a centre linking the civilisations of East and West?",
      choices: [
        ["It was influenced by Greek civilisation after Alexander's conquests, and Kuwait's location made it a meeting point of civilisations", 1, "Correct (p. 39): Greek influence plus Kuwait's strategic location."],
        ["It is Kuwait's largest island", 0, "The largest island is Bubiyan (p. 97)."],
        ["It is Kuwait's highest point", 0, "Failaka is low-lying; the highest ground is in the west (p. 96)."]
      ],
      hint: "Find a style in the temple that came from the West, then remember where the island lies. (p. 39)",
      stamp: "Ikaros", env: "coast"
    },
    wara: {
      kicker: "Station 3 of 5", title: "Wara Hill", sub: "Day of Uwara · pre-Islamic era",
      era: "Pre-Islamic era", pages: "Land pp. 95–96 · Legacy p. 40",
      land: "Kuwait's southern hills include Wara Hill and the Burgan hills. Hills are land higher than its surroundings, but lower than mountains (p. 96). To the north-east lies the Ahmadi Plateau: high land with a flat top that extends over a wide area, about 125–137 m high (p. 95).",
      trace: "Uwara (today Wara) is linked to famous “Days of the Arabs”: the First Day of Uwara, between Al-Mundhir ibn Ma' As-Sama' and Bakr ibn Wa'il, and the Second, between Bani Tamim and 'Amr ibn Hind, king of Al-Hira. It appears in Arabic poetry of the Islamic era (p. 40).",
      place: "You are on the nearest isolated hill to Wara's position in Fig. (4): it rises about 40 m above its surroundings.",
      verse1: "وَلَسْنا بِذَبْحِ الجَيْشِ يَوْمَ أُوارَةٍ", verse2: "وَلَمْ يَسْتَبِحْنا عامِرٌ وَقَنابِلُهْ",
      poet: "Jarir · Fig. (6) p. 40",
      mission: "Listen to Jarir's verse, then turn north-east toward the Ahmadi Plateau and compare what you stand on with what you see.",
      steps: ["Listen to Jarir's verse", "Find the Ahmadi Plateau", "Compare the elevation profile", "Answer the lesson question"],
      ahmadi: "Ahmadi Plateau", ahmadiDist: "21 km · 125–137 m (p. 95)",
      youHere: "You are here: hill · 117 m",
      profileTitle: "Real elevation profile: Wara Hill to the Ahmadi Plateau",
      profileHill: "Hill: a sharp rise over a small area", profilePlateau: "Plateau: a broad high area",
      q: "Distinguish between a hill and a plateau using what you saw.",
      choices: [
        ["A hill rises above its surroundings over a small area; a plateau is high land with a flat top that extends over a wide area", 1, "Correct: the textbook definitions (pp. 95–96), as the profile shows."],
        ["A hill is a hollow where rain collects; a plateau is sand piled by wind", 0, "Those are a khabra and sand dunes (p. 97)."],
        ["There is no difference; both are coastal forms", 0, "Hills and plateaus are desert landforms (pp. 95–96)."]
      ],
      hint: "In the profile, compare how wide each high area is, not only how high. (pp. 95–96)",
      stamp: "Day of Uwara", env: "desert"
    },
    kazma: {
      kicker: "Station 4 of 5", title: "Kazma", sub: "Dhat As-Salasil · 12 AH / 633 AD",
      era: "12 AH / 633 AD", pages: "Land pp. 96, 98 · Legacy p. 40",
      land: "You are on the edge of Jal Az-Zor, a rocky escarpment along the north-west shore of Kuwait Bay (p. 96). Below you is Kazma Bay, branching west from Kuwait Bay (p. 98).",
      trace: "In the Islamic era Kazma became a launch point for the Islamic conquests toward Iraq and Persia, and saw the Battle of Dhat As-Salasil in 12 AH / 633 AD, led by the noble Companion Khalid ibn Al-Walid (may Allah be pleased with him) against the Sasanian army led by Hormuz ibn Ardashir (p. 40).",
      place: "The edge of Jal Az-Zor: about 140 m high, with the water some 4 km below you.",
      mission: "Play the battle map on the land of Kazma itself, then discover the two directions the conquests took.",
      steps: ["Play the battle map", "Discover the two directions", "Answer the lesson question"],
      play: "Play the battle map",
      armyA: "Muslim army", armyAsub: "led by Khalid ibn Al-Walid",
      armyB: "Sasanian army", armyBsub: "led by Hormuz ibn Ardashir",
      battle: "Dhat As-Salasil · 12 AH / 633 AD",
      toIraq: "Toward Iraq", toPersia: "Toward Persia",
      noFigures: "No historical figures are depicted here; the battle is shown as map symbols.",
      q: "Why was Kazma a launch point for the conquests toward Iraq and Persia?",
      choices: [
        ["Because Kuwait lies between the Arabian Peninsula, Iraq and Persia", 1, "Correct: “Kuwait's location between the Arabian Peninsula, Iraq and Persia gave it great importance since ancient times” (p. 40)."],
        ["Because it is Kuwait's highest point", 0, "The highest ground is in the west; Kazma is on the coast (pp. 96, 98)."],
        ["Because it is an island far from the mainland", 0, "Kazma is on the mainland, by Kazma Bay (p. 98)."]
      ],
      hint: "Look at what surrounds Kuwait: what is to the north? to the east? (p. 40)",
      stamp: "Dhat As-Salasil", env: "coast"
    },
    shaqaya: {
      kicker: "Station 5 of 5", title: "Al-Shaqaya", sub: "Mu'jam Al-Buldan · Yaqut Al-Hamawi",
      era: "7th century AH", pages: "Land p. 96 · Legacy p. 40 · Activity (1) p. 99",
      land: "In the west the land rises; Al-Dibdibah plain covers the west and south, and Wadi Al-Batin runs along the western border. Wadis are ancient water channels carved by heavy rain that dried up over time (p. 96).",
      trace: "The historian and geographer Yaqut Al-Hamawi, in his “Mu'jam Al-Buldan”, mentioned ancient places in Kuwait: As-Sidan (today As-Sadah), Ash-Shaji (today Al-Shaqaya), Hawman (today Huma) and Ad-Daw (today Al-Dibdibah) (p. 40).",
      place: "You are on the highest point inside Kuwait's borders in the elevation data: about 299 m, with Wadi Al-Batin below you.",
      mission: "Match Yaqut's old names to today's places, then summon the rain and watch Wadi Al-Batin.",
      steps: ["Match the four names", "Summon the rain", "Answer the textbook question"],
      matchTitle: "Names from “Mu'jam Al-Buldan”", matchHelp: "Pick an old name, then pick today's place on the map.",
      old: { sadah: "As-Sidan", shaqaya: "Ash-Shaji", huma: "Hawman", dibdiba: "Ad-Daw" },
      now: { sadah: "As-Sadah", shaqaya: "Al-Shaqaya", huma: "Huma", dibdiba: "Al-Dibdibah" },
      rain: "Summon the rain", wadi: "Wadi Al-Batin", highest: "Highest point · 299 m",
      flood: "Water runs in the dry wadi",
      q: "What happens to dry wadis in desert areas when heavy rain falls on them?",
      choices: [
        ["Water flows in them again, because they are ancient channels carved by heavy rain", 1, "Correct: wadis are “ancient water channels formed by heavy rainfall” (p. 96) — Activity (1) p. 99."],
        ["They turn into sand dunes", 0, "Dunes are formed by wind, not rain (p. 97)."],
        ["Nothing changes because they are dry", 0, "Watch the wadi after the rain again."]
      ],
      hint: "Recall the definition of a wadi: how did it form in the first place? (p. 96)",
      stamp: "Mu'jam Al-Buldan", env: "desert"
    },
    final: {
      kicker: "Finale", title: "My Map", sub: "Activities (1) & (2) p. 41 · Activity (3) p. 99",
      land: "You are back in the map room with five stamps. Now prove what you learned on the map.",
      trace: "", mission: "Mark the sites on the map, put your stamps on the timeline, then answer the textbook question.",
      steps: ["Mark the three sites", "Order the stamps in time", "Answer the textbook question"],
      place1: "Pick a symbol, then tap its place on the map (Activity 1, p. 41)",
      sym: { ubaid: "Ubaid culture", hellen: "Hellenistic civilisation", wara: "Wara" },
      placed: "In the right place", farAway: "Not here; check Fig. (4) p. 38",
      order: "Order the stamps from oldest to newest", orderHelp: "Tap the stamps in time order.",
      orderOk: "The timeline is correct", orderBad: "That is not the oldest yet",
      q: "What evidence confirms the deep civilisational, Arab and Islamic roots of Kuwait? Choose all that apply.",
      multi: [
        ["Ubaid-period remains at As-Sabiyah: rectangular houses, ovens, pottery", 1],
        ["Hellenistic temples, inscriptions and statues on Failaka", 1],
        ["Uwara's link to the Days of the Arabs, and its mention in poetry", 1],
        ["The Umm Naqa sand dunes", 0],
        ["The Battle of Dhat As-Salasil at Kazma", 1],
        ["Places named by Yaqut Al-Hamawi in “Mu'jam Al-Buldan”", 1],
        ["The Umm Al-Rimam depression", 0]
      ],
      check: "Check", multiOk: "Well done: this is the evidence of Kuwait's deep roots (p. 40).", multiBad: "Check again: some of these are landforms, not human heritage.",
      complete: "Your passport is complete!", completeSub: "Now back to your textbook: do Activity (1) p. 41 on the book's map, and Activity (3) p. 99.",
      hint: "Heritage evidence is something people left behind, not a shape made by nature. (p. 38)"
    }
  },
  features: {
    batin: "Wadi Al-Batin", zour: "Jal Az-Zor", rawd: "Al-Rawdatain Khabra", aish: "Umm Al-Aish Khabra", naqa: "Umm Naqa Dunes",
    rimam: "Umm Al-Rimam Depr.", liyah: "Al-Liyah Hills", maru: "Kura Al-Maru Hills", dibdiba: "Al-Dibdibah Plain", adan: "Al-Adan Plain",
    ahmadi: "Ahmadi Plateau", burgan: "Burgan Hill", bay: "Kuwait Bay", ard: "Ras Al-Ard", abdulla: "Khor Abdullah",
    bubiyan: "Bubiyan Island", failaka: "Failaka Island", gulf: "Arabian Gulf"
  },
  hist: { sabiya: "As-Sabiyah", failaka: "Failaka", wara: "Wara (Uwara)", kazma: "Kazma", shaqaya: "Al-Shaqaya (Ash-Shaji)",
          sadah: "As-Sadah (As-Sidan)", huma: "Huma (Hawman)", dibdiba: "Al-Dibdibah (Ad-Daw)" }
}
};

// المواقع (خط الطول، خط العرض) — معالم شكل (١٩) وشكل (٤)
RX.GEO = {
  features: {
    batin: [47.0494, 29.5994], zour: [47.9132, 29.5602], rawd: [47.7186, 29.8186], aish: [47.9132, 29.762], naqa: [47.7769, 29.8911], rimam: [47.9641, 29.6836], liyah: [47.3772, 29.5806], maru: [47.5988, 29.4746], dibdiba: [47.3802, 29.2395], adan: [48.0719, 29.2308], ahmadi: [48.058, 29.094], burgan: [47.8473, 29.0784], bay: [47.9311, 29.4717], ard: [48.0763, 29.3237], abdulla: [48.3548, 29.8476], bubiyan: [48.2515, 29.7533], failaka: [48.3278, 29.4238], gulf: [48.62, 29.12]
  },
  hist: { sabiya: [47.825, 29.513], failaka: [48.33, 29.42], wara: [47.875, 28.976], kazma: [47.688, 29.376],
          shaqaya: [46.721, 29.190], sadah: [47.49, 29.224], huma: [46.976, 29.486], dibdiba: [47.335, 29.089] },
  featKind: { batin: "wadi", zour: "hill", rawd: "khabra", aish: "khabra", naqa: "dune", rimam: "wadi", liyah: "hill", maru: "hill",
    dibdiba: "plain", adan: "plain", ahmadi: "plateau", burgan: "hill", bay: "bay", ard: "cape", abdulla: "khor", bubiyan: "island", failaka: "island", gulf: "sea" }
};
RX.ORDER = ["sabiya", "failaka", "wara", "kazma", "shaqaya"];
