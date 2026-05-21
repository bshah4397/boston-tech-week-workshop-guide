import { FormEvent, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
  Sparkles,
  Stethoscope,
  TerminalSquare,
  Wrench,
} from "lucide-react";

type WorkshopStep = {
  id: string;
  title: string;
  time: string;
  outcome: string;
  prompt: string;
  expected: string;
  fallback: string;
};

type ReferenceItem = {
  method: string;
  participantAction: string;
  workshopUse: string;
};

const navigation = [
  { href: "#overview", label: "Home / Overview" },
  { href: "#live", label: "Live Workshop" },
  { href: "#setup", label: "Setup" },
  { href: "#prompts", label: "Prompt Library" },
  { href: "#postmessage", label: "PostMessage Reference" },
  { href: "#troubleshooting", label: "Troubleshooting" },
  { href: "#extensions", label: "Extensions" },
];

const workshopSteps: WorkshopStep[] = [
  {
    id: "setup",
    title: "Create Your Slot From Template",
    time: "5 min",
    outcome: "Your assigned app folder exists and no other slot was touched.",
    prompt:
      'Your assigned slot is {{APP_SLOT}}. Work only in the app-host repo. Copy {{TEMPLATE_FOLDER}} into {{APP_FOLDER}}. In {{APP_FOLDER}}/index.tsx, change the slot-types import from ../slot-types to ../../slot-types, set slotConfig.slotId to "{{APP_SLOT}}", set title to "Visit Prep Sidecar", and set description to "Workshop participant slot". Do not edit root routing, package files, Vercel config, {{TEMPLATE_FOLDER}}, or any other app folder.',
    expected:
      "The new slot folder has index.tsx and post-message.ts, and the exported slotConfig uses your assigned app number.",
    fallback:
      "If copying fails, ask a facilitator to create the folder, then continue with only the metadata edits in your assigned slot.",
  },
  {
    id: "bootstrap",
    title: "Run The Local Demo",
    time: "5 min",
    outcome: "The copied template is routable and visible on localhost.",
    prompt:
      "Only modify {{APP_FOLDER}}. Start the local app-host dev server on localhost, then verify the slot works at {{APP_BASE_PATH}}/demo and {{LOGOUT_PATH}}. Confirm the Athena registration URLs for this slot are {{LAUNCH_PATH}} for launch, {{CALLBACK_PATH}} for post-login redirect, and {{LOGOUT_PATH}} for post-logout redirect. If the app host dashboard does not list {{APP_SLOT}}, fix only import paths or slotConfig inside {{APP_FOLDER}}. Do not change shared slot discovery.",
    expected:
      "The host dashboard lists your slot, local demo mode renders, and the three Athena registration URLs are slot-specific.",
    fallback:
      "If you are stuck, open {{APP_BASE_PATH}}/demo directly. A facilitator can confirm whether the slot was copied correctly.",
  },
  {
    id: "smart",
    title: "Add SMART Patient Context",
    time: "8 min",
    outcome: "The app is ready to use real Athena launch context instead of only demo data.",
    prompt:
      "Only modify {{APP_FOLDER}}. Use the existing slot-scoped APIs: {{LAUNCH_PATH}}, {{CALLBACK_PATH}}, and {{PATIENT_CONTEXT_PATH}}. Preserve local demo mode. Add explicit states for setup required, launch in progress, callback received, patient loaded, and patient load failed. When patient context is available, render real patient name, DOB, FHIR ID, and gender in a patient banner. Do not render developer details, tokens, authorization codes, PKCE verifiers, cookies, or raw bearer headers.",
    expected:
      "The sidecar still works locally, and the real launch path has clear patient-context states without exposing sensitive OAuth material.",
    fallback:
      "If real SMART wiring is not ready in your environment, keep demo patient data but add the same states so the UI can be tested.",
  },
  {
    id: "clinical",
    title: "Build Neutral Visit Prep UI",
    time: "7 min",
    outcome: "The app feels like a clinical product, not a hello-world demo.",
    prompt:
      "Only modify {{APP_FOLDER}}. Turn the Patient Context screen into a Visit Prep Sidecar. Keep real patient name, DOB, and FHIR ID in a visually distinct patient banner when SMART context is available, and keep demo identity for local mode. Add two neutral mock prep cards: Vitals review due and Medication reconciliation. Do not add badges, resize behavior, or attention highlighting yet.",
    expected:
      "At 400px width, the sidecar shows patient identity and two neutral prep cards without generic demo buttons.",
    fallback:
      "Paste the fallback card data and render it below the patient header. The clinical content can be mock data.",
  },
  {
    id: "resize",
    title: "Add Resize And Collapse Details",
    time: "5 min",
    outcome: "The app can request more workspace only when the user needs detail.",
    prompt:
      "Only modify {{APP_FOLDER}}. Add an Open details action to the Vitals review due card. When clicked, send appResize version 1.0.0 with newWidth set to 600 and show a Review details panel with rationale and next steps. Add a Collapse details action in the detail panel that sends appResize version 1.0.0 with newWidth set to 400 and returns to the compact prep list.",
    expected:
      "The sidecar expands from compact prep view to a wider detail view, then collapses back to 400px from the detail panel.",
    fallback:
      "Fallback snippets: send appResize with newWidth set to 600 for Open details, and appResize with newWidth set to 400 for Collapse details.",
  },
  {
    id: "badge",
    title: "Add Automatic Badge Behavior",
    time: "5 min",
    outcome: "The sidecar can ask for attention when business logic says the gap matters.",
    prompt:
      "Only modify {{APP_FOLDER}}. Use or refine the local post-message helper for Embedded App Launcher messages. When the Vitals review due gap is present on load, send appShowBadgePersistent version 1.0.0 automatically instead of adding a manual Flag for review button. Visually mark the card with a small red status dot. When Mark reviewed is clicked in the detail view, send appClearBadge version 1.0.0, send appResize version 1.0.0 with newWidth set to 400, and show the card as Reviewed.",
    expected:
      "Opening the app with an active vitals gap shows an Athena badge automatically; marking reviewed clears the badge and returns to compact mode.",
    fallback:
      "Fallback snippets: appShowBadgePersistent on load, appClearBadge when reviewed, and appResize with newWidth set to 400 after review.",
  },
  {
    id: "context",
    title: "Listen For Patient Changes",
    time: "5 min",
    outcome: "The sidecar reacts when Athena changes patient context.",
    prompt:
      'Only modify {{APP_FOLDER}}. Add a window message listener for inbound Embedded App Framework context-change events. At the top of the listener, console.log every received message with a label like "[{{APP_SLOT}}] received window message" before filtering so DevTools can prove whether the app received anything. The real patient-change payload can look like { event: "patientContextChanged", updatedPatient: "5" }, so treat updatedPatient as a valid patient identifier in addition to patientId, patientID, patientIdentifier, fhirPatientId, or patient.id. When patient context changes, reset the active prep card, clear detail/review state, and reload {{PATIENT_CONTEXT_PATH}}?updatedPatient=<encoded patient identifier> if a patient identifier is available. Do not reload the plain {{PATIENT_CONTEXT_PATH}} for a patient-change event because it will reuse the original SMART launch patient.',
    expected:
      "Switching context in Athena reloads the sidecar to the new patient instead of showing stale prep state.",
    fallback:
      'If a live context-change event is not available, dispatch { event: "patientContextChanged", updatedPatient: "5" } from DevTools and confirm the app reloads with the updatedPatient query.',
  },
  {
    id: "reopen",
    title: "Reopen After Patient Change",
    time: "Extension",
    outcome: "The app returns at the right moment after the provider manually minimizes it.",
    prompt:
      "Only modify {{APP_FOLDER}}. Do not add a programmatic minimize button. In the live demo, the provider manually minimizes the sidecar using Athena chrome, then navigates to another patient. When the patientContextChanged listener reloads a new patient that still has an attention-needed prep gap, send appReopen version 1.0.0 so the sidecar returns with the new patient identity and compact prep state.",
    expected:
      "After the provider manually minimizes the app and changes patient, the app reopens only because the new patient has an attention-needed prep gap.",
    fallback:
      "Fallback snippet: after the updated patient context fetch succeeds, send appReopen version 1.0.0 and keep the UI in compact mode.",
  },
];

const postMessageItems: ReferenceItem[] = [
  {
    method: "appShowBadgePersistent",
    participantAction: "Automatic attention badge",
    workshopUse: "Fires on load when business logic finds an active care gap.",
  },
  {
    method: "appResize",
    participantAction: "Open or collapse details",
    workshopUse: "Moves between 400px compact mode and 600px detail mode.",
  },
  {
    method: "appClearBadge",
    participantAction: "Mark reviewed",
    workshopUse: "Resolves the notification state after the gap is handled.",
  },
  {
    method: "appReopen",
    participantAction: "New patient needs prep",
    workshopUse: "Returns the app after a provider manually minimizes it and changes patient.",
  },
  {
    method: "patientContextChanged",
    participantAction: "Switch patients in Athena",
    workshopUse: "Reloads patient identity when the event includes updatedPatient or another patient identifier.",
  },
];

const promptCards = [
  {
    title: "00 Create Slot From Template",
    summary: "Copy the template into the assigned app folder.",
    prompt: workshopSteps[0].prompt,
  },
  {
    title: "01 SMART Patient Context",
    summary: "Prepare the copied slot for real Athena SMART launch context.",
    prompt: workshopSteps[2].prompt,
  },
  {
    title: "02 Neutral Visit Prep UI",
    summary: "Turn the patient-context screen into the Visit Prep Sidecar.",
    prompt: workshopSteps[3].prompt,
  },
  {
    title: "03 Resize And Collapse",
    summary: "Use appResize for product-led detail expansion and collapse.",
    prompt: workshopSteps[4].prompt,
  },
  {
    title: "04 Automatic Badge",
    summary: "Use appShowBadgePersistent and appClearBadge from business logic.",
    prompt: workshopSteps[5].prompt,
  },
  {
    title: "05 Context Change Listener",
    summary: "React to inbound Athena patient context changes.",
    prompt: workshopSteps[6].prompt,
  },
  {
    title: "06 Reopen Behavior",
    summary: "Return the sidecar after the provider manually minimizes and changes patients.",
    prompt: workshopSteps[7].prompt,
  },
];

function normalizeAppSlot(value: string) {
  const match = value.trim().toLowerCase().match(/\d{1,4}/);
  if (!match) {
    return null;
  }

  return `app-${match[0].padStart(3, "0")}`;
}

type PromptContext = {
  appBasePath: string;
  appFolder: string;
  appSlot: string;
  callbackPath: string;
  launchPath: string;
  logoutPath: string;
  patientContextPath: string;
  templateFolder: string;
};

function personalizePrompt(prompt: string, context: PromptContext) {
  return prompt
    .split("{{APP_FOLDER}}")
    .join(context.appFolder)
    .split("{{APP_SLOT}}")
    .join(context.appSlot)
    .split("{{APP_BASE_PATH}}")
    .join(context.appBasePath)
    .split("{{LAUNCH_PATH}}")
    .join(context.launchPath)
    .split("{{CALLBACK_PATH}}")
    .join(context.callbackPath)
    .split("{{LOGOUT_PATH}}")
    .join(context.logoutPath)
    .split("{{PATIENT_CONTEXT_PATH}}")
    .join(context.patientContextPath)
    .split("{{TEMPLATE_FOLDER}}")
    .join(context.templateFolder);
}

function addStepCommitInstruction(prompt: string, context: PromptContext) {
  return `${prompt}\n\nWhen finished, commit any tracked changes with a message like "${context.appSlot}: short message".`;
}

function copyLabel(copiedId: string | null, id: string) {
  return copiedId === id ? "Copied" : "Copy prompt";
}

export function App() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [slotDraft, setSlotDraft] = useState("007");
  const [assignedSlot, setAssignedSlot] = useState("app-007");
  const [slotError, setSlotError] = useState<string | null>(null);
  const promptContext = useMemo(
    () => ({
      appBasePath: `/${assignedSlot}`,
      appFolder: `src/apps/${assignedSlot}`,
      appSlot: assignedSlot,
      callbackPath: `/api/apps/${assignedSlot}/smart/callback`,
      launchPath: `/api/apps/${assignedSlot}/smart/launch`,
      logoutPath: `/${assignedSlot}/logout-complete`,
      patientContextPath: `/api/apps/${assignedSlot}/patient-context`,
      templateFolder: "src/app-template",
    }),
    [assignedSlot],
  );
  const appFolder = promptContext.appFolder;
  const personalizedSteps = useMemo(
    () =>
      workshopSteps.map((step) => ({
        ...step,
        expected: personalizePrompt(step.expected, promptContext),
        fallback: personalizePrompt(step.fallback, promptContext),
        outcome: personalizePrompt(step.outcome, promptContext),
        prompt: addStepCommitInstruction(personalizePrompt(step.prompt, promptContext), promptContext),
      })),
    [promptContext],
  );
  const personalizedPromptCards = useMemo(
    () =>
      promptCards.map((card) => ({
        ...card,
        prompt: addStepCommitInstruction(personalizePrompt(card.prompt, promptContext), promptContext),
      })),
    [promptContext],
  );

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
  }

  function handleSlotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSlot = normalizeAppSlot(slotDraft);

    if (!nextSlot) {
      setSlotError("Enter a number like 007, 101, or app-101.");
      return;
    }

    setAssignedSlot(nextSlot);
    setSlotDraft(nextSlot);
    setSlotError(null);
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <nav className="top-nav" aria-label="Workshop sections">
          <a className="brand" href="#overview" aria-label="Boston Tech Week workshop overview">
            <Stethoscope aria-hidden="true" size={21} />
            <span>Embedded Apps Workshop</span>
          </a>
          <div className="nav-links">
            {navigation.slice(1).map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <section id="overview" className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Boston Tech Week / athenahealth</p>
            <h1 id="hero-title">Build a Visit Prep Sidecar</h1>
            <p className="hero-text">
              A guided workshop for building an embedded SMART on FHIR sidecar app that launches in
              Athena, reads real patient identity, and uses postMessage to participate in the
              provider workspace.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#live">
                Start guided build
                <ExternalLink aria-hidden="true" size={17} />
              </a>
              <a className="secondary-action" href="#setup">
                Review setup
              </a>
            </div>
          </div>
          <SidecarPreview />
        </section>
      </header>

      <main>
        <section id="live" className="page-section live-section" aria-labelledby="live-heading">
          <div className="section-kicker">Live workshop console</div>
          <div className="section-heading-row">
            <div>
              <h2 id="live-heading">Live Workshop Path</h2>
              <p>
                Follow these steps in order during the event. The 45-minute core gets the complete
                app behavior working; the 75-minute extension adds debugging and customization.
              </p>
            </div>
            <div className="timeline-badges" aria-label="Workshop timing">
              <span>45-minute core</span>
              <span>75-minute extension</span>
            </div>
          </div>

          <form className="slot-control" onSubmit={handleSlotSubmit}>
            <div>
              <label htmlFor="assigned-slot">Assigned app number</label>
              <p>Enter your workshop slot once. Every prompt below will use that app folder.</p>
            </div>
            <div className="slot-entry">
              <span aria-hidden="true">app-</span>
              <input
                id="assigned-slot"
                inputMode="numeric"
                onChange={(event) => {
                  setSlotDraft(event.target.value);
                  setSlotError(null);
                }}
                placeholder="007"
                value={slotDraft.replace(/^app-/i, "")}
              />
              <button type="submit">Apply to prompts</button>
            </div>
            <div className="slot-status" aria-live="polite">
              {slotError ?? `Using ${appFolder}`}
            </div>
          </form>

          <div className="workshop-layout">
            <aside className="progress-panel" aria-label="Build progress">
              {personalizedSteps.map((step, index) => (
                <a key={step.id} href={`#step-${step.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step.title}
                </a>
              ))}
            </aside>

            <div className="step-list">
              {personalizedSteps.map((step, index) => (
                <article id={`step-${step.id}`} key={step.id} className="step-card">
                  <div className="step-meta">
                    <span>Step {index + 1}</span>
                    <span>
                      <Clock3 aria-hidden="true" size={14} />
                      {step.time}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p className="step-outcome">{step.outcome}</p>
                  <div className="prompt-block">
                    <div className="prompt-heading">
                      <TerminalSquare aria-hidden="true" size={17} />
                      Prompt
                    </div>
                    <p>{step.prompt}</p>
                    <button type="button" onClick={() => handleCopy(step.id, step.prompt)}>
                      {copiedId === step.id ? (
                        <Check aria-hidden="true" size={16} />
                      ) : (
                        <Clipboard aria-hidden="true" size={16} />
                      )}
                      {copyLabel(copiedId, step.id)}
                    </button>
                  </div>
                  <div className="step-support">
                    <div>
                      <h4>Expected result</h4>
                      <p>{step.expected}</p>
                    </div>
                    <div>
                      <h4>Fallback snippet</h4>
                      <p>{step.fallback}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="setup" className="page-section" aria-labelledby="setup-heading">
          <div className="section-kicker">Before the room starts</div>
          <h2 id="setup-heading">Setup</h2>
          <div className="setup-grid">
            <Checklist
              title="Participant prerequisites"
              items={[
                "Git account or access to the workshop app-host repository.",
                "Node installed locally so npm install, npm test, and npm run dev work.",
                "LLM tool ready: Codex, Claude Code, Cursor, Windsurf, or equivalent.",
              ]}
            />
            <Checklist
              title="Assigned slot"
              items={[
                "Use app-001 through app-099 for workshop attendees.",
                "Use app-101 and above for internal dry runs.",
                "Keep src/app-template as the source app, not a launchable slot.",
              ]}
            />
            <Checklist
              title="Athena and repo readiness"
              items={[
                "Clone the app-host repo before the workshop.",
                "Pull latest main before creating the assigned app folder.",
                "Confirm preview access and practice entitlement.",
                "Confirm the slot client ID is listed in api/_lib/workshop-config.ts.",
                "Confirm launch, callback, and logout URLs use the assigned app number.",
                "Confirm postMessage origin uses the shared Vercel domain.",
              ]}
            />
          </div>
        </section>

        <section id="prompts" className="page-section contrast-section" aria-labelledby="prompts-heading">
          <div className="section-kicker">Copy-ready material</div>
          <h2 id="prompts-heading">Prompt Library</h2>
          <div className="prompt-grid">
            {personalizedPromptCards.map((card, index) => {
              const id = `library-${index}`;
              return (
                <article className="prompt-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.summary}</p>
                  <pre>{card.prompt}</pre>
                  <button type="button" onClick={() => handleCopy(id, card.prompt)}>
                    {copiedId === id ? <Check aria-hidden="true" size={16} /> : <Clipboard aria-hidden="true" size={16} />}
                    {copyLabel(copiedId, id)}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section id="postmessage" className="page-section" aria-labelledby="postmessage-heading">
          <div className="section-kicker">Framework behavior</div>
          <h2 id="postmessage-heading">PostMessage Reference</h2>
          <div className="reference-table" role="table" aria-label="PostMessage workshop mapping">
            <div className="reference-row reference-head" role="row">
              <div role="columnheader">Method</div>
              <div role="columnheader">Product action</div>
              <div role="columnheader">Workshop use</div>
            </div>
            {postMessageItems.map((item) => (
              <div className="reference-row" role="row" key={item.method}>
                <div role="cell">
                  <code>{item.method}</code>
                </div>
                <div role="cell">{item.participantAction}</div>
                <div role="cell">{item.workshopUse}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="troubleshooting" className="page-section contrast-section" aria-labelledby="troubleshooting-heading">
          <div className="section-kicker">Recovery paths</div>
          <h2 id="troubleshooting-heading">Troubleshooting</h2>
          <div className="trouble-grid">
            <Trouble title="SMART launch fails" text="Check the /api/apps/app-XXX/smart/launch URL, api/_lib/workshop-config.ts client ID entry, callback URL, and preview practice entitlement before changing code." />
            <Trouble title="PostMessage does nothing" text="Check message shape, methodVersion, accepted origin, and whether the app is actually embedded in Athena." />
            <Trouble title="Deployment breaks" text="Use the internal test slot first. If main is unstable, switch participants to prebuilt catch-up slots." />
            <Trouble title="Participant falls behind" text="Use the fallback snippet for the current step, then continue with the next guided prompt." />
          </div>
        </section>

        <section id="extensions" className="page-section" aria-labelledby="extensions-heading">
          <div className="section-kicker">If there is more time</div>
          <h2 id="extensions-heading">Extensions</h2>
          <div className="extension-grid">
            <Extension
              icon={<FileText aria-hidden="true" />}
              title="Event Debug Panel"
              text="Listen for patientContextChanged and appStateChanged, then show a compact developer event log."
            />
            <Extension
              icon={<Wrench aria-hidden="true" />}
              title="Workspace Modes"
              text="Add fullscreen, popout, and popin as optional ways for the app to adapt to user focus."
            />
            <Extension
              icon={<Sparkles aria-hidden="true" />}
              title="Product Customization"
              text="Rename the prep cards and actions to match each participant's company or product concept."
            />
            <Extension
              icon={<GitBranch aria-hidden="true" />}
              title="Internal Dry Run"
              text="Create app-101, app-102, and app-103 from the template to validate direct-to-main pushes before the workshop."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function SidecarPreview() {
  return (
    <div className="preview-frame" aria-label="Visit Prep Sidecar preview">
      <div className="ehr-preview" aria-label="EHR chart workspace">
        <div className="ehr-topbar">
          <strong>athenaOne</strong>
          <span className="ehr-nav-skeleton" aria-hidden="true" />
          <span className="ehr-nav-skeleton short" aria-hidden="true" />
          <span className="ehr-nav-skeleton" aria-hidden="true" />
        </div>
        <div className="ehr-patient-banner" aria-hidden="true">
          <div className="ehr-skeleton-stack">
            <span className="ehr-skeleton eyebrow-line" />
            <span className="ehr-skeleton title-line" />
            <span className="ehr-skeleton meta-line" />
          </div>
        </div>
        <div className="ehr-tabs" aria-hidden="true">
          <span className="ehr-tab-skeleton active" />
          <span className="ehr-tab-skeleton" />
          <span className="ehr-tab-skeleton short" />
          <span className="ehr-tab-skeleton" />
        </div>
        <div className="ehr-workspace" aria-hidden="true">
          <aside className="ehr-sidebar">
            <span className="ehr-skeleton sidebar-title" />
            <span className="ehr-skeleton sidebar-line" />
            <span className="ehr-skeleton sidebar-line" />
            <span className="ehr-skeleton sidebar-line short" />
          </aside>
          <section className="ehr-note">
            <div className="ehr-note-header">
              <span className="ehr-skeleton note-title" />
              <span className="ehr-skeleton note-date" />
            </div>
            <div className="ehr-note-grid">
              <div>
                <span className="ehr-skeleton block-label" />
                <span className="ehr-skeleton body-line long" />
                <span className="ehr-skeleton body-line" />
              </div>
              <div>
                <span className="ehr-skeleton block-label" />
                <span className="ehr-skeleton body-line medium" />
              </div>
              <div>
                <span className="ehr-skeleton block-label" />
                <span className="ehr-skeleton body-line long" />
                <span className="ehr-skeleton body-line short" />
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="preview-sidecar" aria-label="Embedded sidecar app">
        <div className="sidecar-header">
          <div>
            <span className="sidecar-app-label">APP-101</span>
            <strong className="sidecar-app-title">Visit Prep</strong>
          </div>
          <span className="smart-chip">Patient Loaded</span>
        </div>
        <div className="preview-patient-banner">
          <span className="preview-avatar" aria-hidden="true">AR</span>
          <div>
            <strong className="sidecar-patient-name">Alex Rivers</strong>
            <span>DOB 04/12/1975 · FHIR ID 12345</span>
          </div>
        </div>
        <div className="gap-card active">
          <div className="gap-card-head">
            <span>Active care gap</span>
            <span className="preview-status-dot" aria-hidden="true" />
          </div>
          <strong>Vitals review due</strong>
          <span>Last BP is elevated. Review before closing.</span>
          <span className="mini-action">Open details</span>
        </div>
        <div className="gap-card">
          <strong>Medication reconciliation</strong>
          <span>Confirm adherence and discontinued medications.</span>
        </div>
      </div>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="checklist">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check aria-hidden="true" size={16} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Trouble({ title, text }: { title: string; text: string }) {
  return (
    <article className="trouble-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Extension({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="extension-card">
      <div className="icon-tile">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
