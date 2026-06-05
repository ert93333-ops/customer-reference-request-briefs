const ANALYTICS_KEY = "customerreferencerequestbriefs_analytics_events";
const INTENTS_KEY = "customerreferencerequestbriefs_purchase_intents";
const ISSUE_BASE = "https://github.com/ert93333-ops/customer-reference-request-briefs/issues/new";

const fields = {
  notes: document.querySelector("#reference-notes"),
  deal: document.querySelector("#deal-notes"),
  buyer: document.querySelector("#buyer-notes"),
  advocate: document.querySelector("#advocate-notes"),
  consent: document.querySelector("#consent-notes"),
  fatigue: document.querySelector("#fatigue-notes"),
  ask: document.querySelector("#ask-notes"),
  confidentiality: document.querySelector("#confidentiality-notes"),
  owner: document.querySelector("#owner-notes"),
  draft: document.querySelector("#ask-draft"),
  tone: document.querySelector("#tone-notes"),
};

const outputPanel = document.querySelector("#output-panel");
const briefOutput = document.querySelector("#brief-output");
const outputStatus = document.querySelector("#output-status");
const workflowError = document.querySelector("#workflow-error");
const copyButton = document.querySelector("#copy-brief");
const copyStatus = document.querySelector("#copy-status");
const sampleButton = document.querySelector("#sample-button");
const generateButton = document.querySelector("#generate-button");
const intentForm = document.querySelector("#intent-form");
const remoteIntent = document.querySelector("#remote-intent");
const remoteIntentLink = document.querySelector("#remote-intent-link");
const copyRemoteIntent = document.querySelector("#copy-remote-intent");
const remoteCopyStatus = document.querySelector("#remote-copy-status");
const intentStatus = document.querySelector("#intent-status");
let selectedPlan = "Starter";
let latestBriefText = "";
let latestRemoteText = "";

function track(event, detail = {}) {
  const params = new URLSearchParams(window.location.search);
  const payload = {
    event,
    detail,
    attribution: {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    },
    page: window.location.pathname,
    referrer: document.referrer || "",
    experiment_id: "customer-reference-request-briefs-v0",
    variant: "static-browser-local",
    timestamp: new Date().toISOString(),
  };
  const events = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "[]");
  events.push(payload);
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(-200)));
}

function includesAny(text, terms) {
  return terms.some((term) => term.test(text));
}

function valueOf(field) {
  return field ? field.value.trim() : "";
}

function collectInput() {
  const input = {
    notes: valueOf(fields.notes),
    deal: valueOf(fields.deal),
    buyer: valueOf(fields.buyer),
    advocate: valueOf(fields.advocate),
    consent: valueOf(fields.consent),
    fatigue: valueOf(fields.fatigue),
    ask: valueOf(fields.ask),
    confidentiality: valueOf(fields.confidentiality),
    owner: valueOf(fields.owner),
    draft: valueOf(fields.draft),
    tone: valueOf(fields.tone),
  };
  input.all = Object.values(input).join("\n").toLowerCase();
  return input;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function addFinding(findings, title, message) {
  findings.push({ title, message });
}

function analyze(input) {
  const all = input.all;
  const findings = [];
  if (!includesAny(all, [/deal context|deal stage|late-stage|procurement|proof|reference purpose|sales cycle|evaluation|pilot|security review|buyer needs/i])) {
    addFinding(findings, "missing deal context, stage, or reference purpose:", "Explain why this reference is being requested and what decision it supports.");
  }
  if (!includesAny(all, [/buyer persona|\bpersona\b|industry|use case|similar customer|match rationale|workflow match|company size|segment fit|\brole\b|vp|director|ops|finance|healthcare|analytics/i])) {
    addFinding(findings, "missing buyer persona, industry, use case, or match rationale:", "Show why this advocate is relevant to the prospect's situation.");
  }
  if (!includesAny(all, [/advocate fit|relationship health|health green|happy|promoter|champion|admin champion|successful|reference fit|good fit|healthy account|customer fit/i])) {
    addFinding(findings, "missing customer advocate fit and relationship health:", "Check whether the customer is a strong, healthy, relevant advocate.");
  }
  if (!includesAny(all, [/consent|permission|approved|opted in|approval|ok to ask|allowed|comfortable|agreed|reference program|marketing approval|csm approval/i])) {
    addFinding(findings, "missing explicit consent, permission, or approval status:", "Do not contact an advocate until consent or an approval path is clear.");
  }
  if (!includesAny(all, [/fatigue|recent ask|last reference|cool-down|cooldown|one ask per|rotation|availability|not overused|quarter|45 days|30 days/i])) {
    addFinding(findings, "missing reference fatigue, recent asks, or cool-down period:", "Protect advocates from repeated last-minute asks.");
  }
  if (!includesAny(all, [/20-minute|15-minute|30-minute|time-box|time boxed|time commitment|call next week|commitment|no prep|required prep|optional|decline|calendar/i])) {
    addFinding(findings, "missing time-boxed ask and expected commitment:", "Make the request easy to accept or decline by naming the time commitment.");
  }
  if (!includesAny(all, [/confidential|confidentiality|logo|quote|name use|public quote|disclosure|summary approval|approve summary|no logo|no public|permission boundary/i])) {
    addFinding(findings, "missing confidentiality boundary, logo/name/quote permission, or disclosure notes:", "Clarify what can be shared and what requires customer approval.");
  }
  if (!includesAny(all, [/owner|reviewer|customer marketing|advocacy|csm|account executive|ae|follow-up|follow up|next step|status update|owns|review/i])) {
    addFinding(findings, "missing owner, next step, reviewer, or follow-up path:", "Name who asks, who reviews, and who gets status updates.");
  }
  if (!includesAny(all, [/would you be open|are you open|comfortable|no pressure|if timing|if not|decline|optional|thank you|appreciate|ask draft|customer-facing ask/i])) {
    addFinding(findings, "missing safe customer-facing ask wording:", "Use respectful, optional language instead of a rushed internal command.");
  }
  if (includesAny(all, [/you owe us|must do|need you today|last chance|guarantee|guaranteed|will close|will win|entitled|pressure|gift card|cash reward|paid review|fake testimonial|overclaim/i])) {
    addFinding(findings, "pressure, entitlement, overclaim, or incentive ambiguity risk:", "Remove pressure, transactional ambiguity, fake proof, and unsupported sales claims.");
  }
  if (includesAny(all, [/full name|personal email|phone number|crm export|salesforce export|hubspot export|customer list|reference list|contract detail|contract terms|msa|order form|private customer data|account id|password|credential|api key|token|secret|pii/i])) {
    addFinding(findings, "private customer data, personal email, CRM export, customer list, contract detail, credential, or PII risk:", "Do not paste private contacts, customer lists, CRM exports, contract details, credentials, or identifiers into public tools.");
  }
  return findings;
}

function section(title, items) {
  if (!items.length) return "";
  return `<section class="brief-section"><h4>${title}</h4><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`;
}

function generateBrief() {
  const input = collectInput();
  const hasInput = ["notes", "deal", "buyer", "advocate", "consent", "fatigue", "ask", "confidentiality", "owner", "draft", "tone"].some((key) => input[key]);
  if (!hasInput) {
    workflowError.textContent = "Paste customer reference request notes before generating a brief.";
    track("brief_generation_failed", { reason: "empty_input" });
    return;
  }
  workflowError.textContent = "";
  track("core_action_started", { action: "generate_customer_reference_request_brief" });
  const findings = analyze(input);
  const summary = [
    input.deal ? `<strong>Deal context:</strong> ${escapeHtml(input.deal)}` : "",
    input.buyer ? `<strong>Buyer match:</strong> ${escapeHtml(input.buyer)}` : "",
    input.advocate ? `<strong>Advocate fit:</strong> ${escapeHtml(input.advocate)}` : "",
    input.consent ? `<strong>Consent status:</strong> ${escapeHtml(input.consent)}` : "",
    input.fatigue ? `<strong>Fatigue guardrail:</strong> ${escapeHtml(input.fatigue)}` : "",
    input.ask ? `<strong>Time ask:</strong> ${escapeHtml(input.ask)}` : "",
    input.confidentiality ? `<strong>Confidentiality:</strong> ${escapeHtml(input.confidentiality)}` : "",
    input.owner ? `<strong>Owner/reviewer:</strong> ${escapeHtml(input.owner)}` : "",
    input.draft ? `<strong>Ask draft:</strong> ${escapeHtml(input.draft)}` : "",
  ].filter(Boolean);
  const grouped = findings.length
    ? findings.map((finding) => `<strong>${finding.title}</strong> ${finding.message}`)
    : ["No blocking customer reference request gaps detected in the public-safe notes."];
  const askOutline = [
    "Explain why the request is relevant to this deal or proof need.",
    "Confirm the advocate is a fit and has consent or an approval path.",
    "Make the time commitment specific and easy to decline.",
    "State confidentiality, quote, logo, and summary approval boundaries.",
  ];
  const handoff = [
    "Assign customer marketing, advocacy, CSM, AE, or founder owner.",
    "Record who reviews the ask before it reaches the customer.",
    "Keep CRM exports, customer lists, private contacts, contract details, and credentials out of public tools.",
    "Measure accepted requests, declined requests, fatigue objections, and influenced deals before scaling.",
  ];
  const reminders = [
    "This tool does not connect to CRM, advocacy platforms, customer lists, email, or customer data stores.",
    "Avoid pressure, entitlement, fake proof, paid-review ambiguity, and unsupported sales claims.",
  ];
  briefOutput.innerHTML = [
    "<div class=\"brief-summary\"><h3>Customer reference request brief ready</h3><p>Use this before sales, customer marketing, advocacy, or CS asks a customer for proof.</p></div>",
    section("Parse summary", summary),
    section("Missing context and risk warnings", grouped),
    section("Consent-safe ask outline", askOutline),
    section("Owner handoff", handoff),
    section("Safety reminders", reminders),
  ].join("");
  latestBriefText = [
    "Customer reference request brief",
    "",
    "Warnings:",
    ...findings.map((finding) => `- ${finding.title} ${finding.message}`),
    "",
    "Consent-safe ask outline:",
    ...askOutline.map((item) => `- ${item}`),
  ].join("\n");
  outputPanel.classList.add("has-brief", findings.length ? "status-warning" : "status-good");
  outputPanel.classList.remove(findings.length ? "status-good" : "status-warning");
  outputStatus.textContent = findings.length ? `${findings.length} warning checks ready` : "Reference brief ready";
  copyButton.disabled = false;
  track("brief_generated", { warnings: findings.length });
  track("core_action_completed", { warnings: findings.length });
}

function loadSample() {
  fields.notes.value = "Enterprise prospect wants to speak with a similar analytics customer before procurement review.";
  fields.deal.value = "Deal context: late-stage enterprise evaluation needs proof before procurement review.";
  fields.buyer.value = "Buyer persona/use-case match: VP Ops in healthcare analytics, same reporting workflow and rollout size.";
  fields.advocate.value = "Advocate fit: happy admin champion, relationship health green, similar customer fit.";
  fields.consent.value = "Consent status: customer opted into reference program; customer marketing approval required before outreach.";
  fields.fatigue.value = "Fatigue guardrail: last reference call was 45 days ago; no more than one ask per quarter.";
  fields.ask.value = "Time-boxed ask: 20-minute call next week, no prep required, optional decline if timing is not good.";
  fields.confidentiality.value = "Confidentiality: no logo use, no public quote, and customer can approve any summary.";
  fields.owner.value = "Customer marketing owns ask; CSM reviews; AE gets status update only.";
  fields.draft.value = "Would you be open to a 20-minute reference call next week? No pressure if timing is not good.";
  fields.tone.value = "Respectful, optional, no pressure, no private emails, no CRM export, no contract details.";
  track("sample_loaded");
}

async function copyText(text, statusElement, successText) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  statusElement.textContent = successText;
}

function submitIntent(event) {
  event.preventDefault();
  const email = document.querySelector("#intent-email").value.trim();
  const role = document.querySelector("#intent-role").value.trim();
  const volume = document.querySelector("#reference-volume").value.trim();
  const process = document.querySelector("#current-process").value.trim();
  const plan = document.querySelector("#plan-interest").value;
  const willingness = document.querySelector("#willingness").value.trim();
  const intents = JSON.parse(localStorage.getItem(INTENTS_KEY) || "[]");
  intents.push({ role, volume, process, plan, willingness, selectedPlan, emailProvided: Boolean(email), timestamp: new Date().toISOString() });
  localStorage.setItem(INTENTS_KEY, JSON.stringify(intents.slice(-100)));
  latestRemoteText = [
    "Customer Reference Request Briefs early access request",
    "",
    `Role/team: ${role || "not provided"}`,
    `Reference volume: ${volume || "not provided"}`,
    `Current reference process: ${process || "not provided"}`,
    `Plan interest: ${plan}`,
    `Willingness to pay: ${willingness || "not provided"}`,
    "",
    "Email intentionally excluded from this public issue body.",
  ].join("\n");
  const params = new URLSearchParams({
    template: "demo_request.md",
    labels: "early-access,purchase-intent,demo-request",
    title: "Early access request: Customer Reference Request Briefs",
    body: latestRemoteText,
  });
  remoteIntentLink.href = `${ISSUE_BASE}?${params.toString()}`;
  remoteIntent.hidden = false;
  intentStatus.textContent = "You are on the early access list. Use the public request if you want a remote handoff.";
  track("purchase_intent_submitted", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("waitlist_submitted", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("signup_completed", { plan, selectedPlan, emailProvided: Boolean(email) });
  track("remote_intent_ready", { hasRole: Boolean(role), hasVolume: Boolean(volume) });
}

document.querySelectorAll("a[href='#workflow']").forEach((link) => link.addEventListener("click", () => track("cta_clicked", { triggerSource: "workflow_link" })));
document.querySelectorAll(".plan-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPlan = button.dataset.plan || "Starter";
    document.querySelector("#plan-interest").value = selectedPlan;
    document.querySelector("#intent-email").focus();
    track("plan_selected", { plan: selectedPlan });
    track("pricing_viewed", { plan: selectedPlan });
    track("signup_started", { plan: selectedPlan });
  });
});
sampleButton?.addEventListener("click", loadSample);
generateButton?.addEventListener("click", generateBrief);
copyButton?.addEventListener("click", async () => {
  await copyText(latestBriefText, copyStatus, "Copied reference brief");
  track("copy_brief_clicked");
});
intentForm?.addEventListener("submit", submitIntent);
copyRemoteIntent?.addEventListener("click", async () => {
  await copyText(latestRemoteText, remoteCopyStatus, "Copied request details");
  track("remote_intent_copied");
});
if (window.location.pathname.endsWith("customer-reference-request-template.html")) {
  track("template_opened");
  track("seo_page_viewed", { page: "customer_reference_request_template" });
}
if (window.location.pathname === "/" || window.location.pathname.endsWith("/") || window.location.pathname.endsWith("/index.html")) {
  track("landing_viewed");
}
track("page_view");
