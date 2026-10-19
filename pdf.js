/* EP Certs — PDF renderer.
 * renderCert(jsPDF, template, data, settings) -> jsPDF document (A4, mm).
 * Draws any template from forms.js, so new templates print with no changes here.
 */
(function (root) {
  const C = {
    ink: [17, 17, 16], gold: [201, 162, 39], goldInk: [128, 99, 10], label: [92, 90, 84],
    line: [196, 194, 186], fill: [248, 247, 243], white: [255, 255, 255], soft: [120, 118, 110],
  };
  const PW = 210, PH = 297, M = 12, CW = PW - 2 * M, GAP = 4;
  let FOOT = 18;

  // Standard PDF fonts are WinAnsi only; map the few characters electricians type that it lacks.
  const MAP = { "Ω": " Ohm", "≥": ">=", "≤": "<=", "→": "->", "≈": "~", "✓": "Yes", "✔": "Yes", "Δ": "d", " ": " ", " ": " " };
  const clean = (s) => String(s == null ? "" : s).replace(/[^\x00-\xff–—‘’“”•€]/g, (ch) => MAP[ch] ?? "?");
  const fmtDate = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || ""); };

  function isShown(f, data) {
    if (!f.showIf) return true;
    const v = data[f.showIf.f];
    return Array.isArray(v) ? v.includes(f.showIf.v) : v === f.showIf.v;
  }

  function renderCert(jsPDF, t, data, settings) {
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const co = (settings && settings.company) || {};
    const ref = data._ref || "";
    let y = 0;
    FOOT = (t.footer || []).length > 1 ? 18 : 12;

    const col = (c, kind = "text") => kind === "fill" ? doc.setFillColor(...c) : kind === "draw" ? doc.setDrawColor(...c) : doc.setTextColor(...c);
    const font = (style = "normal", size = 9, face = "helvetica") => { doc.setFont(face, style); doc.setFontSize(size); };
    const lines = (txt, w) => doc.splitTextToSize(clean(txt), w);
    const LH = (size) => size * 0.3528 * 1.25; // mm per line

    function header(first) {
      const h = first ? 30 : 14;
      col(C.ink, "fill"); doc.rect(0, 0, PW, h, "F");
      col(C.gold, "fill"); doc.rect(0, h, PW, 1.2, "F");
      font("bold", first ? 15 : 10); col(C.gold);
      doc.text("ELECTRICAL POTENTIAL", M, first ? 12 : 9, { charSpace: first ? 0.6 : 0.4 });
      if (first) {
        font("normal", 7.5); col([215, 213, 205]);
        const info = [co.name || "Electrical Potential Ltd", co.phone, co.email].filter(Boolean).join("   |   ");
        doc.text(clean(info), M, 18);
        if (co.address) doc.text(clean(co.address), M, 22.5);
        font("bold", 10.5); col(C.white);
        const tl = lines(t.title, 92);
        doc.text(tl, PW - M, 10, { align: "right", lineHeightFactor: 1.2 });
        if (t.subtitle) { font("normal", 7.5); col([215, 213, 205]); doc.text(clean(t.subtitle), PW - M, 10 + tl.length * LH(10.5) + 0.5, { align: "right" }); }
        y = h + 1.2 + 6;
        // reference row
        font("bold", 7); col(C.label); doc.text("REFERENCE / CERTIFICATE ID NO.", M, y, { charSpace: 0.3 });
        font("bold", 11, "courier"); col(C.ink); doc.text(clean(ref), M + 54, y + 0.3);
        if (data.jobNo) { font("bold", 7); col(C.label); doc.text("JOB NO.", PW - M - 30, y, { align: "right", charSpace: 0.3 }); font("bold", 11, "courier"); col(C.ink); doc.text(clean(data.jobNo), PW - M, y + 0.3, { align: "right" }); }
        y += 4;
        if (t.intro) { font("normal", 7.5); col(C.soft); const il = lines(t.intro, CW); doc.text(il, M, y + 2.5); y += il.length * LH(7.5) + 3; }
      } else {
        font("normal", 7.5); col(C.white);
        doc.text(clean(t.title), PW - M, 6.5, { align: "right", maxWidth: 110 });
        font("bold", 8, "courier"); col(C.gold); doc.text(clean(ref), PW - M, 11, { align: "right" });
        y = h + 1.2 + 6;
      }
    }

    function newPage() { doc.addPage(); header(false); }
    const bottom = () => PH - FOOT - 2;

    // ---- measuring -------------------------------------------------------
    function labelLines(f, w) { font("bold", 7); return f.label ? lines(f.label, w) : []; }
    function labelH(f, w) { return labelLines(f, w).length * LH(7) + (f.label ? 1 : 0); }

    function optionLayout(opts, w) {
      font("normal", 8);
      const out = []; let x = 0, row = 0;
      for (const o of opts) {
        const ow = 3.4 + 1.6 + doc.getTextWidth(clean(o)) + 5;
        if (x > 0 && x + ow > w) { x = 0; row++; }
        out.push({ o, x, row }); x += ow;
      }
      return { items: out, rows: row + 1 };
    }

    function measure(f, w) {
      const v = data[f.id];
      switch (f.type) {
        case "note": font(f.small ? "italic" : "bold", f.small ? 6.5 : 7.8); return lines(f.text, w).length * LH(f.small ? 6.5 : 7.8) + 1.5;
        case "inline": font("bold", 7.8); return lines(inlineText(f), w).length * LH(7.8) + 1.5;
        case "text": case "date": { font("normal", 9); const n = Math.max(1, lines(f.type === "date" ? fmtDate(v) : v, w - 4).length); return labelH(f, w) + Math.max(6.5, n * LH(9) + 2.6); }
        case "textarea": { font("normal", 9); const n = lines(v, w - 4).length; return labelH(f, w) + Math.max((f.rows || 2) * LH(9) + 3, n * LH(9) + 3); }
        case "choice": case "yesno": case "multi": {
          const opts = f.type === "yesno" ? ["Yes", "No"] : f.options;
          const il = inlineOpts(f, w); if (il) return Math.max(il.ll.length * LH(7), 3.6) + 1.6;
          return labelH(f, w) + optionLayout(opts, w).rows * 5.2;
        }
        case "tests": return labelH(f, w) + f.rows.length * 5.8 + 0.5;
        case "sig": return labelH(f, w) + 14.5;
      }
      return 0;
    }

    // Short option sets sit to the right of their label on one line.
    function inlineOpts(f, w) {
      const opts = f.type === "yesno" ? ["Yes", "No"] : f.options;
      const L = optionLayout(opts, 1e9); const last = L.items[L.items.length - 1];
      font("normal", 8); const ow = last.x + 5 + doc.getTextWidth(clean(last.o)) + 1;
      if (ow > w * 0.5 || !f.label) return null;
      font("bold", 7); const ll = lines(f.label, w - ow - 4);
      return ll.length <= 2 ? { ll, ow, L } : null;
    }

    function inlineText(f) {
      return f.parts.map((p) => typeof p === "string" ? p : (data[p.id] || p.options[0])).join("");
    }

    // ---- drawing ---------------------------------------------------------
    function drawLabel(f, x, w) {
      const ll = labelLines(f, w); if (!ll.length) return 0;
      font("bold", 7); col(C.label); doc.text(ll, x, y + 2.4, { lineHeightFactor: 1.25 });
      return ll.length * LH(7) + 1;
    }
    function box(x, yy, w, h) { col(C.fill, "fill"); col(C.line, "draw"); doc.setLineWidth(0.2); doc.roundedRect(x, yy, w, h, 0.8, 0.8, "FD"); }
    function check(x, yy, on) {
      doc.setLineWidth(0.25); col(on ? C.ink : C.line, "draw");
      if (on) { col(C.ink, "fill"); doc.rect(x, yy, 3.4, 3.4, "FD"); col(C.gold, "draw"); doc.setLineWidth(0.55); doc.line(x + 0.75, yy + 1.8, x + 1.45, yy + 2.6); doc.line(x + 1.45, yy + 2.6, x + 2.7, yy + 0.8); }
      else { col(C.white, "fill"); doc.rect(x, yy, 3.4, 3.4, "FD"); }
    }

    function draw(f, x, w) {
      const v = data[f.id];
      const top = y;
      switch (f.type) {
        case "note": { const s = f.small ? 6.5 : 7.8; font(f.small ? "italic" : "bold", s); col(f.small ? C.soft : C.ink); doc.text(lines(f.text, w), x, y + s * 0.3528, { lineHeightFactor: 1.25 }); break; }
        case "inline": { font("bold", 7.8); col(C.ink); doc.text(lines(inlineText(f), w), x, y + 2.8, { lineHeightFactor: 1.25 }); break; }
        case "text": case "date": {
          const lh = drawLabel(f, x, w); const by = top + lh;
          font("normal", 9); const tl = lines(f.type === "date" ? fmtDate(v) : v, w - 4);
          const bh = Math.max(6.5, Math.max(1, tl.length) * LH(9) + 2.6);
          box(x, by, w, bh); col(C.ink); if (tl.length) doc.text(tl, x + 2, by + 4.3, { lineHeightFactor: 1.25 });
          break;
        }
        case "textarea": {
          const lh = drawLabel(f, x, w); const by = top + lh;
          font("normal", 9); const tl = lines(v, w - 4);
          const bh = Math.max((f.rows || 2) * LH(9) + 3, tl.length * LH(9) + 3);
          box(x, by, w, bh); col(C.ink); if (tl.length) doc.text(tl, x + 2, by + 4.3, { lineHeightFactor: 1.25 });
          break;
        }
        case "choice": case "yesno": case "multi": {
          const opts = f.type === "yesno" ? ["Yes", "No"] : f.options;
          const sel = Array.isArray(v) ? v : (v ? [v] : []);
          const il = inlineOpts(f, w);
          if (il) {
            font("bold", 7); col(C.label); doc.text(il.ll, x, y + 2.6, { lineHeightFactor: 1.25 });
            const ox = x + w - il.ow, oy = y + (il.ll.length > 1 ? 0.9 : 0);
            for (const it of il.L.items) {
              check(ox + it.x, oy, sel.includes(it.o));
              font(sel.includes(it.o) ? "bold" : "normal", 8); col(sel.includes(it.o) ? C.ink : C.label);
              doc.text(clean(it.o), ox + it.x + 5, oy + 2.75);
            }
            break;
          }
          const lh = drawLabel(f, x, w);
          const L = optionLayout(opts, w);
          for (const it of L.items) {
            const oy = top + lh + it.row * 5.2 + 0.6;
            check(x + it.x, oy, sel.includes(it.o));
            font(sel.includes(it.o) ? "bold" : "normal", 8); col(sel.includes(it.o) ? C.ink : C.label);
            doc.text(clean(it.o), x + it.x + 5, oy + 2.75);
          }
          break;
        }
        case "tests": {
          const lh = drawLabel(f, x, w); let ty = top + lh;
          const vals = v || {};
          const c1 = w * 0.48, c3 = 14, c2 = w - c1 - c3;
          col(C.line, "draw"); doc.setLineWidth(0.2);
          f.rows.forEach((r, i) => {
            if (i % 2 === 0) { col(C.fill, "fill"); doc.rect(x, ty, w, 5.8, "F"); }
            font("normal", 8); col(C.label); doc.text(clean(r.label), x + 2, ty + 3.9);
            font("bold", 9, "courier"); col(C.ink); doc.text(clean(vals[r.id] || ""), x + c1 + 2, ty + 4.0, { maxWidth: c2 - 3 });
            font("bold", 7.5); col(C.label); if (r.unit) doc.text(r.unit, x + w - 2, ty + 3.9, { align: "right" });
            doc.line(x, ty + 5.8, x + w, ty + 5.8);
            ty += 5.8;
          });
          doc.rect(x, top + lh, w, f.rows.length * 5.8, "S");
          break;
        }
        case "sig": {
          const lh = drawLabel(f, x, w); const by = top + lh;
          col(C.white, "fill"); col(C.line, "draw"); doc.setLineWidth(0.2); doc.roundedRect(x, by, w, 14, 0.8, 0.8, "FD");
          if (v && v.img) {
            try {
              const r = (v.w && v.h) ? v.w / v.h : 3;
              let ih = 13.5, iw = ih * r; if (iw > w - 4) { iw = w - 4; ih = iw / r; }
              doc.addImage(v.img, "PNG", x + 2, by + (14 - ih) / 2, iw, ih);
            } catch (e) { /* unreadable image: leave box blank */ }
          }
          break;
        }
      }
    }

    // A long description can be taller than a page: flow it across pages.
    function drawLongTextarea(f, x, w) {
      const lh = drawLabel(f, x, w); y += lh;
      font("normal", 9);
      let tl = lines(data[f.id], w - 4);
      while (tl.length) {
        const room = Math.floor((bottom() - y - 3) / LH(9));
        const chunk = tl.slice(0, Math.max(1, room)); tl = tl.slice(chunk.length);
        const bh = chunk.length * LH(9) + 3;
        box(x, y, w, bh); font("normal", 9); col(C.ink); doc.text(chunk, x + 2, y + 4.6, { lineHeightFactor: 1.25 });
        y += bh;
        if (tl.length) newPage();
      }
    }

    function sectionTitle(title) {
      font("bold", 8.5); col(C.goldInk);
      doc.text(clean(title).toUpperCase(), M, y + 3, { charSpace: 0.5 });
      col(C.gold, "draw"); doc.setLineWidth(0.5); doc.line(M, y + 4.6, PW - M, y + 4.6);
      y += 7;
    }

    // ---- page flow -------------------------------------------------------
    header(true);
    for (const s of t.sections) {
      const fields = s.fields.filter((f) => isShown(f, data));
      const rows = []; let cur = [], sum = 0;
      for (const f of fields) {
        const fw = f.w || 1;
        if (cur.length && sum + fw > 1.001) { rows.push(cur); cur = []; sum = 0; }
        cur.push(f); sum += fw;
      }
      if (cur.length) rows.push(cur);

      const sized = rows.map((r) => {
        const ws = r.map((f) => (f.w || 1) * (CW + GAP) - GAP);
        return { r, ws, h: Math.max(...r.map((f, i) => measure(f, ws[i]))) };
      });
      if (sized.length && y + 7.5 + Math.min(sized[0].h, 40) > bottom()) newPage();
      sectionTitle(s.title);
      for (const row of sized) {
        const tooTall = row.h > bottom() - y;
        if (tooTall && row.r.length === 1 && row.r[0].type === "textarea") {
          if (bottom() - y < 25) newPage();
          drawLongTextarea(row.r[0], M, row.ws[0]); y += 3; continue;
        }
        if (tooTall) newPage();
        let x = M;
        row.r.forEach((f, i) => { draw(f, x, row.ws[i]); x += row.ws[i] + GAP; });
        y += row.h + 2.4;
      }
      y += 1;
    }

    // ---- footer on every page --------------------------------------------
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p);
      const fy = PH - FOOT + 2;
      col(C.gold, "draw"); doc.setLineWidth(0.4); doc.line(M, fy, PW - M, fy);
      let ly = fy + 4;
      (t.footer || []).forEach((txt, i) => {
        font(i === 0 ? "bold" : "normal", i === 0 ? 7 : 6.2); col(i === 0 ? C.ink : C.soft);
        const fl = lines(txt, CW - 30); doc.text(fl, PW / 2, ly, { align: "center", lineHeightFactor: 1.2 }); ly += fl.length * LH(i === 0 ? 7 : 6.2);
      });
      font("normal", 6.5); col(C.soft);
      doc.text(`Page ${p} of ${n}`, PW - M, PH - 4, { align: "right" });
      doc.text(clean(ref), M, PH - 4);
    }
    doc.setProperties({ title: clean(`${t.title} ${ref}`), author: clean(co.name || "Electrical Potential Ltd"), creator: "EP Certs" });
    return doc;
  }

  const api = { renderCert, isShown, fmtDate };
  if (typeof module !== "undefined") module.exports = api; else root.EPPdf = api;
})(this);
