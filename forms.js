/* EP Certs — form templates.
 * Each template is pure data. The app (index.html) renders the phone form from it,
 * and pdf.js renders the certificate from the same definition.
 * To add a new document, add a template object here — no other code changes needed.
 *
 * Field types:
 *   text, date, textarea      plain inputs (date stored as YYYY-MM-DD)
 *   choice                    pick one of options (tap again to clear)
 *   multi                     pick any of options
 *   yesno                     choice with ["Yes","No"]
 *   tests                     test-result grid (rows: [{id,label,unit,ph}])
 *   sig                       finger signature (copyFrom: another sig field)
 *   note                      fixed wording printed on the certificate
 *   inline                    sentence with dropdown words (parts: strings and {id,options})
 * Common keys:
 *   w        width on the PDF row: 1, 0.5, 0.34, 0.66 (phone always stacks)
 *   req      must be filled before issuing
 *   showIf   {f: fieldId, v: value} — only shown when that field has that value
 *   person   {g: group, p: "name"|"reg"|"email"|"phone"|"phoneEmail"} — quick-fill from saved people
 *   auto     "today" — filled with today's date on a new certificate
 *   list     suggestions for a text field
 * Template keys:
 *   fergus   {fieldId: "site"|"contact"|"description"|"customer"} — filled from a Fergus job number
 */
(function (root) {
  const SUPPLY = [
    "230/400 V AC, 50 Hz, MEN (TN-C-S), single phase",
    "230/400 V AC, 50 Hz, MEN (TN-C-S), three phase",
    "Grid-connected inverter system (AS/NZS 4777.1) on MEN supply",
    "Stand-alone inverter system (AS/NZS 4509)",
  ];
  const CUSTOMER_COPY = "CUSTOMER COPY - THIS IS AN IMPORTANT DOCUMENT AND SHOULD BE RETAINED FOR A MINIMUM OF 7 YEARS";
  const BUILDING_ACT = "This Electrical Safety Certificate also confirms that the electrical work complies with the building code for the purposes of Section 19(1)(e) of the Building Act 2004.";

  const evidence = (id, label, kind) => [
    { id, type: "yesno", label, req: true },
    { id: id + "Id", type: "text", label: "Identify (name, date and version" + (kind === "sdoc" ? ", or EESS registration)" : ")"), showIf: { f: id, v: "Yes" }, w: 0.5 },
    { id: id + "Link", type: "text", label: "Link", showIf: { f: id, v: "Yes" }, w: 0.5, ph: "https://" },
  ];

  const TEMPLATES = [
    {
      id: "coc",
      code: "COC",
      name: "CoC + ESC",
      title: "Electrical Certificate of Compliance & Electrical Safety Certificate",
      blurb: "Certificate of Compliance with the ESC on the same sheet. Use for most jobs.",
      fergus: { location: "site", contact: "contact", desc: "description" },
      intro: "This form has been designed to be used by licensed electrical workers to certify that installations or part installations under Part 1 or Part 2 of AS/NZS 3000 are safe to be connected to the specified system of electrical supply.",
      footer: [CUSTOMER_COPY, BUILDING_ACT],
      sections: [
        { title: "Location and customer", fields: [
          { id: "location", type: "textarea", rows: 3, label: "Location details", req: true, w: 0.5, ph: "Street address, unit, site" },
          { id: "contact", type: "textarea", rows: 3, label: "Contact details (name and address)", req: true, w: 0.5 },
        ]},
        { title: "Electrical worker", fields: [
          { id: "workerName", type: "text", label: "Name of electrical worker", w: 0.5, req: true, person: { g: "me", p: "name" } },
          { id: "workerReg", type: "text", label: "Registration / practising licence number", w: 0.5, req: true, person: { g: "me", p: "reg" } },
          { id: "workerContact", type: "text", label: "Phone & email", person: { g: "me", p: "phoneEmail" } },
          { id: "supervised", type: "text", label: "Name and registration number of person(s) supervised" },
        ]},
        { title: "Certificate of Compliance", fields: [
          { id: "workType", type: "multi", label: "Type of work", options: ["Addition", "Alteration", "New work"], req: true },
          { id: "risk", type: "choice", label: "The prescribed electrical work is", options: ["Low risk", "General", "High-risk"], req: true },
          { id: "riskSpec", type: "text", label: "High-risk (specify)", showIf: { f: "risk", v: "High-risk" }, list: ["Photovoltaic system", "Mains parallel generation", "Not to AS/NZS 3000 Part 2", "Mains work"] },
          { id: "means", type: "multi", label: "Means of compliance", options: ["Part 1 of AS/NZS 3000", "Part 2 of AS/NZS 3000"], req: true },
          { id: "addStd", type: "choice", label: "Additional standards or electrical code of practice were required", options: ["No", "Yes"], req: true },
          { id: "addStdSpec", type: "text", label: "Yes (specify)", showIf: { f: "addStd", v: "Yes" }, list: ["AS/NZS 4777.1", "AS/NZS 5033", "AS/NZS 5139", "AS/NZS 4509", "AS/NZS 3019"] },
          { id: "dates", type: "text", label: "Date or range of dates that prescribed electrical work undertaken", req: true, ph: "e.g. 14/10/2026 – 16/10/2026" },
          { id: "fittings", type: "yesno", label: "Contains fittings that are safe to connect to a power supply?", req: true },
          { id: "supply", type: "text", label: "Specify type of supply system", req: true, list: SUPPLY },
          { id: "earthing", type: "yesno", label: "The installation has an earthing system that is correctly rated (where applicable)", req: true },
          { id: "parts", type: "choice", label: "Parts of the installation to which this certificate relates that are safe to connect to a power supply?", options: ["All", "Parts (specify)"], req: true },
          { id: "partsSpec", type: "text", label: "Parts (specify)", showIf: { f: "parts", v: "Parts (specify)" } },
          ...evidence("mfr", "The work relies on manufacturer's instructions", "mfr"),
          { id: "mfrNote", type: "note", small: true, showIf: { f: "mfr", v: "Yes" }, text: "If yes, identify the instruction manual including name, date and version, and attach a copy of the manufacturer's instructions to this certificate (or provide a reference to a readily accessible electronic format, e.g. an internet link)." },
          ...evidence("design", "The work has been done in accordance with a certified design", "design"),
          { id: "designNote", type: "note", small: true, showIf: { f: "design", v: "Yes" }, text: "If yes, identify the certified design including name, date and version, and attach a copy of the certified design to this certificate (or provide a reference to a readily accessible electronic format, e.g. an internet link)." },
          ...evidence("sdoc", "The work relies on a Supplier Declaration of Conformity (SDoC)", "sdoc"),
          { id: "sdocNote", type: "note", small: true, showIf: { f: "sdoc", v: "Yes" }, text: "If yes, identify the SDoC including name, date and version OR EESS registration, and attach a copy of the SDoC to this certificate (or provide a reference to a readily accessible electronic format, e.g. an internet link)." },
          { id: "tested", type: "choice", label: "The installation has been satisfactorily tested in accordance with the Electricity (Safety) Regulations 2010", options: ["No", "Yes"], req: true },
        ]},
        { title: "Description of work and test results", fields: [
          { id: "desc", type: "textarea", rows: 5, label: "Description of work", req: true },
          { id: "tests", type: "tests", label: "Test results (provide values)", rows: [
            { id: "polarity", label: "Polarity (independent earth)", unit: "", ph: "Correct" },
            { id: "ir", label: "Insulation resistance", unit: "Ohms", ph: ">200M" },
            { id: "ec", label: "Earth continuity", unit: "Ohms", ph: "0.12" },
            { id: "bond", label: "Bonding", unit: "Ohms", ph: "0.05" },
            { id: "efli", label: "Fault loop impedance", unit: "Ohms", ph: "0.38" },
            { id: "other", label: "Other (specify)", unit: "", ph: "RCD 22 ms @ 30 mA" },
          ]},
        ]},
        { title: "Certificate of Compliance declaration", fields: [
          { id: "cocDecl", type: "note", text: "By signing this document I certify that the completed prescribed electrical work to which this Certificate of Compliance applies has been done lawfully and safely, and the information in the certificate is correct." },
          { id: "cocSig", type: "sig", label: "Certifier's signature", w: 0.66, req: true, person: { g: "me", p: "sig" } },
          { id: "cocDate", type: "date", label: "Date", w: 0.34, req: true, auto: "today" },
        ]},
        { title: "Electrical Safety Certificate", fields: [
          { id: "escDecl", type: "note", text: "By signing this document I certify that the installation, or part of the installation, to which this Electrical Safety Certificate applies is connected to a power supply and is safe to use." },
          { id: "escName", type: "text", label: "Certifier's name", w: 0.5, req: true, person: { g: "esc", p: "name" } },
          { id: "escReg", type: "text", label: "Registration / practising licence number", w: 0.5, req: true, person: { g: "esc", p: "reg" } },
          { id: "escSig", type: "sig", label: "Certifier's signature", req: true, copyFrom: "cocSig", person: { g: "esc", p: "sig" } },
          { id: "escIssue", type: "date", label: "Certificate issue date", w: 0.5, req: true, auto: "today" },
          { id: "escConn", type: "date", label: "Connection date", w: 0.5, req: true },
        ]},
      ],
    },

    {
      id: "esc",
      code: "ESC",
      name: "ESC only",
      title: "Electrical Safety Certificate",
      blurb: "Standalone safety certificate for connecting an installation.",
      fergus: { location: "site", contact: "contact", desc: "description" },
      intro: "This Electrical Safety Certificate provides a legally recognisable statement that the connected installation or part installation, or any fitting that supplies an installation or a part of an installation, is safe to use following prescribed electrical work.",
      footer: [CUSTOMER_COPY, BUILDING_ACT],
      sections: [
        { title: "Location and customer", fields: [
          { id: "location", type: "textarea", rows: 3, label: "Location details", req: true, w: 0.5 },
          { id: "contact", type: "textarea", rows: 3, label: "Contact details (name and address)", req: true, w: 0.5 },
        ]},
        { title: "Work", fields: [
          { id: "extent", type: "choice", label: "Details of work", options: ["The whole installation", "Part of the installation"], req: true },
          { id: "desc", type: "textarea", rows: 8, label: "Description of work", req: true },
          { id: "connDate", type: "date", label: "Date of connection", w: 0.5, req: true },
        ]},
        { title: "Declaration", fields: [
          { id: "decl", type: "note", text: "By signing this document I certify that the installation, or part of the installation, to which the Electrical Safety Certificate applies is connected to a power supply and is safe to use." },
          { id: "name", type: "text", label: "Certifier's name", w: 0.5, req: true, person: { g: "me", p: "name" } },
          { id: "reg", type: "text", label: "Registration / practising licence number", w: 0.5, req: true, person: { g: "me", p: "reg" } },
          { id: "sig", type: "sig", label: "Certifier's signature", w: 0.5, req: true, person: { g: "me", p: "sig" } },
          { id: "issue", type: "date", label: "Certificate issue date", w: 0.5, req: true, auto: "today" },
          { id: "email", type: "text", label: "Email", w: 0.5, person: { g: "me", p: "email" } },
          { id: "org", type: "text", label: "Organisation / company", w: 0.5, company: true },
        ]},
      ],
    },

    {
      id: "roi",
      code: "ROI",
      name: "Record of Inspection",
      title: "Record of Inspection (RoI) of High-Risk Prescribed Electrical Work",
      subtitle: "Pursuant to the Electricity (Safety) Regulations 2010",
      blurb: "Inspection of high-risk work such as PV and mains parallel generation.",
      fergus: { location: "site", inspected: "description" },
      footer: ["Record of Inspection (RoI)"],
      sections: [
        { title: "Issuer (inspector) details", fields: [
          { id: "inspName", type: "text", label: "Name of inspector", w: 0.5, req: true, person: { g: "me", p: "name" } },
          { id: "inspReg", type: "text", label: "Registration #", w: 0.5, req: true, person: { g: "me", p: "reg" } },
          { id: "inspEmail", type: "text", label: "Email address", w: 0.5, person: { g: "me", p: "email" } },
          { id: "inspPhone", type: "text", label: "Telephone", w: 0.5, person: { g: "me", p: "phone" } },
        ]},
        { title: "Location of installation", fields: [
          { id: "location", type: "text", label: "Location details", req: true },
          { id: "locType", type: "multi", label: "Location type", req: true, options: ["Domestic", "Non-Domestic Accommodation", "Industrial", "Commercial", "Educational", "Healthcare", "Miscellaneous (other)"] },
        ]},
        { title: "Certifying electrical work and CoC details", fields: [
          { id: "w1Name", type: "text", label: "Name of electrical worker", w: 0.3, req: true, person: { g: "w1", p: "name" } },
          { id: "w1Reg", type: "text", label: "Registration #", w: 0.2, req: true, person: { g: "w1", p: "reg" } },
          { id: "w2Name", type: "text", label: "Second worker (if any)", w: 0.3, person: { g: "w2", p: "name" } },
          { id: "w2Reg", type: "text", label: "Registration #", w: 0.2, person: { g: "w2", p: "reg" } },
          { id: "cocDetails", type: "textarea", rows: 2, label: "CoC details", w: 0.66, req: true },
          { id: "cocAttached", type: "multi", label: "Attachments", options: ["CoC(s) attached"], w: 0.34 },
        ]},
        { title: "Certifying electrical work and RoI details", fields: [
          { id: "inspected", type: "textarea", rows: 2, label: "What was inspected", req: true },
          { id: "standards", type: "textarea", rows: 2, label: "Specify the regulation(s) and companion standard(s), or identify the certified design, followed when carrying out the inspection", req: true },
          { id: "results", type: "textarea", rows: 2, label: "What are the results of the inspection", req: true },
          { id: "category", type: "multi", label: "High risk category", req: true, options: [
            "Not to AS/NZS 3000 Part 2 – 6A(2)(a)(i)",
            "High voltage installation – 6A(2)(a)(ii)",
            "Mains parallel generation – 6A(2)(a)(iii)",
            "Photovoltaic system – 6A(2)(a)(iv)",
            "Hazardous area – 6A(2)(a)(v)",
            "Electrical medical area – 6A(2)(a)(vi)",
            "Mains work – 6A(2)(b)",
            "Animal stunning or meat conditioning – 6A(2)(c)",
            "Other",
          ]},
          { id: "categoryOther", type: "text", label: "Other – please describe", showIf: { f: "category", v: "Other" } },
        ]},
        { title: "Declaration", fields: [
          { id: "decl", type: "inline", parts: [
            "I hereby confirm that the work described above has been done ",
            { id: "declIn", options: ["in", "not in"] },
            " accordance with the regulations; and the ",
            { id: "declInst", options: ["installation", "part installation"] },
            " on which the work has been done is, and will ",
            { id: "declBe", options: ["be", "not be"] },
            ", when enlivened, electrically safe.",
          ]},
          { id: "sig", type: "sig", label: "Signature", w: 0.66, req: true, person: { g: "me", p: "sig" } },
          { id: "date", type: "date", label: "Date", w: 0.34, req: true, auto: "today" },
        ]},
      ],
    },
  ];

  const api = { TEMPLATES, byId: (id) => TEMPLATES.find((t) => t.id === id) };
  if (typeof module !== "undefined") module.exports = api; else root.EPForms = api;
})(this);
