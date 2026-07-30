# GZD Member ID — Digital Membership Verification

A standalone site (separate from the main gzdbadminton.club site/repo) that lets sponsors
and partners verify a member's status by scanning a QR code or entering a Member ID.
Member data lives in a Google Sheet — no backend or database to run.

## How it works

1. You keep a Google Sheet of members (one row per member).
2. Each member gets a QR code that links to `https://members.gzdbadminton.club/?id=THEIR_ID`.
3. When scanned, the page fetches the sheet's published CSV, looks up that ID, and shows
   a card with name, photo, tier, and an ACTIVE / NOT ACTIVE status.
4. To deactivate someone (e.g. non-renewal), just change their row's `Status` or
   `ExpiryDate` in the sheet — the card updates instantly, no reprinting needed.

## 1. Set up the Google Sheet

Create a sheet with this header row (order doesn't matter, names must match exactly):

| MemberID | FullName | PhotoURL | Tier | JoinDate | ExpiryDate | Status |
|---|---|---|---|---|---|---|
| GZD-0001 | Jane Tan | https://.../jane.jpg | Standard | 2026-06-01 | 2026-12-31 | Active |

Notes:
- `MemberID` — anything unique, e.g. `GZD-0001`. This is what goes in the QR link.
- `PhotoURL` — optional. A public image link (e.g. a shared Google Drive image link
  converted to direct-view, or any image host). Leave blank to show initials instead.
- `Tier` — optional label like "Standard" or "Premium".
- `ExpiryDate` — if this date is in the past, the card automatically shows NOT ACTIVE.
- `Status` — set to `Active`; use anything else (e.g. `Suspended`) to force NOT ACTIVE
  even if the expiry date hasn't passed.

Then publish it as CSV:
1. In Google Sheets: **File → Share → Publish to web**.
2. Under "Link", choose the specific sheet/tab with your member data.
3. Set format to **Comma-separated values (.csv)**.
4. Click **Publish**, copy the URL it gives you.

This makes the sheet readable (not editable) by anyone with the link — fine since it
only contains name/photo/status, no sensitive data. Don't add emails, phone numbers,
or payment info to this sheet.

## 2. Point the site at your sheet

Open [js/verify.js](js/verify.js) and paste your published CSV URL into:

```js
const CONFIG = {
  sheetCsvUrl: 'PASTE_YOUR_PUBLISHED_CSV_URL_HERE',
  ...
};
```

## 3. Deploy

This is a plain static site, so GitHub Pages works well (same approach as the main site,
but as its own separate repo):

1. Create a new GitHub repo, e.g. `GZD_Member_ID`, and push this folder's contents to it.
2. In the repo's **Settings → Pages**, enable Pages from the `main` branch.
3. The included `CNAME` file already points to `members.gzdbadminton.club` — update it
   if you'd rather use a different subdomain (e.g. `id.gzdbadminton.club`).
4. In your domain's DNS settings (wherever `gzdbadminton.club` is managed), add a CNAME
   record: `members` → `<your-github-username>.github.io`.
5. Wait for DNS to propagate, then GitHub Pages will serve it at
   `https://members.gzdbadminton.club`.

## 4. Onboard a new member

1. Add a row to the Google Sheet with their details and a new `MemberID`.
2. Open `admin/generate-qr.html` (keep this tool private — it's for staff, not members),
   enter the same Member ID, click **Generate QR Code**, and download the PNG.
3. Send the QR image to the member (WhatsApp, email, etc.) or print it onto a physical
   card — either way, scanning it opens their live verification card.

## Files

- `index.html` — the public verification page (what QR codes point to).
- `js/verify.js` — fetches/parses the sheet CSV and renders the card; all config is at
  the top of this file.
- `css/card.css` — styling, matches the main site's brand colors/fonts.
- `admin/generate-qr.html` — internal tool for staff to create a member's QR code.
