# GU Facilities Construction Map

**Georgetown University Facilities Management — Active Construction Tracker**

An interactive map showing all active construction projects on the Georgetown campus.
Projects are stored permanently in Google Sheets and the map is hosted on GitHub Pages.

## Files in this package

| File | Purpose |
|------|---------|
| `index.html` | The map application (open this in a browser) |
| `config.js` | **Edit this** — paste your Google Sheets API URL here |
| `Code.gs` | Paste into Google Apps Script to create the backend |
| `SETUP.md` | Step-by-step setup instructions |
| `README.md` | This file |

## Quick start

See **[SETUP.md](SETUP.md)** for full instructions.

Short version:
1. Create a Google Sheet → add `Code.gs` via Apps Script → deploy as Web App → copy URL
2. Paste the URL into `config.js`
3. Upload all files to GitHub and enable GitHub Pages
