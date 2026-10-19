# Fergus lookup for EP Certs

This small Google Apps Script lets EP Certs fill a certificate from a Fergus job number.
Your Fergus token stays in your Google account. The phones only get an access code that
can read a job's customer, site address, contact and description, nothing else.

## Set it up (about 5 minutes, once)

1. **Get a Fergus token.** In Fergus go to Settings → Integrations → Fergus API → Generate PAT. Copy it; Fergus only shows it once.
2. **Create the script.** Go to [script.google.com](https://script.google.com) signed in as the business Google account → New project. Name it "EP Certs Fergus lookup".
3. **Paste the code.** Delete what's in `Code.gs`, paste in the contents of `Code.gs` from this folder, and save.
4. **Add the two secrets.** Project Settings (gear) → Script properties → Add:
   - `FERGUS_TOKEN` = the Fergus token from step 1
   - `APP_KEY` = an access code you make up, e.g. `copper-kiwi-meter-42`
5. **Check it.** Back in the editor, pick `testLookup` in the function list and press Run. Approve the permission prompt (it needs "connect to an external service"). The log should show `"ok":true` and job 839.
6. **Publish it.** Deploy → New deployment → type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, then copy the Web app URL (ends in `/exec`).
7. **Connect the phones.** In EP Certs → Settings → Fergus lookup, paste the URL and the access code, then tap "Test with a job number". Then tap "Copy setup link for another phone" and send that link to Kaycee; opening it once sets up her phone.

## Notes

- The Fergus token expires after 365 days. Refresh it in Fergus (the three-dot menu on the Fergus API page), then update `FERGUS_TOKEN`.
- To change the access code, edit `APP_KEY` and send a new setup link. Old links stop working.
- If you change `Code.gs` later, use Deploy → Manage deployments → Edit → New version, so the URL stays the same.
