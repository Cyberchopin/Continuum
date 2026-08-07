"use client";

import { useMemo, useState } from "react";

type Memory = {
  id: string;
  title: string;
  detail: string;
  source: string;
  age: string;
  confidence: number;
  status: "admissible" | "disputed" | "revoked";
  tone: "lime" | "orange" | "mint" | "gray";
};

const initialMemories: Memory[] = [
  {
    id: "M-1042",
    title: "Payments v3 passed canary",
    detail: "Error rate held below 0.2% for 42 minutes in us-east-1.",
    source: "deploy-bot / canary receipt",
    age: "18 min ago",
    confidence: 96,
    status: "admissible",
    tone: "lime",
  },
  {
    id: "M-1038",
    title: "Rollback owner is on-call",
    detail: "Maya Chen acknowledged rollback duty until 18:00 UTC.",
    source: "pager policy / signed ack",
    age: "31 min ago",
    confidence: 92,
    status: "admissible",
    tone: "mint",
  },
  {
    id: "M-0991",
    title: "Friday deploy freeze",
    detail: "A remembered policy says production changes pause after 16:00 UTC.",
    source: "ops chat / human statement",
    age: "19 days ago",
    confidence: 64,
    status: "admissible",
    tone: "orange",
  },
  {
    id: "M-1033",
    title: "Database headroom is healthy",
    detail: "Peak CPU 42%; connection pool saturation 51%.",
    source: "telemetry / signed snapshot",
    age: "44 min ago",
    confidence: 98,
    status: "admissible",
    tone: "lime",
  },
];

export default function Home() {
  const [memories, setMemories] = useState(initialMemories);
  const [selected, setSelected] = useState("M-0991");
  const [trialRun, setTrialRun] = useState(false);
  const [regionLoss, setRegionLoss] = useState(false);
  const [tab, setTab] = useState<"decision" | "audit">("decision");
  const [enforcementMode, setEnforcementMode] = useState<"shadow" | "enforce">("shadow");

  const activeMemory = memories.find((memory) => memory.id === selected) ?? memories[0];
  const disputed = memories.some((memory) => memory.status === "disputed");
  const admissible = memories.filter((memory) => memory.status === "admissible").length;
  const decisionConfidence = disputed ? 58 : 87;

  const verdict = useMemo(() => {
    if (!trialRun) return "Awaiting examination";
    if (disputed && enforcementMode === "shadow") return "WOULD BLOCK — SHADOW MODE";
    if (disputed) return "HOLD — HUMAN REVIEW";
    return "DEPLOY WITH ROLLBACK GUARD";
  }, [trialRun, disputed, enforcementMode]);

  function injectContradiction() {
    setTrialRun(true);
    setSelected("M-0991");
    setMemories((current) =>
      current.map((memory) =>
        memory.id === "M-0991"
          ? {
              ...memory,
              status: "disputed",
              detail: "Conflict found: current release calendar explicitly allows the 16:30 UTC canary.",
              confidence: 31,
            }
          : memory,
      ),
    );
  }

  function updateSelected(status: Memory["status"]) {
    setTrialRun(true);
    setMemories((current) =>
      current.map((memory) =>
        memory.id === selected ? { ...memory, status, confidence: status === "revoked" ? 0 : 31 } : memory,
      ),
    );
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Continuum home">
          <span className="brand-mark">C</span>
          <span>CONTINUUM</span>
        </a>
        <div className="system-state"><span className="pulse" /> MEMORY PLANE ONLINE</div>
        <div className="header-meta">CASE 02 / DEPLOYMENT</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AGENT MEMORY, UNDER OATH</p>
          <h1>Memory is evidence.<br /><em>Not truth.</em></h1>
          <p className="lede">
            The memory firewall between AI agents and irreversible actions. Adopt it in
            shadow mode, enforce it at the action boundary, and make every recall defensible.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => setTrialRun(true)}>RUN THE MEMORY TRIAL <span>↗</span></button>
            <button className="button ghost" onClick={injectContradiction}>INJECT A CONTRADICTION</button>
          </div>
          <div className="hero-proof">
            <span>COCKROACHDB</span><i /> <span>AWS LAMBDA</span><i /> <span>SHADOW MODE READY</span>
          </div>
        </div>
        <div className="orbit-stage" aria-label={`${admissible} admissible memories`}>
          <div className="orbit orbit-one"><span>M-1042</span></div>
          <div className="orbit orbit-two"><span>M-0991</span></div>
          <div className="orbit orbit-three"><span>M-1033</span></div>
          <div className="core">
            <strong>{admissible}</strong>
            <span>ADMISSIBLE<br />MEMORIES</span>
          </div>
          <span className="axis axis-x">PROVENANCE →</span>
          <span className="axis axis-y">VALIDITY →</span>
        </div>
      </section>

      <section className="caseboard" id="trial">
        <div className="case-heading">
          <div><p className="eyebrow light">LIVE CASE / 02</p><h2>Should the agent deploy<br />payments-v3?</h2></div>
          <div className="case-status"><span className={trialRun ? "status-dot active" : "status-dot"} /> {trialRun ? "EXAMINATION COMPLETE" : "READY TO EXAMINE"}</div>
        </div>

        <div className="trial-grid">
          <div className="memory-stack">
            <div className="section-label"><span>01</span> MEMORIES OFFERED AS EVIDENCE</div>
            {memories.map((memory) => (
              <button
                key={memory.id}
                onClick={() => setSelected(memory.id)}
                className={`memory-card ${memory.tone} ${memory.status} ${selected === memory.id ? "selected" : ""}`}
              >
                <div className="memory-top"><span>{memory.id}</span><span className={`badge ${memory.status}`}>{memory.status}</span></div>
                <h3>{memory.title}</h3>
                <p>{memory.detail}</p>
                <div className="memory-foot"><span>{memory.source}</span><strong>{memory.confidence}%</strong></div>
              </button>
            ))}
          </div>

          <div className="verdict-panel">
            <div className="tabs">
              <button className={tab === "decision" ? "active" : ""} onClick={() => setTab("decision")}>DECISION</button>
              <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>AUDIT LOG</button>
            </div>
            {tab === "decision" ? (
              <>
                <div className="mode-switch" aria-label="Enforcement mode">
                  <span>ENFORCEMENT</span>
                  <button className={enforcementMode === "shadow" ? "active" : ""} onClick={() => setEnforcementMode("shadow")}>SHADOW</button>
                  <button className={enforcementMode === "enforce" ? "active" : ""} onClick={() => setEnforcementMode("enforce")}>ENFORCE</button>
                </div>
                <div className="verdict-kicker">AGENT VERDICT</div>
                <div className={`verdict ${disputed ? "hold" : ""}`}>{verdict}</div>
                <div className="confidence-row"><span>Answer confidence</span><strong>{trialRun ? decisionConfidence : "—"}{trialRun ? "%" : ""}</strong></div>
                <div className="meter"><span style={{ width: `${trialRun ? decisionConfidence : 0}%` }} /></div>
                <div className="reasoning">
                  <p><span>✓</span> Canary and capacity evidence are current and signed.</p>
                  <p><span>✓</span> A rollback owner is explicitly accountable.</p>
                  <p className={disputed ? "warning" : ""}><span>{disputed ? "!" : "?"}</span> The deploy-freeze memory {disputed ? "conflicts with a newer source and is quarantined." : "is old and should be cross-examined."}</p>
                </div>
                <button className="wide-action" onClick={injectContradiction}>{disputed ? "CONTRADICTION QUARANTINED" : "CROSS-EXAMINE THE WEAK LINK"}</button>
              </>
            ) : (
              <div className="audit-list">
                <p><time>16:42:03</time> Retrieval scoped to deployment:payments-v3</p>
                <p><time>16:42:04</time> ACL + temporal validity gates passed</p>
                <p><time>16:42:04</time> 4 candidate memories ranked by vector similarity</p>
                <p><time>16:42:05</time> {disputed ? "Conflict edge created; M-0991 quarantined" : "Decision receipt awaiting trial"}</p>
                <p><time>16:42:05</time> OTel trace 7fd3…e91b linked to receipt</p>
                <p><time>16:42:05</time> Tamper-evident receipt hash persisted</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="gauntlet">
        <div className="gauntlet-heading">
          <div><p className="eyebrow">MEMORY GAUNTLET / V2</p><h2>Safety claims<br />you can rerun.</h2></div>
          <p>Seventy-two generated-and-checked-in cases cover twelve safe controls and sixty unsafe recalls. This is a policy benchmark—not a claim about general conversational recall quality or third-party product quality.</p>
        </div>
        <div className="scoreboard">
          <article className="score winner"><span>CONTINUUM</span><strong>72/72</strong><small>EXPECTED POLICY DECISIONS · 100% UNSAFE-RECALL DETECTION</small></article>
          <article className="score naive"><span>NAIVE VECTOR THRESHOLD</span><strong>17/72</strong><small>EXPECTED POLICY DECISIONS · 8.3% UNSAFE-RECALL DETECTION</small></article>
          <div className="attack-grid">
            {["STALE POLICY", "CONTRADICTION", "REVOKED MEMORY", "DISPUTED MEMORY", "CROSS-TENANT", "WRONG SUBJECT", "PURPOSE DRIFT", "CONSENT MISMATCH", "LOW SIMILARITY", "LOW CONFIDENCE", "PROMPT INJECTION", "COMPOUND ATTACK"].map((attack) => <span key={attack}>BLOCKED · {attack}</span>)}
          </div>
        </div>
        <div className="benchmark-strip">
          <article><span>REFERENCE POLICY P95</span><strong>≈1.1 μs</strong><small>LOCAL NODE 24 / X64 · EXCLUDES NETWORK</small></article>
          <article><span>HASH-LINKED RECEIPTS</span><strong>1,000</strong><small>CHAIN VERIFIED · MUTATION 513 DETECTED</small></article>
          <article><span>ADAPTER CONTRACTS</span><strong>2</strong><small>MEM0 + GRAPHITI · FAIL CLOSED</small></article>
        </div>
        <div className="eval-command"><code>npm run eval &amp;&amp; npm run bench</code><span>CORPUS-DIGESTED · CREDENTIAL-FREE · CI-ENFORCED</span></div>
      </section>

      <section className="evidence-ladder">
        <div className="section-title"><p className="eyebrow light">EVIDENCE, NOT THEATER</p><h2>Every claim has<br />a proof state.</h2></div>
        <div className="evidence-grid">
          <article className="verified"><span>VERIFIED / REPOSITORY</span><h3>Policy, adapters, latency, receipts</h3><p>Seventy-two cases, confusion matrices, a reference microbenchmark, Mem0 and Graphiti normalization, and tamper detection are executable in CI.</p></article>
          <article className="ready"><span>READY / REAL CLOUD RUN</span><h3>AWS + Cockroach proof harness</h3><p>The deployment doctor, SAM stack, Secrets Manager path, and proof capture reject demo output. A real account invocation is still required.</p></article>
          <article className="pending"><span>PENDING / 0 OF 3</span><h3>Adversarial design partners</h3><p>The interview protocol records objections and product changes. No participant is counted until a real practitioner approves anonymous evidence.</p></article>
        </div>
      </section>

      <section className="inspector-section">
        <div className="section-title"><p className="eyebrow">CROSS-EXAMINATION</p><h2>Every memory must show its receipts.</h2></div>
        <div className="inspector-grid">
          <aside className="record-index">
            {memories.map((memory) => (
              <button key={memory.id} onClick={() => setSelected(memory.id)} className={selected === memory.id ? "active" : ""}>
                <span>{memory.id}</span><strong>{memory.title}</strong><small>{memory.status} · {memory.age}</small>
              </button>
            ))}
          </aside>
          <article className="record-detail">
            <div className="detail-head"><div><p>MEMORY RECORD / {activeMemory.id}</p><h3>{activeMemory.title}</h3></div><span className={`seal ${activeMemory.status}`}>{activeMemory.status}</span></div>
            <blockquote>“{activeMemory.detail}”</blockquote>
            <dl>
              <div><dt>PROVENANCE</dt><dd>{activeMemory.source}</dd></div>
              <div><dt>OBSERVED</dt><dd>{activeMemory.age}</dd></div>
              <div><dt>CONFIDENCE</dt><dd>{activeMemory.confidence}% / calibrated</dd></div>
              <div><dt>VALID UNTIL</dt><dd>{activeMemory.id === "M-0991" ? "Policy superseded" : "Today, 18:00 UTC"}</dd></div>
              <div><dt>CONSENT / ACL</dt><dd>ops-deployers · purpose-bound</dd></div>
              <div><dt>CONFLICTS</dt><dd>{activeMemory.status === "disputed" ? "M-1077 / release calendar" : "None detected"}</dd></div>
            </dl>
            <div className="record-actions">
              <button onClick={() => updateSelected("disputed")}>CHALLENGE MEMORY</button>
              <button onClick={() => updateSelected("revoked")}>REVOKE + TOMBSTONE</button>
            </div>
          </article>
        </div>
      </section>

      <section className="resilience">
        <div><p className="eyebrow light">DISTRIBUTED BY DESIGN</p><h2>Trust survives<br />a region failure.</h2><p>Agent memory remains consistent, auditable, and available when one region disappears.</p></div>
        <div className="region-map">
          <div className="region healthy"><span>US-EAST-1</span><strong>PRIMARY</strong><small>12 ms</small></div>
          <div className={`region ${regionLoss ? "failed" : "healthy"}`}><span>US-WEST-2</span><strong>{regionLoss ? "OFFLINE" : "FOLLOWER"}</strong><small>{regionLoss ? "simulated loss" : "38 ms"}</small></div>
          <div className="region healthy"><span>EU-WEST-1</span><strong>{regionLoss ? "PROMOTED" : "FOLLOWER"}</strong><small>81 ms</small></div>
          <div className="region-lines" />
          <button onClick={() => setRegionLoss((value) => !value)}>{regionLoss ? "RESTORE REGION" : "SIMULATE REGION LOSS"}</button>
        </div>
      </section>

      <section className="principles">
        <div className="section-title"><p className="eyebrow">THE MEMORY CONTRACT</p><h2>Five rules before recall.</h2></div>
        <div className="principle-grid">
          {[
            ["01", "PROVENANCE", "Who said it, where it came from, and what changed since."],
            ["02", "TEMPORALITY", "Knowledge expires. Retrieval respects observation and validity time."],
            ["03", "CONSENT", "Purpose-bound access travels with the memory, not the prompt."],
            ["04", "CONTRADICTION", "Conflicts become first-class edges, not quietly averaged facts."],
            ["05", "FORGETTING", "Revocation leaves an auditable tombstone without leaking content."],
          ].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="adoption">
        <div className="section-title"><p className="eyebrow light">ENTERPRISE ADOPTION</p><h2>Observe first.<br />Enforce with evidence.</h2></div>
        <div className="adoption-grid">
          <article><span>01 / INSTRUMENT</span><h3>Connect any memory layer</h3><p>Send candidate memories through one vendor-neutral decision endpoint. No rip-and-replace migration.</p></article>
          <article><span>02 / SHADOW</span><h3>Measure without blocking</h3><p>Capture what Continuum would admit, quarantine, or escalate while existing agents keep running.</p></article>
          <article><span>03 / ENFORCE</span><h3>Guard irreversible actions</h3><p>Turn on fail-closed policy only for deploys, payments, access changes, and regulated workflows.</p></article>
          <article><span>04 / PROVE</span><h3>Export decision receipts</h3><p>Correlate OpenTelemetry traces with tamper-evident evidence digests and policy versions.</p></article>
        </div>
      </section>

      <section className="architecture">
        <p className="eyebrow light">REFERENCE PATH</p>
        <div className="architecture-flow"><span>ANY MEMORY LAYER</span><i>→</i><span>AWS LAMBDA<br /><small>shadow / enforce</small></span><i>→</i><span>COCKROACHDB<br /><small>vector + evidence ledger</small></span><i>→</i><span>OTEL-LINKED RECEIPT</span></div>
        <p className="demo-note">Interactive deterministic demo · Mem0 and Graphiti adapters included · real-cloud proof remains explicitly gated</p>
      </section>

      <footer><div className="brand"><span className="brand-mark">C</span><span>CONTINUUM</span></div><p>The memory firewall for agents that must earn trust.</p><span>BUILD WITH AGENTIC MEMORY / 2026</span></footer>
    </main>
  );
}
