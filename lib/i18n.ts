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
  "preview.emptyName": { ar: "اسم المطعم", en: "Restaurant name" },
  "preview.emptyValue": { ar: "—", en: "—" },

  // ----- Fields of step 1 -----
  "field.restaurantName": { ar: "اسم المطعم", en: "Restaurant name" },
  "field.restaurantName.placeholder": { ar: "مثال: مطعم كذا", en: "e.g. My Restaurant" },
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
  "error.logoMissing": { ar: "رفع الشعار مطلوب", en: "Logo upload is required" },
  "error.menuMissing": { ar: "رفع المنيو مطلوب", en: "Menu upload is required" },
  "error.maxBranches": { ar: "أقصى عدد للفروع فرعين", en: "You can add at most 2 branches" },
  "error.minBranch": { ar: "يجب إضافة فرع واحد على الأقل", en: "Add at least one branch" },
  "error.submit": { ar: "حدث خطأ، حاول مرة أخرى", en: "Something went wrong, please try again" },
  "error.phone": { ar: "رقم الجوال غير صحيح", en: "Invalid mobile number" },
  "error.email": { ar: "البريد الإلكتروني غير صحيح", en: "Invalid email address" },
  "error.email.invalid": { ar: "أدخل بريد إلكتروني صحيح", en: "Enter a valid email address" },
  "error.name.invalid": { ar: "استخدم حروف عربية أو إنجليزية فقط", en: "Use Arabic or English letters only" },
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

  // ----- Submit result -----
  "success.title": { ar: "تم تسجيل مطعمك بنجاح", en: "Your restaurant is registered" },
  "success.body": {
    ar: "شكراً لك، استلمنا بيانات {name} وسيراجعها فريق Nawy Orders ثم يتواصل معك.",
    en: "Thank you, we received the data of {name} and the Nawy Orders team will review it.",
  },
  "success.reference": { ar: "رقم الطلب", en: "Reference number" },
  "success.mock": {
    ar: "نسخة تجريبية: البيانات لم يتم ارسالها الى خادم حقيقي بعد، وسيتم ربط الحفظ بقاعدة البيانات لاحقاً.",
    en: "Demo version: nothing was sent to a real server yet, the real save will be connected later.",
  },
  "success.restart": { ar: "تسجيل مطعم آخر", en: "Register another restaurant" },
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
