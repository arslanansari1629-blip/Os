/* BatchNest — site configuration.
   Edit these values, commit, and push (or edit then redeploy) to update the live site. */
window.BATCHNEST_CONFIG = {
  // Your Telegram channel invite link, e.g. "https://t.me/your_channel" or "https://t.me/+abc123"
  // Leave empty to show a "not configured" toast instead of a broken link.
  TELEGRAM_URL: "",

  // Optional: endpoint that returns today's classes as JSON (see schedule.json for the shape).
  // When set, it is preferred over the bundled schedule.json file.
  CLASSES_API: "",

  // Promotional banner shown in the "Telegram Community" popup (same network the original site used).
  AD_IMAGE_URL: "https://adsempire.com/blog/wp-content/uploads/adsempire/1132x670_AE_telegram_hid.png",

  // Fallback batch list (used if schedule.json cannot be loaded).
  BATCHES: [
    "Arjuna JEE 2026",
    "Alpha JEE 2026",
    "Prayas JEE 2027",
    "Yakeen NEET 2026",
    "Udaan NEET 2026",
    "Vinayak Lakshya NEET 2027",
    "Foundation — Class 9",
    "Foundation — Class 10"
  ],

  // Brand
  SITE_NAME: "BatchNest",
  TAGLINE: "Batch schedule & daily classes in one place"
};
