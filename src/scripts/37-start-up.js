/* ===================== Start up ===================== */
for (const fn of initFns) { try { fn(); } catch (e) { console.error(e); } }
setMode(appMode);
applyNav();
renderProfileWhere();
renderAccount();
accountReady.then(renderAccount);
refreshSample();
showView(location.hash.slice(1) || lsGet(VIEW_KEY) || (appMode === "employer" ? "employer" : "home"), { keepScroll: true });
renderAiChip();
setTimeout(renderAiChip, 1500);   // Claude's connection arrives a moment after load
window.__jfp = () => profile.data;
window.__jfSaveProfile = () => saveProfileSoon();
window.__jfRate = (type, text, ans) => { const r = ruleRate({ type, text }, ans); return { overall: r.overall, scores: r.scores.map(s => s.criterion[0] + s.criterion.slice(1, 4) + ":" + s.score).join(" "), fix: r.improvements[0] || "" }; };
window.__jfTrk = () => trk.data;
window.__jfGeo = reset => { if (reset) geoCache.sig = ""; const g = pageGeometry(); return { cap: g.cap, chars: g.chars, sideChars: g.sideChars, head: g.head, entry: g.entry, sec: g.sec, measured: g.measured, sidebar: g.sidebar }; };
window.__jfSample = () => replaceProfile(JSON.parse(JSON.stringify(SAMPLE_PROFILE)), "test");

window.__jfAcct = { oauthUrl: acctOAuthUrl, providers: acctProviders };
window.__jfV22 = { buildDataZip, deleteDialog: () => { account.user = { id: "x", email: "a@b.c", provider: "email" }; deleteDialog(false); }, undo: undoStep };
window.__jfAi = { tier: aiTier, small: keyIsSmall, smallEngine };
window.__jobFinder = { analyse, norm, example: EXAMPLE_RESUME, exampleJd: EXAMPLE_JD, detectGuide };
