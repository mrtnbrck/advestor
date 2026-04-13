import { useState, useMemo, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const C = {
  bg: "#0D0D0D", surface: "#1A1A1A", card: "#212121", border: "#2E2E2E",
  borderLight: "#3A3A3A", lime: "#D1FF1E", limeDark: "#A8CC18",
  limeSubtle: "#D1FF1E20", green: "#BEF674", red: "#FF4D4D",
  redSubtle: "#FF4D4D18", text: "#F5F5F5", textSec: "#AAAAAA", textMuted: "#666666",
};

const BUSINESS_TYPES = [
  { label: "E-shop (Standard)", value: "eshop", rate: 2 },
  { label: "B2B (Lead generation)", value: "b2b", rate: 1.5 },
  { label: "Lokalne sluzby", value: "local", rate: 5 },
  { label: "SaaS", value: "saas", rate: 3 },
  { label: "Vlastny konverzny pomer", value: "custom", rate: null },
];

const fmt = (n) => {
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(2).replace(".", ",")} M`;
  if (Math.abs(n) >= 10000) return `${(n / 1000).toFixed(1).replace(".", ",")} tis.`;
  return n.toLocaleString("sk-SK", { maximumFractionDigits: 0 });
};
const fmtEur = (n) => `${fmt(n)} \u20AC`;
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

function getTrafficMultiplier(month) {
  if (month <= 3) return 0;
  if (month <= 6) return lerp(0.05, 0.15, (month - 4) / 2);
  if (month <= 12) return lerp(0.15, 0.50, (month - 7) / 5);
  if (month <= 24) return lerp(0.50, 1.00, (month - 13) / 11);
  return lerp(1.00, 1.50, (month - 25) / 11);
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1.5">
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(!show)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", fontSize: 11, fontWeight: 700, cursor: "pointer", background: C.border, color: C.textSec, lineHeight: 1 }}>?</span>
      {show && (
        <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, lineHeight: 1.5, color: C.textSec, width: 280, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {text}
          <span style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: C.card, borderRight: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }} />
        </span>
      )}
    </span>
  );
}

function InputField({ label, value, onChange, suffix, info, min = 0, step = 1, placeholder }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ color: C.textSec, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", marginBottom: 6 }}>
        {label}{info && <InfoTip text={info} />}
      </label>
      <div style={{ position: "relative" }}>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} step={step} placeholder={placeholder}
          style={{ width: "100%", padding: "10px 14px", paddingRight: suffix ? 44 : 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 15, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = C.lime)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
        {suffix && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 14, pointerEvents: "none" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SummaryCard({ year, months, investment, revenue, breakEvenMonth, isHighlight }) {
  const roi = investment > 0 ? (((revenue - investment) / investment) * 100) : 0;
  const profit = revenue - investment;
  const isProfitable = profit > 0;
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: "24px 20px", border: `1px solid ${isHighlight ? C.lime + "40" : C.border}`, flex: 1, minWidth: 220, position: "relative", overflow: "hidden" }}>
      {isHighlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.lime}, ${C.green})` }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 700, background: isHighlight ? C.limeSubtle : C.surface, color: isHighlight ? C.lime : C.textSec }}>{year}R</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Rok {year}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>({months} mes.)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
        <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Investicia</div><div style={{ fontSize: 18, fontWeight: 700, color: C.red }}>{fmtEur(investment)}</div></div>
        <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>Obrat</div><div style={{ fontSize: 18, fontWeight: 700, color: C.lime }}>{fmtEur(revenue)}</div></div>
        <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{isProfitable ? "Zisk" : "Strata"}</div><div style={{ fontSize: 16, fontWeight: 600, color: isProfitable ? C.green : C.red }}>{isProfitable ? "+" : ""}{fmtEur(profit)}</div></div>
        <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>ROI</div><div style={{ fontSize: 16, fontWeight: 600, color: roi > 0 ? C.green : C.red }}>{roi > 0 ? "+" : ""}{roi.toFixed(0)}%</div></div>
      </div>
      {year === 1 && breakEvenMonth && <div style={{ marginTop: 14, padding: "8px 12px", background: C.limeSubtle, borderRadius: 8, fontSize: 12, color: C.lime, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14 }}>{"\u25CF"}</span> Break-even: mesiac {breakEvenMonth}</div>}
      {year === 1 && !breakEvenMonth && <div style={{ marginTop: 14, padding: "8px 12px", background: C.redSubtle, borderRadius: 8, fontSize: 12, color: C.red, fontWeight: 500 }}>Break-even sa dosiahne v roku 2+</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const inv = payload.find((p) => p.dataKey === "investment");
  const rev = payload.find((p) => p.dataKey === "revenue");
  const row = payload[0]?.payload;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Mesiac {label}</div>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 6 }}>Traffic: {fmt(row?.traffic || 0)} ({Math.round((row?.multiplier || 0) * 100)}% ciela)</div>
      {rev && <div style={{ fontSize: 12, color: C.lime, marginBottom: 4 }}>Kum. obrat: {fmtEur(rev.value)}</div>}
      {inv && <div style={{ fontSize: 12, color: C.red }}>Kum. investicia: {fmtEur(inv.value)}</div>}
    </div>
  );
}

function generatePDF(data, params, year1, year2, year3, breakEvenMonth) {
  const { targetTraffic, conversionRate, orderValue, monthlyInvestment, businessLabel } = params;
  const pw = window.open("", "_blank");
  if (!pw) { alert("Povolte pop-up okna pre generovanie PDF."); return; }
  pw.document.write(`<!DOCTYPE html><html><head><title>SEO ROI Kalkulator - Advestor</title>
<style>
@page{size:A4;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{background:#0D0D0D;color:#F5F5F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
.page{width:210mm;min-height:297mm;padding:12mm 14mm;position:relative;page-break-after:always;background:#0D0D0D}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:#D1FF1E}
.page::after{content:'';position:absolute;top:0;left:0;width:2px;height:100%;background:#D1FF1E}
h1{color:#D1FF1E;font-size:20px;margin-bottom:4px}
h2{color:#D1FF1E;font-size:13px;margin:16px 0 10px;text-transform:uppercase;letter-spacing:1px}
.sub{color:#666;font-size:11px;margin-bottom:16px}
.hr{height:1px;background:#2E2E2E;margin:14px 0}
.pr{display:flex;justify-content:space-between;padding:6px 12px;background:#1A1A1A;margin-bottom:3px;border-radius:3px;font-size:11px}
.pl{color:#AAA}.pv{color:#F5F5F5;font-weight:bold}
.yc{background:#212121;border-radius:6px;padding:14px 16px;margin-bottom:8px}
.yt{font-weight:bold;font-size:12px;margin-bottom:10px}
.yg{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
.yg .l{color:#666;font-size:9px;text-transform:uppercase}
.yg .v{font-weight:bold;font-size:13px;margin-top:2px}
.inv{color:#FF4D4D}.rev{color:#D1FF1E}.pro{color:#BEF674}.los{color:#FF4D4D}
.ben{color:#D1FF1E;font-size:11px;font-weight:500;margin-top:8px}
.phr{display:flex;gap:4px;padding:6px 12px;background:#1A1A1A;margin-bottom:3px;border-radius:3px;font-size:10px}
.phper{color:#D1FF1E;font-weight:bold;min-width:120px}
.phpct{color:#F5F5F5;font-weight:bold;min-width:90px}
.phd{color:#AAA}
table{width:100%;border-collapse:collapse;font-size:9.5px}
thead tr{background:#D1FF1E;color:#0D0D0D}
th{padding:5px 6px;text-align:left;font-weight:bold;font-size:8.5px;text-transform:uppercase}
td{padding:4px 6px;border-bottom:1px solid #1A1A1A}
tr:nth-child(even){background:#151515}
tr.be{background:rgba(209,255,30,0.08)}
.ft{position:absolute;bottom:8mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:8px;color:#666;border-top:1px solid #2E2E2E;padding-top:6px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.np{display:none}}
</style></head><body>
<div class="np" style="text-align:center;padding:16px;background:#1A1A1A">
<button onclick="window.print()" style="padding:10px 32px;background:#D1FF1E;color:#0D0D0D;border:none;border-radius:6px;font-weight:bold;font-size:14px;cursor:pointer">Tlacit / Ulozit ako PDF</button>
<p style="color:#666;font-size:11px;margin-top:8px">V dialogu tlace zvolte "Ulozit ako PDF" pre stiahnutie.</p></div>
<div class="page"><h1>SEO ROI Kalkulator</h1><div class="sub">Advestor - 36-mesacna projekcia navratnosti investicie do SEO</div><div class="hr"></div>
<h2>Vstupne parametre</h2>
${[["Cielova mesacna BOFU navstevnost",`${fmt(targetTraffic)} navstev`],["Typ biznisu",businessLabel],["Konverzny pomer",`${conversionRate}%`],["Priemerna hodnota objednavky / LTV",fmtEur(orderValue)],["Mesacna investicia do SEO",fmtEur(monthlyInvestment)]].map(([l,v])=>`<div class="pr"><span class="pl">${l}</span><span class="pv">${v}</span></div>`).join("")}
<h2>Vysledky po rokoch</h2>
${[{label:"ROK 1 (12 mesiacov)",d:year1},{label:"ROK 2 (24 mesiacov)",d:year2},{label:"ROK 3 (36 mesiacov)",d:year3}].map(({label,d})=>{const p=d.revenue-d.investment;const r=d.investment>0?(((d.revenue-d.investment)/d.investment)*100):0;return`<div class="yc"><div class="yt">${label}</div><div class="yg"><div><div class="l">Investicia</div><div class="v inv">${fmtEur(d.investment)}</div></div><div><div class="l">Obrat</div><div class="v rev">${fmtEur(d.revenue)}</div></div><div><div class="l">${p>=0?"Zisk":"Strata"}</div><div class="v ${p>=0?"pro":"los"}">${p>=0?"+":""}${fmtEur(p)}</div></div><div><div class="l">ROI</div><div class="v ${r>=0?"pro":"los"}">${r>=0?"+":""}${r.toFixed(0)}%</div></div></div></div>`}).join("")}
${breakEvenMonth?`<div class="ben">\u25CF Break-even bod: mesiac ${breakEvenMonth} - od tohto mesiaca kumulativny obrat z SEO prevysuje kumulativnu investiciu.</div>`:""}
<h2>Model rastu SEO</h2>
${[["Mesiace 1-3","0% ciela","Budovanie zakladov, technicke SEO, audit, strategia. Ziadna organicka navstevnost."],["Mesiace 4-6","5-15% ciela","Prve vysledky - indexacia obsahu, pociatocne rankingy."],["Mesiace 7-12","15-50% ciela","Vyrazny rast - obsah sa etabluje, backlink profil sa posilnuje."],["Rok 2 (mes. 13-24)","50-100% ciela","Zrelost - stabilne rankingy, rastuca autorita domeny."],["Rok 3 (mes. 25-36)","100-150% ciela","Snowball efekt - kumulativny rast prekracuje povodny ciel."]].map(([p,pct,d])=>`<div class="phr"><span class="phper">${p}</span><span class="phpct">${pct}</span><span class="phd">${d}</span></div>`).join("")}
<div class="ft"><span>Vsetky data su odhady na zaklade zadanych parametrov. Skutocne vysledky sa mozu lisit.</span><span>advestor.sk</span></div></div>
<div class="page"><h1>Mesacny prehlad</h1><div class="sub">Detailny rozpad po jednotlivych mesiacoch</div><div class="hr"></div>
<table><thead><tr><th>Mes.</th><th>% ciela</th><th>Traffic</th><th>Konverzie</th><th>Mes. obrat</th><th>Kum. obrat</th><th>Kum. investicia</th><th>Kum. zisk</th></tr></thead><tbody>
${data.map(row=>{const p=row.revenue-row.investment;return`<tr class="${row.month===breakEvenMonth?"be":""}"><td style="font-weight:bold">${row.month}</td><td>${Math.round(row.multiplier*100)}%</td><td>${row.traffic===0?"-":fmt(row.traffic)}</td><td>${row.conversions===0?"-":row.conversions}</td><td>${row.monthlyRevenue===0?"-":fmtEur(row.monthlyRevenue)}</td><td class="rev" style="font-weight:bold">${fmtEur(row.revenue)}</td><td class="inv">${fmtEur(row.investment)}</td><td class="${p>=0?"pro":"los"}" style="font-weight:bold">${p>=0?"+":""}${fmtEur(p)}</td></tr>`}).join("")}
</tbody></table>
<div class="ft"><span>Vsetky data su odhady na zaklade zadanych parametrov. Skutocne vysledky sa mozu lisit.</span><span>advestor.sk</span></div></div>
</body></html>`);
  pw.document.close();
}

export default function SEOROICalculator() {
  const [targetTraffic, setTargetTraffic] = useState(5000);
  const [businessType, setBusinessType] = useState("eshop");
  const [customRate, setCustomRate] = useState(2.5);
  const [orderValue, setOrderValue] = useState(80);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1500);

  const conversionRate = useMemo(() => businessType === "custom" ? customRate : (BUSINESS_TYPES.find(b => b.value === businessType)?.rate || 2), [businessType, customRate]);
  const businessLabel = useMemo(() => BUSINESS_TYPES.find(b => b.value === businessType)?.label || "Vlastny", [businessType]);

  const data = useMemo(() => {
    const rows = [];
    let cumInv = 0, cumRev = 0;
    for (let m = 1; m <= 36; m++) {
      const mult = getTrafficMultiplier(m);
      const traffic = Math.round(targetTraffic * mult);
      const conv = traffic * (conversionRate / 100);
      const mRev = conv * orderValue;
      cumInv += monthlyInvestment;
      cumRev += mRev;
      rows.push({ month: m, traffic, conversions: Math.round(conv), monthlyRevenue: Math.round(mRev), investment: Math.round(cumInv), revenue: Math.round(cumRev), multiplier: mult });
    }
    return rows;
  }, [targetTraffic, conversionRate, orderValue, monthlyInvestment]);

  const breakEvenMonth = useMemo(() => { for (const r of data) { if (r.revenue >= r.investment && r.revenue > 0) return r.month; } return null; }, [data]);
  const year1 = data[11], year2 = data[23], year3 = data[35];

  const handlePDF = useCallback(() => {
    generatePDF(data, { targetTraffic, conversionRate, orderValue, monthlyInvestment, businessLabel }, year1, year2, year3, breakEvenMonth);
  }, [data, targetTraffic, conversionRate, orderValue, monthlyInvestment, businessLabel, year1, year2, year3, breakEvenMonth]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.lime}, ${C.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.bg }}>A</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>SEO ROI Kalkulator</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Advestor - 36-mesacna projekcia</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, background: C.surface, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}` }}>Vsetky data su odhady na zaklade zadanych parametrov</div>
      </div>

      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

          <div style={{ background: C.surface, borderRadius: 14, padding: "24px 20px", border: `1px solid ${C.border}`, position: "sticky", top: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Parametre</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Upravte hodnoty a sledujte zmeny v realnom case</div>

            <InputField label="Cielova mesacna BOFU navstevnost" value={targetTraffic} onChange={setTargetTraffic} min={100} step={100}
              info="BOFU (Bottom of Funnel) - navstevnost s vysokym umyslom nakupu. Tieto navstevy konvertuju vyrazne lepsie ako bezny organicky traffic, pretoze uz hladaju konkretne riesenie." />

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: C.textSec, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", marginBottom: 6 }}>
                Typ biznisu (Konverzny pomer)<InfoTip text="Konverzny pomer sa lisi podla typu biznisu. BOFU traffic konvertuje vyrazne lepsie ako priemer - tieto hodnoty su konzervativne odhady pre BOFU segment." />
              </label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: "none", cursor: "pointer", appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                onFocus={(e) => (e.target.style.borderColor = C.lime)} onBlur={(e) => (e.target.style.borderColor = C.border)}>
                <option value="eshop" style={{ background: C.card }}>E-shop (Standard) - 2%</option>
                <option value="b2b" style={{ background: C.card }}>B2B (Lead generation) - 1,5%</option>
                <option value="local" style={{ background: C.card }}>Lokalne sluzby - 5%</option>
                <option value="saas" style={{ background: C.card }}>SaaS - 3%</option>
                <option value="custom" style={{ background: C.card }}>Vlastny konverzny pomer</option>
              </select>
            </div>

            {businessType === "custom" && <InputField label="Vlastny konverzny pomer" value={customRate} onChange={setCustomRate} suffix="%" min={0.1} step={0.1} />}

            <div style={{ background: C.card, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Aktivny konverzny pomer</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.lime }}>{conversionRate}%</span>
            </div>

            <InputField label="Priemerna hodnota objednavky / LTV" value={orderValue} onChange={setOrderValue} suffix={"\u20AC"} min={1} step={10}
              info="Priemerna hodnota objednavky pre e-shop, alebo LTV (Lifetime Value) zakaznika pre B2B / SaaS biznis modely." />
            <InputField label="Mesacna investicia do SEO" value={monthlyInvestment} onChange={setMonthlyInvestment} suffix={"\u20AC"} min={100} step={100} />

            <div style={{ marginTop: 8, padding: 14, borderRadius: 10, background: `linear-gradient(135deg, ${C.limeSubtle}, transparent)`, border: `1px solid ${C.lime}30` }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.textMuted, marginBottom: 8 }}>Mesacny potencial (pri 100%)</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 12, color: C.textSec }}>Konverzie</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{Math.round(targetTraffic * (conversionRate / 100))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: C.textSec }}>Mesacny obrat</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.lime }}>{fmtEur(Math.round(targetTraffic * (conversionRate / 100) * orderValue))}</span>
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <SummaryCard year={1} months={12} investment={year1?.investment || 0} revenue={year1?.revenue || 0} breakEvenMonth={breakEvenMonth && breakEvenMonth <= 12 ? breakEvenMonth : null} />
              <SummaryCard year={2} months={24} investment={year2?.investment || 0} revenue={year2?.revenue || 0} breakEvenMonth={breakEvenMonth && breakEvenMonth > 12 && breakEvenMonth <= 24 ? breakEvenMonth : null} />
              <SummaryCard year={3} months={36} investment={year3?.investment || 0} revenue={year3?.revenue || 0} isHighlight />
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: "24px 20px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Kumulativny obrat vs. investicia</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>36-mesacna projekcia rastu SEO</div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: C.lime }} /><span style={{ fontSize: 12, color: C.textSec }}>Obrat</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: C.red }} /><span style={{ fontSize: 12, color: C.textSec }}>Investicia</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.lime} stopOpacity={0.3} /><stop offset="100%" stopColor={C.lime} stopOpacity={0.02} /></linearGradient>
                    <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.15} /><stop offset="100%" stopColor={C.red} stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke={C.textMuted} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} interval={2} />
                  <YAxis stroke={C.textMuted} tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} width={55} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.borderLight }} />
                  {breakEvenMonth && <ReferenceLine x={breakEvenMonth} stroke={C.lime} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Break-even", fill: C.lime, fontSize: 11, fontWeight: 600, position: "top" }} />}
                  <Area type="monotone" dataKey="investment" stroke={C.red} strokeWidth={2} fill="url(#gInv)" dot={false} activeDot={{ r: 4, fill: C.red, stroke: C.card, strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="revenue" stroke={C.lime} strokeWidth={2.5} fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: C.lime, stroke: C.card, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: "24px 20px", border: `1px solid ${C.border}`, marginTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Krivka rastu SEO navstevnosti</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Realisticky model - prve 3 mesiace su nulove (budovanie zakladov), rast zacina az od 4. mesiaca</div>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                {[
                  { label: "Mes. 1-3", desc: "Nulovy traffic", pct: "0%", color: C.textMuted },
                  { label: "Mes. 4-6", desc: "Prve vysledky", pct: "5-15%", color: C.textSec },
                  { label: "Mes. 7-12", desc: "Rast", pct: "15-50%", color: C.green },
                  { label: "Rok 2", desc: "Zrelost", pct: "50-100%", color: C.lime },
                  { label: "Rok 3", desc: "Snowball", pct: "100-150%", color: C.lime },
                ].map((phase, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 110, padding: "12px 14px", borderLeft: i > 0 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{phase.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: phase.color, lineHeight: 1.2 }}>{phase.pct}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{phase.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: C.card }}>
                <div style={{ width: "8%", background: C.textMuted + "60" }} />
                <div style={{ width: "8%", background: C.textSec }} />
                <div style={{ width: "17%", background: C.green }} />
                <div style={{ width: "33%", background: C.lime, opacity: 0.7 }} />
                <div style={{ width: "34%", background: C.lime }} />
              </div>
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: "24px 20px", border: `1px solid ${C.border}`, marginTop: 20, overflowX: "auto" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Mesacny prehlad</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["Mesiac", "% ciela", "Traffic", "Konverzie", "Mes. obrat", "Kum. obrat", "Kum. investicia", "Kum. zisk"].map((h, i) => (
                      <th key={i} style={{ padding: "8px 8px", textAlign: i === 0 ? "left" : "right", color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const profit = row.revenue - row.investment;
                    const isBE = row.month === breakEvenMonth;
                    return (
                      <tr key={row.month} style={{ borderBottom: `1px solid ${C.border}`, background: isBE ? C.limeSubtle : "transparent" }}>
                        <td style={{ padding: "7px 8px", fontWeight: 600, color: C.text }}>{row.month}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: row.multiplier === 0 ? C.textMuted : C.textSec }}>{Math.round(row.multiplier * 100)}%</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: row.traffic === 0 ? C.textMuted : C.textSec }}>{row.traffic === 0 ? "-" : fmt(row.traffic)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: C.textSec }}>{row.conversions === 0 ? "-" : row.conversions}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: C.textSec }}>{row.monthlyRevenue === 0 ? "-" : fmtEur(row.monthlyRevenue)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: C.lime }}>{fmtEur(row.revenue)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: C.red }}>{fmtEur(row.investment)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 600, color: profit >= 0 ? C.green : C.red }}>{profit >= 0 ? "+" : ""}{fmtEur(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <button onClick={handlePDF}
                style={{ padding: "14px 40px", background: C.lime, color: C.bg, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", letterSpacing: -0.3, boxShadow: `0 4px 24px ${C.lime}30` }}
                onMouseEnter={(e) => { e.target.style.background = C.green; e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.target.style.background = C.lime; e.target.style.transform = "translateY(0)"; }}>
                {"\u2193"} Generovat PDF report
              </button>
              <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}>Vygeneruje sa 2-stranove PDF s kompletnym prehladom - parametre, vysledky a mesacna tabulka</div>
            </div>

            <div style={{ marginTop: 20, padding: "14px 20px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 12, color: C.textMuted }}>Tento kalkulator pouziva realisticky model rastu SEO s postupnym zvysovanim organickej navstevnosti.</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>advestor.sk</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.main-grid{grid-template-columns:1fr!important}.main-grid>div:first-child{position:static!important}}`}</style>
    </div>
  );
}
