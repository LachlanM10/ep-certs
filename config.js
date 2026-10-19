/* EP Certs — company presets.
 * Every phone starts with these details. Blank fields on a phone are filled from here
 * each time the app opens, so updating this file (e.g. adding a registration number)
 * reaches both phones on their next open. Anything typed on a phone is kept.
 * This file is public on GitHub Pages: never put passwords, tokens or access codes here.
 */
window.EPConfig = {
  company: {
    name: "Electrical Potential Ltd",
    phone: "027 576 5422",
    email: "lachlan@electricalpotential.co.nz",
    address: "16A Turnbull Crescent, Morrinsville 3300",
  },
  records: "certs@electricalpotential.co.nz", // Gmail address finished certificates are sent to
  people: [
    { id: "p-lachlan", name: "Lachlan Murdoch", reg: "E279592", phone: "027 576 5422", email: "lachlan@electricalpotential.co.nz" },
    { id: "p-kaycee", name: "Kaycee Grinter", reg: "E111650", phone: "027 284 6000", email: "kaycee@electricalpotential.co.nz" },
  ],
};
