"use strict";
// YouTube video IDs for the tutorial videos (Home "New here?" card and More → Help & tutorials). Empty = buttons hidden.
const TUTORIAL_VIDEOS = { en: { short: "qSs4VHZXorw", long: "gsC_dX7n-Lg" }, ro: { short: "ESDlTTuySII", long: "mNdrL7BHEJM" } };
const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fold = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const libKey = (s) => fold(s).replace(/[^a-z0-9]/g, "").slice(0, 80);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
const prefs = () => ({ autoplay: true, ...store.get("settings", {}) });
const setPref = (k, v) => { const s = store.get("settings", {}); v === undefined ? delete s[k] : (s[k] = v); store.set("settings", s); };
const apiKey = () => (prefs().ai === false ? "" : prefs().key || window.LOCAL_GEMINI_KEY || "");
const KEY_URL = "https://aistudio.google.com/apikey";
const keyLink = (t = "aistudio.google.com/apikey") => `<a href="${KEY_URL}" target="_blank" rel="noopener">${t} ↗</a>`;
const COUNTRY = () => prefs().country || prefs().home || "Romania";
const HOME = () => prefs().home || "Romania";
// Online version: videos live on Cloudflare R2 (set in site-config.js); locally they come from media/video/.
const vsrc = (p) => (window.VIDEO_BASE && p.startsWith("media/video/") ? window.VIDEO_BASE + p.slice(12) : p);
{ const ql = new URLSearchParams(location.search).get("lang"); if ((ql === "ro" || ql === "en") && !prefs().lang) setPref("lang", ql); }
const LANG = prefs().lang === "ro" ? "ro" : "en";
const L = (en, ro) => (LANG === "ro" ? ro : en);
let RO = null;
const tagName = (t) => (RO?.tags?.[t]) || t;
const nVideos = (n) => `${n} ${n === 1 ? L("video", "video") : L("videos", "videoclipuri")}`;

let ITEMS = [], BY_ID = {}, TAX = {}, CAT = {}, STAGE = {}, MEDIA = {}, LIBIMG = {}, AVATAR = {}, EMB = null;
const avatar = (a, p) => AVATAR[`${p}:${a}`] || AVATAR[`tiktok:${a}`] || AVATAR[`instagram:${a}`] || "";
const CAT_ICON = {
  "pregnancy": "🤰", "birth": "🏥", "postpartum": "🌷", "feeding-milk": "🍼", "solids-nutrition": "🥕", "sleep": "😴",
  "baby-care": "🛁", "health-medical": "🩺", "safety": "🛡️", "development": "🧠", "play-learning": "🧩",
  "emotions-tantrums": "🌋", "gentle-discipline": "🤝", "self-esteem-character": "🌟", "siblings-family": "👨‍👩‍👧‍👦",
  "dads-partners": "👨‍🍼", "parent-wellbeing": "💆", "couple-relationship": "💞", "childhood-reflections": "🪞",
  "neurodiversity": "🌈", "school-education": "🎒", "screens-tech": "📱", "teens-older": "🧑", "gear-products": "🛒",
  "home-routines": "🏡", "books-resources": "📚", "relatable-humor": "😄", "off-topic": "🗃️",
  "respect-equality": "⚖️", "gifts-keepsakes": "🎁", "media-recommendations": "📺", "ai-prompts": "🤖",
};
const PCAT = {
  "pregnancy-mom": ["🤰", L("Pregnancy & postpartum (mom)", "Sarcină și lăuzie (mama)")], "medical-mom": ["💊", L("Medical & health – for mom", "Medical și sănătate – pentru mama")],
  "breastfeeding-pumping": ["🤱", L("Breastfeeding & pumping", "Alăptare și pompare")], "feeding": ["🍼", L("Feeding & mealtime", "Hrănire și masă")], "sleep": ["😴", L("Sleep", "Somn")],
  "nursery-furniture": ["🛏️", L("Nursery & furniture", "Camera bebelușului și mobilier")], "gear-travel": ["🚼", L("Gear, strollers & travel", "Echipament, cărucioare și călătorii")], "clothing": ["👕", L("Clothing", "Haine")],
  "diapering-bath-skincare": ["🛁", L("Diapering, bath & skincare", "Scutece, baie și îngrijirea pielii")], "medical-child": ["🩹", L("Medical & health – for the child", "Medical și sănătate – pentru copil")],
  "safety": ["🛡️", L("Safety", "Siguranță")], "toys-activities": ["🧸", L("Toys & activities", "Jucării și activități")], "learning-books": ["🔤", L("Learning", "Învățare")],
  "home-organisation": ["🏡", L("Home & organisation", "Casă și organizare")], "other": ["🛍️", L("Other", "Altele")],
};
const MEDIA_KIND = { "cartoon-tv": L("📺 Cartoons & TV", "📺 Desene și TV"), "movie": L("🎬 Movies", "🎬 Filme"), "youtube-channel": "▶️ YouTube", "game": L("🎮 Games", "🎮 Jocuri"),
  "app": L("📱 Apps", "📱 Aplicații"), "podcast": L("🎧 Podcasts", "🎧 Podcasturi"), "music": L("🎵 Music", "🎵 Muzică"),
  "website-course": L("🌐 Websites & courses", "🌐 Site-uri și cursuri"), "social-account": L("👤 Accounts", "👤 Conturi") };
const GIFT_KIND = { "gift": L("🎁 Gift ideas", "🎁 Idei de cadouri"), "keepsake": L("💌 Keepsakes", "💌 Amintiri"), "built-over-time": L("⏳ Built over time", "⏳ Construite în timp") };
const TYPE_LABEL = { "advice": L("Advice", "Sfaturi"), "how-to-demo": L("How-to demo", "Demonstrație"), "scripts": L("What to say", "Ce să spui"),
  "research-explainer": L("Research explained", "Studii explicate"), "personal-story": L("Personal story", "Poveste personală"),
  "product-review": L("Product review", "Recenzie produs"), "activity-idea": L("Activity idea", "Idee de activitate"), "recipe": L("Recipe", "Rețetă"),
  "list-recommendations": L("Recommendations list", "Listă de recomandări"), "reflection": L("Reflection", "Reflecție"), "humor": L("Humor", "Umor"), "news": L("News", "Știri") };
const GROUPS = [
  ["🤰", L("Pregnancy & birth", "Sarcină și naștere"), ["pregnancy", "birth", "postpartum"]],
  ["👶", L("Baby", "Bebeluș"), ["feeding-milk", "solids-nutrition", "sleep", "baby-care", "health-medical", "safety", "development"]],
  ["🧒", L("Growing up", "Creștere"), ["emotions-tantrums", "gentle-discipline", "self-esteem-character", "respect-equality", "play-learning", "neurodiversity", "school-education", "screens-tech", "teens-older"]],
  ["💛", L("You & your family", "Tu și familia ta"), ["parent-wellbeing", "dads-partners", "couple-relationship", "siblings-family", "childhood-reflections", "home-routines"]],
  ["🛍️", L("Things, books & laughs", "Lucruri, cărți și râsete"), ["gear-products", "books-resources", "media-recommendations", "gifts-keepsakes", "ai-prompts", "relatable-humor"]],
];
const TRI = { first: L("1st trimester", "Trimestrul 1"), second: L("2nd trimester", "Trimestrul 2"), third: L("3rd trimester", "Trimestrul 3"), general: L("Whole pregnancy", "Toată sarcina") };
const TRI_ICON = { first: "🌱", second: "🌿", third: "🌳", general: "🤰" };
const catName = (c) => (CAT[c] || c).split(":")[0];
const stageName = (s) => STAGE[s] || s;
const inCat = (it, c) => it.category === c || it.topics.includes(c);
const getJSON = (u, d) => fetch(u, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : d)).catch(() => d);

async function load() {
  const [items, tax, media, lib, av, ro] = await Promise.all([getJSON("data/items.json", []), getJSON("data/taxonomy.json", {}),
    getJSON("data/media.json", {}), getJSON("data/lib_images.json", {}), getJSON("data/avatars.json", {}),
    LANG === "ro" ? getJSON("data/ro.json?v=" + Date.now(), null) : null]);
  ITEMS = items; TAX = tax; CAT = tax.categories; STAGE = tax.life_stages; MEDIA = media; LIBIMG = lib; AVATAR = av; RO = ro;
  if (RO) { CAT = { ...CAT, ...RO.cat }; STAGE = { ...STAGE, ...RO.stage }; }
  const setTop = () => document.documentElement.style.setProperty("--toph", $(".top").offsetHeight + "px");
  setTop(); addEventListener("resize", setTop);
  for (const it of ITEMS) {
    BY_ID[it.id] = it;
    it.tri ||= []; it.media ||= []; it.gifts ||= []; it.prompts ||= [];
    // English text stays in the search index so searching works in both languages.
    const enTxt = [it.title, it.summary, ...it.key_points, ...it.scripts].join(" ");
    const r = RO?.items?.[it.id];
    if (r) applyRo(it, r);
    it._title = fold(it.title); it._tags = fold(it.tags.map((t) => t + " " + tagName(t)).join(" ")); it._sum = fold(it.summary);
    it._pts = fold([...it.key_points, ...it.scripts].join(" "));
    const mtxt = [...Object.values(it.mentions || {}).flat(), ...it.media, ...it.gifts, ...it.prompts]
      .map((m) => (typeof m === "string" ? m : Object.values(m).join(" "))).join(" ");
    it._rest = fold([it.onscreen.join(" "), it.caption, it.author, it.author_name, mtxt, r ? enTxt : ""].join(" "));
    it._tr = fold(it.transcript);
    it._all = [it._title, it._tags, it._sum, it._pts, it._rest, it._tr].join(" \n ");
  }
  route();
}
function applyRo(it, r) {
  const same = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length;
  if (r.title) it.title = r.title;
  if (r.summary) it.summary = r.summary;
  if (same(r.key_points, it.key_points)) it.key_points = r.key_points;
  if (same(r.scripts, it.scripts)) it.scripts = r.scripts;
  for (const k of ["caution", "credentials", "sensitive"]) if (it[k] && r[k]) it[k] = r[k];
  // extras order must match translate_ro.py: product why, people role, media why, gift how, prompt purpose, prompt text
  const m = it.mentions || {}, x = r.extras || [], slots = [];
  (m.products || []).forEach((p) => slots.push([p, "type"]));
  (m.people || []).forEach((p) => slots.push([p, "role"]));
  it.media.forEach((p) => slots.push([p, "why"]));
  it.gifts.forEach((p) => slots.push([p, "how"]));
  it.prompts.forEach((p) => slots.push([p, "purpose"]));
  it.prompts.forEach((p) => slots.push([p, "prompt"]));
  if (x.length === slots.length) slots.forEach(([o, k], i) => { if (o[k] && x[i]) o[k] = x[i]; });
}

async function loadEmb() {
  if (EMB) return EMB;
  const j = await getJSON("data/emb.json", null);
  if (!j) return null;
  const ids = Object.keys(j.v), vecs = ids.map((id) => {
    const b = atob(j.v[id]), a = new Int8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = (b.charCodeAt(i) << 24) >> 24;
    return a;
  });
  return (EMB = { dim: j.dim, ids, vecs });
}

/* ---------- keyword search (rare words count most) ---------- */
// EN<->RO synonym groups so a query in either language finds both.
const SYN = [
  ["tantrum", "meltdown", "criza", "crize", "furie", "isterie"], ["sleep", "somn", "doarme", "dormit", "nap"],
  ["book", "carte", "carti"], ["breastfeed", "alapta", "nursing"], ["pregnan", "sarcin", "gravid", "insarcinat"],
  ["baby", "bebe", "bebelus", "infant", "newborn", "nou-nascut"], ["toddler", "copil mic"], ["birth", "nastere", "labor", "labour"],
  ["dad", "father", "tata", "tati", "husband"], ["mom", "mother", "mama", "mami"], ["food", "mancare", "solids", "diversificare"],
  ["cry", "plans", "plange"], ["fever", "febra"], ["teeth", "dinti", "teething"], ["school", "scoala", "gradinita", "kindergarten"],
  ["sibling", "frate", "frati", "sora"], ["anger", "furie", "angry", "nervos"], ["fear", "frica", "anxiet"], ["potty", "olita"],
  ["screen", "ecran", "telefon", "tablet"], ["hospital", "spital", "maternitate"], ["postpartum", "lehuz", "dupa nastere"],
  ["chok", "heimlich", "back blow", "chest thrust", "airway", "inec", "sufoc", "obstruct"],
  ["cpr", "resuscitat", "resuscitare", "first aid", "prim ajutor"], ["burn", "arsur"], ["poison", "otrav", "intoxic"],
  ["emergenc", "urgent", "urgenta"], ["colic", "colici"], ["rash", "eczema", "iritat"], ["bottle", "biberon"],
  ["stroller", "carucior", "pram"], ["car seat", "scaun auto"], ["diaper", "scutec", "nappy"], ["bath", "baie"],
  ["hit", "hitting", "hits", "lovest", "lovit", "loveste", "lovi"], ["bite", "biting", "musca", "muscat"], ["kid", "child", "copil", "copii", "children"],
  ["regression", "regresie", "leap"], ["vaccin", "vaccine", "vaccination", "vaccinare"],
];
const SYN_IDX = {};
for (const g of SYN) for (const w of g) SYN_IDX[w] = g;
const EMERGENCY = /\b(chok|inec|sufoc|heimlich|cpr|resusc|burn|arsur|poison|otrav|emergenc|urgent|not breathing|nu respira|seizure|convuls|febra|fever)/;
const STOP = new Set(("the a an and or of to in on for with my your our their his her how what whats when why where who which is are was were be been " +
  "do does did done doing it its at about from vs i im me we us you he she they them this that these those then than there here if so but not no " +
  "can cant could should would will shall may might must has have had get got any some all just very really also too like want need know " +
  "please tips advice ok okay one ones thing things way ways much many more most other something anything " +
  "si sa la cu de pe in un o ce cum cand unde care este sunt e a al ale ai au fi fost nu da mai foarte pentru din sau iar dar ca prin dupa " +
  "despre eu tu el ea noi voi ei ele meu mea fac face trebuie").split(" "));
const stem = (t) => (t.length > 4 ? t.replace(/(ings?|ies|es|ed|s|e)$/, "") : t);
function variants(t) {
  const st = stem(t), out = new Set([t]);
  if (st.length >= 3) out.add(st);
  for (const [w, g] of Object.entries(SYN_IDX))
    if (t === w || st === w || (w.length >= 4 && (t.startsWith(w) || st.startsWith(w))) || (st.length >= 5 && w.startsWith(st))) g.forEach((x) => out.add(x));
  return [...out].map((v) => (v.length <= 4 ? new RegExp("\\b" + v.replace(/[-]/g, "\\-")) : v));
}
const has = (txt, t) => (typeof t === "string" ? txt.includes(t) : t.test(txt));
const DF = new Map();
function idf(v) {
  const k = String(v);
  if (!DF.has(k)) { let n = 0; for (const it of ITEMS) if (has(it._all, v)) n++; DF.set(k, n); }
  const n = DF.get(k);
  return n ? Math.log(1 + ITEMS.length / n) : 0;
}
function search(q) {
  const toks = [...new Set(fold(q).split(/[^a-z0-9-]+/).filter((t) => t.length > 1 && !STOP.has(t)))];
  const terms = toks.map((t) => variants(t).map((v) => [v, idf(v)]).filter((x) => x[1] > 0)).filter((v) => v.length);
  if (!terms.length) return [];
  const W = terms.map((v) => Math.max(...v.map((x) => x[1])));
  const totalW = W.reduce((a, b) => a + b, 0), rarest = W.indexOf(Math.max(...W));
  const urgent = EMERGENCY.test(fold(q));
  const res = [], part = [];
  for (const it of ITEMS) {
    let score = 0, got = 0, hitRarest = false;
    terms.forEach((v, i) => {
      let s = 0;
      for (const [t, w] of v) {
        if (!has(it._all, t)) continue;
        let x = 0;
        if (has(it._title, t)) x += 6;
        if (has(it._tags, t)) x += 5;
        if (has(it._pts, t)) x += 3;
        if (has(it._sum, t)) x += 3;
        if (has(it._rest, t)) x += 1.5;
        if (has(it._tr, t)) x += 1;
        s = Math.max(s, x * w);
      }
      if (s) { got += W[i]; if (i === rarest) hitRarest = true; }
      score += s;
    });
    const cover = got / totalW;
    if (!score) continue;
    let final = score * cover * cover + it.useful * 0.3;
    if (urgent && (inCat(it, "safety") || inCat(it, "health-medical"))) final *= 1.6;
    if (it.category === "off-topic" || it.category === "relatable-humor") final *= 0.6;
    if (hitRarest || cover >= 0.7) res.push([final, it]);
    else if (cover >= 0.35) part.push([final, it]);
  }
  const top = (arr, f) => { arr.sort((a, b) => b[0] - a[0]); const cut = arr.length ? arr[0][0] * f : 0; return arr.filter((x) => x[0] >= cut).map((x) => x[1]); };
  const strict = top(res, 0.25);
  // Few exact matches (e.g. a rare word): add the best partial matches after them.
  return strict.length >= 5 ? strict : [...strict, ...top(part, 0.4).slice(0, 30)];
}

/* ---------- Gemini (AI answers) ---------- */
const ASK_MODELS = [["gemini-3.5-flash", 30000], ["gemini-3.1-flash-lite", 30000]];
async function gfetch(path, body, timeout = 30000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${path}`, { method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || "HTTP " + r.status);
    return j;
  } finally { clearTimeout(t); }
}
async function semantic(q, k = 20) {
  const e = await loadEmb();
  if (!e) return [];
  const r = await gfetch("gemini-embedding-001:embedContent", { content: { parts: [{ text: q }] }, taskType: "RETRIEVAL_QUERY", outputDimensionality: e.dim }, 15000);
  const qv = r.embedding.values;
  const sc = e.vecs.map((v, i) => { let s = 0; for (let d = 0; d < qv.length; d++) s += qv[d] * v[d]; return [s, e.ids[i]]; });
  return sc.sort((a, b) => b[0] - a[0]).slice(0, k).map((x) => BY_ID[x[1]]).filter(Boolean);
}
const ASK_CACHE = {};
async function ask(q) {
  if (ASK_CACHE[q]) return ASK_CACHE[q];
  const kw = search(q).slice(0, 10);
  let sem = [];
  try { sem = await semantic(q, 20); } catch (e) { console.warn("semantic", e); }
  const cand = [], seen = new Set();
  for (const it of [...sem.slice(0, 12), ...kw, ...sem.slice(12)])
    if (it && !seen.has(it.id) && it.category !== "off-topic") { seen.add(it.id); cand.push(it); if (cand.length >= 22) break; }
  const src = cand.map((it, i) => `[${i + 1}] ${it.title} (by @${it.author}${it.credentials ? ", " + it.credentials : ""}; ${TYPE_LABEL[it.type] || it.type})
Summary: ${it.summary}
Key points: ${it.key_points.join(" | ")}${it.scripts.length ? "\nWhat to say: " + it.scripts.join(" | ") : ""}${it.caution ? "\nCaution: " + it.caution : ""}`).join("\n\n");
  const prompt = `You are a warm, practical helper inside a parenting library app made for a new mom. A parent asks: «${q}»

Answer ONLY from the numbered sources below (summaries of saved Instagram/TikTok videos). Cite sources inline like [3] or [2][5] right after each piece of advice; when several sources say the same thing, cite them together. If the sources do not really answer the question, say so honestly in one sentence and suggest what to search instead. Never invent advice that is not in the sources.
If it is an urgent safety/medical situation (e.g. choking, not breathing, seizure, high fever in a newborn), start with "**Call 112 (emergency) if…**" and then give the clear steps from the sources.
Keep it short and easy to scan on a phone: one plain sentence first, then bullet points ("- "). Use **bold** for the key actions. Answer in the same language as the question. Do not add a medical disclaimer (the app already shows one).

SOURCES:
${src}`;
  let text = "", err = "";
  for (const [model, ms] of ASK_MODELS) {
    try {
      const r = await gfetch(`${model}:generateContent`, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }, ms);
      text = (r.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
      if (text) break;
    } catch (e) { err = e.name === "AbortError" ? "timed out" : e.message; console.warn(model, err); }
  }
  if (!text) throw new Error(err || "no answer");
  return (ASK_CACHE[q] = { text, cand });
}
function renderAnswer({ text, cand }) {
  const cited = [];
  const cite = (n) => { const it = cand[n - 1]; if (!it) return ""; if (!cited.includes(it)) cited.push(it);
    return `<a class="cite" href="#/item/${encodeURIComponent(it.id)}" title="${esc(it.title)}">${cited.indexOf(it) + 1}</a>`; };
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>").replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_, ns) => ns.split(/\s*,\s*/).map((n) => cite(+n)).join(""));
  let html = "", inList = false;
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-*•]\s+(.*)/);
    if (m) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(m[1])}</li>`; continue; }
    if (inList) { html += "</ul>"; inList = false; }
    if (line.trim()) html += `<p>${inline(line.replace(/^#+\s*/, ""))}</p>`;
  }
  if (inList) html += "</ul>";
  return `<div class="answer">${html}</div><div class="med small">${L("🩺 This is not medical advice — check with your doctor.", "🩺 Acesta nu este un sfat medical — verifică cu medicul tău.")}</div>
    ${cited.length ? `<h3>${L("Sources used", "Surse folosite")}</h3><div class="list">${cited.map((it, i) => card(it, i + 1)).join("")}</div>` : ""}`;
}
/* anonymous usage stats (Microsoft Clarity, only on the live site) */
function track(ev, tags) {
  try { if (!window.clarity) return; clarity("event", ev); for (const k in tags || {}) clarity("set", k, String(tags[k]).slice(0, 200)); } catch {}
}
async function runAsk(q) {
  track("ai_question", { ai_q: q });
  const box = $("#askBox");
  if (!box) return;
  box.innerHTML = `<div class="asking"><span class="spin"></span> ${L("Reading the videos for you…", "Citesc videoclipurile pentru tine…")}</div>`;
  try {
    const r = await ask(q);
    if ($("#askBox") === box) box.innerHTML = `<div class="askhead">${L("✨ Answer from your videos", "✨ Răspuns din videoclipurile tale")}</div>` + renderAnswer(r);
  } catch (e) {
    if ($("#askBox") === box) box.innerHTML = `<div class="muted">${L("✨ Couldn't get an AI answer", "✨ Nu am putut obține un răspuns AI")} (${esc(e.message)}). <button class="btn ghost sm" data-ask="${esc(q)}">${L("Try again", "Încearcă din nou")}</button></div>`;
  }
}

/* ---------- where to buy / watch ---------- */
const enc = encodeURIComponent;
const CNAME = { Romania: ["Romania", "România"], Moldova: ["Moldova", "Moldova"], "United Kingdom": ["United Kingdom", "Regatul Unit"], Germany: ["Germany", "Germania"],
  Netherlands: ["Netherlands", "Țările de Jos"], Italy: ["Italy", "Italia"], Spain: ["Spain", "Spania"], France: ["France", "Franța"], "United States": ["United States", "Statele Unite"] };
const cName = (c) => (CNAME[c] ? L(...CNAME[c]) : c);
const countrySel = (id, cur) => `<select id="${id}">${Object.keys(CNAME).map((c) => `<option value="${c}" ${cur === c ? "selected" : ""}>${esc(cName(c))}</option>`).join("")}</select>`;
// Per shopping country: Google Shopping region, Amazon domain (if any), and price-comparison sites. First site = default "Buy" link.
const SHOPS = {
  Romania: { gl: "ro", sites: [["eMAG", "https://www.emag.ro/search/"], ["Compari.ro", "https://www.compari.ro/CategorySearch.php?st="], ["Price.ro", "https://www.price.ro/index.php?action=q&text="]] },
  Moldova: { gl: "md", sites: [["999.md", "https://999.md/ro/search?query="]] },
  "United Kingdom": { gl: "uk", amz: "co.uk", sites: [["Amazon.co.uk", "https://www.amazon.co.uk/s?k="], ["PriceRunner", "https://www.pricerunner.com/results?q="]] },
  Germany: { gl: "de", amz: "de", sites: [["Amazon.de", "https://www.amazon.de/s?k="], ["idealo", "https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q="], ["Geizhals", "https://geizhals.de/?fs="]] },
  Netherlands: { gl: "nl", amz: "nl", sites: [["bol.com", "https://www.bol.com/nl/nl/s/?searchtext="], ["Amazon.nl", "https://www.amazon.nl/s?k="]] },
  Italy: { gl: "it", amz: "it", sites: [["Amazon.it", "https://www.amazon.it/s?k="]] },
  Spain: { gl: "es", amz: "es", sites: [["Amazon.es", "https://www.amazon.es/s?k="]] },
  France: { gl: "fr", amz: "fr", sites: [["Amazon.fr", "https://www.amazon.fr/s?k="]] },
  "United States": { gl: "us", amz: "com", sites: [["Amazon", "https://www.amazon.com/s?k="]] },
};
const shopOf = () => SHOPS[COUNTRY()] || SHOPS.Romania;
function shopLink(kind, name, extra, q0) {
  const S = shopOf(), q = [name, extra].filter(Boolean).join(" ");
  if (kind === "books") return S.amz ? `https://www.amazon.${S.amz}/s?k=${enc(q)}&i=stripbooks` : `https://www.google.com/search?q=${enc(q + " carte cumpără")}`;
  if (kind === "products") return S.sites[0][1] + enc(q0 || (extra && !name.toLowerCase().includes(extra.toLowerCase()) ? extra + " " + name : name));
  if (kind === "media") {
    if (extra === "youtube-channel" || extra === "music") return `https://www.youtube.com/results?search_query=${enc(name)}`;
    if (extra === "app" || extra === "game") return `https://play.google.com/store/search?q=${enc(name)}&c=apps`;
    if (extra === "podcast") return `https://open.spotify.com/search/${enc(name)}`;
    return `https://www.google.com/search?q=${enc(name + (LANG === "ro" ? " unde vizionez" : " where to watch"))}`;
  }
  return "";
}
const shopLabel = (kind) => (kind === "media" ? L("Where to watch / get", "Unde găsești") : kind === "books" ? L("Find this book", "Găsește cartea") : L("Find in shops", "Caută în magazine"));

// AI price finder: Gemini with Google Search grounding. Only offered when an API key is set.
const PRICE_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
async function findPrices(name, brand) {
  const country = COUNTRY(), ck = `${country}|${name}|${brand || ""}`, cache = store.get("prices", {});
  if (cache[ck] && Date.now() - cache[ck].t < 3 * 864e5) return cache[ck];
  const prompt = `Search the web for where to buy "${name}"${brand ? ` (brand: ${brand})` : ""} online in ${country} right now, from shops that deliver to ${country}.
Return ONLY a JSON array (no prose) of up to 6 current offers sorted by price, cheapest first:
[{"store":"shop name","price":123.45,"currency":"RON","url":"product page URL","note":"e.g. size/variant, used, out of stock"}]
Use only offers you actually found in the search results; never guess prices. If it's the same type of product but a different brand, say so in note. If nothing is found, return [].`;
  let err = "";
  for (const model of PRICE_MODELS) {
    try {
      const r = await gfetch(`${model}:generateContent`, { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0 } }, 45000);
      const c = r.candidates?.[0], txt = (c?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
      const m = txt.match(/\[[\s\S]*\]/);
      if (!m) { err = "no result"; continue; }
      const offers = JSON.parse(m[0]).filter((o) => o && o.store);
      const srcs = (c.groundingMetadata?.groundingChunks || []).map((g) => g.web).filter(Boolean);
      const res = { t: Date.now(), offers, srcs };
      cache[ck] = res; store.set("prices", cache);
      return res;
    } catch (e) { err = e.name === "AbortError" ? "timed out" : e.message; console.warn("prices", model, err); }
  }
  throw new Error(err || "no result");
}
async function runPrices(box) {
  const { name, brand } = box.dataset;
  box.innerHTML = `<div class="asking"><span class="spin"></span> ${L("Searching shops in", "Caut prin magazinele din")} ${esc(cName(COUNTRY()))}…</div>`;
  try {
    const { offers, srcs } = await findPrices(name, brand);
    const domains = srcs.map((s) => (s.title || "").toLowerCase());
    const link = (o) => {
      let host = "";
      try { host = new URL(o.url).hostname.replace(/^www\./, ""); } catch {}
      // Only trust a URL if its site appeared in the actual search results; otherwise search that shop.
      return host && domains.some((d) => d.includes(host) || host.includes(d)) ? o.url
        : `https://www.google.com/search?q=${enc(name + " " + (host || o.store))}`;
    };
    box.innerHTML = offers.length ? `<div class="prices">${offers.map((o) => `<a class="offer" href="${esc(link(o))}" target="_blank" rel="noopener">
        <b>${esc(o.store)}</b><span class="pr">${o.price ? esc(String(o.price)) + " " + esc(o.currency || "") : "—"}</span>${o.note ? `<small>${esc(o.note)}</small>` : ""}</a>`).join("")}</div>
      <p class="muted small">${L("Found by AI with Google Search — prices change often, check on the shop's site before buying.", "Găsite de AI cu Google Search — prețurile se schimbă des, verifică pe site-ul magazinului înainte să cumperi.")}</p>`
      : `<p class="muted">${L("No offers found right now.", "Nu am găsit oferte acum.")}</p>`;
  } catch (e) {
    const quota = /quota|exceeded|429|no longer available/i.test(e.message);
    box.innerHTML = `<p class="muted">${quota
        ? L("The AI price search isn't available on this API key (Google Search needs a paid Gemini plan or the free quota is used up). Compare prices here instead:", "Căutarea AI de prețuri nu e disponibilă pe această cheie (Google Search cere un plan Gemini plătit sau s-a terminat cota gratuită). Compară prețurile aici:")
        : L("Couldn't search prices", "Nu am putut căuta prețurile") + ` (${esc(e.message)}). <button class="btn ghost sm" data-prices>${L("Try again", "Încearcă din nou")}</button><br>` + L("Or compare prices here:", "Sau compară prețurile aici:")}</p>
      ${compareLinks(name, brand)}`;
  }
}
function compareLinks(name, brand) {
  const q = [brand, name].filter(Boolean).join(" "), S = shopOf();
  const sites = [...S.sites.map(([n, u]) => [n, u + enc(q)]), ["Google Shopping", `https://www.google.com/search?tbm=shop&gl=${S.gl}&q=${enc(q)}`]];
  return `<div class="row">${sites.map(([n, u]) => `<a class="btn ghost sm" href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join(" ")}</div>`;
}

/* ---------- help lines per country (checked Nov 2026: findahelpline.com and official sites) ---------- */
const SOS = L("Emergency — ambulance, police, fire", "Urgențe — ambulanță, poliție, pompieri");
const H24 = L("24/7, free", "24/7, gratuit"), FREE = L("free", "gratuit");
const HELPS = {
  Romania: { sos: "112", lines: [
    ["🚨", "112", SOS, H24],
    ["🤱", "0374 451 362", L("DepreHUB M.A.M.A — emotional support for moms (pregnancy, postpartum)", "DepreHUB M.A.M.A — sprijin emoțional pentru mame (sarcină, lăuzie)"), L("free & confidential", "gratuit și confidențial")],
    ["💬", "0374 456 420", L("DepreHUB — emotional support for anyone", "DepreHUB — sprijin emoțional pentru oricine"), H24],
    ["🕊️", "0800 801 200", L("TelVerde Antisuicid — if you have dark thoughts", "TelVerde Antisuicid — dacă ai gânduri negre"), FREE],
    ["🛡️", "0800 500 333", L("Domestic violence helpline", "Linia pentru victimele violenței domestice"), H24],
    ["🧒", "116 111", L("Telefonul Copilului — for children and parents", "Telefonul Copilului — pentru copii și părinți"), FREE]] },
  Moldova: { sos: "112", lines: [
    ["🚨", "112", SOS, H24],
    ["🛡️", "0800 88008", L("Helpline for women and girls facing violence", "Linia pentru femei și fete care se confruntă cu violența"), L("free & confidential", "gratuit și confidențial")],
    ["🧒", "116 111", L("Telefonul Copilului — for children and parents", "Telefonul Copilului — pentru copii și părinți"), FREE]] },
  "United Kingdom": { sos: "999", lines: [
    ["🚨", "999", SOS, H24],
    ["🩺", "111", L("NHS 111 — urgent medical advice", "NHS 111 — sfat medical urgent"), H24],
    ["🤱", "0808 1961 776", L("PANDAS — perinatal mental health support for parents", "PANDAS — sprijin pentru sănătatea mintală a părinților în sarcină și după naștere"), FREE],
    ["💬", "116 123", L("Samaritans — whatever you're going through", "Samaritans — orice ai trece"), H24],
    ["🛡️", "0808 2000 247", L("National Domestic Abuse Helpline", "Linia națională pentru violență domestică"), H24],
    ["🧒", "0800 1111", L("Childline — for children and young people", "Childline — pentru copii și tineri"), FREE]] },
  Germany: { sos: "112", lines: [
    ["🚨", "112", SOS + L(" (police: 110)", " (poliție: 110)"), H24],
    ["💬", "116 123", L("TelefonSeelsorge — emotional support, anonymous", "TelefonSeelsorge — sprijin emoțional, anonim"), H24],
    ["🤰", "0800 40 40 020", L("Hilfetelefon Schwangere in Not — pregnant and struggling", "Hilfetelefon Schwangere in Not — pentru gravide în dificultate"), H24],
    ["👪", "0800 111 0 550", L("Elterntelefon — parents' helpline", "Elterntelefon — linia pentru părinți"), FREE],
    ["🛡️", "116 016", L("Hilfetelefon Gewalt gegen Frauen — violence against women, many languages", "Hilfetelefon Gewalt gegen Frauen — violență împotriva femeilor, în multe limbi"), H24],
    ["🧒", "116 111", L("Nummer gegen Kummer — for children and teens", "Nummer gegen Kummer — pentru copii și adolescenți"), FREE]] },
  Netherlands: { sos: "112", lines: [
    ["🚨", "112", SOS, H24],
    ["🕊️", "113", L("113 Zelfmoordpreventie — if you have dark thoughts (also free: 0800 0113)", "113 Zelfmoordpreventie — dacă ai gânduri negre (gratuit și la 0800 0113)"), "24/7"],
    ["🛡️", "0800 2000", L("Veilig Thuis — domestic violence and child abuse", "Veilig Thuis — violență domestică și abuz asupra copiilor"), H24],
    ["🧒", "0800 0432", L("De Kindertelefoon — for children and teens", "De Kindertelefoon — pentru copii și adolescenți"), FREE]] },
  Italy: { sos: "112", lines: [
    ["🚨", "112", SOS, H24],
    ["💬", "02 2327 2327", L("Telefono Amico — emotional support", "Telefono Amico — sprijin emoțional"), ""],
    ["🛡️", "1522", L("Violence and stalking helpline", "Linia pentru violență și hărțuire"), H24],
    ["🧒", "19696", L("Telefono Azzurro — for children and parents", "Telefono Azzurro — pentru copii și părinți"), H24]] },
  Spain: { sos: "112", lines: [
    ["🚨", "112", SOS, H24],
    ["🕊️", "024", L("Suicidal behaviour helpline", "Linia pentru prevenirea suicidului"), H24],
    ["🛡️", "016", L("Gender violence helpline", "Linia pentru violența de gen"), H24],
    ["🧒", "900 20 20 10", L("Fundación ANAR — for children and teens", "Fundación ANAR — pentru copii și adolescenți"), H24]] },
  France: { sos: "112", lines: [
    ["🚨", "112", SOS + L(" (medical: 15)", " (medical: 15)"), H24],
    ["🕊️", "3114", L("Suicide prevention line", "Linia de prevenire a suicidului"), H24],
    ["🛡️", "3919", L("Violences Femmes Info", "Violences Femmes Info — violență împotriva femeilor"), H24],
    ["🧒", "119", L("Allô Enfance en Danger — children at risk", "Allô Enfance en Danger — copii în pericol"), H24]] },
  "United States": { sos: "911", lines: [
    ["🚨", "911", SOS, "24/7"],
    ["🤱", "1-833-852-6262", L("National Maternal Mental Health Hotline (call or text)", "Linia națională pentru sănătatea mintală a mamelor (apel sau SMS)"), H24],
    ["🕊️", "988", L("988 Suicide & Crisis Lifeline (call or text)", "988 — linia pentru criză și suicid (apel sau SMS)"), H24],
    ["🛡️", "1-800-799-7233", L("National Domestic Violence Hotline", "Linia națională pentru violență domestică"), H24]] },
};
const helpSet = () => HELPS[HOME()] || HELPS.Romania;
function helpPage() {
  const H = helpSet();
  return `<h1>${L("🆘 Help lines", "🆘 Linii de ajutor")}</h1>
    <p class="muted">${L("You are not alone. Asking for help is a strong thing to do.", "Nu ești singură. Să ceri ajutor e un lucru curajos.")} ${L("Numbers for", "Numere pentru")} <b>${esc(cName(HOME()))}</b> · <a href="#/settings">${L("change country", "schimbă țara")}</a></p>
    <div class="helplist">${H.lines.map(([e, n, d, h]) => `<div class="helpitem ${n === H.sos ? "sos" : ""}"><div><b>${e} ${esc(d)}</b>${h ? `<small>${esc(h)}</small>` : ""}</div>
      <a class="btn ${n === H.sos ? "" : "ghost"}" href="tel:${n.replace(/[\s-]/g, "")}">📞 ${n}</a></div>`).join("")}</div>
    <p class="muted small">${L("Other countries:", "Alte țări:")} <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com ↗</a>.
      ${L("You can hide the help bar at the bottom of pages in More → Help lines.", "Poți ascunde bara de ajutor de la finalul paginilor din Mai mult → Linii de ajutor.")}</p>`;
}

/* ---------- components ---------- */
const sexLabel = (s) => (s === "boy" ? L("👦 boy", "👦 băiat") : s === "girl" ? L("👧 girl", "👧 fată") : L("👦👧 boy & girl", "👦👧 băiat și fată"));
function card(it, num) {
  const badges = [
    it.sex ? `<span class="badge ${it.sex}">${sexLabel(it.sex)}</span>` : "",
    it.lang && it.lang !== "en" ? `<span class="badge">${esc(it.lang.toUpperCase())}</span>` : "",
    it.health ? `<span class="badge med">${L("🩺 Not medical advice · check with your doctor", "🩺 Nu e sfat medical · verifică cu medicul")}</span>` : "",
    it.sensitive ? `<span class="badge sens">${L("⚠️ Sensitive", "⚠️ Subiect sensibil")}: ${esc(it.sensitive)}</span>` : "",
  ].join("");
  const md = MEDIA[it.id], play = md?.video ? "▶" : md?.slides ? `▦ ${md.slides.length}` : "";
  return `<a class="card" href="#/item/${encodeURIComponent(it.id)}">
    <div class="th ${it.sensitive ? "blur" : ""}"><img loading="lazy" src="${esc(it.thumb)}" alt="">${play ? `<span class="play">${play}</span>` : ""}${num ? `<span class="num">${num}</span>` : ""}</div>
    <div><div class="t">${esc(it.title)}</div><div class="s">${esc(it.summary)}</div>
    <div class="meta">${CAT_ICON[it.category] || ""} ${esc(catName(it.category))} · ${at(it)} ${"★".repeat(it.useful)}</div>
    ${badges ? `<div class="meta">${badges}</div>` : ""}</div></a>`;
}
function mosaic(list, used) {
  const sorted = [...new Set(list.slice().sort((a, b) => !!a.sensitive - !!b.sensitive || b.useful - a.useful || (a.id > b.id ? 1 : -1)).map((i) => i.thumb))];
  let th = used ? sorted.filter((t) => !used.has(t)).slice(0, 4) : [];
  if (th.length < 4) th = [...new Set([...th, ...sorted])].slice(0, 4);
  if (used) th.forEach((t) => used.add(t));
  return `<div class="mosaic m${th.length}">${th.map((t) => `<img loading="lazy" src="${esc(t)}" alt="">`).join("")}</div>`;
}
const coll = (href, title, list, emoji = "", count = list.length, used) =>
  `<a class="coll" href="${href}">${mosaic(list, used)}<div class="cl"><b>${emoji ? emoji + " " : ""}${esc(title)}</b><small>${nVideos(count)}</small></div></a>`;
function paged(list, key, render = card, cls = "list") {
  const n = (paged.state[key] ||= 30);
  const html = list.slice(0, n).map((x) => render(x)).join("");
  const more = list.length > n ? `<button class="btn ghost more" data-more="${esc(key)}">${L("Show more", "Arată mai multe")} (${list.length - n})</button>` : "";
  return `<div class="${cls}">${html || `<div class="empty">${L("Nothing here yet.", "Nimic aici încă.")}</div>`}</div>${more}`;
}
paged.state = {};

/* ---------- views ---------- */
let AFTER = [];
let BEST_SEED = Math.random();
/* "New videos added": items carry an `added` date (YYYY-MM-DD) from the pipeline; the original collection has none. */
const fmtDay = (d) => new Date(d + "T12:00").toLocaleDateString(LANG === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
function newPill() {
  const dates = [...new Set(ITEMS.filter((i) => i.added && i.category !== "off-topic").map((i) => i.added))].sort().reverse();
  if (!dates.length) return "";
  const seen = store.get("newSeen", ""), unseen = dates.filter((d) => d > seen);
  const from = unseen.length ? unseen[unseen.length - 1] : dates[0];
  const n = ITEMS.filter((i) => i.added && i.added >= from && i.category !== "off-topic").length;
  return `<a class="newpill ${unseen.length ? "fresh" : ""}" href="#/browse?new=${from}" data-newseen="${dates[0]}">🆕 <b>${n} ${L(n === 1 ? "new video added" : "new videos added", n === 1 ? "videoclip nou adăugat" : "videoclipuri noi adăugate")} <small>· ${fmtDay(dates[0])}</small></b><span>${L("See them →", "Vezi-le →")}</span></a>`;
}
function home() {
  const vis = ITEMS.filter((i) => i.category !== "off-topic");
  const stageCounts = {};
  vis.forEach((it) => it.stages.forEach((s) => (stageCounts[s] = (stageCounts[s] || 0) + 1)));
  const stages = Object.keys(STAGE).filter((s) => stageCounts[s]).map((s) => `<a class="chip" href="#/browse?stage=${s}">${esc(stageName(s))} · ${stageCounts[s]}</a>`).join("");
  const used = new Set();
  const groups = GROUPS.map(([emo, name, cats]) => {
    let cards = cats.map((c) => [c, vis.filter((i) => inCat(i, c))]).filter((x) => x[1].length).map(([c, l]) => coll(`#/browse?cat=${c}`, catName(c), l, CAT_ICON[c], l.length, used));
    if (cats[0] === "pregnancy") {
      const tri = Object.keys(TRI).map((t) => [t, vis.filter((i) => i.tri.includes(t))]).filter((x) => x[1].length)
        .map(([t, l]) => coll(`#/browse?cat=pregnancy&tri=${t}`, TRI[t], l, TRI_ICON[t], l.length, used));
      cards = [cards[0], ...tri, ...cards.slice(1)];
    }
    return `<h2>${emo} ${esc(name)}</h2><div class="hscroll">${cards.join("")}</div>`;
  }).join("");
  const rnd = (id) => { let h = BEST_SEED * 1e9; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 1e9; return h; };
  const best = vis.filter((i) => i.useful >= 5 && !["humor", "reflection"].includes(i.type))
    .sort((a, b) => (b.credentials ? 1 : 0) - (a.credentials ? 1 : 0) || rnd(a.id) - rnd(b.id)).slice(0, 6);
  const ex = LANG === "ro"
    ? ["ce fac dacă bebelușul se îneacă", "cum gestionez o criză de furie în public", "ce pun în bagajul pentru maternitate", "idei de joacă pentru acasă", "cum adoarme bebelușul singur", "what to do if my baby chokes"]
    : ["what to do if my baby chokes", "how to handle a tantrum in public", "what to pack in the hospital bag", "play ideas for rainy days", "how to get my baby to sleep", "ce să fac când copilul lovește"];
  AFTER.push(() => {
    let i = 0;
    clearInterval(home.timer);
    home.timer = setInterval(() => {
      const a = $("#exRot");
      if (!a) return clearInterval(home.timer);
      if (TOUR) return;
      a.classList.add("out");
      setTimeout(() => { i = (i + 1) % ex.length; a.textContent = ex[i]; a.href = "#/browse?q=" + encodeURIComponent(ex[i]); a.classList.remove("out"); }, 350);
    }, 3200);
  });
  return `<div class="hello"><h1>${L("Hi! 👋", "Bună! 👋")}</h1><span class="muted">${vis.length} ${L("videos, summarised & organised", "videoclipuri, rezumate și organizate")}</span></div>
    ${newPill()}
    <div class="askcard"><b>✨ ${L("Ask anything", "Întreabă orice")}</b><span class="muted">${L("e.g.", "ex.")}</span>
      <a class="chip soft" id="exRot" href="#/browse?q=${encodeURIComponent(ex[0])}">${esc(ex[0])}</a></div>
    ${groups}
    <h2>${L("👣 By age & stage", "👣 După vârstă și etapă")}</h2><div class="chips stages">${stages}</div>
    <div class="chips"><a class="chip soft" href="#/browse?sex=boy">${L("👦 About boys", "👦 Despre băieți")}</a><a class="chip soft" href="#/browse?sex=girl">${L("👧 About girls", "👧 Despre fete")}</a>
      <a class="chip soft" href="#/browse?aud=fathers">${L("👨 For dads", "👨 Pentru tați")}</a><a class="chip soft" href="#/browse?type=scripts">${L("💬 What to say", "💬 Ce să spui")}</a></div>
    <h2>${L("⭐ Some of the best", "⭐ Câteva dintre cele mai bune")}</h2>
    <p class="muted">${L("(Rated 5/5 for usefulness: clear, practical, specific advice you can use right away. Creators with professional credentials — doctors, midwives, psychologists — are shown first.)",
      "(Notate cu 5/5 la utilitate: sfaturi clare, practice și concrete pe care le poți folosi imediat. Creatorii cu pregătire profesională — medici, moașe, psihologi — apar primii.)")} <a href="#" data-shuffle>${L("🔀 Shuffle", "🔀 Amestecă")}</a></p>
    ${best.map((x) => card(x)).join("")}`;
}

function browse(params) {
  const f = Object.fromEntries(params);
  let list = f.q ? search(f.q) : ITEMS.slice();
  if (f.cat) list = list.filter((i) => i.category === f.cat || (f.inc !== "0" && i.topics.includes(f.cat)));
  if (f.tri) list = list.filter((i) => i.tri.includes(f.tri));
  if (f.stage) list = list.filter((i) => i.stages.includes(f.stage));
  if (f.tag) list = list.filter((i) => i.tags.includes(f.tag));
  if (f.sex) list = list.filter((i) => i.sex === f.sex || (f.sex !== "both" && i.sex === "both"));
  if (f.aud) list = list.filter((i) => i.audience.includes(f.aud) || (f.aud === "fathers" && inCat(i, "dads-partners")));
  if (f.type) list = list.filter((i) => i.type === f.type);
  if (f.lang) list = list.filter((i) => i.lang === f.lang);
  if (f.plat) list = list.filter((i) => i.platform === f.plat);
  if (f.author) list = list.filter((i) => i.author === f.author);
  if (f.health) list = list.filter((i) => i.health);
  if (f.min) list = list.filter((i) => i.useful >= +f.min);
  let mName = "", mObj = null;
  const mList = (i, kind) => (kind === "media" ? i.media : kind === "gifts" ? i.gifts : i.mentions?.[kind] || []);
  if (f.m) {
    const [kind, key] = f.m.split(":");
    list = list.filter((i) => mList(i, kind).some((x) => { const n = kind === "books" ? x.title : x.name; if (libKey(n) === key) { mName ||= n; mObj ||= x; return true; } }));
  }
  if (f.pcat) list = list.filter((i) => (i.mentions?.products || []).some((p) => p.pcat === f.pcat));
  if (f.sens === "0") list = list.filter((i) => !i.sensitive);
  if (!f.cat && f.hideoff !== "0" && !f.m) list = list.filter((i) => i.category !== "off-topic");
  if (f.new) list = list.filter((i) => i.added && i.added >= f.new);
  if (f.sort === "new" || f.new) list.sort((a, b) => (b.added || "").localeCompare(a.added || "") || (b.id > a.id ? 1 : -1));

  const link = (k, v) => { const p = new URLSearchParams(params); v == null || f[k] === v ? p.delete(k) : p.set(k, v); return "#/browse?" + p; };
  const chip = (k, v, label) => `<a class="chip ${f[k] === v ? "on" : ""}" href="${link(k, v)}">${esc(label)}</a>`;
  const sel = (k, opts, label) => `<label class="muted">${label} <select data-k="${k}"><option value="">${L("Any", "Oricare")}</option>${opts.map(([v, l]) =>
    `<option value="${esc(v)}" ${f[k] === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
  const title = f.new ? `${L("🆕 New videos", "🆕 Videoclipuri noi")} <small class="muted">${L("added", "adăugate")} ${f.new === [...new Set(ITEMS.map((i) => i.added || ""))].sort().pop() ? L("on", "pe") : L("since", "din")} ${fmtDay(f.new)}</small>` : f.q ? `${L("Results for", "Rezultate pentru")} “${esc(f.q)}”` : f.tri ? `${TRI_ICON[f.tri]} ${esc(TRI[f.tri])}` : f.cat ? `${CAT_ICON[f.cat] || ""} ${esc(catName(f.cat))}`
    : f.tag ? `#${esc(tagName(f.tag))}` : f.author ? `@${esc(f.author)}` : f.pcat ? `${PCAT[f.pcat]?.[0] || "🛒"} ${esc(PCAT[f.pcat]?.[1] || f.pcat)}`
    : f.m ? `${{ books: "📚", products: "🛒", people: "👤", media: "📺", gifts: "🎁" }[f.m.split(":")[0]] || ""} ${esc(mName)}` : L("Browse", "Explorează");
  const QL = { sex: { boy: L("👦 Boys", "👦 Băieți"), girl: L("👧 Girls", "👧 Fete") }, aud: { fathers: L("👨 Dads", "👨 Tați") }, health: { 1: L("🩺 Medical", "🩺 Medical") },
    sens: { 0: L("🙈 No sensitive", "🙈 Fără sensibile") }, min: { 4: "★4+" }, lang: { ro: "🇷🇴 RO", en: "🇬🇧 EN" }, plat: { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" }, sort: { new: L("Newest", "Cele mai noi") } };
  const pillName = (k, v) => k === "cat" ? catName(v) : k === "stage" ? STAGE[v] : k === "type" ? TYPE_LABEL[v] : k === "tri" ? TRI[v] : QL[k]?.[v];
  const pills = Object.keys(f).filter((k) => pillName(k, f[k])).map((k) => `<a class="chip on" href="${link(k, null)}" aria-label="${L("Remove filter", "Scoate filtrul")}">${esc(pillName(k, f[k]))} ✕</a>`);
  const active = Object.keys(f).filter((k) => !["sort", "inc", "hideoff", "q"].includes(k)).length;

  let triRow = "";
  if (f.cat === "pregnancy") {
    const base = ITEMS.filter((i) => inCat(i, "pregnancy"));
    triRow = `<div class="chips tri">${Object.keys(TRI).map((t) => { const n = base.filter((i) => i.tri.includes(t)).length;
      return n ? chip("tri", t, `${TRI_ICON[t]} ${TRI[t]} · ${n}`) : ""; }).join("")}</div>`;
  }
  const tagMap = {};
  list.forEach((i) => i.tags.forEach((t) => (tagMap[t] ||= []).push(i)));
  const topTags = Object.entries(tagMap).filter(([t, l]) => l.length >= 2 && t !== f.tag && l.length < list.length).sort((a, b) => b[1].length - a[1].length).slice(0, 14);
  const collRow = topTags.length ? `<h2 class="row-h">${L("Collections", "Colecții")} ${list.length < ITEMS.length * 0.8 ? L("in here", "de aici") : ""} <a class="muted" href="#/collections">${L("See all →", "Vezi toate →")}</a></h2>
    <div class="hscroll">${topTags.map(([t, l]) => coll(link("tag", t), "#" + tagName(t), l)).join("")}</div>` : "";

  let askBox = "";
  if (f.q) {
    if (apiKey()) { askBox = `<div id="askBox" class="askbox"></div>`; AFTER.push(() => runAsk(f.q)); }
    else askBox = `<div class="askbox muted">${L("✨ Want a written answer with sources? Get a free Gemini key at " + keyLink() + " and paste it in <a href=\"#/settings\">More → AI answers</a>.",
      "✨ Vrei un răspuns scris, cu surse? Ia o cheie Gemini gratuită de pe " + keyLink() + " și lipește-o în <a href=\"#/settings\">Mai mult → Răspunsuri AI</a>.")}</div>`;
  }
  let authorBar = "";
  if (f.author) {
    const plats = [...new Set(ITEMS.filter((i) => i.author === f.author).map((i) => i.platform))];
    const av = avatar(f.author, plats[0]);
    authorBar = `<div class="row creator">${av ? `<img class="av big" src="${esc(av)}" alt="">` : ""}${plats.map((p) => followBtn(f.author, p)).join("")}</div>`;
  }
  let shopBar = "";
  if (f.m && mObj) {
    const kind = f.m.split(":")[0], sx = kind === "books" ? mObj.author : kind === "products" ? (mObj.brand !== mName ? mObj.brand : "") : mObj.kind;
    const s = shopLink(kind, mName, sx, mObj.q);
    const img = LIBIMG[`${kind}:${libKey(mName)}`];
    if (s) shopBar = `<div class="box shopbar">${img ? `<img src="${esc(img)}" alt="">` : ""}<div>
      <a class="btn" href="${esc(s)}" target="_blank" rel="noopener">${kind === "media" ? "▶" : "🛒"} ${esc(shopLabel(kind))} ↗</a>
      ${kind === "products" || kind === "books" ? (apiKey()
        ? `<button class="btn ghost" data-prices>💸 ${L("Best prices in", "Cele mai bune prețuri în")} ${esc(cName(COUNTRY()))} (AI)</button>`
        : `<p class="muted small">${L("💸 Get a free Gemini key at ", "💸 Ia o cheie Gemini gratuită de pe ") + keyLink() + L(" and add it in <a href=\"#/settings\">More → AI answers</a> to compare prices across shops.", " și adaug-o în <a href=\"#/settings\">Mai mult → Răspunsuri AI</a> ca să compari prețurile din magazine.")}</p>`) : ""}
      <div id="priceBox" data-name="${esc(mName)}" data-brand="${esc(kind === "products" ? sx || "" : sx ? "book by " + sx : "book")}"></div></div></div>`;
  }
  return `<h1>${title}</h1>${authorBar}${shopBar}${f.cat && !f.tri ? `<p class="muted">${esc((CAT[f.cat] || "").split(":").slice(1).join(":"))}</p>` : ""}
  ${triRow}${askBox}
  <details class="filters"><summary><span>⚙️ ${L("Filters", "Filtre")}${active ? ` <b class="fcount">${active}</b>` : ""}</span><span class="muted">${list.length} ${L("items", "rezultate")}</span></summary>
    <div class="row">${sel("cat", Object.keys(CAT).map((c) => [c, catName(c)]), L("Topic", "Subiect"))}
    ${sel("stage", Object.entries(STAGE), L("Stage", "Etapă"))}
    ${sel("type", Object.entries(TYPE_LABEL), L("Type", "Tip"))}</div>
    <div class="chips qchips">${chip("sex", "boy", L("👦 Boys", "👦 Băieți"))}${chip("sex", "girl", L("👧 Girls", "👧 Fete"))}${chip("aud", "fathers", L("👨 Dads", "👨 Tați"))}
      ${chip("health", "1", L("🩺 Medical topics", "🩺 Subiecte medicale"))}${chip("sens", "0", L("🙈 Hide sensitive", "🙈 Ascunde subiecte sensibile"))}${chip("min", "4", L("★4+ only", "Doar ★4+"))}${chip("lang", "ro", L("🇷🇴 Romanian", "🇷🇴 În română"))}${chip("lang", "en", L("🇬🇧 English", "🇬🇧 În engleză"))}
      ${chip("plat", "instagram", "Instagram")}${chip("plat", "tiktok", "TikTok")}${chip("plat", "facebook", "Facebook")}${chip("sort", "new", L("Newest first", "Cele mai noi"))}</div>
  </details>
  ${pills.length ? `<div class="chips fpills">${pills.join("")}${pills.length > 1 ? `<a class="chip" href="#/browse${f.q ? "?q=" + encodeURIComponent(f.q) : ""}">${L("Clear all", "Șterge tot")}</a>` : ""}</div>` : ""}
  ${f.q ? "" : collRow}
  ${f.q && apiKey() ? `<h2>${L("Matching videos", "Videoclipuri potrivite")}</h2>` : ""}
  ${paged(list, "browse:" + params)}
  ${f.q ? collRow : ""}`;
}

function collections() {
  const tagMap = {};
  ITEMS.filter((i) => i.category !== "off-topic").forEach((i) => i.tags.forEach((t) => (tagMap[t] ||= []).push(i)));
  const all = Object.entries(tagMap).filter(([, l]) => l.length >= 3).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return `<h1>${L("All collections", "Toate colecțiile")}</h1><p class="muted">${all.length} ${L("collections (tags used on 3+ videos).", "colecții (etichete folosite la 3+ videoclipuri).")}</p>
    ${paged(all, "colls", ([t, l]) => coll(`#/browse?tag=${encodeURIComponent(t)}`, "#" + tagName(t), l), "colls")}`;
}

function player(it) {
  const md = MEDIA[it.id];
  if (md?.video) return `<video class="vid" src="${esc(vsrc(md.video))}" poster="${esc(it.thumb)}" controls playsinline preload="metadata"></video>`;
  if (md?.slides?.length) {
    const s = md.slides.map((x) => x.type === "video" ? `<video src="${esc(x.src)}" controls playsinline preload="metadata"></video>`
      : `<img src="${esc(x.src)}" alt="" loading="lazy">`).join("");
    return `<div class="carwrap"><div class="car">${s}</div>${md.slides.length > 1 ? `<button class="carbtn l" data-car="-1">‹</button><button class="carbtn r" data-car="1">›</button>` : ""}</div>
      ${md.slides.length > 1 ? `<div class="cardots">1 / ${md.slides.length} · ${L("swipe", "glisează")} ⟷</div>` : ""}
      ${md.audio ? `<audio class="aud" src="${esc(md.audio)}" controls></audio>` : ""}`;
  }
  return `<a href="${esc(it.url)}" target="_blank" rel="noopener"><img class="vid" src="${esc(it.thumb)}" alt=""></a>`;
}

const at = (it) => (it.platform === "facebook" ? "" : "@") + esc(it.author || "");
const PLAT = { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook" };
const profileUrl = (a, p) => (p === "tiktok" ? `https://www.tiktok.com/@${encodeURIComponent(a)}` : p === "facebook" ? `https://www.facebook.com/search/top?q=${encodeURIComponent(a)}` : `https://www.instagram.com/${encodeURIComponent(a)}/`);
const followBtn = (a, p) => `<a class="btn follow" href="${profileUrl(a, p)}" target="_blank" rel="noopener">${L("➕ Follow on", "➕ Urmărește pe")} ${PLAT[p] || "Instagram"}</a>`;

function item(id) {
  const it = BY_ID[id];
  if (!it) return `<div class="empty">${L("Not found.", "Nu a fost găsit.")}</div>`;
  const favs = store.get("favs", []), notes = store.get("notes", {}), fb = store.get("feedback", {})[id] || {};
  const m = it.mentions || {};
  const list = (arr, fn) => (arr && arr.length ? `<ul class="points">${arr.map(fn).join("")}</ul>` : "");
  const related = ITEMS.filter((o) => o !== it && o.category !== "off-topic")
    .map((o) => [o.tags.filter((t) => it.tags.includes(t)).length * 2 + (o.category === it.category ? 1 : 0) + (o.dedupe && o.dedupe === it.dedupe ? 5 : 0), o])
    .filter((x) => x[0] >= 3).sort((a, b) => b[0] - a[0]).slice(0, 5).map((x) => x[1]);
  AFTER.push(() => {
    setSpeed();
    const car = $(".car"), dots = $(".cardots");
    if (car && dots) car.addEventListener("scroll", () => { dots.textContent = `${Math.round(car.scrollLeft / car.clientWidth) + 1} / ${car.children.length} · ${L("swipe", "glisează")} ⟷`; }, { passive: true });
    if (!prefs().autoplay || it.sensitive) return;
    const v = $(".vid") || $(".aud") || $(".car video");
    if (v && v.play) v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  });
  const lib = (kind, name) => { const k = libKey(name); return LIBIMG[`${kind}:${k}`] ? `<img src="${esc(LIBIMG[`${kind}:${k}`])}" alt="" loading="lazy">` : ""; };
  const mention = (kind, name, extra, sx, q) => { const s = shopLink(kind, name, sx, q);
    return `<li><a class="ment" href="#/browse?m=${kind}:${libKey(name)}">${lib(kind, name)}<span>${esc(name)}${extra ? ` <span class="muted">${extra}</span>` : ""}</span></a>${s ? `<a class="shop" href="${esc(s)}" target="_blank" rel="noopener" title="${esc(shopLabel(kind))}">${kind === "media" ? "▶" : "🛒"}<span>${kind === "media" ? L("Find", "Găsește") : L("Buy", "Cumpără")}</span></a>` : ""}</li>`; };
  const trId = it.transcript || it.onscreen.length;
  return `<div class="jump"><button class="chip soft" data-jump="sumBox">${L("See summary", "Vezi rezumatul")}</button>${trId ? `<button class="chip soft" data-jump="trBox">${L("See transcript", "Vezi transcrierea")}</button>` : ""}<button class="chip soft" data-jump="fbBox">${L("Give feedback", "Dă feedback")}</button></div>
  <div class="iwrap"><div class="pl ${it.sensitive ? "sensgate" : ""}">${player(it)}<button class="plfav ${favs.includes(id) ? "on" : ""}" data-plfav aria-label="${L("Save", "Salvează")}">${favs.includes(id) ? "❤️" : "🤍"}</button>${/<video/.test(player(it)) ? `<button class="spd" data-spd aria-label="${L("Playback speed", "Viteza de redare")}">${SPEED}×</button><div class="spdhint" aria-hidden="true">2× ▸▸</div>` : ""}${it.sensitive ? `<button class="sensveil" id="reveal">⚠️<b>${L("Sensitive subject", "Subiect sensibil")}</b><span>${esc(it.sensitive)}</span><u>${L("Tap to show", "Atinge pentru a afișa")}</u></button>` : ""}</div><div class="info">
    <h1>${esc(it.title)}</h1>
    <div class="muted creator">${avatar(it.author, it.platform) ? `<img class="av" src="${esc(avatar(it.author, it.platform))}" alt="">` : ""}<a href="#/browse?author=${encodeURIComponent(it.author)}">${at(it)}</a>${it.credentials ? ` · ${esc(it.credentials)}` : ""}</div>
    <div class="row" style="margin-top:8px"><button class="btn ghost" id="fav">${favs.includes(id) ? L("❤️ Saved", "❤️ Salvat") : L("🤍 Save", "🤍 Salvează")}</button>
      ${followBtn(it.author, it.platform)}
      <a class="btn ghost" href="${esc(it.url)}" target="_blank" rel="noopener">${L("Source", "Sursa")}: ${PLAT[it.platform] || "Instagram"} ↗</a></div>
    ${it.sensitive ? `<div class="box sens">⚠️ <b>${L("Sensitive subject", "Subiect sensibil")}:</b> ${esc(it.sensitive)}</div>` : ""}
    ${it.health ? `<div class="box med">🩺 <b>${L("This is not medical advice — check with your doctor.", "Acesta nu este un sfat medical — verifică cu medicul tău.")}</b>${it.caution ? `<div>${esc(it.caution)}</div>` : ""}</div>`
      : it.caution ? `<div class="box note">💡 ${esc(it.caution)}</div>` : ""}
    <div class="box" id="sumBox"><p style="margin:0">${esc(it.summary)}</p>
      ${it.key_points.length ? `<h3>${L("Key points", "Idei principale")}</h3>${list(it.key_points, (p) => `<li>${esc(p)}</li>`)}` : ""}
      ${it.scripts.length ? `<h3>${L("💬 What to say", "💬 Ce să spui")}</h3>${it.scripts.map((s) => `<div class="script">“${esc(s)}”</div>`).join("")}` : ""}</div>
    <div class="chips"><a class="chip soft" href="#/browse?cat=${it.category}">${CAT_ICON[it.category] || ""} ${esc(catName(it.category))}</a>
      ${it.topics.map((t) => `<a class="chip" href="#/browse?cat=${t}">${esc(catName(t))}</a>`).join("")}
      ${it.tri.filter((t) => t !== "general").map((t) => `<a class="chip" href="#/browse?cat=pregnancy&tri=${t}">${TRI_ICON[t]} ${TRI[t]}</a>`).join("")}
      ${it.stages.map((s) => `<a class="chip" href="#/browse?stage=${s}">${esc(stageName(s))}</a>`).join("")}
      ${it.sex ? `<a class="chip" href="#/browse?sex=${it.sex}">${sexLabel(it.sex)}</a>` : ""}
      <span class="chip">${esc(TYPE_LABEL[it.type] || it.type)}</span><span class="chip">${"★".repeat(it.useful)}${"☆".repeat(5 - it.useful)}</span></div>
    ${it.ill.length ? `<h2>${L("Images", "Imagini")}</h2><div class="ills">${it.ill.map((i) => `<figure><a href="${esc(i.src)}" target="_blank"><img loading="lazy" src="${esc(i.src)}" alt=""></a><figcaption>${esc(i.caption)}</figcaption></figure>`).join("")}</div>` : ""}
    ${(m.books || []).length || (m.products || []).length || (m.people || []).length || it.media.length || it.gifts.length || it.prompts.length ? `<div class="box">
      ${(m.books || []).length ? `<h3>${L("📚 Books", "📚 Cărți")}</h3><ul class="ments">${m.books.filter((b) => b.title).map((b) => mention("books", b.title, b.author ? "— " + esc(b.author) : "", b.author)).join("")}</ul>` : ""}
      ${(m.products || []).length ? `<h3>${L("🛒 Products", "🛒 Produse")}</h3><ul class="ments">${m.products.filter((p) => p.name).map((p) => mention("products", p.name, [p.pcat ? PCAT[p.pcat]?.[0] : "", p.brand && p.brand !== p.name ? p.brand : "", p.type].filter(Boolean).map(esc).join(" · ") + (p.any ? ` <span class="anyb">${L("any brand · example photo", "orice marcă · poză de exemplu")}</span>` : ""), p.brand && p.brand !== p.name ? p.brand : "", p.q)).join("")}</ul>` : ""}
      ${it.media.length ? `<h3>${L("📺 Recommended media", "📺 Media recomandate")}</h3><ul class="ments">${it.media.map((x) => mention("media", x.name, [MEDIA_KIND[x.kind], x.why].filter(Boolean).map(esc).join(" · "), x.kind)).join("")}</ul>` : ""}
      ${it.gifts.length ? `<h3>${L("🎁 Gifts & keepsakes", "🎁 Cadouri și amintiri")}</h3><ul class="ments">${it.gifts.map((x) => mention("gifts", x.name, [GIFT_KIND[x.kind], x.how].filter(Boolean).map(esc).join(" · "))).join("")}</ul>` : ""}
      ${it.prompts.length ? `<h3>${L("🤖 AI prompts", "🤖 Prompturi AI")}</h3>${it.prompts.map((x) => `<div class="script">“${esc(x.prompt)}”${x.purpose ? `<div class="muted">${esc(x.purpose)}</div>` : ""}</div>`).join("")}` : ""}
      ${(m.people || []).length ? `<h3>${L("👤 Experts", "👤 Experți")}</h3><ul class="ments">${m.people.filter((p) => p.name).map((p) => mention("people", p.name, p.role ? esc(p.role) : "")).join("")}</ul>` : ""}</div>` : ""}
    <div class="chips">${it.tags.map((t) => `<a class="chip" href="#/browse?tag=${encodeURIComponent(t)}">#${esc(tagName(t))}</a>`).join("")}</div>
    <div class="box"><h3 style="margin-top:0">${L("📝 My note", "📝 Notița mea")}</h3><textarea id="note" data-clarity-mask="true" placeholder="${L("Write a note for yourself…", "Scrie-ți o notiță…")}">${esc(notes[id] || "")}</textarea></div>
    ${it.transcript ? `<details class="box" id="trBox"><summary>${L("What they say (transcript", "Ce spun (transcriere")}${it.lang && it.lang !== "en" ? ", " + esc(it.lang.toUpperCase()) : ""})</summary><div class="pre">${esc(it.transcript)}</div></details>` : ""}
    ${it.onscreen.length ? `<details class="box" ${it.transcript ? "" : `id="trBox"`}><summary>${L("Text on screen", "Text pe ecran")}</summary><div class="pre">${esc(it.onscreen.join("\n"))}</div></details>` : ""}
    ${it.caption ? `<details class="box"><summary>${L("Original caption", "Descrierea originală")}</summary><div class="pre">${esc(it.caption)}</div></details>` : ""}
    <details class="box" id="fbBox" ${fb.cat || fb.note || fb.off ? "open" : ""}><summary>${L("💬 Feedback (not parenting? wrong topic?)", "💬 Feedback (nu e despre parenting? subiect greșit?)")}</summary>
      <button class="btn ${fb.off ? "" : "soft"}" id="fbOff" style="margin-top:8px" ${fb.off ? "disabled" : ""}>${fb.off ? L("✓ Reported as not about parenting. Thank you!", "✓ Raportat ca nefiind despre parenting. Mulțumim!") : L("🚫 Not about parenting", "🚫 Nu e despre parenting")}</button>
      <div class="row" style="margin-top:8px"><select id="fbCat"><option value="">${L("Better topic…", "Subiect mai potrivit…")}</option>${Object.keys(CAT).map((c) =>
        `<option value="${c}" ${fb.cat === c ? "selected" : ""}>${esc(catName(c))}</option>`).join("")}</select></div>
      <textarea id="fbNote" placeholder="${L("e.g. 'should be its own category: travel', 'not useful', 'duplicate of …'", "ex. „ar trebui să fie o categorie separată: călătorii”, „nu e util”, „duplicat cu …”")}">${esc(fb.note || "")}</textarea>
      <button class="btn soft" id="fbSend">${L("Send", "Trimite")}</button> <span class="muted" id="fbSent">${fb.sent ? L("✓ Sent", "✓ Trimis") : ""}</span></details>
  </div></div>
  ${related.length ? `<h2>${L("Related", "Similare")}</h2>${paged(related, "rel" + id)}` : ""}`;
}

const LIB_TABS = [["books", L("📚 Books", "📚 Cărți")], ["products", L("🛒 Products", "🛒 Produse")], ["media", "📺 Media"], ["gifts", L("🎁 Gifts & keepsakes", "🎁 Cadouri și amintiri")],
  ["prompts", L("🤖 AI prompts", "🤖 Prompturi AI")], ["people", L("👤 Experts", "👤 Experți")], ["creators", L("🎥 Creators", "🎥 Creatori")]];
const LIB_SUB = { products: ["pcat", PCAT, (v) => v.join(" ")], media: ["kind", MEDIA_KIND, (v) => v], gifts: ["kind", GIFT_KIND, (v) => v] };
function libAgg(tab) {
  const agg = {};
  for (const it of ITEMS) {
    if (it.category === "off-topic" && tab === "creators") continue;
    const arr = tab === "creators" ? [{ name: it.author, role: it.author_name, plat: it.platform }] : tab === "media" ? it.media : tab === "gifts" ? it.gifts
      : tab === "prompts" ? it.prompts.map((p) => ({ name: p.prompt, role: p.purpose })) : it.mentions?.[tab];
    for (const x of arr || []) {
      const name = tab === "books" ? x.title : x.name;
      if (!name) continue;
      const k = tab === "creators" ? name : libKey(name) + (tab === "prompts" ? it.id : "");
      const extra = tab === "books" ? x.author : tab === "products" ? (x.brand && x.brand !== name ? x.brand : "") : tab === "media" ? x.why : tab === "gifts" ? x.how : x.role;
      const r = (agg[k] ||= { k, name, extra, sub: {}, plat: x.plat, items: [] });
      r.items.push(it);
      const sk = x.pcat || x.kind;
      if (sk) r.sub[sk] = (r.sub[sk] || 0) + 1;
    }
  }
  for (const r of Object.values(agg)) r.cat = Object.entries(r.sub).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";
  return Object.values(agg).sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}
function library(params) {
  const tab = params.get("t") || "books", sub = params.get("s");
  let rows = libAgg(tab);
  const pic = (k, r) => (k === "creators" ? avatar(r.name, r.plat) : k !== "prompts" && LIBIMG[`${k}:${r.k}`]) || null;
  const img = (r) => pic(tab, r) || r.items.slice().sort((a, b) => !!a.sensitive - !!b.sensitive || b.useful - a.useful)[0].thumb;
  const mos = (th) => `<div class="mosaic m${th.length}">${th.map((t) => `<img loading="lazy" src="${esc(t)}" alt="">`).join("")}</div>`;
  const tabs = LIB_TABS.map(([k, l]) => {
    const rr = libAgg(k), pics = rr.map((r) => pic(k, r)).filter(Boolean).slice(0, 4);
    const th = pics.length >= 4 ? pics : [...new Set(rr.map((r) => r.items[0].thumb))].slice(0, 4);
    return `<a class="coll ${tab === k ? "on" : ""}" href="#/library?t=${k}">${mos(th)}<div class="cl"><b>${l}</b><small>${rr.length}</small></div></a>`;
  }).join("");
  let subRow = "";
  if (LIB_SUB[tab]) {
    const [, labels] = LIB_SUB[tab];
    const lab = (s) => (tab === "products" ? `${PCAT[s][0]} ${PCAT[s][1]}` : labels[s]);
    const groups = Object.keys(labels).map((s) => [s, rows.filter((r) => r.cat === s)]).filter((g) => g[1].length);
    subRow = `<h2 class="row-h">${L("Categories", "Categorii")}</h2><div class="hscroll">${groups.map(([s, rr]) => {
      const pics = rr.map((r) => pic(tab, r)).filter(Boolean).slice(0, 4);
      const th = pics.length ? pics : rr.slice(0, 4).map((r) => r.items[0].thumb);
      return `<a class="coll ${sub === s ? "on" : ""}" href="#/library?t=${tab}${sub === s ? "" : "&s=" + s}">${mos(th)}<div class="cl"><b>${esc(lab(s))}</b><small>${rr.length}</small></div></a>`;
    }).join("")}</div>`;
    if (sub) rows = rows.filter((r) => r.cat === sub);
  }
  const libCard = (r) => {
    if (tab === "prompts") return `<a class="script prompt" href="#/item/${encodeURIComponent(r.items[0].id)}">🤖 “${esc(r.name)}”${r.extra ? `<div class="muted">${esc(r.extra)} · ${at(r.items[0])}</div>` : ""}</a>`;
    const href = tab === "creators" ? `#/browse?author=${encodeURIComponent(r.name)}` : `#/browse?m=${tab}:${r.k}`;
    return `<a class="lcard ${tab === "creators" || tab === "people" ? "round" : ""} ${tab === "products" ? "prod" : ""}" href="${href}"><img loading="lazy" src="${esc(img(r))}" alt="">
      <b>${tab === "creators" ? "@" : ""}${esc(r.name)}</b>${r.extra ? `<small>${esc(r.extra)}</small>` : ""}<span class="cnt">${nVideos(r.items.length)}</span></a>`;
  };
  const note = LANG === "ro"
    ? { books: "cărți menționate sau recomandate", products: "produse recomandate sau considerate utile", media: "seriale, canale, jocuri și aplicații recomandate",
      gifts: "idei de cadouri, amintiri și tradiții", prompts: "prompturi AI care au ajutat mămicile", people: "experți citați", creators: "creatori de la care ai salvat videoclipuri" }[tab]
    : { books: "books mentioned or recommended", products: "products recommended or found helpful", media: "shows, channels, games & apps recommended",
      gifts: "gift ideas, keepsakes & traditions", prompts: "AI prompts that helped moms", people: "experts cited", creators: "creators you saved videos from" }[tab];
  return `<h1>${L("Library", "Bibliotecă")}</h1><div class="hscroll tabs4">${tabs}</div>${subRow}
    <p class="muted">${rows.length} ${note}.${["books", "products", "media", "people"].includes(tab) ? L(" Pictures come from web searches — they may occasionally be wrong.", " Pozele vin din căutări pe internet — uneori pot fi greșite.") : ""}</p>
    ${paged(rows, "lib" + tab + sub, libCard, tab === "prompts" ? "plist" : "lgrid")}`;
}
function saved() {
  const favs = store.get("favs", []).map((id) => BY_ID[id]).filter(Boolean);
  const notes = Object.keys(store.get("notes", {})).map((id) => BY_ID[id]).filter((it) => it && !favs.includes(it));
  return `<h1>${L("❤️ Saved", "❤️ Salvate")}</h1>${paged(favs, "favs")}${notes.length ? `<h2>${L("📝 With notes", "📝 Cu notițe")}</h2>${paged(notes, "notes")}` : ""}`;
}

function settings() {
  const fb = store.get("feedback", {});
  const n = Object.keys(fb).length;
  const counts = {};
  ITEMS.forEach((it) => { counts[it.category] = (counts[it.category] || 0) + 1; it.topics.forEach((t) => { if (t !== it.category) counts[t] = (counts[t] || 0) + 1; }); });
  const p = prefs(), own = !!p.key, local = !!window.LOCAL_GEMINI_KEY, aiOn = p.ai !== false;
  const keyState = !aiOn ? L("⏸️ AI answers are turned off.", "⏸️ Răspunsurile AI sunt oprite.")
    : own ? `${L("✅ Your key is saved", "✅ Cheia ta este salvată")}: <code>••••${esc(p.key.slice(-4))}</code>`
    : local ? L("✅ Using the key from this computer's local config file (only on this PC).", "✅ Se folosește cheia din fișierul de configurare al acestui calculator (doar pe acest PC).")
    : L("⚪ No key yet.", "⚪ Nicio cheie încă.");
  return `<h1>${L("More", "Mai mult")}</h1>
    <details class="box learn" id="learnBox"><summary><b>${L("🎓 Help & tutorials", "🎓 Ajutor și tutoriale")}</b></summary>${learnBtns()}</details>
    <div class="box"><h3 style="margin-top:0">🌍 ${L("Language", "Limba")}</h3>
      <div class="langpick"><button class="btn ${LANG === "en" ? "on" : "ghost"}" data-lang="en">🇬🇧 English</button><button class="btn ${LANG === "ro" ? "on" : "ghost"}" data-lang="ro">🇷🇴 Română</button></div>
      <p class="muted">${L("Summaries and tips are translated automatically. Transcripts and original captions stay in the video's language.",
        "Rezumatele și sfaturile sunt traduse automat. Transcrierile și descrierile originale rămân în limba videoclipului.")}</p></div>
    <div class="box"><h3 style="margin-top:0">${L("▶️ Playback", "▶️ Redare")}</h3>
      <label class="toggle"><input type="checkbox" id="autoplay" ${p.autoplay ? "checked" : ""}> ${L("Autoplay videos when I open them", "Pornește automat videoclipurile când le deschid")}</label></div>
    <div class="box"><h3 style="margin-top:0">${L("✨ AI answers", "✨ Răspunsuri AI")}</h3>
      <p class="muted">${L("Type a question in the search bar and get a short answer written only from these videos, with links to the sources. Needs a free Google Gemini key. It is stored only on this device.",
        "Scrie o întrebare în bara de căutare și primești un răspuns scurt, scris doar din aceste videoclipuri, cu linkuri către surse. Ai nevoie de o cheie Google Gemini gratuită. Se salvează doar pe acest dispozitiv.")}</p>
      <p><a class="btn ghost" href="${KEY_URL}" target="_blank" rel="noopener">🔑 ${L("Get a free key", "Ia o cheie gratuită")}: aistudio.google.com/apikey ↗</a></p>
      <p class="keystate">${keyState}</p>
      <label class="toggle"><input type="checkbox" id="aiOn" ${aiOn ? "checked" : ""}> ${L("Use AI answers and price search", "Folosește răspunsurile AI și căutarea de prețuri")}</label>
      <div class="row" style="margin-top:8px"><input type="password" id="keyIn" data-clarity-mask="true" placeholder="${own ? L("Paste a new key to replace it", "Lipește o cheie nouă ca s-o înlocuiești") : L("Paste Gemini API key", "Lipește cheia Gemini API")}" autocomplete="off" style="flex:1">
      <button class="btn" id="keySave">${L("Save & test", "Salvează și testează")}</button></div>
      <div id="keyMsg" class="keymsg"></div>
      ${own ? `<button class="btn ghost danger" id="keyDel">🗑️ ${L("Remove my key from this device", "Șterge cheia mea de pe acest dispozitiv")}</button>` : ""}</div>
    <div class="box"><h3 style="margin-top:0">🛒 ${L("Shopping country", "Țara pentru cumpărături")}</h3>
      ${countrySel("country", COUNTRY())}
      <p class="muted small">${L("Used for “Buy” links, price comparison sites and AI price search.", "Folosită pentru linkurile „Cumpără”, site-urile de comparat prețuri și căutarea de prețuri cu AI.")}</p></div>
    <div class="box"><h3 style="margin-top:0">🆘 ${L("Help lines", "Linii de ajutor")}</h3>
      <label class="muted">${L("Country you live in (emergency number and help lines)", "Țara în care locuiești (numărul de urgență și liniile de ajutor)")}</label>
      <div style="margin:6px 0 10px">${countrySel("homeCountry", HOME())}</div>
      <label class="toggle"><input type="checkbox" id="helpOn" ${p.help !== false ? "checked" : ""}> ${L("Show the help bar at the bottom of every page", "Arată bara de ajutor la finalul fiecărei pagini")}</label>
      <p><a href="#/help">${L("See all help lines →", "Vezi toate liniile de ajutor →")}</a></p></div>
    <div class="box" id="backupBox"><h3 style="margin-top:0">💾 ${L("Backup", "Copie de siguranță")}</h3>
      <p class="muted">${L(`Your saved videos (${store.get("favs", []).length}), notes (${Object.keys(store.get("notes", {})).length}) and settings live only in this browser. App updates never delete them. You only need a copy in cases like these:`,
        `Videoclipurile salvate (${store.get("favs", []).length}), notițele (${Object.keys(store.get("notes", {})).length}) și setările stau doar în acest browser. Actualizările aplicației nu le șterg niciodată. Ai nevoie de o copie doar în cazuri ca acestea:`)}</p>
      <ul class="bkcases">
        <li>📱 <b>${L("New phone", "Telefon nou")}</b> ${L("or switching to another browser", "sau trecerea pe alt browser")}</li>
        <li>🧹 <b>${L("Clearing browser data", "Ștergerea datelor din browser")}</b> ${L("(history, cookies, “free up space” apps)", "(istoric, cookie-uri, aplicații de „eliberat spațiu”)")}</li>
        <li>🍏 <b>${L("iPhone, not added to the home screen", "iPhone, fără scurtătură pe ecran")}</b> ${L("— Safari may delete it after ~7 days without opening the app", "— Safari o poate șterge după ~7 zile în care nu deschizi aplicația")}</li>
        <li>🕶️ <b>${L("Private / incognito tabs", "File private / incognito")}</b> ${L("— everything is lost when you close them", "— totul se pierde când le închizi")}</li>
      </ul>
      ${own ? `<label class="toggle"><input type="checkbox" id="bkKey"> ${L("Include my AI key (keep the file private)", "Include și cheia AI (păstrează fișierul doar pentru tine)")}</label>` : ""}
      <div class="row" style="margin-top:8px"><button class="btn" id="bkSave">⬇️ ${L("Save a copy", "Salvează o copie")}</button>
      <button class="btn ghost" id="bkLoad">⬆️ ${L("Restore from a copy", "Restaurează dintr-o copie")}</button>
      <input type="file" id="bkFile" accept=".json,application/json" hidden></div>
      <div id="bkMsg" class="keymsg"></div></div>
    <div class="box beta"><h3 style="margin-top:0">🧪 ${L("You're a beta tester", "Ești beta tester")}</h3>
      <p class="muted small">${L("Thank you for trying the app! To improve it for you, it records anonymous usage (which pages and buttons are used, searches) with Microsoft Clarity. Your notes, saved videos and AI key are never sent.",
        "Mulțumesc că testezi aplicația! Ca s-o fac mai bună pentru tine, înregistrează anonim cum e folosită (ce pagini și butoane, căutările) cu Microsoft Clarity. Notițele, videoclipurile salvate și cheia AI nu sunt trimise niciodată.")}</p></div>
    <div class="box"><h3 style="margin-top:0">${L("🏷️ Category feedback", "🏷️ Feedback categorii")}</h3><p class="muted">${n} ${L("items with feedback on this device.", "elemente cu feedback pe acest dispozitiv.")}</p>
      <button class="btn" id="exportFb" ${n ? "" : "disabled"}>${L("Copy feedback", "Copiază feedback-ul")}</button>
      <button class="btn ghost" id="clearFb" ${n ? "" : "disabled"}>${L("Clear", "Șterge")}</button></div>
    <div class="box"><h3 style="margin-top:0">${L("📊 Categories overview", "📊 Prezentare categorii")}</h3><table>${Object.keys(CAT).map((c) =>
      `<tr><td>${CAT_ICON[c] || ""} <a href="#/browse?cat=${c}">${esc(catName(c))}</a><div class="muted">${esc(CAT[c].split(":").slice(1).join(":"))}</div></td><td>${counts[c] || 0}</td></tr>`).join("")}</table></div>`;
}

/* ---------- guided tour & tutorial videos ---------- */
const TUTORIAL_CHAPTERS = {"en": {"short": [[0, "Welcome"], [30, "Getting around"], [43, "With or without AI"], [63, "Search anything"], [112, "A video page"], [130, "The Library"], [152, "On your home screen"]], "long": [[0, "Welcome"], [24, "Learn the app"], [35, "Getting around"], [48, "With or without AI"], [62, "Your free AI key"], [91, "Search anything"], [115, "AI answers"], [131, "The Home page"], [149, "Topics & filters"], [202, "A video page"], [233, "The Library"], [259, "Prices"], [277, "Help & settings"], [300, "On your home screen"]]}, "ro": {"short": [[0, "Bun venit"], [35, "Cum te orientezi"], [51, "Cu sau fără AI"], [78, "Caută orice"], [108, "Răspunsuri AI"], [128, "Teme și filtre"], [140, "Pagina unui video"], [164, "Biblioteca"], [188, "Pe ecranul telefonului"]], "long": [[0, "Bun venit"], [28, "Învață aplicația"], [41, "Cum te orientezi"], [57, "Cu sau fără AI"], [75, "Cheia ta AI gratuită"], [113, "Caută orice"], [143, "Răspunsuri AI"], [164, "Pagina Acasă"], [186, "Teme și filtre"], [249, "Pagina unui video"], [288, "Biblioteca"], [318, "Prețuri"], [339, "Ajutor și setări"], [368, "Pe ecranul telefonului"]]}};
const tutVid = (k) => TUTORIAL_VIDEOS[LANG]?.[k] || TUTORIAL_VIDEOS[LANG === "ro" ? "en" : "ro"]?.[k] || "";
function learnBtns(gift = true) {
  const vids = ["short", "long"].filter(tutVid);
  return `<div class="learnrow"><button class="btn" data-tour="quick">${L("🧭 Quick tour", "🧭 Tur rapid")}</button><button class="btn ghost" data-tour="full">${L("🗺️ Full tour", "🗺️ Tur complet")}</button></div>
    ${vids.length ? `<div class="learnrow">${vids.map((k) => `<button class="btn ghost" data-tutvid="${k}">${k === "short" ? L("▶️ Short video (~3 min)", "▶️ Video scurt (~3 min)") : L("▶️ Detailed video (~6 min)", "▶️ Video detaliat (~6 min)")}</button>`).join("")}</div>` : ""}
    ${gift ? `<div class="learnrow"><button class="btn ghost" data-gift>💌 ${L("Bianca's card", "Felicitarea de la Bianca")}</button></div>` : ""}`;
}
function modal(html, cls = "") {
  closeModal();
  document.body.insertAdjacentHTML("beforeend", `<div class="modal" data-modalbg><div class="modal-card ${cls}" role="dialog" aria-modal="true">
    <button class="modal-x" data-modalclose aria-label="${L("Close", "Închide")}">✕</button>${html}</div></div>`);
}
function closeModal() { const m = $(".modal"); if (m) { m.remove(); store.set("tourSeen", 1); } }
function playTut(k, auto = true) {
  if (!TOUR) track("tutorial_video_" + k);
  const id = encodeURIComponent(tutVid(k));
  if (!id) return;
  document.querySelectorAll("video,audio").forEach((m) => m.pause());
  const lang = TUTORIAL_VIDEOS[LANG]?.[k] ? LANG : LANG === "ro" ? "en" : "ro", ch = TUTORIAL_CHAPTERS[lang]?.[k] || [];
  const ts = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  modal(`<div class="vwrap"><iframe id="tutFrame" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=${auto ? 1 : 0}&rel=0&cc_load_policy=1&enablejsapi=1" title="${L("Tutorial video", "Video tutorial")}"
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
    ${ch.length ? `<div class="tutch"><b>${L("⏱️ Jump to", "⏱️ Sari la")}</b>${ch.map(([s, n]) => `<button class="chip" data-seek="${s}"><span>${ts(s)}</span> ${esc(n)}</button>`).join("")}</div>` : ""}
    <a class="small" href="https://youtu.be/${id}" target="_blank" rel="noopener">${L("Open on YouTube ↗", "Deschide pe YouTube ↗")}</a>`, "vidcard");
}
function tutSeek(s) {
  const w = $("#tutFrame")?.contentWindow;
  if (!w) return;
  const cmd = (func, args = []) => w.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  cmd("seekTo", [s, true]); cmd("playVideo");
}
const GIFT_TEXT = {
  en: ["Hi 💛",
    "For years I've been saving videos I found useful or beautiful. For the last few months I've been putting them together, and now they're ready for all my loved ones.",
    "It's a very varied collection: conception, tantrums, exercises, games, keepsakes, babies and big kids, sensitive topics, even apps that hide your child's face. I hope you'll find ideas, help and tools here.",
    "<b>Keep in mind:</b> these are people from the internet (parents, teachers, coaches, some doctors) sharing their own, biased opinions and experiences. Use your own critical thinking: keep what's useful to you and leave what isn't.",
    "Enjoy it whenever you have time. 📖 A PDF book is coming soon."],
  ro: ["Bună 💛",
    "De ani de zile salvez videoclipuri care mi s-au părut utile sau frumoase. În ultimele luni le-am adunat la un loc, iar acum sunt gata pentru toți cei dragi mie.",
    "E o colecție foarte variată: concepție, crize de furie, exerciții, jocuri, amintiri de păstrat, bebeluși și copii mai mari, subiecte sensibile, chiar și aplicații care ascund fața copilului. Sper să găsești aici idei, ajutor și instrumente.",
    "<b>Nu uita:</b> sunt oameni de pe internet (părinți, profesori, coach-uri, câțiva medici) care își împărtășesc propriile păreri și experiențe, subiective. Folosește-ți gândirea critică: păstrează ce te ajută și lasă ce nu.",
    "Bucură-te de ea oricând ai timp. 📖 În curând vine și o carte PDF."],
};function showGift() {
  history.replaceState(null, "", location.pathname + location.hash);
  const ov = document.createElement("div");
  ov.className = "gift-ov";
  const G = GIFT_TEXT[LANG];
  ov.innerHTML = `<div class="gift-card" tabindex="-1" role="dialog" aria-modal="true" aria-label="${L("A card from Bianca", "O felicitare de la Bianca")}">
    <div class="gift-inside"><div class="gift-text">
      ${G.map((p, i) => `<p style="--d:${i}">${p}</p>`).join("")}
      <p class="gift-sign" style="--d:${G.length}">${L("With love, Bianca", "Cu drag, Bianca")}</p>
      <div class="gift-end" style="--d:${G.length + 1}"><button class="btn" data-tour="quick">${L("🧭 Show me around", "🧭 Arată-mi aplicația")}</button>
        <button class="btn ghost" data-giftclose>${L("Close", "Închide")}</button></div></div>
    </div>
    <button class="gift-cover" aria-label="${L("Open the card", "Deschide felicitarea")}">
      <span class="gift-ribbon"></span><span class="gift-bow" aria-hidden="true">🎀</span>
      <span class="gift-tag"><span class="gift-for">${L("For you", "Pentru tine")}</span>
        <span class="gift-from">${L("from Bianca, with love", "de la Bianca, cu drag")}</span></span>
      <span class="gift-tap">${L("Tap to open", "Atinge ca să deschizi")}</span>
    </button></div>`;
  document.body.appendChild(ov);
  const fit = () => {
    const box = $(".gift-inside", ov), txt = $(".gift-text", ov);
    let fs = 22;
    txt.style.fontSize = fs + "px";
    while (fs > 8 && txt.scrollHeight > box.clientHeight) txt.style.fontSize = (fs -= 0.25) + "px";
  };
  addEventListener("resize", fit);
  const burst = (n) => {
    const set = ["💛", "💗", "✨", "🌸", "⭐", "💕"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "gift-fx";
      s.textContent = set[i % set.length];
      s.style.cssText = `left:${Math.random() * 100}vw;--x:${(Math.random() - 0.5) * 160}px;--r:${(Math.random() - 0.5) * 720}deg;font-size:${14 + Math.random() * 22}px;animation-delay:${Math.random() * 0.9}s;animation-duration:${2.6 + Math.random() * 2}s`;
      ov.appendChild(s);
      setTimeout(() => s.remove(), 6000);
    }
  };
  const close = () => { removeEventListener("resize", fit); ov.classList.add("out"); setTimeout(() => ov.remove(), 400); };
  requestAnimationFrame(() => { ov.classList.add("in"); fit(); $(".gift-cover", ov).focus(); });
  ov.addEventListener("click", (e) => {
    if (e.target.closest(".gift-cover") && !ov.classList.contains("open")) {
      ov.classList.add("open"); burst(46);
      setTimeout(() => { ov.classList.add("opened"); $(".gift-card", ov).focus({ preventScroll: true }); }, 1300);
    } else if (e.target.closest("[data-giftclose],[data-tour]")) close();
  });
  ov.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}
function maybeWelcome() {
  if (/[?&]gift\b/.test(location.search)) return showGift();
  if (store.get("tourSeen") || location.href.includes("notour") || TOUR) return;
  modal(`<h2>${L("👋 New here? Want a quick tour?", "👋 Ești nouă aici? Vrei un tur rapid?")}</h2>
    <p>${L("I'll show you the most useful parts, one at a time.", "Îți arăt pe rând cele mai utile părți.")}</p>
    <div class="welcome"><button class="btn" data-tour="quick">${L("🧭 Quick tour (1 min)", "🧭 Tur rapid (1 min)")}</button>
      <button class="btn ghost" data-tour="full">${L("🗺️ Full tour (3 min)", "🗺️ Tur complet (3 min)")}</button>
      <button class="btn ghost" data-modalclose>${L("No thanks", "Nu, mulțumesc")}</button></div>
    <p class="muted small">${L("You can start it anytime from Home or More.", "Îl poți porni oricând din Acasă sau Mai mult.")}</p>`, "welcome");
}

const TOUR_ITEM = "tt_7679833509854203149";
const tourItem = () => "#/item/" + encodeURIComponent(BY_ID[TOUR_ITEM] ? TOUR_ITEM : (ITEMS.find((i) => !i.sensitive && i.category !== "off-topic") || ITEMS[0] || {}).id);
const boxOf = (s) => () => $(s)?.closest(".box");
// q: also in the quick tour; r: route to open first; s: selector or function returning the element; x: text (string or fn(full)).
const TOUR_STEPS = [
  { q: 1, r: "#/", s: "#q", t: L("🔍 Ask or search anything", "🔍 Întreabă sau caută orice"),
    x: () => L("Type a question or just a word here. Typos and mixing Romanian with English are totally fine.", "Scrie aici o întrebare sau doar un cuvânt. Greșelile de scriere și amestecul de română cu engleză sunt în regulă.")
      + " " + (apiKey() ? L("You'll also get a short AI answer with sources.", "Primești și un răspuns scurt de la AI, cu surse.")
      : L("Want written answers too? Add a free AI key in More.", "Vrei și răspunsuri scrise? Adaugă o cheie AI gratuită în Mai mult.")) },
  { q: 1, r: "#/", s: ".askcard", t: L("💡 Not sure what to ask?", "💡 Nu știi ce să întrebi?"),
    x: L("Example questions change here every few seconds. Tap one to see how searching works.", "Aici apar pe rând întrebări-exemplu. Atinge una ca să vezi cum funcționează căutarea.") },
  { r: "#/", s: "#view .hscroll", t: L("📂 Topics", "📂 Subiecte"),
    x: L("Videos are grouped by topic. Swipe sideways to see more and tap a topic to open it.", "Videoclipurile sunt grupate pe subiecte. Glisează în lateral ca să vezi mai multe și atinge un subiect ca să-l deschizi.") },
  { r: "#/", s: ".chips.stages", t: L("👣 By age & stage", "👣 După vârstă și etapă"),
    x: L("Pick your child's age, from pregnancy to the teen years, to see only what fits right now.", "Alege vârsta copilului, de la sarcină până la adolescență, ca să vezi doar ce ți se potrivește acum.") },
  { q: 1, s: ".tabs", t: L("🧭 Main menu", "🧭 Meniul principal"),
    x: L("These buttons are always at the bottom: Home, Browse, Library, Saved and More.", "Aceste butoane sunt mereu jos: Acasă, Explorează, Bibliotecă, Salvate și Mai mult.") },
  { r: "#/browse", s: () => { const d = $(".filters"); if (d) d.open = true; return $(".filters .row"); }, t: L("🗂️ Filters", "🗂️ Filtre"),
    x: L("Topic = what it's about. Stage = your child's age. Type = the kind of video (advice, what to say, demo…). Use one or combine them.",
      "Subiect = despre ce e vorba. Etapă = vârsta copilului. Tip = felul videoclipului (sfaturi, ce să spui, demonstrație…). Folosește unul sau combină-le.") },
  { r: "#/browse", s: () => { const d = $(".filters"); if (d) d.open = true; return $(".filters .qchips"); }, t: L("✨ Quick filters", "✨ Filtre rapide"),
    x: L("One tap: boys or girls, dads, medical topics, hide sensitive subjects, only the best (★4+), language, platform or newest first. Tap again to turn it off.",
      "O singură atingere: băieți sau fete, tați, subiecte medicale, ascunde subiectele sensibile, doar cele mai bune (★4+), limbă, platformă sau cele mai noi. Atinge din nou ca să-l oprești.") },
  { q: 1, r: tourItem, s: ".pl", t: L("▶️ Watch it right here", "▶️ Privește direct aici"),
    x: L("Videos play inside the app, no Instagram or TikTok account needed. Hold the right side of the video to play it at 2×, or tap the 1× button for 1.5× or 2×.",
      "Videoclipurile pornesc chiar în aplicație, fără cont de Instagram sau TikTok. Ține apăsat pe partea dreaptă a videoclipului ca să meargă de 2 ori mai repede, sau atinge butonul 1× pentru 1,5× sau 2×.") },
  { r: tourItem, s: ".jump", t: L("⚡ Jump to what you need", "⚡ Sari direct unde vrei"),
    x: L("These buttons take you straight to the summary, the transcript, or the feedback box.", "Aceste butoane te duc direct la rezumat, la transcriere sau la feedback.") },
  { r: tourItem, s: "#sumBox", t: L("📝 The summary", "📝 Rezumatul"),
    x: L("Every video comes with a short summary, the key points and often exactly what to say to your child.", "Fiecare videoclip are un rezumat scurt, ideile principale și, de multe ori, exact ce să-i spui copilului.") },
  { q: 1, r: tourItem, s: "[data-plfav]", t: L("❤️ Save it from the video", "❤️ Salvează direct din video"),
    x: L("Tap the heart on the video to save it while you watch. Tap again to remove it.", "Atinge inima de pe video ca să-l salvezi în timp ce îl privești. Atinge din nou ca să-l scoți.") },
  { q: 1, r: tourItem, s: "#fav", t: L("❤️ Save it", "❤️ Salvează"),
    x: (full) => L("The Save button under the video does the same. You'll find all saved videos in the Saved tab.", "Butonul Salvează de sub video face același lucru. Toate videoclipurile salvate le găsești în fila Salvate.")
      + (full ? " " + L("Source opens the original post on TikTok or Instagram.", "Sursa deschide postarea originală pe TikTok sau Instagram.") : "") },
  { r: tourItem, s: () => $(".shop")?.closest(".ments") || $(".ments"), t: L("🛒 Books & products", "🛒 Cărți și produse"),
    x: L("Things mentioned in the video are listed here. Tap 🛒 Buy to find them in shops in your country.", "Aici apar lucrurile menționate în videoclip. Atinge 🛒 Cumpără ca să le găsești în magazinele din țara ta.") },
  { r: tourItem, s: "#note", t: L("✏️ My note", "✏️ Notița mea"),
    x: L("Write a private note for yourself. It's saved automatically on this device.", "Scrie-ți o notiță personală. Se salvează automat pe acest dispozitiv.") },
  { r: tourItem, s: "#trBox > summary", t: L("💬 What they say", "💬 Ce spun"),
    x: L("Tap here to read the full transcript. Handy when you can't turn the sound on.", "Atinge aici ca să citești transcrierea completă. Utilă când nu poți porni sunetul.") },
  { q: 1, r: "#/library", s: ".tabs4", t: L("📚 Library", "📚 Bibliotecă"),
    x: L("All the books, products, shows, gifts, AI prompts, experts and creators from the videos, in one place. Swipe to pick a tab.",
      "Toate cărțile, produsele, emisiunile, cadourile, prompturile AI, experții și creatorii din videoclipuri, într-un singur loc. Glisează ca să alegi o filă.") },
  { r: "#/saved", s: '.tabs a[data-tab="saved"]', t: L("❤️ Saved", "❤️ Salvate"),
    x: L("Everything you save and every note you write ends up here.", "Tot ce salvezi și toate notițele tale ajung aici.") },
  { q: 1, s: "#langBtn", t: L("🌍 Language", "🌍 Limba"),
    x: L("Switch the whole app between English (EN) and Romanian (RO) with one tap.", "Schimbă toată aplicația între engleză (EN) și română (RO) cu o singură atingere.") },
  { q: 1, s: "#tutBtn", t: L("🎓 Tutorials", "🎓 Tutoriale"),
    x: L("Tours and tutorial videos are always here, if you want to see something again.", "Tururile și videoclipurile tutorial sunt mereu aici, dacă vrei să revezi ceva.") },
  { q: 1, m: 1, s: () => { if (!$(".vidcard")) playTut("short", false); return $(".vidcard"); }, t: L("▶️ Tutorial videos, right in the app", "▶️ Videoclipuri tutorial, direct în aplicație"),
    x: L("The tutorial videos play right here. Tap a time stamp under the video to jump straight to the part you need.",
      "Videoclipurile tutorial pornesc chiar aici. Atinge un moment de sub video ca să sari direct la partea care te interesează.") },
  { q: 1, r: "#/settings", s: () => $("#keyIn")?.closest(".box"), t: L("✨ AI answers (optional)", "✨ Răspunsuri AI (opțional)"),
    x: () => L("Get a free Google Gemini key at " + keyLink() + ", tap Create API key, copy it and paste it here. Then you get written answers with sources. It stays only on this device.",
      "Ia o cheie Google Gemini gratuită de pe " + keyLink() + ", apasă Create API key, copiaz-o și lipește-o aici. Apoi primești răspunsuri scrise, cu surse. Rămâne doar pe acest dispozitiv.") },
  { r: "#/settings", s: boxOf("#country"), t: L("🛒 Shopping country", "🛒 Țara pentru cumpărături"),
    x: L("Choose where you shop, so Buy links and prices point to shops near you.", "Alege de unde cumperi, ca linkurile „Cumpără” și prețurile să ducă la magazine de lângă tine.") },
  { r: "#/settings", s: boxOf("#helpOn"), t: L("🆘 Help lines", "🆘 Linii de ajutor"),
    x: L("Pick the country you live in for the right emergency number and help lines. If your toddler plays with your phone, you can turn off the emergency bar here so they can't call by accident.",
      "Alege țara în care locuiești, pentru numărul de urgență și liniile de ajutor potrivite. Dacă cel mic se joacă pe telefonul tău, poți opri aici bara de urgență, ca să nu sune din greșeală.") },
  { r: "#/settings", s: boxOf("#autoplay"), t: L("▶️ Autoplay", "▶️ Pornire automată"),
    x: L("Choose whether videos start playing as soon as you open them.", "Alege dacă videoclipurile pornesc singure când le deschizi.") },
  { r: "#/settings", s: boxOf("#exportFb"), t: L("🏷️ Feedback", "🏷️ Feedback"),
    x: L("Video not about parenting, or in the wrong topic? Tap Give feedback on its page — it's sent to us automatically.",
      "Videoclipul nu e despre parenting sau e la subiectul greșit? Apasă Dă feedback pe pagina lui — ni se trimite automat.") },
  { q: 1, r: "#/settings", s: boxOf("#bkSave"), t: L("💾 Keep a backup", "💾 Păstrează o copie"),
    x: L("Your saved videos, notes and settings live only in this browser. Save a copy now and then, and restore it on a new phone or if the browser data is cleared.",
      "Videoclipurile salvate, notițele și setările stau doar în acest browser. Salvează din când în când o copie și restaureaz-o pe un telefon nou sau dacă se șterg datele browserului.") },
  { q: 1, t: L("📲 Add it to your home screen", "📲 Pune-o pe ecranul telefonului"),
    x: L("So it opens like an app, with one tap:<br><b>iPhone (Safari):</b> Share ⬆️ → Add to Home Screen.<br><b>Android (Chrome):</b> ⋮ → Add to home screen → Install / Create shortcut → <b>Create shortcut</b>.<br><b>Computer (Chrome):</b> ⋮ → Cast, save and share → Create shortcut (or Ctrl + D to bookmark it).",
      "Ca să se deschidă ca o aplicație, dintr-o atingere:<br><b>iPhone (Safari):</b> Partajare ⬆️ → Adaugă pe ecranul principal.<br><b>Android (Chrome):</b> ⋮ → Adaugă pe ecranul de pornire → Instalează / Creează o comandă rapidă → <b>Creează o comandă rapidă</b>.<br><b>Calculator (Chrome):</b> ⋮ → Proiectează, salvează și trimite → Creează o comandă rapidă (sau Ctrl + D ca s-o salvezi).") },
  { q: 1, s: ".helpbar", t: L("🆘 Help is always close", "🆘 Ajutorul e mereu aproape"),
    x: L("At the bottom of every page: the emergency number and help lines. Living somewhere else? Change the country in More → Help lines. You can restart this tour anytime from 🎓 Tutorials.",
      "La finalul fiecărei pagini: numărul de urgență și liniile de ajutor. Locuiești în altă țară? Schimb-o din Mai mult → Linii de ajutor. Poți reporni turul oricând din 🎓 Tutoriale.") },
];
let TOUR = null;
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
function startTour(kind) {
  closeModal(); store.set("tourSeen", 1);
  TOUR?.el.remove();
  const full = kind === "full", el = document.createElement("div");
  el.className = "tour busy";
  el.innerHTML = `<div class="tour-ring"></div><div class="tour-card" role="dialog" aria-modal="true" aria-live="polite"></div>`;
  document.body.append(el);
  TOUR = { full, el, steps: TOUR_STEPS.filter((s) => full || s.q), i: 0, n: 0, target: null };
  track("tour_start_" + (full ? "full" : "quick"));
  tourGo(0);
}
async function tourGo(i) {
  const T = TOUR;
  if (!T || i < 0) return;
  if (i >= T.steps.length) { track("tour_finished_" + (T.full ? "full" : "quick")); return endTour(); }
  const st = T.steps[i], n = ++T.n;
  T.i = i; T.target = null; T.el.classList.add("busy");
  if (!st.m && $(".modal")) $(".modal").remove();
  const r = typeof st.r === "function" ? st.r() : st.r;
  if (r && (location.hash || "#/") !== r) {
    location.hash = r;
    await new Promise((ok) => { addEventListener("hashchange", () => setTimeout(ok), { once: true }); setTimeout(ok, 600); });
  }
  const find = () => { if (!st.s) return null; const e = typeof st.s === "function" ? st.s() : $(st.s); return e && e.getClientRects().length ? e : null; };
  let el = find();
  for (let w = 0; st.s && !el && w < 25; w++) { await sleep(100); el = find(); }
  if (T !== TOUR || n !== T.n) return;
  T.target = el;
  const last = i === T.steps.length - 1, c = $(".tour-card", T.el);
  c.innerHTML = `<button class="tour-x" data-tourend aria-label="${L("Skip the tour", "Sari peste tur")}">✕</button>
    <div class="tour-prog"><span style="width:${((i + 1) / T.steps.length) * 100}%"></span></div><small class="tour-n">${i + 1} / ${T.steps.length}</small>
    <h3>${st.t}</h3><p>${typeof st.x === "function" ? st.x(T.full) : st.x}</p>
    <div class="tour-btns"><button class="tour-skip" data-tourend>${L("Skip", "Sari peste")}</button>
      ${i ? `<button class="btn ghost" data-tourprev>${L("← Back", "← Înapoi")}</button>` : ""}
      <button class="btn" data-tournext>${last ? L("Done ✓", "Gata ✓") : L("Next →", "Înainte →")}</button></div>`;
  if (el && !el.closest(".top,.tabs")) {
    el.scrollIntoView({ block: "center" });
    // If the card fits neither below nor above, scroll the target up (not under the header) to make room below it.
    const r = el.getBoundingClientRect(), ch = c.offsetHeight + 30, minTop = $(".top").offsetHeight + ($(".backbar")?.offsetHeight || 0) + 12;
    if (r.bottom + ch > innerHeight && r.top - ch < 10) scrollBy(0, Math.min(r.bottom + ch - innerHeight, r.top - minTop));
  }
  T.el.classList.remove("busy");
  tourPlace();
  $("[data-tournext]", c).focus({ preventScroll: true });
}
function tourPlace() {
  if (!TOUR) return;
  const ring = $(".tour-ring", TOUR.el), c = $(".tour-card", TOUR.el), el = TOUR.target, vw = innerWidth, vh = innerHeight, m = 10;
  const r = el && el.isConnected ? el.getBoundingClientRect() : null, cw = c.offsetWidth, ch = c.offsetHeight;
  TOUR.el.classList.toggle("nospot", !r);
  if (!r) { c.style.left = (vw - cw) / 2 + "px"; c.style.top = Math.max(m, (vh - ch) / 2) + "px"; return; }
  const x1 = Math.max(3, r.left - 6), y1 = Math.max(3, r.top - 6), x2 = Math.min(vw - 3, r.right + 6), y2 = Math.min(vh - 3, r.bottom + 6);
  Object.assign(ring.style, { left: x1 + "px", top: y1 + "px", width: Math.max(0, x2 - x1) + "px", height: Math.max(0, y2 - y1) + "px" });
  const top = y2 + 12 + ch <= vh - m ? y2 + 12 : y1 - 12 - ch >= m ? y1 - 12 - ch : vh - ch - m;
  c.style.top = Math.max(m, top) + "px";
  c.style.left = Math.max(m, Math.min((x1 + x2 - cw) / 2, vw - cw - m)) + "px";
}
function endTour() {
  if (!TOUR) return;
  if (TOUR.i < TOUR.steps.length - 1) track("tour_skipped", { tour_step: TOUR.i + 1 });
  TOUR.el.remove(); TOUR = null; $(".modal")?.remove();
  for (const k in SCROLL) delete SCROLL[k];
  (location.hash || "#/") === "#/" ? scrollTo(0, 0) : (location.hash = "#/");
}
addEventListener("resize", tourPlace);
addEventListener("scroll", tourPlace, { passive: true });
// No sound behind the tour: pause any video that starts (e.g. autoplay on the item page).
document.addEventListener("play", (e) => { if (!TOUR && e.target.closest?.(".pl")) track("video_play"); if (TOUR) e.target.pause(); else if (e.target.closest?.(".pl") && !HOLD) e.target.playbackRate = SPEED; }, true);
/* playback speed: 1× → 1.5× → 2× button, and hold the right side of a video for 2× */
let SPEED = 1, HOLD = null;
function setSpeed() {
  document.querySelectorAll(".pl video").forEach((v) => { v.defaultPlaybackRate = v.playbackRate = SPEED; });
  document.querySelectorAll("[data-spd]").forEach((b) => { b.textContent = SPEED + "×"; b.classList.toggle("on", SPEED !== 1); });
}
document.addEventListener("pointerdown", (e) => {
  const v = e.target.closest?.(".pl video");
  if (!v || TOUR || e.button > 0) return;
  const r = v.getBoundingClientRect();
  if (e.clientX < r.left + r.width * 0.6 || e.clientY > r.bottom - 56) return;
  const h = HOLD = { v, used: false, timer: setTimeout(() => {
    h.used = true; v.playbackRate = 2; if (v.paused) v.play().catch(() => {});
    v.closest(".pl").classList.add("fast");
  }, 300) };
}, true);
const endHold = () => {
  if (!HOLD) return;
  const h = HOLD; HOLD = null; clearTimeout(h.timer);
  if (h.used) {
    h.v.playbackRate = SPEED; h.v.closest(".pl")?.classList.remove("fast");
    const stop = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    document.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", stop, true), 400);
  }
};
["pointerup", "pointercancel"].forEach((n) => document.addEventListener(n, endHold, true));
document.addEventListener("contextmenu", (e) => { if (HOLD || e.target.closest?.(".pl video")) e.preventDefault(); }, true);
addEventListener("keydown", (e) => {
  if (TOUR) {
    if (e.key === "Escape") endTour();
    else if (e.key === "ArrowRight") tourGo(TOUR.i + 1);
    else if (e.key === "ArrowLeft") tourGo(TOUR.i - 1);
    else return;
    e.preventDefault();
  } else if (e.key === "Escape" && $(".modal")) closeModal();
});

/* ---------- events ---------- */
document.addEventListener("click", async (e) => {
  const t = e.target;
  const tb = t.closest("[data-tour]");
  if (tb) { startTour(tb.dataset.tour); return; }
  if (t.closest("[data-gift]")) { showGift(); return; }
  if (t.closest("[data-tutvid]")) { playTut(t.closest("[data-tutvid]").dataset.tutvid); return; }
  if (t.closest("[data-seek]") && !TOUR) { tutSeek(+t.closest("[data-seek]").dataset.seek); return; }
  if (t.closest("#tutBtn") && !TOUR) { modal(`<h2>${L("🎓 Tutorials", "🎓 Tutoriale")}</h2><p class="muted">${L("Pick a guided tour of the app or watch a tutorial video.", "Alege un tur ghidat al aplicației sau privește un video tutorial.")}</p>${learnBtns(false)}`); return; }
  if (t.closest("[data-modalclose]") || t.matches("[data-modalbg]")) { closeModal(); return; }
  if (TOUR) {
    if (t.closest("[data-tournext]")) tourGo(TOUR.i + 1);
    else if (t.closest("[data-tourprev]")) tourGo(TOUR.i - 1);
    else if (t.closest("[data-tourend]")) endTour();
    return;
  }
  const more = t.closest("[data-more]");
  if (more) { paged.state[more.dataset.more] += 30; route(true); return; }
  if (t.closest("[data-shuffle]")) { e.preventDefault(); BEST_SEED = Math.random(); route(true); return; }
  if (t.closest("[data-ask]")) { runAsk(t.closest("[data-ask]").dataset.ask); return; }
  if (t.closest("[data-car]")) { const c = $(".car"); c.scrollBy({ left: c.clientWidth * +t.closest("[data-car]").dataset.car, behavior: "smooth" }); return; }
  if (t.closest("[data-newseen]")) store.set("newSeen", t.closest("[data-newseen]").dataset.newseen);
  if (t.closest(".reminder")) { t.closest(".reminder").classList.toggle("open"); return; }
  const jb = t.closest("[data-jump]");
  if (jb) { const d = document.getElementById(jb.dataset.jump); if (d) { if (d.tagName === "DETAILS") d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
  if (t.closest("[data-spd]")) { SPEED = SPEED === 1 ? 1.5 : SPEED === 1.5 ? 2 : 1; setSpeed(); return; }
  if (t.closest("#reveal")) { const g = t.closest(".sensgate"); g.classList.remove("sensgate"); t.closest("#reveal").remove(); return; }
  const lb = t.closest("[data-lang],#langBtn");
  if (lb) { const v = lb.dataset.lang || (LANG === "ro" ? "en" : "ro"); if (v !== LANG) { setPref("lang", v); location.reload(); } return; }
  if (t.id === "back") { NAV > 0 ? history.back() : (location.hash = "#/browse"); return; }
  if (t.id === "fav" || t.closest("[data-plfav]")) {
    const id = decodeURIComponent(location.hash.split("/")[2]);
    const favs = store.get("favs", []), i = favs.indexOf(id);
    i >= 0 ? favs.splice(i, 1) : favs.unshift(id);
    store.set("favs", favs);
    track(i >= 0 ? "unsave" : t.id === "fav" ? "save_button" : "save_heart_on_video");
    const fb = $("#fav"), pb = $("[data-plfav]");
    if (fb) fb.textContent = i >= 0 ? L("🤍 Save", "🤍 Salvează") : L("❤️ Saved", "❤️ Salvat");
    if (pb) { pb.textContent = i >= 0 ? "🤍" : "❤️"; pb.classList.toggle("on", i < 0); pb.classList.remove("pop"); void pb.offsetWidth; pb.classList.add("pop"); }
  }
  if (t.id === "keySave") {
    const v = $("#keyIn").value.trim(), msg = $("#keyMsg");
    if (!v) { msg.className = "keymsg bad"; msg.textContent = L("Paste a key first.", "Lipește mai întâi o cheie."); return; }
    t.disabled = true; msg.className = "keymsg"; msg.textContent = L("Checking the key…", "Verific cheia…");
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", { headers: { "x-goog-api-key": v } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || "HTTP " + r.status);
      setPref("key", v); setPref("ai", undefined); route();
      const m = $("#keyMsg"); if (m) { m.className = "keymsg ok"; m.textContent = L("✅ Key saved and working! You can now ask questions in the search bar.", "✅ Cheia e salvată și funcționează! Acum poți pune întrebări în bara de căutare."); }
    } catch (err) {
      t.disabled = false; msg.className = "keymsg bad";
      msg.textContent = `❌ ${L("This key didn't work, nothing was saved", "Cheia nu a funcționat, nu s-a salvat nimic")}: ${err.message}`;
    }
    return;
  }
  if (t.id === "keyDel" && confirm(L("Remove your Gemini key from this device?", "Ștergi cheia Gemini de pe acest dispozitiv?"))) {
    setPref("key", undefined); route();
    const m = $("#keyMsg"); if (m) { m.className = "keymsg ok"; m.textContent = L("🗑️ Key removed.", "🗑️ Cheia a fost ștearsă."); }
    return;
  }
  if (t.closest("[data-prices]")) { const b = $("#priceBox"); if (b) { t.closest("[data-prices]").disabled = true; runPrices(b); } return; }
  if (t.id === "exportFb") {
    const txt = JSON.stringify(store.get("feedback", {}), null, 1);
    try { await navigator.clipboard.writeText(txt); t.textContent = L("Copied ✓", "Copiat ✓"); }
    catch { const w = window.open(); w.document.body.innerText = txt; }
  }
  if (t.id === "fbOff" || t.id === "fbSend") {
    const id = decodeURIComponent(location.hash.split("/")[2] || ""), fb = store.get("feedback", {}), cur = fb[id] || { title: BY_ID[id]?.title, was: BY_ID[id]?.category };
    const off = t.id === "fbOff", cat = $("#fbCat").value, note = $("#fbNote").value.trim();
    if (!off && !cat && !note) { $("#fbNote").focus(); return; }
    t.disabled = true;
    sendFb(id, off ? "not_parenting" : "category: " + (cat || "-"), off ? "" : note).then((ok) => {
      if (!ok) { t.disabled = false; alert(L("Couldn't send — check your internet and try again.", "Nu s-a putut trimite — verifică internetul și încearcă din nou.")); return; }
      off ? (cur.off = true) : (cur.sent = true);
      fb[id] = cur; store.set("feedback", fb);
      track(off ? "feedback_not_parenting" : "feedback_category");
      if (off) t.textContent = L("✓ Reported as not about parenting. Thank you!", "✓ Raportat ca nefiind despre parenting. Mulțumim!"), t.classList.remove("soft");
      else t.disabled = false, $("#fbSent").textContent = L("✓ Sent. Thank you!", "✓ Trimis. Mulțumim!");
    });
    return;
  }
  if (t.id === "clearFb" && confirm(L("Clear all category feedback?", "Ștergi tot feedback-ul pentru categorii?"))) { store.set("feedback", {}); route(); }
  if (t.id === "bkSave") {
    const settings = { ...store.get("settings", {}) };
    if (!$("#bkKey")?.checked) delete settings.key;
    const data = { app: "parenting-library", version: 1, saved: new Date().toISOString(),
      favs: store.get("favs", []), notes: store.get("notes", {}), feedback: store.get("feedback", {}), settings };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }));
    a.download = `parenting-library-backup-${data.saved.slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    const m = $("#bkMsg"); m.className = "keymsg ok";
    m.textContent = L("✅ Copy saved to your Downloads / Files.", "✅ Copia a fost salvată în Descărcări / Fișiere.");
  }
  if (t.id === "bkLoad") $("#bkFile").click();
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "bkFile" || !e.target.files[0]) return;
  const m = $("#bkMsg");
  try {
    const d = JSON.parse(await e.target.files[0].text());
    if (d.app !== "parenting-library") throw new Error("not a Parenting Library backup");
    const favs = store.get("favs", []);
    (d.favs || []).forEach((id) => favs.includes(id) || favs.push(id));
    store.set("favs", favs);
    store.set("notes", { ...store.get("notes", {}), ...(d.notes || {}) });
    store.set("feedback", { ...store.get("feedback", {}), ...(d.feedback || {}) });
    const s = store.get("settings", {}), bs = d.settings || {};
    store.set("settings", { ...bs, ...s, key: s.key || bs.key });
    route(true);
    const m2 = $("#bkMsg"); m2.className = "keymsg ok";
    m2.textContent = L(`✅ Restored: ${(d.favs || []).length} saved videos, ${Object.keys(d.notes || {}).length} notes.`,
      `✅ Restaurat: ${(d.favs || []).length} videoclipuri salvate, ${Object.keys(d.notes || {}).length} notițe.`);
  } catch (err) {
    m.className = "keymsg bad";
    m.textContent = `❌ ${L("This file couldn't be restored", "Fișierul nu a putut fi restaurat")}: ${err.message}`;
  }
  e.target.value = "";
});
document.addEventListener("change", (e) => {
  if (e.target.id === "autoplay") { setPref("autoplay", e.target.checked); return; }
  if (e.target.id === "aiOn") { setPref("ai", e.target.checked ? undefined : false); route(true); return; }
  if (e.target.id === "helpOn") { setPref("help", e.target.checked ? undefined : false); route(true); return; }
  if (e.target.id === "country") { setPref("country", e.target.value); return; }
  if (e.target.id === "homeCountry") { setPref("home", e.target.value); route(true); return; }
  if (e.target.id === "fbCat") { e.target.dispatchEvent(new Event("input", { bubbles: true })); return; }
  const s = e.target.closest("select[data-k]");
  if (!s) return;
  const p = new URLSearchParams(location.hash.split("?")[1] || "");
  s.value ? p.set(s.dataset.k, s.value) : p.delete(s.dataset.k);
  location.hash = "#/browse?" + p;
});
document.addEventListener("input", (e) => {
  const id = decodeURIComponent(location.hash.split("/")[2] || "");
  if (e.target.id === "note") { const n = store.get("notes", {}); e.target.value ? (n[id] = e.target.value) : delete n[id]; store.set("notes", n); }
  if (e.target.id === "fbNote" || e.target.id === "fbCat") {
    const fb = store.get("feedback", {});
    const cur = { cat: $("#fbCat").value, note: $("#fbNote").value };
    cur.cat || cur.note ? (fb[id] = { ...cur, title: BY_ID[id]?.title, was: BY_ID[id]?.category }) : delete fb[id];
    store.set("feedback", fb);
  }
});

/* ---------- router ---------- */
let NAV = 0, LAST_Y = 0;
const SCROLL = {};
addEventListener("scroll", () => { LAST_Y = scrollY; }, { passive: true });
// Feedback goes to a Google Form → private Google Sheet (Bianca's account). Users never see the form.
const FB_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSc_RvZrau3SGez2IiVUOMJZ-FGIMv3Wkn1B1XBQUb3nZ1gF_w/formResponse";
function sendFb(id, type, note) {
  const b = new URLSearchParams({ "entry.2021367569": id + " | " + (BY_ID[id]?.title || ""), "entry.1139664319": type, "entry.239655636": note || "" });
  return fetch(FB_FORM, { method: "POST", mode: "no-cors", body: b }).then(() => true, () => false);
}
// Dots under horizontally swipeable filter rows, so people see there is more to the right.
function addScrollDots() {
  document.querySelectorAll(".qchips").forEach((el) => {
    if (el.nextElementSibling?.classList.contains("sdots")) return;
    el.insertAdjacentHTML("afterend", '<div class="sdots" aria-hidden="true"></div>');
    updDots(el);
  });
}
function updDots(el) {
  const d = el.nextElementSibling;
  if (!d || !d.classList.contains("sdots")) return;
  const over = el.scrollWidth - el.clientWidth;
  if (over < 4) { d.hidden = true; return; }
  d.hidden = false;
  const n = Math.max(3, Math.ceil(el.scrollWidth / el.clientWidth));
  const on = Math.round((el.scrollLeft / over) * (n - 1));
  d.innerHTML = Array.from({ length: n }, (_, i) => `<i${i === on ? ' class="on"' : ""}></i>`).join("");
}
document.addEventListener("scroll", (e) => { if (e.target.classList?.contains("qchips")) updDots(e.target); }, true);
document.addEventListener("toggle", (e) => e.target.querySelectorAll?.(".qchips").forEach(updDots), true);
addEventListener("resize", () => document.querySelectorAll(".qchips").forEach(updDots));
function route(keepScroll) {
  const [path, qs] = (location.hash.slice(1) || "/").split("?");
  const params = new URLSearchParams(qs || "");
  const parts = path.split("/").filter(Boolean);
  const tab = parts[0] || "home";
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  $("#q").value = params.get("q") || "";
  document.querySelectorAll("video,audio").forEach((m) => m.pause());
  AFTER = [];
  const html = tab === "item" ? item(decodeURIComponent(parts[1])) : tab === "browse" ? browse(params) : tab === "library" ? library(params)
    : tab === "collections" ? collections() : tab === "saved" ? saved() : tab === "settings" ? settings() : tab === "help" ? helpPage() : home();
  const y = scrollY;
  const root = ["home", "saved", "settings", "library"].includes(tab) || (tab === "browse" && ![...params.keys()].length);
  const rtxt = L("<b>A friendly reminder:</b> everything here is advice from real people and their own experience. Use your critical thinking — take what fits you and your family, and leave what doesn't. You know your child best.",
    "<b>Un gând prietenos:</b> tot ce găsești aici sunt sfaturi de la oameni reali, din experiența lor. Folosește-ți gândirea critică — păstrează ce ți se potrivește ție și familiei tale și lasă deoparte ce nu. Tu îți cunoști copilul cel mai bine.");
  const reminder = `<button type="button" class="reminder" style="--dur:${Math.round(rtxt.replace(/<[^>]+>/g, "").length / 7)}s" aria-label="${L("A friendly reminder (tap to read)", "Un gând prietenos (atinge ca să citești)")}">🧡<span class="rm-win"><span class="rm-track"><span>${rtxt}</span><span aria-hidden="true">${rtxt}</span></span><span class="rm-full">${rtxt}</span></span></button>`;
  // Sits at the end of the page (far from the tab bar and buttons) and opens a page rather than dialing, so it's hard to hit by accident.
  const helpBar = prefs().help === false || tab === "help" ? "" : `<div class="helpbar"><span>🆘 ${L("Need help? Emergency", "Ai nevoie de ajutor? Urgențe")} <b>${esc(helpSet().sos)}</b></span>
    <a href="#/help">${L("Help lines →", "Linii de ajutor →")}</a></div>`;
  view.innerHTML = (root ? "" : `<div class="backbar"><button class="back" id="back">${L("← Back", "← Înapoi")}</button></div>`) + reminder + html + helpBar;
  scrollTo(0, keepScroll === true ? y : tab !== "item" && SCROLL[location.hash] ? SCROLL[location.hash] : 0);
  AFTER.forEach((f) => f());
  addScrollDots();
  track("page_" + tab, params.get("q") ? { search: params.get("q") } : tab === "item" ? { video: decodeURIComponent(parts[1] || "") } : null);
  if (params.get("q")) track("search");
}
addEventListener("hashchange", (e) => {
  SCROLL["#" + (e.oldURL.split("#")[1] || "")] = LAST_Y;
  NAV++;
  route();
});
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#q").value.trim();
  location.hash = q ? "#/browse?q=" + encodeURIComponent(q) : "#/browse";
  $("#q").blur();
});
function shellText() {
  document.documentElement.lang = LANG;
  $("#langBtn").innerHTML = `<span class="${LANG === "en" ? "on" : ""}">EN</span><span class="${LANG === "ro" ? "on" : ""}">RO</span>`;
  $("#langBtn").setAttribute("aria-label", LANG === "ro" ? "Switch to English" : "Schimbă în română");
  if (LANG !== "ro") return;
  $("#tutBtn span").textContent = "Tutoriale";
  $(".brand").textContent = "🌱 Biblioteca Părinților";
  document.title = "Biblioteca Părinților";
  $("#q").placeholder = "Întreabă sau caută orice…";
  const tabs = { home: "Acasă", browse: "Explorează", library: "Bibliotecă", saved: "Salvate", settings: "Mai mult" };
  document.querySelectorAll(".tabs a").forEach((a) => { const s = a.querySelector("span"); if (s) s.textContent = tabs[a.dataset.tab]; });
}
shellText();
load().then(maybeWelcome);
