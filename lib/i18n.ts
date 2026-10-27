// This file holds ALL the visible text of the app, in Arabic and in English.
// Every key has the same meaning in the two languages. Components never write text themselves.

import type { Lang } from "./types";

/** One piece of text in both languages. */
type TranslationEntry = {
  ar: string;
  en: string;
};

/** All the text of the app. The keys are the same in both languages. */
export const translations = {
  // ----- App shell -----
  "app.title": { ar: "تسجيل مطعم جديد", en: "New Restaurant Registration" },
  "app.langToggle": { ar: "English", en: "العربية" },
  "app.brand": { ar: "Nawy Orders", en: "Nawy Orders" },
  "app.logoAlt": { ar: "شعار ناوي أوردرز", en: "Nawy Orders logo" },

  // Branch coordinates
  "branch.latitude": { ar: "خط العرض", en: "Latitude" },
  "branch.longitude": { ar: "خط الطول", en: "Longitude" },
  "branch.coordsHint": {
    ar: "يتم تعبئته تلقائياً من الخريطة أو البحث",
    en: "Filled automatically from the map or search",
  },

  // ----- Steps -----
  "step.counter": { ar: "الخطوة {current} من {total}", en: "Step {current} of {total}" },
  "step.main": { ar: "البيانات الأساسية", en: "Main Info" },
  "step.identity": { ar: "هوية المطعم", en: "Restaurant Identity" },
  "step.branches": { ar: "الفروع", en: "Branches" },
  "step.package": { ar: "الباقة", en: "Package" },
  "step.1": { ar: "البيانات الأساسية", en: "Main Info" },
  "step.2": { ar: "هوية المطعم", en: "Restaurant Identity" },
  "step.3": { ar: "الفروع", en: "Branches" },
  "step.4": { ar: "الباقة", en: "Package" },

  // ----- Buttons -----
  "btn.back": { ar: "رجوع", en: "Back" },
  "btn.next": { ar: "التالي", en: "Next" },
  "btn.finish": { ar: "اتمام التسجيل", en: "Complete Registration" },
  "btn.change": { ar: "تغيير", en: "Change" },
  "btn.remove": { ar: "حذف", en: "Remove" },

  // ----- Live preview -----
  "preview.label": { ar: "معاينة مباشرة", en: "Live Preview" },
  "preview.hint": {
    ar: "يتم تحديث المعاينة تلقائياً أثناء تعبئة البيانات",
    en: "The preview updates automatically as you fill in the form",
  },
  "preview.restaurant": { ar: "بيانات المطعم", en: "Restaurant info" },
  "preview.owner": { ar: "المالك", en: "Owner" },
  "preview.phone": { ar: "الجوال", en: "Mobile" },
  "preview.email": { ar: "البريد", en: "Email" },
  "preview.branches": { ar: "الفروع", en: "Branches" },
  "preview.noBranches": { ar: "لم يتم إضافة فروع بعد", en: "No branches added yet" },
  "preview.menu": { ar: "المنيو", en: "Menu" },
  "preview.viewMenu": { ar: "عرض المنيو", en: "View menu" },
  "preview.noMenu": { ar: "لم يتم رفع المنيو بعد", en: "No menu uploaded yet" },
  "preview.plan": { ar: "الباقة", en: "Package" },
  "preview.hours": { ar: "مواعيد العمل", en: "Opening hours" },
  "preview.location": { ar: "الموقع", en: "Location" },
  "preview.noLocation": { ar: "لم يتم تحديد الموقع بعد", en: "Location not set yet" },
  "preview.emptyValue": { ar: "—", en: "—" },

  // ----- Fields of step 1 -----
  "field.restaurantNameAr": { ar: "اسم المطعم بالعربي", en: "Restaurant name (Arabic)" },
  "field.restaurantNameAr.placeholder": { ar: "مثال: مطعم كذا", en: "مثال: مطعم كذا" },
  "field.restaurantNameEn": { ar: "اسم المطعم بالإنجليزي", en: "Restaurant name (English)" },
  "field.restaurantNameEn.placeholder": { ar: "e.g. My Restaurant", en: "e.g. My Restaurant" },
  "field.logo": { ar: "الشعار", en: "Logo" },
  "field.logo.drop": { ar: "اسحب الشعار هنا أو اضغط للرفع", en: "Drag the logo here or click to upload" },
  "field.logo.hint": { ar: "PNG أو JPG أو SVG — بحد أقصى 5 ميجا بايت", en: "PNG, JPG or SVG — max 5 MB" },
  "field.logo.missing": { ar: "لم يتم رفع الشعار بعد", en: "No logo uploaded yet" },
  "field.menu": { ar: "إضافة المنيو", en: "Add menu" },
  "field.menu.drop": { ar: "اسحب ملف المنيو هنا أو اضغط للرفع", en: "Drag the menu file here or click to upload" },
  "field.menu.hint": { ar: "PDF أو PNG أو JPG — بحد أقصى 10 ميجا بايت", en: "PDF, PNG or JPG — max 10 MB" },
  "field.menu.missing": { ar: "لم يتم رفع المنيو بعد", en: "No menu uploaded yet" },
  "field.ownerName": { ar: "اسم المالك", en: "Owner full name" },
  "field.ownerName.placeholder": { ar: "مثال: احمد محمود", en: "e.g. Ahmed Mahmoud" },
  "field.phone": { ar: "رقم الجوال", en: "Mobile number" },
  "field.phone.placeholder": { ar: "01012345678", en: "01012345678" },
  "field.phone.hint": {
    ar: "رقم مصري يبدأ بـ 010 أو 011 أو 012 أو 015",
    en: "Egyptian number starting with 010, 011, 012 or 015",
  },
  "field.email": { ar: "البريد الإلكتروني", en: "Email" },
  "field.email.placeholder": { ar: "name@restaurant.com", en: "name@restaurant.com" },

  // ----- Fields of step 2 -----
  "identity.heading": {
    ar: "اختر اللون الذي يعبر عن علامتك التجارية",
    en: "Choose the color that represents your brand",
  },
  "identity.primary": { ar: "اللون الأساسي", en: "Primary color" },
  "identity.background": { ar: "لون الخلفية", en: "Background color" },
  "identity.accent": { ar: "اضف لون اخر", en: "Add another color" },
  "identity.recommended": { ar: "الالوان الموصى بها", en: "Recommended colors" },
  "identity.logo": { ar: "شعار المطعم", en: "Restaurant logo" },
  "identity.hex": { ar: "قيمة اللون", en: "Hex value" },
  "identity.hex.placeholder": { ar: "#E43820", en: "#E43820" },
  "identity.optional": { ar: "اختياري", en: "Optional" },
  "identity.palette.loading": { ar: "جاري اقتراح ألوان من الشعار...", en: "Suggesting colors from the logo..." },
  "identity.palette.option1": { ar: "الاقتراح الأول", en: "Suggestion 1" },
  "identity.palette.option2": { ar: "الاقتراح الثاني", en: "Suggestion 2" },
  "identity.palette.option3": { ar: "الاقتراح الثالث", en: "Suggestion 3" },
  "identity.palette.fallback": {
    ar: "لم نتمكن من اقتراح ألوان من هذا الشعار، اختر من الألوان الجاهزة.",
    en: "We could not suggest colors from this logo, pick one of the ready colors.",
  },
  "identity.palette.lowContrast": {
    ar: "تباين الألوان منخفض، قد يكون النص صعب القراءة.",
    en: "The color contrast is low, so the text may be hard to read.",
  },
  "identity.palette.invalidFile": {
    ar: "تعذر قراءة ملف الشعار، جرّب صورة أخرى.",
    en: "Could not read the logo file, try another image.",
  },
  "identity.palette.rateLimited": {
    ar: "طلبات كثيرة في وقت قصير، انتظر قليلًا ثم أعد المحاولة.",
    en: "Too many requests, wait a moment then try again.",
  },
  "identity.palette.serverError": {
    ar: "تعذر اقتراح الألوان الآن.",
    en: "Could not suggest colors right now.",
  },
  "identity.palette.retry": { ar: "إعادة المحاولة", en: "Try again" },

  // ----- Fields of step 3 -----
  "branches.helper": {
    ar: "أضف فروع مطعمك ومواقعها ومواعيد العمل ليظهر للعملاء على الخريطة.",
    en: "Add your branches, their locations and opening hours so customers can see them on the map.",
  },
  "branches.add": { ar: "اضافة فرع جديد", en: "Add new branch" },
  "branches.count": { ar: "فرعين متصلين", en: "2 branches added" },
  "branch.title1": { ar: "الفرع الاول", en: "Branch 1" },
  "branch.title2": { ar: "الفرع الثاني", en: "Branch 2" },
  "branch.name": { ar: "اسم الفرع", en: "Branch name" },
  "branch.name.placeholder": { ar: "مثال: فرع المعادي", en: "e.g. Maadi branch" },
  "branch.address": { ar: "العنوان بالتفصيل", en: "Full address" },
  "branch.address.placeholder": {
    ar: "مثال: 12 شارع التسعين، التجمع الخامس، القاهرة",
    en: "e.g. 12 Ninety Street, Fifth Settlement, Cairo",
  },
  "branch.city": { ar: "المدينة", en: "City" },
  "branch.city.placeholder": { ar: "مثال: مدينة نصر", en: "e.g. Nasr City" },
  "branch.search": { ar: "ابحث عن العنوان", en: "Search address" },
  "branch.hours": { ar: "مواعيد العمل", en: "Opening hours" },
  "branch.hoursFrom": { ar: "من", en: "From" },
  "branch.hoursTo": { ar: "إلى", en: "To" },
  "branch.notFound": {
    ar: "لم نجد هذا العنوان، جرب كتابة اسم الشارع أو المنطقة",
    en: "Address not found, try the street or area name",
  },

  // ----- Map -----
  "map.hint": { ar: "اضغط على الخريطة لتحديد الموقع", en: "Click the map to set the location" },
  "map.comingSoon": { ar: "الخريطة هتتفعيل قريباً", en: "Map coming soon" },
  "map.loading": { ar: "جاري تحديد العنوان...", en: "Finding the address..." },
  "map.failed": { ar: "تعذر تحديد العنوان، اكتبه يدوياً", en: "Could not find the address, please type it" },

  // ----- Fields of step 4 -----
  "package.heading": { ar: "اختر الباقة المناسبة لمطعمك", en: "Choose the right package for your restaurant" },
  "package.loading": { ar: "جاري تحميل الباقات...", en: "Loading packages..." },
  "package.loadFailed": { ar: "تعذر تحميل الباقات", en: "Could not load packages" },
  "package.retry": { ar: "إعادة المحاولة", en: "Try again" },
  "package.noOffers": { ar: "لا توجد باقات متاحة حالياً", en: "No packages available right now" },
  "package.duration": { ar: "مدة الاشتراك", en: "Subscription duration" },
  "package.months3": { ar: "3 شهور", en: "3 months" },
  "package.months6": { ar: "6 شهور", en: "6 months" },
  "package.months12": { ar: "12 شهر", en: "12 months" },
  "package.monthsCount": { ar: "{count} شهور", en: "{count} months" },
  "package.plan.starter": { ar: "Starter", en: "Starter" },
  "package.plan.growth": { ar: "Growth", en: "Growth" },
  "package.feature.ai": { ar: "ميزات الذكاء الاصطناعي", en: "AI features" },
  "package.noSelection": { ar: "لم يتم اختيار باقة بعد", en: "No package selected yet" },
  "package.selected": { ar: "تم الاختيار", en: "Selected" },
  "package.features": { ar: "المميزات", en: "Features" },

  // ----- Errors -----
  "error.required": { ar: "هذا الحقل مطلوب", en: "This field is required" },
  "error.branch.city.required": { ar: "المدينة مطلوبة", en: "City is required" },
  "error.logoMissing": { ar: "رفع الشعار مطلوب", en: "Logo upload is required" },
  "error.menuMissing": { ar: "رفع المنيو مطلوب", en: "Menu upload is required" },
  "error.maxBranches": { ar: "أقصى عدد للفروع فرعين", en: "You can add at most 2 branches" },
  "error.minBranch": { ar: "يجب إضافة فرع واحد على الأقل", en: "Add at least one branch" },
  "error.submit": { ar: "حدث خطأ، حاول مرة أخرى", en: "Something went wrong, please try again" },
  "error.phone": { ar: "رقم الجوال غير صحيح", en: "Invalid mobile number" },
  "error.email": { ar: "البريد الإلكتروني غير صحيح", en: "Invalid email address" },
  "error.email.invalid": { ar: "أدخل بريد إلكتروني صحيح", en: "Enter a valid email address" },
  "error.name.invalid": { ar: "استخدم حروف عربية أو إنجليزية فقط", en: "Use Arabic or English letters only" },
  "error.nameAr.invalid": { ar: "استخدم حروف عربية فقط", en: "Use Arabic letters only" },
  "error.nameEn.invalid": { ar: "استخدم حروف إنجليزية فقط", en: "Use English letters only" },
  "error.name.length": { ar: "الاسم لازم يكون بين 2 و 60 حرف", en: "Name must be 2 to 60 characters" },
  "error.hours.equal": {
    ar: "وقت الغلق لازم يكون مختلف عن وقت الفتح",
    en: "Closing time must differ from opening time",
  },
  "error.color": { ar: "قيمة اللون غير صحيحة، استخدم صيغة #RRGGBB", en: "Invalid color value, use the #RRGGBB format" },
  "error.fileType": { ar: "صيغة الملف غير مدعومة", en: "Unsupported file format" },
  "error.fileSize": { ar: "حجم الملف أكبر من الحد المسموح", en: "The file is bigger than the allowed size" },
  "error.chooseOffer": { ar: "اختر الباقة والمدة", en: "Choose a package and duration" },
  "error.apiMissingConfig": { ar: "إعداد الخادم ناقص", en: "Server setup is incomplete" },
  "form.errorSummary": {
    ar: "يوجد حقول ناقصة أو غير صحيحة، راجع الحقول المميزة باللون الأحمر.",
    en: "Some fields are missing or invalid, please check the highlighted fields.",
  },

  // ----- Uploads and submit -----
  "upload.uploading": { ar: "جاري رفع الملف...", en: "Uploading file..." },
  "upload.done": { ar: "تم رفع الملف", en: "File uploaded" },
  "upload.failed": { ar: "فشل رفع الملف", en: "File upload failed" },
  "upload.retry": { ar: "إعادة الرفع", en: "Retry upload" },
  "upload.tooLarge": { ar: "حجم الملف أكبر من المسموح", en: "File is too large" },
  "upload.step.urls": { ar: "فشل تجهيز رابط الرفع", en: "Could not get the upload URL" },
  "upload.step.put": { ar: "فشل رفع الملف إلى التخزين", en: "Uploading the file to storage failed" },
  "upload.step.confirm": { ar: "فشل تأكيد الملف", en: "Confirming the file failed" },
  "submit.loading": { ar: "جاري الإرسال...", en: "Submitting..." },
  "submit.duplicate": { ar: "تم إرسال هذا الطلب من قبل", en: "This request was already submitted" },
  "submit.error.general": { ar: "في بيانات مطلوب تعديلها", en: "Some data needs correction" },
  "submit.success.title": { ar: "تم إرسال طلبك بنجاح", en: "Your request was submitted" },
  "submit.success.requestId": { ar: "رقم الطلب", en: "Request ID" },
  "submit.success.home": { ar: "الرئيسية", en: "Home" },
} as const;

/** The type of a translation key. */
export type TranslationKey = keyof typeof translations;

/** Reads one text in the wanted language. */
export function t(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>): string {
  let text: string = translations[key][lang];

  if (vars !== undefined) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}

/** The writing direction of a language. */
export function getDirection(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

/** The locale used to write the numbers of a language. */
export function getLocale(lang: Lang): string {
  return lang === "ar" ? "ar-EG" : "en-US";
}

/** Writes a number with the separators of the language. */
export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(getLocale(lang)).format(value);
}
