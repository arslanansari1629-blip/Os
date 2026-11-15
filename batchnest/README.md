# BatchNest — static rebuild

A self-contained static rebuild of the **BatchNest** front-end (`/study` experience):
Select Batch → Today's Class → View All Classes → Telegram community popup.

## Structure
```
index.html            # redirects to /study
study/index.html      # main page
404.html              # not-found page ("This page could not be found.")
schedule.json         # batch list + classes (edit this to publish classes)
assets/js/config.js   # TELEGRAM_URL, AD_IMAGE_URL, CLASSES_API, batches, branding
assets/js/app.js      # rendering logic
assets/css/style.css  # styles
assets/img/logo.svg   # logo / favicon
vercel.json           # clean URLs + cache headers
```

## Configure
1. Open `assets/js/config.js` and set `TELEGRAM_URL` to your channel invite link.
2. Publish classes by adding objects to `schedule.json` → `classes`, e.g.:
   ```json
   { "date": "2026-11-16", "time": "05:00 PM", "subject": "Physics — Kinematics", "teacher": "Alakh Pandey", "batch": "Arjuna JEE 2026", "mode": "Live", "link": "https://…" }
   ```
   `date` is `YYYY-MM-DD` (local time). `link` is optional (button shows "SOON" without it).
   `batch` is optional — omit it to show the class to every batch.
3. Or point `CLASSES_API` at your own backend returning the same JSON shape.

## Run locally
```
cd batchnest && python3 -m http.server 8080
# open http://localhost:8080/study
```

## Routes
- `/` → redirect to `/study`
- `/study` → main page
- any unknown route → `404.html`
