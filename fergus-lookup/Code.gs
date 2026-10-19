/**
 * EP Certs — Fergus job lookup (Google Apps Script web app).
 *
 * Holds your Fergus API token on Google's side, so it never sits on a phone or on GitHub.
 * The certificate app asks:  <web app URL>?job=839&key=<access code>
 * and gets back only what a certificate needs: job number, customer, site address,
 * main contact and job description. It can only read jobs, never change them.
 *
 * Setup (about 5 minutes) — see README.md next to this file.
 * Script properties needed (Project Settings → Script properties):
 *   FERGUS_TOKEN  your Fergus personal access token (Fergus → Settings → Integrations → Fergus API)
 *   APP_KEY       any access code you make up, e.g. three random words; the phones send this
 */
const FERGUS = "https://api.fergus.com";

function doGet(e) {
  const p = (e && e.parameter) || {};
  const props = PropertiesService.getScriptProperties();
  const appKey = props.getProperty("APP_KEY");
  const token = props.getProperty("FERGUS_TOKEN");
  if (!appKey || !token) return reply({ ok: false, error: "The Fergus lookup isn't finished: add FERGUS_TOKEN and APP_KEY in Script properties." });
  if (p.key !== appKey) return reply({ ok: false, error: "Wrong access code. Check it in EP Certs Settings." });
  const n = String(p.job || "").replace(/\D/g, "");
  if (!n) return reply({ ok: false, error: "No job number was sent." });

  const attempts = [
    "/jobs?filterJobNo=" + n + "&pageSize=20",
    "/jobs?filterSearchText=" + n + "&pageSize=50",
  ];
  let lastStatus = 0;
  for (const path of attempts) {
    const res = UrlFetchApp.fetch(FERGUS + path, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      muteHttpExceptions: true,
    });
    lastStatus = res.getResponseCode();
    if (lastStatus === 401 || lastStatus === 403) return reply({ ok: false, error: "Fergus rejected the token. It may have expired: refresh it in Fergus, then update FERGUS_TOKEN." });
    if (lastStatus !== 200) continue;
    const body = JSON.parse(res.getContentText() || "{}");
    const list = body.data || body.jobs || [];
    const job = list.find((j) => String(j.jobNo) === n || String(j.jobNumber || "").split("-").pop() === n);
    if (job) return reply({ ok: true, job: slim(job) });
  }
  return reply({ ok: false, error: lastStatus === 200 ? "No Fergus job " + n + " was found." : "Fergus didn't answer properly (code " + lastStatus + "). Try again shortly." });
}

// Only the fields a certificate uses leave Google.
function slim(j) {
  const s = j.siteAddress || {}, c = j.mainContact || {};
  return {
    jobNumber: j.jobNumber || ("EP-" + j.jobNo),
    description: j.description || "",
    longDescription: j.longDescription || "",
    customer: (j.customer && j.customer.customerFullName) || "",
    contactFirstName: c.firstName || "",
    contactLastName: c.lastName || "",
    contactItems: (c.contactItems || []).map((x) => ({ type: x.contactType, value: x.contactValue })),
    site: {
      address1: s.address1 || "", address2: s.address2 || "", suburb: s.addressSuburb || "",
      city: s.addressCity || "", postcode: s.addressPostcode || "",
    },
  };
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run this once from the editor to check your token works (see the log). */
function testLookup() {
  const out = doGet({ parameter: { job: "839", key: PropertiesService.getScriptProperties().getProperty("APP_KEY") } });
  Logger.log(out.getContent());
}
