# EP Certs

Phone web app for Electrical Potential Ltd's electrical certificates: CoC + ESC, standalone ESC, and Record of Inspection.
Open it, tap Share → Add to Home Screen, and it works like an app, offline included.

- `index.html` – the app
- `config.js` – company and electrician details every phone starts with (public: no passwords or codes)
- `forms.js` – the certificate templates; add a new form here
- `pdf.js` – draws the branded PDF from any template
- `fergus-lookup/` – optional Google Apps Script that fills certificates from a Fergus job number

Certificates are stored only on the phone that made them. Finished PDFs are shared to the records Gmail.
After changing any file, bump `VERSION` in `sw.js` so phones pick up the new version.
