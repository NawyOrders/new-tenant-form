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
  "app.title": { ar: "ØªØ³Ø¬ÙŠÙ„ Ù…Ø·Ø¹Ù… Ø¬Ø¯ÙŠØ¯", en: "New Restaurant Registration" },
  "app.langToggle": { ar: "English", en: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" },
  "app.brand": { ar: "Nawy Orders", en: "Nawy Orders" },
  "app.logoAlt": { ar: "Ø´Ø¹Ø§Ø± Ù†ÙˆÙŠ Ø£ÙˆØ±Ø¯Ø±Ø²", en: "Nawy Orders logo" },

  // Branch coordinates
  "branch.latitude": { ar: "Ø®Ø· Ø§Ù„Ø¹Ø±Ø¶", en: "Latitude" },
  "branch.longitude": { ar: "Ø®Ø· Ø§Ù„Ø·ÙˆÙ„", en: "Longitude" },
  "branch.coordsHint": {
    ar: "ÙŠØªÙ… ØªØ¹Ø¨Ø¦ØªÙ‡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù…Ù† Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø£Ùˆ Ø§Ù„Ø¨Ø­Ø«",
    en: "Filled automatically from the map or search",
  },

  // ----- Steps -----
  "step.counter": { ar: "Ø§Ù„Ø®Ø·ÙˆØ© {current} Ù…Ù† {total}", en: "Step {current} of {total}" },
  "step.1": { ar: "Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø§Ø³Ø§Ø³ÙŠØ©", en: "Main Info" },
  "step.2": { ar: "Ù‡ÙˆÙŠØ© Ø§Ù„Ù…Ø·Ø¹Ù…", en: "Restaurant Identity" },
  "step.3": { ar: "Ø§Ù„ÙØ±ÙˆØ¹", en: "Branches" },
  "step.4": { ar: "Ø§Ù„Ø¨Ø§Ù‚Ø©", en: "Package" },

  // ----- Buttons -----
  "btn.back": { ar: "Ø±Ø¬ÙˆØ¹", en: "Back" },
  "btn.next": { ar: "Ø§Ù„ØªØ§Ù„ÙŠ", en: "Next" },
  "btn.finish": { ar: "Ø§ØªÙ…Ø§Ù… Ø§Ù„ØªØ³Ø¬ÙŠÙ„", en: "Complete Registration" },
  "btn.change": { ar: "ØªØºÙŠÙŠØ±", en: "Change" },
  "btn.remove": { ar: "Ø­Ø°Ù", en: "Remove" },

  // ----- Live preview -----
  "preview.label": { ar: "Ù…Ø¹Ø§ÙŠÙ†Ø© Ù…Ø¨Ø§Ø´Ø±Ø©", en: "Live Preview" },
  "preview.hint": {
    ar: "ÙŠØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø£Ø«Ù†Ø§Ø¡ ØªØ¹Ø¨Ø¦Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
    en: "The preview updates automatically as you fill in the form",
  },
  "preview.restaurant": { ar: "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø·Ø¹Ù…", en: "Restaurant info" },
  "preview.owner": { ar: "Ø§Ù„Ù…Ø§Ù„Ùƒ", en: "Owner" },
  "preview.phone": { ar: "Ø§Ù„Ø¬ÙˆØ§Ù„", en: "Mobile" },
  "preview.email": { ar: "Ø§Ù„Ø¨Ø±ÙŠØ¯", en: "Email" },
  "preview.branches": { ar: "Ø§Ù„ÙØ±ÙˆØ¹", en: "Branches" },
  "preview.noBranches": { ar: "Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© ÙØ±ÙˆØ¹ Ø¨Ø¹Ø¯", en: "No branches added yet" },
  "preview.menu": { ar: "Ø§Ù„Ù…Ù†ÙŠÙˆ", en: "Menu" },
  "preview.viewMenu": { ar: "Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù†ÙŠÙˆ", en: "View menu" },
  "preview.noMenu": { ar: "Ù„Ù… ÙŠØªÙ… Ø±ÙØ¹ Ø§Ù„Ù…Ù†ÙŠÙˆ Ø¨Ø¹Ø¯", en: "No menu uploaded yet" },
  "preview.plan": { ar: "Ø§Ù„Ø¨Ø§Ù‚Ø©", en: "Package" },
  "preview.noPlan": { ar: "Ù„Ù… ÙŠØªÙ… Ø§Ø®ØªÙŠØ§Ø± Ø¨Ø§Ù‚Ø© Ø¨Ø¹Ø¯", en: "No plan selected yet" },
  "preview.hours": { ar: "Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„", en: "Opening hours" },
  "preview.location": { ar: "Ø§Ù„Ù…ÙˆÙ‚Ø¹", en: "Location" },
  "preview.noLocation": { ar: "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¨Ø¹Ø¯", en: "Location not set yet" },
  "preview.emptyName": { ar: "Ø§Ø³Ù… Ø§Ù„Ù…Ø·Ø¹Ù…", en: "Restaurant name" },
  "preview.emptyValue": { ar: "â€”", en: "â€”" },

  // ----- Fields of step 1 -----
  "field.restaurantName": { ar: "Ø§Ø³Ù… Ø§Ù„Ù…Ø·Ø¹Ù…", en: "Restaurant name" },
  "field.restaurantName.placeholder": { ar: "Ù…Ø«Ø§Ù„: Ù…Ø·Ø¹Ù… ÙƒØ°Ø§", en: "e.g. My Restaurant" },
  "field.logo": { ar: "Ø§Ù„Ø´Ø¹Ø§Ø±", en: "Logo" },
  "field.logo.drop": { ar: "Ø§Ø³Ø­Ø¨ Ø§Ù„Ø´Ø¹Ø§Ø± Ù‡Ù†Ø§ Ø£Ùˆ Ø§Ø¶ØºØ· Ù„Ù„Ø±ÙØ¹", en: "Drag the logo here or click to upload" },
  "field.logo.hint": { ar: "PNG Ø£Ùˆ JPG Ø£Ùˆ SVG â€” Ø¨Ø­Ø¯ Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª", en: "PNG, JPG or SVG â€” max 5 MB" },
  "field.logo.missing": { ar: "Ù„Ù… ÙŠØªÙ… Ø±ÙØ¹ Ø§Ù„Ø´Ø¹Ø§Ø± Ø¨Ø¹Ø¯", en: "No logo uploaded yet" },
  "field.menu": { ar: "Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ÙŠÙˆ", en: "Add menu" },
  "field.menu.drop": { ar: "Ø§Ø³Ø­Ø¨ Ù…Ù„Ù Ø§Ù„Ù…Ù†ÙŠÙˆ Ù‡Ù†Ø§ Ø£Ùˆ Ø§Ø¶ØºØ· Ù„Ù„Ø±ÙØ¹", en: "Drag the menu file here or click to upload" },
  "field.menu.hint": { ar: "PDF Ø£Ùˆ PNG Ø£Ùˆ JPG â€” Ø¨Ø­Ø¯ Ø£Ù‚ØµÙ‰ 10 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª", en: "PDF, PNG or JPG â€” max 10 MB" },
  "field.menu.missing": { ar: "Ù„Ù… ÙŠØªÙ… Ø±ÙØ¹ Ø§Ù„Ù…Ù†ÙŠÙˆ Ø¨Ø¹Ø¯", en: "No menu uploaded yet" },
  "field.ownerName": { ar: "Ø§Ø³Ù… Ø§Ù„Ù…Ø§Ù„Ùƒ", en: "Owner full name" },
  "field.ownerName.placeholder": { ar: "Ù…Ø«Ø§Ù„: Ø§Ø­Ù…Ø¯ Ù…Ø­Ù…ÙˆØ¯", en: "e.g. Ahmed Mahmoud" },
  "field.phone": { ar: "Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„", en: "Mobile number" },
  "field.phone.placeholder": { ar: "01012345678", en: "01012345678" },
  "field.phone.hint": {
    ar: "Ø±Ù‚Ù… Ù…ØµØ±ÙŠ ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 010 Ø£Ùˆ 011 Ø£Ùˆ 012 Ø£Ùˆ 015",
    en: "Egyptian number starting with 010, 011, 012 or 015",
  },
  "field.email": { ar: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", en: "Email" },
  "field.email.placeholder": { ar: "name@restaurant.com", en: "name@restaurant.com" },

  // ----- Fields of step 2 -----
  "identity.heading": {
    ar: "Ø§Ø®ØªØ± Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ø°ÙŠ ÙŠØ¹Ø¨Ø± Ø¹Ù† Ø¹Ù„Ø§Ù…ØªÙƒ Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©",
    en: "Choose the color that represents your brand",
  },
  "identity.primary": { ar: "Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ø§Ø³Ø§Ø³ÙŠ", en: "Primary color" },
  "identity.background": { ar: "Ù„ÙˆÙ† Ø§Ù„Ø®Ù„ÙÙŠØ©", en: "Background color" },
  "identity.accent": { ar: "Ø§Ø¶Ù Ù„ÙˆÙ† Ø§Ø®Ø±", en: "Add another color" },
  "identity.recommended": { ar: "Ø§Ù„Ø§Ù„ÙˆØ§Ù† Ø§Ù„Ù…ÙˆØµÙ‰ Ø¨Ù‡Ø§", en: "Recommended colors" },
  "identity.logo": { ar: "Ø´Ø¹Ø§Ø± Ø§Ù„Ù…Ø·Ø¹Ù…", en: "Restaurant logo" },
  "identity.hex": { ar: "Ù‚ÙŠÙ…Ø© Ø§Ù„Ù„ÙˆÙ†", en: "Hex value" },
  "identity.hex.placeholder": { ar: "#E43820", en: "#E43820" },
  "identity.optional": { ar: "Ø§Ø®ØªÙŠØ§Ø±ÙŠ", en: "Optional" },

  // ----- Fields of step 3 -----
  "branches.helper": {
    ar: "Ø£Ø¶Ù ÙØ±ÙˆØ¹ Ù…Ø·Ø¹Ù…Ùƒ ÙˆÙ…ÙˆØ§Ù‚Ø¹Ù‡Ø§ ÙˆÙ…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ Ù„ÙŠØ¸Ù‡Ø± Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©.",
    en: "Add your branches, their locations and opening hours so customers can see them on the map.",
  },
  "branches.add": { ar: "Ø§Ø¶Ø§ÙØ© ÙØ±Ø¹ Ø¬Ø¯ÙŠØ¯", en: "Add new branch" },
  "branches.count": { ar: "ÙØ±Ø¹ÙŠÙ† Ù…ØªØµÙ„ÙŠÙ†", en: "2 branches added" },
  "branch.title1": { ar: "Ø§Ù„ÙØ±Ø¹ Ø§Ù„Ø§ÙˆÙ„", en: "Branch 1" },
  "branch.title2": { ar: "Ø§Ù„ÙØ±Ø¹ Ø§Ù„Ø«Ø§Ù†ÙŠ", en: "Branch 2" },
  "branch.name": { ar: "Ø§Ø³Ù… Ø§Ù„ÙØ±Ø¹", en: "Branch name" },
  "branch.name.placeholder": { ar: "Ù…Ø«Ø§Ù„: ÙØ±Ø¹ Ø§Ù„Ù…Ø¹Ø§Ø¯ÙŠ", en: "e.g. Maadi branch" },
  "branch.address": { ar: "Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø¨Ø§Ù„ØªÙØµÙŠÙ„", en: "Full address" },
  "branch.address.placeholder": {
    ar: "Ù…Ø«Ø§Ù„: 12 Ø´Ø§Ø±Ø¹ Ø§Ù„ØªØ³Ø¹ÙŠÙ†ØŒ Ø§Ù„ØªØ¬Ù…Ø¹ Ø§Ù„Ø®Ø§Ù…Ø³ØŒ Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©",
    en: "e.g. 12 Ninety Street, Fifth Settlement, Cairo",
  },
  "branch.search": { ar: "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", en: "Search address" },
  "branch.hours": { ar: "Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„", en: "Opening hours" },
  "branch.hoursFrom": { ar: "Ù…Ù†", en: "From" },
  "branch.hoursTo": { ar: "Ø¥Ù„Ù‰", en: "To" },
  "branch.notFound": {
    ar: "Ù„Ù… Ù†Ø¬Ø¯ Ù‡Ø°Ø§ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†ØŒ Ø¬Ø±Ø¨ ÙƒØªØ§Ø¨Ø© Ø§Ø³Ù… Ø§Ù„Ø´Ø§Ø±Ø¹ Ø£Ùˆ Ø§Ù„Ù…Ù†Ø·Ù‚Ø©",
    en: "Address not found, try the street or area name",
  },

  // ----- Map -----
  "map.hint": { ar: "Ø§Ø¶ØºØ· Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ù„ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…ÙˆÙ‚Ø¹", en: "Click the map to set the location" },
  "map.comingSoon": { ar: "Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ù‡ØªØªÙØ¹Ù„ Ù‚Ø±ÙŠØ¨Ø§Ù‹", en: "Map coming soon" },
  "map.loading": { ar: "Ø¬Ø§Ø±ÙŠ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†...", en: "Finding the address..." },
  "map.failed": { ar: "ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†ØŒ Ø§ÙƒØªØ¨Ù‡ ÙŠØ¯ÙˆÙŠØ§Ù‹", en: "Could not find the address, please type it" },

  // ----- Fields of step 4 -----
  "package.heading": { ar: "Ø§Ø®ØªØ± Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ù…Ø·Ø¹Ù…Ùƒ", en: "Choose the right package for your restaurant" },
  "package.monthly": { ar: "Ø´Ù‡Ø±ÙŠ", en: "Monthly" },
  "package.yearly": { ar: "Ø³Ù†ÙˆÙŠ", en: "Yearly" },
  "package.selected": { ar: "ØªÙ… Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±", en: "Selected" },
  "package.popular": { ar: "Ø±Ø§Ø¦Ø¬", en: "Popular" },
  "package.mostOrdered": { ar: "Ø§Ù„Ø§ÙƒØ«Ø± Ø·Ù„Ø¨Ø§", en: "Most ordered" },
  "package.perYear": { ar: "Ø¬.Ù…/ Ø³Ù†Ø©", en: "EGP/year" },
  "package.perMonth": { ar: "Ø¬.Ù…/ Ø´Ù‡Ø±", en: "EGP/month" },
  "package.features": { ar: "Ø§Ù„Ù…Ù…ÙŠØ²Ø§Øª", en: "Features" },

  // ----- Errors -----
  "error.required": { ar: "Ù‡Ø°Ø§ Ø§Ù„Ø­Ù‚Ù„ Ù…Ø·Ù„ÙˆØ¨", en: "This field is required" },
  "error.logoMissing": { ar: "Ø±ÙØ¹ Ø§Ù„Ø´Ø¹Ø§Ø± Ù…Ø·Ù„ÙˆØ¨", en: "Logo upload is required" },
  "error.menuMissing": { ar: "Ø±ÙØ¹ Ø§Ù„Ù…Ù†ÙŠÙˆ Ù…Ø·Ù„ÙˆØ¨", en: "Menu upload is required" },
  "error.maxBranches": { ar: "Ø£Ù‚ØµÙ‰ Ø¹Ø¯Ø¯ Ù„Ù„ÙØ±ÙˆØ¹ ÙØ±Ø¹ÙŠÙ†", en: "You can add at most 2 branches" },
  "error.minBranch": { ar: "ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© ÙØ±Ø¹ ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„", en: "Add at least one branch" },
  "error.submit": { ar: "Ø­Ø¯Ø« Ø®Ø·Ø£ØŒ Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰", en: "Something went wrong, please try again" },
  "error.phone": { ar: "Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„ ØºÙŠØ± ØµØ­ÙŠØ­", en: "Invalid mobile number" },
  "error.email": { ar: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­", en: "Invalid email address" },
  "error.color": { ar: "Ù‚ÙŠÙ…Ø© Ø§Ù„Ù„ÙˆÙ† ØºÙŠØ± ØµØ­ÙŠØ­Ø©ØŒ Ø§Ø³ØªØ®Ø¯Ù… ØµÙŠØºØ© #RRGGBB", en: "Invalid color value, use the #RRGGBB format" },
  "error.fileType": { ar: "ØµÙŠØºØ© Ø§Ù„Ù…Ù„Ù ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø©", en: "Unsupported file format" },
  "error.fileSize": { ar: "Ø­Ø¬Ù… Ø§Ù„Ù…Ù„Ù Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ø­Ø¯ Ø§Ù„Ù…Ø³Ù…ÙˆØ­", en: "The file is bigger than the allowed size" },
  "form.errorSummary": {
    ar: "ÙŠÙˆØ¬Ø¯ Ø­Ù‚ÙˆÙ„ Ù†Ø§Ù‚ØµØ© Ø£Ùˆ ØºÙŠØ± ØµØ­ÙŠØ­Ø©ØŒ Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ù…ÙŠØ²Ø© Ø¨Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ø£Ø­Ù…Ø±.",
    en: "Some fields are missing or invalid, please check the highlighted fields.",
  },

  // ----- Submit result -----
  "success.title": { ar: "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ù…Ø·Ø¹Ù…Ùƒ Ø¨Ù†Ø¬Ø§Ø­", en: "Your restaurant is registered" },
  "success.body": {
    ar: "Ø´ÙƒØ±Ø§Ù‹ Ù„ÙƒØŒ Ø§Ø³ØªÙ„Ù…Ù†Ø§ Ø¨ÙŠØ§Ù†Ø§Øª {name} ÙˆØ³ÙŠØ±Ø§Ø¬Ø¹Ù‡Ø§ ÙØ±ÙŠÙ‚ Nawy Orders Ø«Ù… ÙŠØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ.",
    en: "Thank you, we received the data of {name} and the Nawy Orders team will review it.",
  },
  "success.reference": { ar: "Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨", en: "Reference number" },
  "success.mock": {
    ar: "Ù†Ø³Ø®Ø© ØªØ¬Ø±ÙŠØ¨ÙŠØ©: Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ù… ÙŠØªÙ… Ø§Ø±Ø³Ø§Ù„Ù‡Ø§ Ø§Ù„Ù‰ Ø®Ø§Ø¯Ù… Ø­Ù‚ÙŠÙ‚ÙŠ Ø¨Ø¹Ø¯ØŒ ÙˆØ³ÙŠØªÙ… Ø±Ø¨Ø· Ø§Ù„Ø­ÙØ¸ Ø¨Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ø§Ø­Ù‚Ø§Ù‹.",
    en: "Demo version: nothing was sent to a real server yet, the real save will be connected later.",
  },
  "success.restart": { ar: "ØªØ³Ø¬ÙŠÙ„ Ù…Ø·Ø¹Ù… Ø¢Ø®Ø±", en: "Register another restaurant" },
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
