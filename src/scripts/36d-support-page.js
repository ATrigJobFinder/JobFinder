/* ===================== Contact or help: a message goes to your Supabase table support_messages ===================== */
// Anyone can send; only you can read them (Supabase > Table Editor > support_messages). See supabase/migrations/004_support_messages.sql.
onInit(() => {
  const f = $("spForm");
  if (!f) return;
  const say = (m, err) => { const s = $("spStatus"); s.textContent = m; s.classList.toggle("err", !!err); };
  viewHooks.support = () => { if (account.user) { if (!$("spEmail").value) $("spEmail").value = account.user.email || ""; if (!$("spName").value) $("spName").value = account.user.name || ""; } };
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("spName").value.trim(), email = $("spEmail").value.trim(), kind = $("spKind").value, message = $("spMsg").value.trim();
    if ($("spTrap").value) { say("Thanks, we've got it."); return; }   // a robot filled the hidden box
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say("Check your email address, so we can reply.", true); $("spEmail").focus(); return; }
    if (message.length < 10) { say("Tell us a little more (at least a sentence).", true); $("spMsg").focus(); return; }
    if (!jobsDbOn()) { say("Sending isn't switched on for this copy of Job Finder yet.", true); return; }
    $("spSend").disabled = true; say("Sending…");
    try {
      const res = await fetch(dbBase() + "/support_messages", { method: "POST", headers: { ...dbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ name: name || null, email, kind, message, page: String(currentView || "").slice(0, 60) }) });
      if (!res.ok) throw new Error(String(res.status));
      $("spMsg").value = ""; say("Thanks, we've got your message and will reply by email.");
    } catch (err) { say(err.message === "404" ? "Messages can't be received yet: the site owner needs to finish setting up the support table." : "Couldn't send that. Check your connection and try again.", true); }
    finally { $("spSend").disabled = false; }
  });
});
