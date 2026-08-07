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

  const activeMemory = memories.find((memory) => memory.id === selected) ?? memories[0];
  const disputed = memories.some((memory) => memory.status === "disputed");
  const admissible = memories.filter((memory) => memory.status === "admissible").length;
  const decisionConfidence = disputed ? 58 : 87;

  const verdict = useMemo(() => {
    if (!trialRun) return "Awaiting examination";
    if (disputed) return "HOLD — HUMAN REVIEW";
    return "DEPLOY WITH ROLLBACK GUARD";
  }, [trialRun, disputed]);

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
            Continuum is a persistent memory control plane that makes every agent memory
            traceable, challengeable, time-aware, and safe to forget.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => setTrialRun(true)}>RUN THE MEMORY TRIAL <span>↗</span></button>
            <button className="button ghost" onClick={injectContradiction}>INJECT A CONTRADICTION</button>
          </div>
          <div className="hero-proof">
            <span>COCKROACHDB</span><i /> <span>AWS LAMBDA</span><i /> <span>PROVENANCE-FIRST</span>
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
                <p><time>16:42:05</time> Region-safe action receipt persisted</p>
              </div>
            )}
          </div>
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

      <section className="architecture">
        <p className="eyebrow light">REFERENCE PATH</p>
        <div className="architecture-flow"><span>AGENT</span><i>→</i><span>AWS LAMBDA<br /><small>policy + reasoning</small></span><i>→</i><span>COCKROACHDB<br /><small>vector + audit</small></span><i>→</i><span>ACTION RECEIPT</span></div>
        <p className="demo-note">Interactive deterministic demo · production adapters included in the open-source repository</p>
      </section>

      <footer><div className="brand"><span className="brand-mark">C</span><span>CONTINUUM</span></div><p>Persistent memory for agents that must earn trust.</p><span>BUILD WITH AGENTIC MEMORY / 2026</span></footer>
    </main>
  );
}
