# Georgetown Facilities Construction Map — Setup Guide

Follow these steps **once** to connect the map to Google Sheets so projects save permanently.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**
2. Name it something like **GU Construction Projects**
3. Leave it open — you'll need the URL in Step 3

---

## Step 2 — Add the Apps Script backend

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Open the file `Code.gs` from this package and **paste the entire contents** into the Apps Script editor
4. Click **Save** (the floppy disk icon) and name the project **GU Construction Map**

---

## Step 3 — Deploy the Apps Script as a Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon ⚙ next to "Select type" and choose **Web app**
3. Fill in the settings:
   - **Description:** GU Construction Map API
   - **Execute as:** Me *(your Georgetown Google account)*
   - **Who has access:** Anyone *(so the map can read/write)*
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/LONG_STRING_HERE/exec`

---

## Step 4 — Connect the map to your sheet

1. Open the file `config.js` in a text editor (Notepad, TextEdit, VS Code, etc.)
2. Paste your Web App URL between the quotes on this line:
   ```js
   window.SHEET_API_URL = 'PASTE_YOUR_URL_HERE';
   ```
3. Save `config.js`

---

## Step 5 — Publish to GitHub Pages (free shareable link)

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Click **New repository**, name it `gu-construction-map`, set it to **Public**
3. Upload all files from this folder (`index.html`, `config.js`, `Code.gs`, `SETUP.md`)
4. Go to **Settings → Pages**
5. Under "Branch", select **main** and click **Save**
6. After ~1 minute, your map is live at:
   `https://YOUR-USERNAME.github.io/gu-construction-map`

Share that link with your team — everyone sees the same live data. 🎉

---

## How it works

```
Your browser                 Google Apps Script           Google Sheet
     │                              │                          │
     │── Load map ──────────────────│                          │
     │── GET projects ─────────────▶│── Read rows ────────────▶│
     │◀─ Return JSON ───────────────│◀─ Return data ───────────│
     │                              │                          │
     │── Add project ──────────────▶│── Append row ───────────▶│
     │── Delete project ───────────▶│── Delete row ───────────▶│
     │── Change phase ─────────────▶│── Update row ───────────▶│
```

- **No login required** to view or edit (anyone with the link can add projects)
- **Projects are stored** in the Google Sheet — open it anytime to see/export all data
- **To restrict editing**, you can add a simple password field — ask your IT team or contact us

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Could not load from sheet" banner | Double-check the URL in `config.js` matches exactly what Apps Script gave you |
| Projects save locally but disappear on refresh | `config.js` URL is not set or is wrong |
| "Authorization required" error | Re-deploy the Apps Script and accept the permissions prompt |
| Changes not saving to sheet | Re-deploy Apps Script after any code edits (Deploy → Manage deployments → Edit → Deploy) |

---

*Built for Georgetown University Facilities Management*  
*Questions? Contact your GU IT representative.*
