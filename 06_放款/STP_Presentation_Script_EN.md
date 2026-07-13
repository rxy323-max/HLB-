# STP Disbursement Overview — 客户讲解逐字稿（英文）

> 使用方法：对着 `STP_Disbursement_Overview_EN.html` 从上往下滚动，照着念。
> 【方括号内是给你的中文提示，不用念】
> 预计时长：完整讲 20–25 分钟；每节末尾有可选的停顿提问句。

---

## PART 1 · 开场：材料目的（约 2 分钟）

【打开文档，停在页面顶部标题处】

Hello everyone, thank you for joining today's session.

What I'm going to walk you through today is a single-page visual document called the **"STP Disbursement Requirements Overview."**

Let me first explain **why we prepared this document**.

Over the past weeks, the requirements for the disbursement stage have been spread across several sources — the Disbursement FRS, the CRA business rules and defect codes, the STP requirement list, and the OCR document list. Each of them is detailed, but it's hard to see the **full picture** from any single one.

So the purpose of this document is simple: **to combine everything into one page**, so that we can align on four things together:

- **First**, what exactly qualifies a case for STP — the eligibility conditions.
- **Second**, how the disbursement process actually flows, and who does what.
- **Third**, how disbursement connects with upstream and downstream systems.
- **And fourth**, the boundary of OCR — which documents go through OCR, and which checks are automated versus manual.

This is an **internal discussion draft** — nothing here is final. The goal today is to confirm that our understanding matches yours, and to capture any corrections from your side.

【停顿】Before I go into the content, let me quickly show you how the document is organized.

---

## PART 2 · 结构总览（约 2 分钟）

【慢慢滚动一遍整个页面，让客户看到全貌，然后回到顶部】

The document has **five sections**, numbered 00 to 04. Let me give you the map first, so you always know where we are:

- **Section 00 — the Core Model.** One picture that shows the single pipeline every disbursement case goes through. This is the foundation for everything else.
- **Section 01 — STP Hard Eligibility Rules.** The seven conditions a case must meet, plus a 90-day time gate, plus two control switches.
- **Section 02 — Process and Roles.** Four roles and eight process stages, end to end.
- **Section 03 — Upstream and Downstream Interactions.** What feeds into disbursement, what disbursement integrates with, and what it produces.
- **Section 04 — the OCR and CRA Workbench boundary.** Which documents need OCR, which checks run automatically, and which stay with people.

So the logic of the document is: **model first, then conditions, then process, then integrations, then the OCR boundary.** Each section builds on the previous one.

One more thing before we start — 【指着图例】at the top you can see a color legend, and it stays consistent through the whole document:

- **Teal** means the system — OCR and expert rules.
- **Green** means STP automated disbursement.
- **Amber** means CRA manual handling.
- **Red** means blocked or ineligible.

Whenever you see these colors below, they mean the same thing.

Alright, let's start with Section 00.

---

## PART 3 · Section 00 — Core Model（约 4 分钟）

【滚动到 Section 00】

Section 00 is the **single most important idea** in this document. If you only remember one thing today, please remember this section.

【指着蓝色高亮框念】

The key alignment is this: **OCR plays exactly one role — field population, or auto-fill. It does NOT replace the review step.**

Review exists for **every** disbursement case. Even on the STP path, OCR only fills in the data, and CRA still reviews it — either manually, or through systemized expert rules.

What STP actually automates is the **execution** — account creation, payment, document generation, and emailing. **Not the review itself.**

【指着流程管线图】

Now look at the pipeline. Every single case — no exceptions — goes through the same five steps:

- **Step one: Sales Submission.** Sales collects and uploads the documents.
- **Step two: OCR Classify and Fill.** The system classifies the documents, extracts the fields, and auto-populates the data. Notice this box is teal — it's the system working.
- **Step three: CRA Review.** The results get confirmed and cross-checked.
- **Step four: Business Rule Validation.** Fourteen types of expert rules run against the data.
- **Step five: Routing.** Based on eligibility and results, the case goes one of two ways.

【指着下方两个分支】

And here are the two ways:

- On the left, the **amber lane — CRA Manual Handling**. If the case is ineligible, or a rule failed, or the master switch is off, it goes here: CRA Checker maintains it, the Authorizer approves it. Fully manual.
- On the right, the **green lane — STP Auto Disbursement**. If the case is eligible, all rules passed, and the switch is on, the system executes the disbursement automatically, with no manual execution by CRA.

【指着汇合点】

And notice — **both lanes converge into the same final step: Disbursement Execution.** Host maintenance, account creation, payment, documents, email. Whether it went through the manual lane or the STP lane, the execution steps are identical. The only difference is **who pushes the buttons** — a person, or the system.

So to summarize Section 00 in one sentence: **there is one pipeline for all cases; STP is an automation layer at the end of it, not a separate process.**

【可选停顿】Any questions on the core model before we move on? … Good. Now that we have the model, the natural next question is: **which cases qualify for the green lane?** That's Section 01.

---

## PART 4 · Section 01 — STP Hard Eligibility Rules（约 5 分钟）

【滚动到 Section 01】

We're now in Section 01 — the second of five sections. This one answers: **what makes a case eligible for STP?**

The underlying principle is simple: STP removes manual execution, so it's only safe for cases that are **simple, clean, and free of risk judgment**. There are **seven hard rules**, and a case must meet **all seven at the same time**. Failing any single one sends the case to the manual lane.

【逐张念条件卡片，每张一两句】

- **Rule one: Individual.** Corporate and partnership cases involve resolutions, authorized signatories, multiple guarantors, multilingual documents — too much judgment to automate safely.
- **Rule two: New car.** Used and reconditioned cars need VOC, payoff, inspections, import permits — too many variables.
- **Rule three: a single beneficiary, matching the dealer system.** "Who receives the money" must be completely unambiguous.
- **Rule four: no payoff.** No settlement of an existing loan, so no settlement calculation and no coordination with a previous lender.
- **Rule five: not FBT.** FBT means funding before ownership transfer — extra risk exposure that needs manual checks.
- **Rule six: no FD pledge.** No manual verification of fixed-deposit amounts and pledge terms.
- **Rule seven: no floor stock dealer.** Wholesale-financing dealers are a high-risk category that needs extra manual review.

So if you think about it, these seven rules together describe **the cleanest possible case**: an individual buying a new car, one clear payee, no settlement, no special financing, no pledge, from a normal dealer.

【指着红色时效框】

On top of the seven rules, there is a **time-validity gate — the 90-day three-tier check**. An approval has a shelf life; beyond 90 days the risk situation may have changed. The system checks in three tiers:

- **Tier one:** if today is within 90 days of the first approval date — allow.
- **Tier two:** otherwise, look at the vehicle registration date. If it's missing, block. If registration happened within 90 days of approval — allow.
- **Tier three:** otherwise, look at the LOU renewal date. If it's missing, block. If today is within 90 days of the renewal — allow. Otherwise, block.

So it's a cascade: approval date, then registration date, then renewal date. Each tier gives the case one more chance, and the last tier is final.

【指着两个开关卡片】

Finally, two **control switches**:

- **STP_SWITCH** — this is the global master switch, and it defaults to **OFF**. Think of it as management's emergency brake. When it's ON, eligible cases flow to automated disbursement. When it's OFF — even fully eligible cases are downgraded to the CRA Authorizer for manual handling. This gives the bank full operational control during launch or during any incident, without changing any code or rules.
- **Full Maintenance Indicator** — this decides whether the wrap-up completes in one pass. If **Yes**: disbursement, documents, and email all complete end to end automatically. If **No**: the system stops after the payment itself, sets the status to "Funded Pending Post Maintenance," and hands the case to the **Post Maintenance** queue, where staff complete the remaining documents and accounting. This exists because in some scenarios — FBR and FBT for example — certain documents can only be generated after transfer completes.

To recap Section 01: **seven rules, all at once, plus a 90-day gate, plus two switches.** That's the full definition of "STP-eligible."

【可选停顿】Does this match your understanding of the eligibility scope? … Great. So now we know **which** cases go where. Section 02 shows **how** the process actually runs, step by step.

---

## PART 5 · Section 02 — Process & Roles（约 4 分钟）

【滚动到 Section 02】

We're now at Section 02 — the middle of the document. Two things here: **four roles**, and **eight process stages**.

【指着四张角色卡】

First, the roles:

- **Sales** — collects and uploads documents, triggers the E-Hakmilik lodgement, checks FIS and dealer eligibility, and submits the disbursement application.
- **CRA Checker / Maintenance** — confirms OCR results, maintains the disbursement data, handles defects, and manually verifies any case that failed rule validation.
- **CRA Authorizer** — the final approval. Note two built-in controls: the authorization limit equals the approved amount plus fees and taxes, and the authorizer can never be the same person as the latest checker — a four-eyes principle.
- And the fourth role — 【指着 teal 卡片】 — is **the system itself**: AIOCR plus the expert rules. Classification, extraction, cross-validation, automated rule checking, and, for STP cases, automated disbursement. In the STP lane, the system effectively **is** the fourth worker, and it even gets its own teller ID in the records.

【指着八步列表，逐步念】

Now the eight stages, top to bottom:

- **Stage 1 — Sales submission**: lodgement, FIS query, dealer eligibility, upload, and submit. Submission also triggers Host Acceptance — CIF, facility, and collateral creation in the core system.
- **Stage 2 — System pre-processing**: classification, integrity checks, OCR extraction, cross-validation.
- **Stage 3 — Pre-sorting**: if the OCR cross-check passed and auto-routing is on, the case goes to expert rules; otherwise it goes to the manual queue.
- **Stage 4 — Expert rule validation**: the fourteen rule types. Pass — the case moves to the STP decision. Fail — it goes to the manual queue, with defects automatically registered.
- **Stage 5 — Manual maintenance and authorization**: for non-STP cases, Checker then Authorizer.
- **Stage 6 — Disbursement execution**: and remember from Section 00 — this stage is **shared** by both lanes. Host maintenance, account creation, payment, document generation, emailing. If an interface times out, the case goes to an error queue for retry.
- **Stage 7 — Wrap-up**: full-maintenance cases finish in one pass; the rest go to Post Maintenance.
- **Stage 8 — Post-disbursement**: LHDN e-stamping, status sync to RBS and eTracker, and reporting.

Notice how stages 1 to 4 are exactly the five pipeline boxes from Section 00, just in more detail — and stages 5 to 8 are what happens after the routing decision.

【可选停顿】That's the process. Next, Section 03 puts this process in context — what's around it.

---

## PART 6 · Section 03 — Upstream & Downstream（约 3 分钟）

【滚动到 Section 03】

Section 03 — the fourth of five. Disbursement is not an isolated module, so this section is organized as **three columns: what comes in, what we integrate with, and what goes out.**

【指着左栏】

**The left column — upstream inputs:**

- The **Acceptance module**: a completed acceptance is the prerequisite for disbursement, and the signed documents become the baseline — we call it Version 1 — that OCR results are compared against.
- The **approval chain**: the first approval date drives the 90-day gate we saw in Section 01, and the CED-approved amount is the baseline for FD pledge comparison.
- **CILT**: if the extracted data — Version 2 — differs from Version 1 on key commercial terms, the case breaks out into the CILT amendment flow, and audited field changes require a reason code.

【指着中栏】

**The middle column — systems we integrate with during this stage:**

- **FIS / JPJ** for lodgement and vehicle registration status;
- **Dealer management** for FBR/FBT limits and the floor-stock indicator;
- **HOST**, the core banking system, for acceptance, account creation, and the payment itself — with retry and error-queue handling;
- and the **AIOCR engine** doing classification, extraction, and cross-validation, with a three-color status monitor.

【指着右栏】

**The right column — downstream outputs:**

- **Documents and email**: the merged hirer and guarantor PDF, encrypted with a personal PIN;
- **LHDN** e-stamping in batch XML;
- **RBS and eTracker**: the funded status flows back, and the customer sees "Disbursement" in their tracker;
- and **reports**: reconciliation, performance, defect reports — all filterable by the STP Application Indicator, so management can always measure how much volume actually went through STP.

【可选停顿】So that's the full context. Now — the last section, and probably the one most relevant for today's discussion: the OCR boundary.

---

## PART 7 · Section 04 — OCR × CRA Workbench Boundary（约 6 分钟）

【滚动到 Section 04】

We're at Section 04, the final section. It answers **two design questions**:

- **Question one: which documents go through OCR?** — and the answer is defined by **data source**.
- **Question two: which checks run in the OCR engine, and which stay in the CRA workbench?** — and the answer is defined by **determinism and confidence**.

This section has four parts: 4.1 the two uses of OCR, 4.2 the document scope, 4.3 the check split, and 4.4 the principles. Let's take them one at a time.

【指着 4.1 两张卡】

**Part 4.1 — the two uses of OCR.**

Important: these are not two kinds of OCR — they are **two downstream uses of the same OCR output**.

- **Use A — auto-fill, for every case.** Extracted fields populate the maintenance pages automatically. CRA staff shift from manually typing data to visually checking and confirming it. A human is always in the loop — here, OCR is the assistant.
- **Use B — feeding the automated rule validation, for STP candidates.** Once the cross-check passes, the extracted results feed the expert rules for a fully automated check. If everything passes, that review step can be systemized — which is what makes a case eligible for the STP lane.

And B depends on A: fields must be reliably extracted before they can be filled in or fed to any rule.

【指着 4.2 三个分桶】

**Part 4.2 — which documents actually need OCR.**

Not every disbursement document goes through OCR. We classify them by **where the data comes from**, into three buckets:

- **Bucket one — already captured.** Documents like NRIC, passport, driving license — these were collected and verified at the application stage. At disbursement we simply **reuse** the data. No repeat OCR.
- **Bucket two — system-generated.** The HP Agreement, the Application Form, the Second Schedule, the biometric result — the **system produced these documents itself**, so the fields are already structured in the database. Running OCR on them would be reading back our own output. No OCR needed.
- **Bucket three — OCR required.** These are external documents appearing **for the first time** at the disbursement stage: the vehicle invoice, VOC, road tax, insurance cover note, delivery order, IBG letter, the FIS/JPJ result, E-hakmilik, the admin-fee credit note, and the loan suspense receipt. **This bucket is the true scope of disbursement OCR.**

【指着明细表】Below the buckets there's a detail table listing each document with its category and scenario — for example, vehicle invoice applies to new cars, VOC to used cars only. We don't need to read every row now; it's there as the reference for follow-up.

【指着 4.3 两栏】

**Part 4.3 — where each check runs.**

The split is: **the OCR engine handles what can be computed; the CRA workbench handles what requires judgment.**

- **The engine layer, automated:** field extraction, plus the deterministic expert rules — date comparisons, arithmetic totals, fixed values like "admin fee equals 270 ringgit," amount consistency, region matching, form-version mapping. The output is a clean pass or fail, and every failure automatically registers the mapped **defect code**. When a resubmission passes, the defect is automatically marked rectified.
- **The workbench layer, manual:** confirming or correcting results — with a reason recorded for every edit; low-confidence fields that fall below the threshold; isolated key fields that have no cross-document counterpart to compare against; and special judgment calls — like whether a scenario is missing a mandatory file. **Final discretion always rests with CRA.**

【指着 4.4 四张原则卡】

**Part 4.4 — and we can compress all of this into four principles:**

- **P1: the data source decides whether to OCR.** Already captured or system-generated — reuse it. New external document — OCR it.
- **P2: determinism decides whether to automate.** If a check can be written as a formula with a numeric counterpart, the engine runs it. If it needs human eyes, it stays in the workbench.
- **P3: confidence decides the routing.** High confidence and all rules passed — auto-confirm, STP-eligible. Low confidence, failed rules, or isolated fields — push to the workbench.
- **P4: final discretion rests with CRA.** OCR and rules only produce results and suggestions. The decision to confirm, override, or release always belongs to a person.

---

## PART 8 · 收尾（约 2 分钟）

【滚回页面顶部或停在 4.4】

Let me wrap up with the whole story in five sentences — one per section:

- **Section 00:** every case runs on one pipeline; STP is automation at the end of it, not a separate flow.
- **Section 01:** a case enters the STP lane only if it passes seven hard rules, a 90-day gate, and the master switch is on.
- **Section 02:** four roles, eight stages — and in the STP lane, the system is effectively the fourth worker.
- **Section 03:** disbursement takes inputs from acceptance and approval, integrates with FIS, dealer management and HOST, and outputs documents, statuses and reports.
- **Section 04:** OCR only fills; documents are scoped by data source; checks are split by determinism and confidence; and the final say always stays with CRA.

What we'd like from you today is confirmation on three things:

- **First**, does the eligibility scope in Section 01 match your business reality?
- **Second**, is the document classification in Section 4.2 complete — is anything missing from the "OCR required" bucket?
- **And third**, are you comfortable with the automation boundary in Section 4.3 — the split between engine and workbench?

Everything you correct today will be folded back into this document, and it will become our shared baseline for the detailed design.

Thank you — and now I'm happy to take questions.

---

## 附：常用过渡句备忘（可随时插用）

- "Just to remind us where we are — we've covered X, and we're now moving to Y."
- "This connects back to what we saw in Section 00 — same pipeline, more detail."
- "Again, the colors are consistent: green is automated, amber is manual."
- "Let me pause here — does this match your current process?"
- "We don't need to go through every row now; this table is the reference for follow-up."
- "If this differs from your side, please stop me — this is exactly what we want to catch today."
