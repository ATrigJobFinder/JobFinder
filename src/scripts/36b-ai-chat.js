/* ===================== Ask AI: a help chat on every page, using the AI chosen in Connect your AI ===================== */
// A button in the corner opens a small chat. It talks to whichever AI is chosen: the one in the browser, Chrome's, the person's own key,
// or Claude. A small model gets a shorter brief, a few turns of memory and a short-answer limit; a larger one gets the fuller brief.
// The chat only advises. It never changes anything in the person's resume or letters, and nothing typed here is saved.
const CHAT_PAGE_NOTES = {
  home: "the Home page, where they choose what to do next",
  connect: "Connect your AI, where they choose which AI writes for them",
  builder: "Create or edit resume, which builds a resume step by step",
  letter: "Create or edit cover letter, which writes a letter from their profile and a job ad",
  cv: "Resume and cover letter templates, where they choose a design",
  linkedin: "Create or edit LinkedIn, which improves their LinkedIn profile",
  profile: "Create or edit profile, where their details are saved once and reused",
  jobs: "Find jobs, where they search Australian jobs",
  scanner: "Tailor to a job, which checks a resume against a job ad",
  companies: "Company guides",
  tracker: "the application tracker",
  interview: "Interviews, where they practise answers and get feedback",
  aptitude: "Aptitude tests",
  learning: "Learning, with courses for the skills a job asks for",
  employer: "Hiring, for employers"
};
const CHAT_CHIPS = {
  _: ["What should I do first?", "How do I tailor my resume to a job?", "How do I make my cover letter stronger?"],
  builder: ["What makes a good resume bullet point?", "How long should my resume be?", "What do I put if I have no experience?"],
  letter: ["How long should a cover letter be?", "What goes in the opening paragraph?", "How do I show I fit the job?"],
  interview: ["How do I answer 'tell me about yourself'?", "What is the STAR method?", "How do I handle nerves?"],
  jobs: ["How do I search for graduate roles?", "What does 'direct from employer' mean?", "How do I apply well?"],
  scanner: ["What does the match score mean?", "Which missing skills should I add?", "Is it okay to copy words from the ad?"],
  linkedin: ["What makes a good headline?", "What goes in the About section?"],
  connect: ["Which AI should I choose?", "What is a model size?", "Is my key safe?"]
};
const chat = { open: false, busy: false, turns: [], ctl: null };
const chatPageName = () => VIEWS[currentView] || "Job Finder";
function chatSystem() {
  const where = CHAT_PAGE_NOTES[currentView] || chatPageName();
  const pages = Object.values(VIEWS).join("; ");
  if (aiTier() === "small") return `You are the help assistant inside Job Finder, a website that helps Australian job seekers with resumes, cover letters, LinkedIn, interviews and finding jobs.
Rules:
1. Answer in 3 sentences or fewer, in plain words, with Australian spelling.
2. When it helps, name the Job Finder page to open: ${pages}.
3. Never make up facts about the person. If you don't know, say so.
4. No headings or tables.
The person is on: ${where}.`;
  return `You are the help assistant inside Job Finder, a free website that helps Australian job seekers write resumes and cover letters, improve LinkedIn, practise interviews and find jobs.
The pages are: ${pages}. When it would help, point to the page that does the job.
How to answer:
- Be practical and kind. Plain words, Australian spelling, usually under 120 words. Short lists are fine; no headings or tables.
- Give advice a recruiter in Australia would agree with: honest resumes, no invented experience, specific results, a clear fit to the job ad.
- You can't see or change the person's documents. If an answer depends on them, ask for the detail you need, or tell them where in Job Finder to look.
- If you don't know, say so rather than guessing.
The person is on: ${where}.`;
}
// The last few turns, trimmed. A small model remembers fewer and shorter ones.
function chatMessages() {
  const small = aiTier() === "small", keep = small ? 6 : 14, cap = small ? 600 : 2000;
  const turns = chat.turns.slice(-keep).map(t => ({ role: t.role, content: String(t.text).slice(0, cap) }));
  return [{ role: "system", content: chatSystem() }, ...turns];
}
async function chatAsk(signal) {
  const small = aiTier() === "small", msgs = chatMessages(), max = small ? tightMax(450) : 900, e = aiCfg.engine;
  // 1. the AI chosen in Connect your AI: a model in the browser, or the person's own key
  if (USER_ENGINES.has(e) && aiUsable(e)) {
    try { return { text: await aiChat(e, msgs, signal, { expect: small ? 450 : 900, max }), via: AI_NAME(e) }; }
    catch (err) { if (err.code === "cancelled" || !claudeSample || !aiCfg.fallback) throw err; }
  }
  // 2. Chrome's built-in AI, when it's the choice (or automatic) and ready
  if (aiChromeAllowed() && (await chromeAIState()) === "available") {
    let s;
    try {
      const sys = msgs[0], rest = msgs.slice(1), last = rest.pop();
      s = await self.LanguageModel.create({ ...LM_OPTS, initialPrompts: [sys, ...rest] });
      const text = await s.prompt(last.content, signal ? { signal } : undefined);
      if (text) return { text: String(text), via: "Chrome's built-in AI" };
    } catch (err) { if (signal && signal.aborted) throw aiError("cancelled"); /* try Claude next */ }
    finally { try { s && s.destroy(); } catch { /* gone */ } }
  }
  // 3. Claude through the site, which answers in JSON
  if (claudeSample) {
    const asked = [...msgs.slice(0, -1), { role: "user", content: msgs[msgs.length - 1].content + '\n\nReply with only this JSON: {"reply": "your answer"}' }];
    const d = await claudeSample.json(asked, { signal, cache: false });
    if (d && typeof d.reply === "string" && d.reply.trim()) return { text: d.reply, via: "Claude" };
    throw aiError("invalid_json");
  }
  throw aiError("no_engine", "No AI is connected.");
}
// Plain text with a little formatting: **bold**, and lines starting "-" or "1." as a list. Everything is escaped first.
function chatHtml(t) {
  let html = "", list = false;
  for (const line of esc(String(t)).split(/\n/)) {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) { if (!list) { html += "<ul>"; list = true; } html += `<li>${m[1]}</li>`; }
    else { if (list) { html += "</ul>"; list = false; } if (line.trim()) html += `<p>${line}</p>`; }
  }
  if (list) html += "</ul>";
  return html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}
function chatDraw() {
  const log = $("chatLog");
  if (!log) return;
  const noAi = !chat.turns.length && !chat.busy;
  log.innerHTML = (chat.turns.length ? "" : `<div class="chat-msg bot"><p>Hi! I'm here to help with Job Finder and your job search. Ask me anything, or try one of these.</p></div>`)
    + chat.turns.map(t => `<div class="chat-msg ${t.role === "user" ? "me" : "bot"}${t.err ? " err" : ""}">${t.role === "user" ? `<p>${esc(t.text)}</p>` : chatHtml(t.text)}${t.via ? `<small>${esc(t.via)}</small>` : ""}${t.fix ? `<button class="linkish" type="button" data-chat="connect">Open Connect your AI</button>` : ""}</div>`).join("")
    + (chat.busy ? `<div class="chat-msg bot busy" aria-label="Thinking"><span></span><span></span><span></span></div>` : "");
  const chips = $("chatChips");
  if (chips) { const list = CHAT_CHIPS[currentView] || CHAT_CHIPS._; chips.hidden = !noAi && chat.turns.length > 0; chips.innerHTML = list.map(c => `<button type="button" class="chat-chip" data-chat-ask="${esc(c)}">${esc(c)}</button>`).join(""); }
  log.scrollTop = log.scrollHeight;
}
function chatWho() {
  const w = $("chatWho");
  if (!w) return;
  const e = aiCfg.engine;
  w.textContent = USER_ENGINES.has(e) && aiUsable(e) ? `Using ${AI_NAME(e)}${aiTier() === "small" ? " (short answers)" : ""}` : claudeSample ? "Using Claude" : "Using Chrome's AI, if it's ready";
}
async function chatSend(text) {
  text = String(text || "").trim();
  if (!text || chat.busy) return;
  chat.turns.push({ role: "user", text }); chat.busy = true; chat.ctl = new AbortController();
  $("chatIn").value = ""; $("chatSend").hidden = true; $("chatStop").hidden = false; chatDraw();
  try {
    const r = await chatAsk(chat.ctl.signal);
    chat.turns.push({ role: "assistant", text: r.text.trim(), via: r.via });
  } catch (e) {
    if (e.code === "cancelled") chat.turns.pop();   // stopped: forget the unanswered question so it can be asked again
    else if (e.code === "no_engine") chat.turns.push({ role: "assistant", text: "No AI is connected yet, so I can't answer. Choose one in Connect your AI (a free key takes a couple of minutes).", err: true, fix: true });
    else chat.turns.push({ role: "assistant", text: aiErrWords(e), err: true, fix: e.code === "bad_key" || e.code === "bad_request" });
  } finally { chat.busy = false; chat.ctl = null; $("chatSend").hidden = false; $("chatStop").hidden = true; chatDraw(); $("chatIn").focus(); }
}
function chatToggle(open) {
  chat.open = open == null ? !chat.open : open;
  const p = $("chatPanel"), f = $("chatFab");
  if (!p) return;
  p.hidden = !chat.open; f.setAttribute("aria-expanded", String(chat.open)); f.classList.toggle("on", chat.open);
  if (chat.open) { chatWho(); chatDraw(); $("chatIn").focus(); }
  else f.focus();
}
function chatInit() {
  if (document.getElementById("chatFab")) return;
  const fab = document.createElement("button");
  fab.id = "chatFab"; fab.type = "button"; fab.className = "chat-fab"; fab.setAttribute("aria-expanded", "false"); fab.setAttribute("aria-controls", "chatPanel");
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg><span>Ask AI</span>`;
  const panel = document.createElement("section");
  panel.id = "chatPanel"; panel.className = "chat-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ask AI for help");
  panel.innerHTML = `<header class="chat-head"><div><b>Ask AI</b><small id="chatWho"></small></div><button class="chat-x" type="button" data-chat="clear" title="Start a new chat">New chat</button><button class="chat-x" type="button" data-chat="close" aria-label="Close chat">✕</button></header>
    <div class="chat-log" id="chatLog" role="log" aria-live="polite"></div>
    <div class="chat-chips" id="chatChips"></div>
    <form class="chat-form" id="chatForm"><textarea id="chatIn" rows="2" maxlength="1500" placeholder="Ask about your resume, cover letter, interviews…" aria-label="Your question"></textarea><button class="btn primary" id="chatSend" type="submit">Send</button><button class="btn" id="chatStop" type="button" data-chat="stop" hidden>Stop</button></form>
    <p class="chat-note">It can be wrong, so check anything important. Your chat isn't saved.</p>`;
  document.body.append(fab, panel);
  fab.addEventListener("click", () => chatToggle());
  panel.addEventListener("click", e => {
    const b = e.target.closest("[data-chat],[data-chat-ask]");
    if (!b) return;
    if (b.dataset.chatAsk) { chatSend(b.dataset.chatAsk); return; }
    const a = b.dataset.chat;
    if (a === "close") chatToggle(false);
    else if (a === "clear") { if (chat.ctl) chat.ctl.abort(); chat.turns = []; chat.busy = false; chatDraw(); }
    else if (a === "stop" && chat.ctl) chat.ctl.abort();
    else if (a === "connect") { chatToggle(false); openView("connect"); }
  });
  $("chatForm").addEventListener("submit", e => { e.preventDefault(); chatSend($("chatIn").value); });
  $("chatIn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatSend($("chatIn").value); } });
  panel.addEventListener("keydown", e => { if (e.key === "Escape") chatToggle(false); });
  aiChangeListeners.add(() => { if (chat.open) chatWho(); });
}
onInit(chatInit);
