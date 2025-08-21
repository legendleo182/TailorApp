# Tailor CRM (Shops, Customers, Bills, Analytics)

A lightweight web app built with HTML, CSS, and JavaScript using Supabase for auth, database, and storage.

## Features
- Email/password login
- Shops: add, edit, delete
- Customers per shop: add, edit, delete
- Bills per shop: upload bill photo, stitching amount, balance amount, status (Bill Paid SF or Mere Paas)
- Analytics: Total Paid Balance, Total Unpaid Balance, Total Stitching, plus per-shop summary

## Setup
1. Create a Supabase project.
2. Run SQL in `SUPABASE_SCHEMA.sql` (SQL editor). Also create a public storage bucket named `bills`.
3. In `assets/js/`, copy `config.example.js` to `config.js` and fill your Supabase URL and anon key.
4. Open `index.html` in a local server (recommended). For example with VSCode Live Server or:
   - Python: `python -m http.server 5500`
   - Node: `npx http-server . -p 5500`
5. Visit `http://localhost:5500/index.html` (adjust port/path).

## Files
- `index.html`: Login/Sign up
- `app.html`: Main app UI (Shops, Customers, Bills, Analytics)
- `assets/js/*`: JS modules
- `assets/css/styles.css`: Styles

## Notes
- RLS policies scope all data to the authenticated user (owner).
- Bill status values: `paid_sf` (Bill Paid SF) or `unpaid` (Mere Paas).
- Public URLs are used for bill images via the `bills` storage bucket.
