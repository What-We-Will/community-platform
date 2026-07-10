import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

// ─── Internal primitives ──────────────────────────────────────────────────────

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-16 scroll-mt-20">
      <h2 className="font-bebas text-3xl uppercase text-primary-orange sm:text-4xl">
        {children}
      </h2>
      <div className="mt-1 h-0.5 w-full bg-primary-orange" />
    </div>
  );
}

function SubTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-10 scroll-mt-20">
      <h3 className="font-bebas text-2xl uppercase text-accent-blue">{children}</h3>
      <div className="mt-1 h-px w-full bg-primary-orange/40" />
    </div>
  );
}

function SubSubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-8 font-bebas text-xl text-primary-orange">{children}</h4>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-r-xl border-l-[3px] border-primary-orange bg-warm-beige px-4 py-3 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function CalloutRef({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div className="mb-12 mt-6 rounded-r-xl border-l-[3px] border-primary-orange bg-warm-beige px-3 py-2">
      <a href={href} className="italic text-primary-orange hover:underline">
        {children}
      </a>
    </div>
  );
}

function GuideBadge({ letter }: { letter: string }) {
  return (
    <div className="mt-4 flex justify-center">
      <div className="rounded bg-gray-700 px-5 py-2">
        <span className="font-bebas text-xl tracking-widest text-white">
          GUIDE {letter}
        </span>
      </div>
    </div>
  );
}

function GuideSection({
  id,
  letter,
  title,
  children,
}: {
  id: string;
  letter: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className="group mt-12 scroll-mt-20" open={false}>
      <summary className="flex cursor-pointer list-none items-start gap-4 rounded-lg border border-border p-4 hover:bg-muted/50">
        <div className="shrink-0 rounded bg-gray-700 px-3 py-1">
          <span className="font-bebas text-base tracking-widest text-white">
            GUIDE {letter}
          </span>
        </div>
        <div className="flex-1">
          <span className="font-bebas text-2xl uppercase text-primary-orange sm:text-3xl">
            {title}
          </span>
        </div>
        <ChevronDown className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-4 border-l-2 border-border pl-4">{children}</div>
    </details>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-dark-blue text-white">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-warm-beige"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-border px-3 py-2.5 align-top leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 space-y-4 leading-relaxed text-foreground/85">{children}</div>;
}

// ─── TOC ─────────────────────────────────────────────────────────────────────

const tocSections = [
  { num: "1", title: "Introduction", id: "s1" },
  {
    num: "2",
    title: "Severance & Legal Rights",
    id: "s2",
    subs: [
      { title: "Reading the Agreement", id: "s2-sep" },
      { title: "Negotiation", id: "s2-neg" },
      { title: "WARN Act", id: "s2-warn" },
      { title: "Collective Bargaining", id: "s2-cbt" },
    ],
  },
  {
    num: "3",
    title: "Health Insurance & COBRA",
    id: "s3",
    subs: [{ title: "Action Steps", id: "s3-steps" }],
  },
  {
    num: "4",
    title: "Unemployment Benefits",
    id: "s4",
    subs: [{ title: "Action Steps", id: "s4-steps" }],
  },
  {
    num: "5",
    title: "Equipment & Finances",
    id: "s5",
    subs: [
      { title: "Returning Property", id: "s5-property" },
      { title: "401(k), Stock & RSUs", id: "s5-401k" },
    ],
  },
  { num: "6", title: "Immigration & Visas", id: "s6" },
  { num: "7", title: "Mental Health", id: "s7" },
  { num: "8", title: "Job Search Prep", id: "s8" },
  { num: "9", title: "Collective Action", id: "s9" },
  { num: "10", title: "FAQs", id: "s10" },
  {
    num: "11",
    title: "Next Steps & Resources",
    id: "s11",
    subs: [
      { title: "Practical Timeline", id: "s11-timeline" },
      { title: "Resource Directory", id: "s11-resources" },
    ],
  },
];

const guideSections = [
  { letter: "A", title: "Severance Negotiation", id: "guide-a" },
  { letter: "B", title: "Health Insurance Decision", id: "guide-b" },
  { letter: "C", title: "Unemployment Deep-Dive", id: "guide-c" },
  { letter: "D", title: "Mental Health & Stabilization", id: "guide-d" },
  { letter: "E", title: "Immigration Survival Manual", id: "guide-e" },
  { letter: "F", title: "Collective Action Playbook", id: "guide-f" },
];

function TableOfContents() {
  return (
    <nav aria-label="Guide contents" className="text-sm">
      <p className="mb-3 font-bebas text-base uppercase tracking-widest text-muted-foreground">
        Contents
      </p>
      <ol className="space-y-1.5">
        {tocSections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="font-medium text-foreground/80 hover:text-primary-orange"
            >
              {s.num}. {s.title}
            </a>
            {s.subs && (
              <ol className="mt-1 ml-3 space-y-1">
                {s.subs.map((sub) => (
                  <li key={sub.id}>
                    <a
                      href={`#${sub.id}`}
                      className="text-muted-foreground hover:text-primary-orange"
                    >
                      – {sub.title}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
      <p className="mb-3 mt-8 font-bebas text-base uppercase tracking-widest text-muted-foreground">
        Supplemental Guides
      </p>
      <ol className="space-y-1.5">
        {guideSections.map((g) => (
          <li key={g.id}>
            <a
              href={`#${g.id}`}
              className="text-foreground/80 hover:text-primary-orange"
            >
              <span className="font-semibold text-primary-orange">
                Guide {g.letter}:
              </span>{" "}
              {g.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LayoffGuideContent() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark-blue px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-bebas text-5xl uppercase tracking-tight sm:text-6xl md:text-7xl">
            Layoff Resource Guide
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Practical guidance for workers navigating layoffs — severance,
            insurance, immigration, job search, and collective action.
          </p>
          <p className="mt-6 max-w-2xl rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            This document is for informational purposes and does not constitute
            legal advice.
          </p>
        </div>
      </section>

      {/* Quick start banner */}
      <div className="border-b border-primary-orange/20 bg-warm-beige px-4 py-4">
        <div className="mx-auto max-w-4xl text-sm leading-relaxed">
          <strong>Quick start:</strong>{" "}
          <em>
            If you want the simplest path forward, skip to{" "}
            <a href="#s11" className="text-primary-orange underline-offset-2 hover:underline">
              Section 11: &quot;Next Steps &amp; Resource Directory.&quot;
            </a>{" "}
            That section gives you a step-by-step timeline of what to do
            immediately, within the first week, and over the next 60 days.
          </em>
        </div>
      </div>

      {/* Body: TOC sidebar + content */}
      <div className="mx-auto max-w-7xl px-4 py-12 lg:flex lg:gap-12">
        {/* Sticky TOC */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6">
            <TableOfContents />
          </div>
        </aside>

        {/* Main content */}
        <article className="min-w-0 flex-1">

          {/* ── Section 1 ── */}
          <SectionTitle id="s1">1. Introduction and Orientation</SectionTitle>
          <Prose>
            <p>
              If you&apos;re reading this, you&apos;re likely dealing with
              uncertainty — about your income, your health insurance, your visa
              status, or what you&apos;re supposed to do next. You may feel
              confused, frustrated, or even angry. All of that is normal.
              Layoffs often happen quickly, with limited clarity and little time
              to process what comes next.
            </p>
            <p>
              This guide is designed to help you{" "}
              <strong>move forward with clarity</strong>. It pulls together the
              most common questions raised by workers and provides{" "}
              <strong>clear, actionable steps</strong>, grounded in legal
              guidance and real-world examples. It is not legal advice, but it
              is meant to help you understand your options and make informed
              decisions quickly.
            </p>
            <p>You do not need to read this entire document right now.</p>
            <p>
              <strong>
                If you want the simplest path forward, skip to{" "}
                <a href="#s11" className="text-primary-orange hover:underline">
                  Section 11: &quot;Next Steps &amp; Resource Directory.&quot;
                </a>
              </strong>{" "}
              That section gives you a step-by-step timeline of what to do
              immediately, within the first week, and over the next 60 days.
            </p>
            <p>
              For everything else, use this guide as a reference. Different
              sections apply depending on your situation:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                If you have a severance agreement — go to{" "}
                <a href="#s2" className="font-semibold text-primary-orange hover:underline">
                  Section 2
                </a>
              </li>
              <li>
                If you&apos;re worried about health insurance — go to{" "}
                <a href="#s3" className="font-semibold text-primary-orange hover:underline">
                  Section 3
                </a>
              </li>
              <li>
                If you&apos;re on a visa — go to{" "}
                <a href="#s6" className="font-semibold text-primary-orange hover:underline">
                  Section 6
                </a>
              </li>
              <li>
                If you want to understand your options beyond individual
                decisions — go to{" "}
                <a href="#s9" className="font-semibold text-primary-orange hover:underline">
                  Section 9
                </a>
              </li>
            </ul>
            <p>
              Where possible, sources are cited so you can verify information
              yourself.
            </p>
            <p>
              You are not the only person navigating this. Many of the insights
              in this guide come directly from other workers asking the same
              questions you likely have right now.
            </p>
          </Prose>

          {/* ── Section 2 ── */}
          <SectionTitle id="s2">
            2. Understanding Your Severance and Legal Rights
          </SectionTitle>

          <SubTitle id="s2-sep">Reading the Separation Agreement</SubTitle>
          <Prose>
            <p>
              A separation agreement typically outlines: (1) the amount and
              form of severance pay, (2) the schedule of health-insurance
              coverage, (3) a release of claims against the employer, (4)
              non-disparagement and confidentiality clauses, (5) return of
              company property, and (6) the deadline for signing.
            </p>
            <p>
              Severance is usually offered in exchange for waiving the right to
              sue for termination-related claims. There is no universal formula
              for severance pay. A common rule of thumb in private practice is{" "}
              <strong>one to two weeks of pay per year of service</strong>, but
              neither federal nor most state laws require any severance.
            </p>
            <p>
              Executives often receive more generous packages. The agreement may
              specify whether severance is paid as a lump sum or salary
              continuation; this matters because some states treat salary
              continuation as wages when assessing unemployment benefits.
            </p>
            <p>
              Employees <strong>aged 40 and older</strong> are protected by the
              Older Workers Benefit Protection Act. A valid waiver of
              age-discrimination claims must provide at least{" "}
              <strong>21 days to consider the severance offer</strong> and allow{" "}
              <strong>7 days to revoke signature after signing</strong>. Make
              sure the document contains this language and that you are given
              the required time to review it.
            </p>
          </Prose>

          <SubTitle id="s2-neg">Negotiation Possibilities</SubTitle>
          <Prose>
            <p>
              Severance terms are not always take-it-or-leave-it. If you
              believe your package is below industry norms or if the separation
              agreement contains problematic clauses, consider negotiating. A
              negotiation might involve requesting:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>More weeks of pay</strong> (especially if your tenure
                was long or if you were laid off while on leave). Unions and
                collective actions have secured higher severance; for example,
                Kickstarter United&apos;s agreement provided four months of
                severance pay for all laid-off employees and continued
                healthcare coverage for up to six months.
              </li>
              <li>
                <strong>Extended health-insurance coverage</strong> (e.g.,
                asking the company to cover COBRA premiums for several months).
                Companies sometimes concede this when pressed collectively.
              </li>
              <li>
                <strong>Accelerated vesting of unvested RSUs</strong> or
                alternative compensation of equivalent value. Some workers have
                negotiated partial vesting or cash payments for unvested stock.
              </li>
              <li>
                <strong>Recognition of prior service</strong> if you were
                rehired after a break. Several survey respondents reported that
                their severance was calculated only on the most recent tenure
                and asked management to include earlier years of service.
              </li>
              <li>
                <strong>Training or upskilling support</strong> (e.g., a
                stipend to pursue certificates during the job search).
              </li>
            </ul>
            <p>
              When negotiating, it helps to designate a small group of worker
              representatives and present consistent demands. Workers who band
              together have more leverage and are less likely to be singled out
              than individuals acting alone. However, you may be asked to{" "}
              <strong>
                trade silence (agreeing not to escalate or speak publicly)
              </strong>{" "}
              in return for improved terms.
            </p>
          </Prose>
          <CalloutRef href="#guide-a">
            More information on this topic can be found in{" "}
            <strong>Guide A: Severance Negotiation Tactical Guide</strong>
          </CalloutRef>

          <SubTitle id="s2-warn">
            WARN Act and Remote-Worker Classification
          </SubTitle>
          <Prose>
            <p>
              The federal Worker Adjustment and Retraining Notification (WARN)
              Act requires employers with 100 or more full-time employees to
              provide <strong>60 days&apos; advance notice</strong> of a mass
              layoff or plant closing affecting at least 50 full-time employees
              at a <strong>single site of employment</strong>. Remote work
              complicates this requirement.
            </p>
            <p>
              Federal WARN regulations envision employees who travel or work at
              a client site but do not explicitly address fully remote workers
              with a fixed at-home workspace. Employers must decide whether a
              remote worker&apos;s &quot;single site of employment&quot; is that
              person&apos;s home, their assigned office, or another location.
              Because the issue is unsettled in court, some companies err on
              the side of giving notice to remote workers, while others do not.
            </p>
            <p>
              If you were classified as remote, review company communications
              to see whether you were regularly assigned to a specific office or
              reported to a particular manager; this may support an argument
              that your home was not your &quot;single site of employment.&quot;
            </p>
          </Prose>

          <SubTitle id="s2-cbt">
            Examples of Collective Bargaining and Cautionary Tales
          </SubTitle>
          <Prose>
            <p>
              Collective action can improve outcomes, but it comes with risks.
              In 2020 Kickstarter employees, who were unionized, negotiated an
              agreement that provided four months of severance pay, recall
              rights for a year and continued healthcare coverage for up to six
              months.
            </p>
            <p>
              On the other hand, activism can provoke retaliation. In 2025 the
              National Labor Relations Board accused Mozilla of refusing to hire
              former Apple engineer Cher Scarlett because of her workplace
              activism, leading to a $300,000 settlement. The settlement was
              hailed as an important precedent, but the case illustrates the
              real career risks faced by high-profile organizers.
            </p>
            <p>
              When weighing public advocacy, consider both the potential gains
              (stronger severance, transparency) and the personal risks
              (blacklisting, future hiring hurdles).
            </p>
          </Prose>
          <CalloutRef href="#guide-f">
            See{" "}
            <strong>
              Guide F: Collective Action and Organizing Playbook
            </strong>{" "}
            for more detailed information on collective bargaining.
          </CalloutRef>

          {/* ── Section 3 ── */}
          <SectionTitle id="s3">3. Health Insurance and COBRA</SectionTitle>
          <Prose>
            <p>
              Employer-sponsored coverage usually ends on your separation date
              or at the end of that month. The{" "}
              <strong>
                Consolidated Omnibus Budget Reconciliation Act (COBRA)
              </strong>{" "}
              allows you to continue the same health plan at your own expense.
              Key rules:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>60-day election window:</strong> Once your
                employer-sponsored plan ends, you have{" "}
                <strong>60 days to enroll in COBRA</strong>. Even if you delay
                enrolling, coverage is retroactive to the day your previous
                coverage ended as long as you elect within the window.
              </li>
              <li>
                <strong>Duration:</strong> COBRA coverage generally lasts{" "}
                <strong>18 months</strong>, but certain qualifying events (e.g.,
                disability or divorce) can extend it to{" "}
                <strong>36 months</strong>.
              </li>
              <li>
                <strong>Cost:</strong> You must pay the{" "}
                <strong>
                  entire group premium plus up to a 2% administrative fee
                </strong>
                . Employers sometimes agree to subsidize this cost as part of a
                severance negotiation.
              </li>
            </ul>
            <p>
              Alternatives include enrolling in a spouse&apos;s plan,
              purchasing a Marketplace plan through healthcare.gov (which may
              offer subsidies based on income) or researching short-term
              insurance.
            </p>
            <p>
              If you qualify for Medicaid due to reduced income, it may be
              cheaper than COBRA. Compare options before electing COBRA because
              you generally cannot switch until the next open enrollment period.
            </p>
          </Prose>

          <SubTitle id="s3-steps">Action Steps</SubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Determine when your current coverage ends:</strong> The
                date may be listed in your separation agreement or HR portal.
              </li>
              <li>
                <strong>Watch for the COBRA notice:</strong> Your employer must
                send a general notice and an election notice explaining your
                rights.
              </li>
              <li>
                <strong>Compare costs and coverage:</strong> Use healthcare.gov
                to estimate premiums and subsidies. Consider whether you can
                join a spouse&apos;s or domestic partner&apos;s plan.
              </li>
              <li>
                <strong>Negotiate employer-paid coverage:</strong> Ask whether
                the company will cover COBRA premiums for a period (e.g., three
                months) as part of your severance.
              </li>
              <li>
                <strong>Enroll within 60 days:</strong> If you miss the
                deadline you lose the right to COBRA.
              </li>
            </ul>
          </Prose>
          <CalloutRef href="#guide-b">
            More information on this topic can be found in{" "}
            <strong>
              Guide B: Health Insurance Decision System for Laid-Off Workers
            </strong>
          </CalloutRef>

          {/* ── Section 4 ── */}
          <SectionTitle id="s4">4. Unemployment Benefits</SectionTitle>
          <Prose>
            <p>
              Unemployment insurance is a state program. Eligibility rules and
              benefit amounts vary, but typical requirements include earning a
              minimum amount in the past 12–24 months and actively seeking
              work.
            </p>
            <p>
              There is no federal unemployment system; instead, you file a
              claim with the <strong>state where you worked</strong>. If you
              worked remotely in a different state from where you live, contact
              your home state&apos;s unemployment office for assistance on
              where to file.
            </p>
            <p>
              Because severance pay is sometimes treated as wages, it may{" "}
              <strong>delay or reduce unemployment benefits</strong>, especially
              when severance is paid as salary continuation. Check your
              state&apos;s rules and ask the unemployment agency whether your
              severance will affect your claim.
            </p>
            <p>
              Apply as soon as you are laid off; some states have waiting
              periods, and benefits are not retroactive.
            </p>
          </Prose>

          <SubTitle id="s4-steps">Action Steps</SubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Gather documents:</strong> Have your separation
                agreement, Social Security number, and recent pay stubs ready.
              </li>
              <li>
                <strong>File with the state where you worked:</strong> Use the
                state&apos;s online portal or phone number.
              </li>
              <li>
                <strong>Ask about severance impact:</strong> If your severance
                is paid over time, unemployment benefits may not start until
                after the severance period ends.
              </li>
              <li>
                <strong>Maintain eligibility:</strong> Keep records of job
                search activities and report any freelance income. Failure to
                meet job-search requirements can result in denial of benefits.
              </li>
            </ul>
          </Prose>
          <CalloutRef href="#guide-c">
            More information on this topic can be found in{" "}
            <strong>
              Guide C: Unemployment Benefits &amp; Financial Protection
            </strong>
          </CalloutRef>

          {/* ── Section 5 ── */}
          <SectionTitle id="s5">
            5. Equipment, Data and Financial Documents
          </SectionTitle>

          <SubTitle id="s5-property">Returning Company Property</SubTitle>
          <Prose>
            <p>
              Once layoff notices go out, IT departments often lock accounts
              quickly. Prepare by:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Backing up personal data:</strong> Use your{" "}
                <strong>personal</strong> devices or accounts to copy personal
                contacts, tax documents and performance reviews. Avoid
                forwarding company emails to your personal email because
                communications may be monitored; instead, take screenshots or
                photos with your phone.
              </li>
              <li>
                <strong>Returning equipment:</strong> Return laptops, badges,
                security tokens, credit cards and other property promptly.
                Retain proof of return (e.g., shipping receipt) to avoid being
                charged.
              </li>
              <li>
                <strong>Accessing W-2/1095-C forms:</strong> If your employer
                uses a vendor such as ADP, you may need to create a personal
                account to download these forms after your work credentials are
                disabled.
              </li>
            </ul>
          </Prose>

          <SubTitle id="s5-401k">401(k), Stock and RSUs</SubTitle>
          <Prose>
            <p>
              You retain <strong>100% ownership of your contributions</strong>{" "}
              to your 401(k) plan, but employer matching contributions may vest
              over time. When leaving a job, you usually have four options:
            </p>
            <ol className="ml-4 list-decimal space-y-2">
              <li>
                <strong>Keep the funds in your former employer&apos;s plan</strong>{" "}
                (if your balance meets the minimum, typically $5,000 or
                $7,000). Pros: low administrative costs and access to
                institutional investment options; cons: you cannot make new
                contributions and are limited to the plan&apos;s investment
                menu.
              </li>
              <li>
                <strong>Roll the account into your new employer&apos;s 401(k)</strong>{" "}
                if the new plan accepts rollovers. This consolidates retirement
                savings and delays taxes until distribution.
              </li>
              <li>
                <strong>Roll the account into an IRA.</strong> An IRA may offer
                more investment choices and lower fees.
              </li>
              <li>
                <strong>Cash out the account.</strong> This option is typically
                discouraged because distributions may be subject to income tax
                and a 10% early-withdrawal penalty if you are under 59½.
              </li>
            </ol>
            <p>
              Decide quickly — delays can complicate a rollover and you may be
              forced to move small balances out of the plan. Separately, confirm
              how long you have to exercise any stock options and whether
              unvested RSUs will be forfeited or can be negotiated. If you
              believe the company misrepresented your 401(k) or stock rights,
              consult an employment lawyer.
            </p>
          </Prose>

          {/* ── Section 6 ── */}
          <SectionTitle id="s6">
            6. Immigration and Visa Considerations
          </SectionTitle>
          <Prose>
            <p>
              Non-U.S. citizens may face additional pressure because loss of
              employment can jeopardize visa status.
            </p>
          </Prose>

          <SubSubTitle>Nonimmigrant Workers</SubSubTitle>
          <Prose>
            <p>
              <strong>
                Nonimmigrant workers in H-1B, E-1, E-2, E-3, L-1, H-1B1, O-1
                and TN classifications
              </strong>{" "}
              have a <strong>60-day grace period</strong> or until the end of
              the authorized validity period (whichever comes first) to either
              find a new employer, change status or depart the United States.
            </p>
            <p>
              USCIS clarified that{" "}
              <strong>
                the grace period starts the day after termination
              </strong>{" "}
              based on the last day for which a salary was paid. During this
              period you retain valid status but cannot work unless a new
              petition is filed.
            </p>
            <p>
              Severance payments do <strong>not</strong> extend the start of
              the grace-period clock.
            </p>
            <p>
              If you cannot secure sponsorship, you must depart the country
              before the grace period ends. Consult an immigration attorney as
              soon as possible; delays can have serious consequences.
            </p>
          </Prose>

          <SubSubTitle>F-1 Students on STEM OPT</SubSubTitle>
          <Prose>
            <p>
              STEM OPT holders can accumulate up to{" "}
              <strong>150 days of unemployment</strong> across both the 12-month
              OPT period and the 24-month STEM extension. Exceeding 150 days
              violates status and{" "}
              <strong>no additional 60-day grace period</strong> is granted.
            </p>
            <p>
              If laid off while on OPT, contact your international student
              office to update your SEVIS record and discuss options such as
              transferring to another employer or enrolling in a new program.
            </p>
            <p>
              Immigration advice is highly specific; always consult a qualified
              attorney before making decisions about leaving or staying in the
              country.
            </p>
          </Prose>
          <CalloutRef href="#guide-e">
            More information on this topic can be found in{" "}
            <strong>
              Guide E: Immigration Survival Manual: Navigating Layoffs
            </strong>
          </CalloutRef>

          {/* ── Section 7 ── */}
          <SectionTitle id="s7">
            7. Mental Health and Personal Support
          </SectionTitle>
          <Prose>
            <p>
              Layoffs often produce grief, anger, relief or shame. Acknowledge
              these feelings and remember they are common. Support resources
              include:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Employee Assistance Programs (EAPs):</strong> Many
                employers provide short-term counseling and referrals.
              </li>
              <li>
                <strong>Online therapy platforms and crisis hotlines:</strong>{" "}
                Services like BetterHelp, Talkspace, or the National Alliance
                on Mental Illness (NAMI) can provide help.
              </li>
              <li>
                <strong>Community support groups:</strong> Tech Workers
                Coalition and local unions host peer-support meetings where
                people share experiences and strategies. Workers may also build
                informal networks to swap advice, vent and plan their next
                moves.
              </li>
              <li>
                <strong>Confidential communication channels:</strong> Use
                encrypted tools such as Signal for sensitive discussions and be
                mindful that company email and Slack may be monitored.
              </li>
            </ul>
          </Prose>
          <CalloutRef href="#guide-d">
            More information on this topic can be found in{" "}
            <strong>Guide D: Mental Health &amp; Stabilization Guide</strong>
          </CalloutRef>

          {/* ── Section 8 ── */}
          <SectionTitle id="s8">8. Preparing for the Job Search</SectionTitle>
          <Prose>
            <p>
              A layoff can also be an opportunity to reevaluate career goals.
              Prepare by:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Updating your resume and LinkedIn profile:</strong>{" "}
                Highlight quantifiable achievements and skills.
              </li>
              <li>
                <strong>Networking:</strong> Reach out to former colleagues,
                attend industry events, and join professional groups. Some
                communities, such as the Tech Workers Coalition, host webinars
                and mentorship circles.
              </li>
              <li>
                <strong>Upskilling:</strong> Take advantage of free or low-cost
                courses on platforms like Coursera, edX, and internal company
                resources if offered. Don&apos;t hesitate to ask HR whether any
                training stipend is available.
              </li>
              <li>
                <strong>Interview preparation:</strong> Practice with peers,
                research target companies and consider contract or short-term
                roles while searching for a long-term fit.
              </li>
              <li>
                <strong>Financial planning:</strong> Create a budget based on
                your severance and unemployment benefits. Understand
                health-insurance costs and plan for the possibility of several
                months without income.
              </li>
            </ul>
          </Prose>

          {/* ── Section 9 ── */}
          <SectionTitle id="s9">9. Collective Action and Organizing</SectionTitle>
          <Prose>
            <p>
              Without a union, workers who band together still retain the power
              to negotiate collectively. Informal collective negotiation involves
              designating a group of representatives, drafting a clear list of
              demands and communicating them to the employer. The process
              typically looks like this:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong>Secure communication:</strong> Use non-company tools
                (Signal, ProtonMail) to organize meetings and share sensitive
                information.
              </li>
              <li>
                <strong>Identify grievances:</strong> Common issues include
                remote WARN exclusions, short severance periods, miscalculated
                years of service, confusing DocuSign workflows, visa issues and
                401(k) concerns.
              </li>
              <li>
                <strong>Choose spokespeople:</strong> A small delegation
                prevents the company from bargaining with individuals
                separately.
              </li>
              <li>
                <strong>Draft demands:</strong> Examples include longer
                severance, health-insurance extensions, accelerated RSU vesting
                and inclusion of remote workers in WARN notices.
              </li>
              <li>
                <strong>Present demands and negotiate:</strong> Keep messaging
                consistent. Decide in advance whether you will accept
                non-disclosure clauses or silence in exchange for better terms.
              </li>
              <li>
                <strong>Document everything:</strong> Keep records of
                communications and meeting notes in case legal questions arise.
              </li>
            </ul>
            <p>
              Collective organizing is protected activity under U.S. labor law,
              but there can be risks. The case of Cher Scarlett, where Mozilla
              allegedly refused to hire a candidate because of past activism
              (settled for $300k), shows that retaliation is still a reality.
            </p>
            <p>
              Participants in public campaigns may face blacklisting or negative
              repercussions. Consider your risk tolerance and seek legal advice
              if you are considering a high-profile role.
            </p>
            <p>
              Organizations such as the{" "}
              <strong>Tech Workers Coalition</strong> and the{" "}
              <strong>
                Emergency Workplace Organizing Committee (EWOC)
              </strong>{" "}
              provide training and support for workers interested in collective
              action.
            </p>
          </Prose>
          <CalloutRef href="#guide-f">
            More information on this topic can be found in{" "}
            <strong>Guide F: Collective Action and Organizing</strong>
          </CalloutRef>

          {/* ── Section 10 ── */}
          <SectionTitle id="s10">10. Frequently Asked Questions</SectionTitle>
          <Prose>
            <p>
              This section distills common questions from survey respondents
              and Slack threads. Each answer points to the section of this
              guide where more detail can be found.
            </p>
          </Prose>
          <DataTable
            headers={["Question", "Short Answer"]}
            rows={[
              [
                <strong key="q1">Why is my severance only X weeks?</strong>,
                "Employers are not legally required to pay severance. Packages vary by state and company; a rough norm is one to two weeks of pay per year of service. Check whether your years of service were calculated correctly and consider negotiating for more.",
              ],
              [
                <strong key="q2">Can I negotiate my final termination date or unvested RSUs?</strong>,
                <span key="a2">Sometimes. Ask HR to push back your termination date to extend health coverage and vesting. Request accelerated vesting or cash payment for unvested RSUs. See <a href="#s2" className="text-primary-orange hover:underline">Section 2</a>.</span>,
              ],
              [
                <strong key="q3">Why didn&apos;t I receive WARN protection as a remote worker?</strong>,
                "The federal WARN Act requires notice for mass layoffs at a single site of employment but does not explicitly address fully remote workers. Companies interpret this differently; misclassification is an open legal question.",
              ],
              [
                <strong key="q4">What if I was on parental, disability or medical leave?</strong>,
                "The Family and Medical Leave Act prohibits employers from penalizing employees for taking leave or considering leave use in termination decisions. If you suspect discrimination, consult an employment lawyer.",
              ],
              [
                <strong key="q5">Can I get my unvested RSUs or have prior service counted?</strong>,
                "There is no legal requirement for employers to accelerate vesting or recognize prior service unless a contract says so. However, some workers have negotiated these points; collective action often has more leverage.",
              ],
              [
                <strong key="q6">How do severance and unemployment interact?</strong>,
                "Severance paid as salary continuation may delay unemployment benefits. Check with your state's unemployment agency and apply promptly.",
              ],
              [
                <strong key="q7">What happens to my 401(k)?</strong>,
                "You can usually keep the account with your former employer, roll it into an IRA or a new employer's plan, or cash it out. Each choice has pros and cons; consider taxes and fees.",
              ],
              [
                <strong key="q8">What are my health-insurance options after layoff?</strong>,
                "COBRA lets you continue your plan for 18–36 months if you elect within 60 days. You must pay the full premium plus up to 2%. Marketplace plans and Medicaid may be cheaper.",
              ],
              [
                <strong key="q9">How do I handle immigration issues after layoff?</strong>,
                "H-1B and similar visa holders have a 60-day grace period starting the day after termination. F-1 STEM OPT holders can accumulate up to 150 days of unemployment total. Consult an immigration attorney.",
              ],
              [
                <strong key="q10">Will organizing hurt my career?</strong>,
                "Labor activism is protected, but retaliation still occurs. The 2025 case against Mozilla, which settled for $300k, shows that employers sometimes refuse to hire activists. Weigh the benefits of organizing against potential risks.",
              ],
            ]}
          />

          {/* ── Section 11 ── */}
          <SectionTitle id="s11">
            11. Next Steps &amp; Resource Directory
          </SectionTitle>

          <SubTitle id="s11-timeline">Practical Timeline</SubTitle>

          <SubSubTitle>Immediately (Day 0–3)</SubSubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>Back up personal data</strong> with your own devices.</li>
              <li><strong>Save copies of pay stubs, W-2s and benefit summaries</strong> from company portals.</li>
              <li><strong>Contact an employment lawyer</strong> if you have complex questions about severance, WARN classification or discrimination.</li>
              <li><strong>Join support networks</strong> (e.g., Tech Workers Coalition, layoff Slack groups) to connect with peers.</li>
            </ul>
          </Prose>

          <SubSubTitle>Within the First Week</SubSubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>Review your separation agreement</strong> and note deadlines (e.g., 21-day consideration period).</li>
              <li><strong>File for unemployment</strong> in the state where you worked.</li>
              <li><strong>Compare health-insurance options</strong> and decide whether to elect COBRA.</li>
              <li><strong>Assess your financial position</strong> and create a budget.</li>
            </ul>
          </Prose>

          <SubSubTitle>Within 60 Days</SubSubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>Enroll in COBRA</strong> if you choose that option.</li>
              <li><strong>Complete any rollover of your 401(k)</strong> or choose to leave funds in the plan.</li>
              <li><strong>Decide whether to sign the separation agreement</strong> before the deadline and, if negotiating, secure written amendments.</li>
              <li><strong>Update your resume and network.</strong> Register for job-search sites and training courses.</li>
            </ul>
          </Prose>

          <SubSubTitle>Beyond 60 Days</SubSubTitle>
          <Prose>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>Continue job search and upskilling.</strong></li>
              <li><strong>Monitor immigration deadlines</strong> if on a visa.</li>
              <li><strong>Stay connected with support networks</strong> and consider forming or joining unions or worker councils.</li>
            </ul>
          </Prose>

          <SubTitle id="s11-resources">Resource Directory</SubTitle>
          <DataTable
            headers={["Topic", "Resources"]}
            rows={[
              [
                <strong key="r1">Severance and legal rights</strong>,
                "U.S. Equal Employment Opportunity Commission — Employee rights and severance agreements; Hamilton Law Firm article on FMLA and RIF terminations.",
              ],
              [
                <strong key="r2">WARN Act</strong>,
                "Employment Law Worldview article on remote workers and WARN Act; DOL WARN Act compliance assistance (dol.gov).",
              ],
              [
                <strong key="r3">COBRA and health insurance</strong>,
                <span key="r3a">U.S. Department of Labor — COBRA Continuation Coverage; <a href="https://healthcare.gov" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">Healthcare.gov</a> for Marketplace plans.</span>,
              ],
              [
                <strong key="r4">Unemployment benefits</strong>,
                "USA.gov — Unemployment benefits guide; state unemployment offices.",
              ],
              [
                <strong key="r5">401(k) and retirement</strong>,
                "Vanguard — What happens to your 401(k) when you quit your job?; IRS guidelines on rollovers.",
              ],
              [
                <strong key="r6">Immigration</strong>,
                "Greenberg Traurig article summarizing USCIS guidance on the 60-day grace period; your school's international office (for F-1 holders).",
              ],
              [
                <strong key="r7">Worker organizing</strong>,
                <span key="r7a">Tech Workers Coalition (<a href="https://techworkerscoalition.org" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">techworkerscoalition.org</a>); Emergency Workplace Organizing Committee (<a href="https://workerorganizing.org" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">workerorganizing.org</a>); Kickstarter United agreement details; Reuters coverage of Cher Scarlett case.</span>,
              ],
              [
                <strong key="r8">Mental health support</strong>,
                <span key="r8a">National Alliance on Mental Illness (<a href="https://nami.org" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">nami.org</a>); Crisis Text Line (text HOME to 741741); Employee Assistance Programs; local community support groups.</span>,
              ],
            ]}
          />

          <Callout>
            <p className="text-xs italic text-muted-foreground">
              This document is intended for informational purposes and does not
              constitute legal advice. Laws may change, and individual
              circumstances vary. Consult a qualified attorney or financial
              advisor for advice regarding your specific situation.
            </p>
          </Callout>

          {/* ══════════════════════════════════════════════════════════
              SUPPLEMENTAL GUIDES
          ══════════════════════════════════════════════════════════ */}

          <div className="mt-16">
            <div className="mb-2 h-0.5 w-full bg-primary-orange/20" />
            <h2 className="font-bebas text-2xl uppercase tracking-widest text-muted-foreground">
              Supplemental Guides
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Click any guide to expand it.
            </p>
          </div>

          {/* ── Guide A ── */}
          <GuideSection id="guide-a" letter="A" title="Severance Negotiation Tactical Guide">
            <Prose>
              <p>
                Being laid off is disruptive, but the terms of your exit
                aren&apos;t fixed. Employers often start with a low offer
                designed to protect their interests, not yours.
              </p>
              <p>
                This guide explains how to negotiate for a better severance
                package — whether you&apos;re advocating alone or as part of a
                group — and clarifies which items are negotiable, how to frame
                your requests, and when to seek professional help. It is not
                legal advice; consult an employment attorney for specific
                situations.
              </p>
            </Prose>

            <SubTitle>1. Individual vs Collective Negotiation</SubTitle>
            <SubSubTitle>Individual Negotiation (Informal)</SubSubTitle>
            <Prose>
              <p>
                When you are not covered by a union contract, severance terms
                are negotiated directly with your employer. Your leverage comes
                from factors such as tenure, performance and potential legal
                claims. These conversations occur privately and require
                preparation and persistence.
              </p>
            </Prose>
            <SubSubTitle>Collective Negotiation (Formal or Semi-Formal)</SubSubTitle>
            <Prose>
              <p>
                When coworkers organize together, they can present unified
                demands and designate spokespeople. Collective action can
                increase leverage — employers often prefer a single settlement
                rather than dozens of individual negotiations. Unionized workers
                like those at Kickstarter United negotiated four months of
                severance pay, continuation of healthcare for four to six months
                and recall rights for a year.
              </p>
              <p>
                Even without formal recognition, employees at Meta and Amazon
                organized petitions and shared spreadsheets to highlight
                disparities and push for better severance.
              </p>
            </Prose>

            <SubTitle>2. Preparation and Leverage</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong>Gather documents:</strong> Employment contract,
                  employee handbook, commission plans, RSU/stock option
                  agreements, performance reviews and the severance agreement.
                </li>
                <li>
                  <strong>Understand typical formulas:</strong> Many companies
                  calculate severance as{" "}
                  <strong>one to two weeks of pay per year of service</strong>.
                  This is a baseline, not a legal requirement.
                </li>
                <li>
                  <strong>Know your rights:</strong> Employees aged 40 or older
                  must be given at least <strong>21 days</strong> to consider a
                  severance agreement (45 days in group layoffs) and{" "}
                  <strong>7 days</strong> to revoke their signature.
                </li>
                <li>
                  <strong>Assess leverage:</strong> Tenure, performance
                  reviews, any legal claims and the employer&apos;s desire to
                  avoid negative publicity.
                </li>
                <li>
                  <strong>Consult professionals:</strong> If the agreement
                  contains a broad legal release, non-compete or complex
                  stock/RSU terms, speak with an employment attorney or
                  financial advisor.
                </li>
              </ul>
            </Prose>

            <SubTitle>3. What&apos;s Negotiable (and What Isn&apos;t)</SubTitle>
            <Prose>
              <p>
                The initial offer rarely reflects the maximum the employer can
                provide.
              </p>
            </Prose>
            <DataTable
              headers={["Item", "Why it matters", "Negotiation considerations"]}
              rows={[
                [
                  <strong key="ni1">Severance pay</strong>,
                  "Provides income while you transition.",
                  "Use the rule of thumb (one to two weeks per year) as a starting point. Employees with potential legal claims may negotiate higher payments.",
                ],
                [
                  <strong key="ni2">COBRA / health insurance premiums</strong>,
                  "Continuation of benefits is expensive if you pay full cost yourself.",
                  "Negotiate for the employer to pay some or all of your COBRA premiums for 3–6 months.",
                ],
                [
                  <strong key="ni3">Pro-rated bonuses and commissions</strong>,
                  "Bonuses and commissions may comprise a large part of your compensation.",
                  "Employers often try to withhold bonuses and commissions if you leave before payout. Demand pro-rata payment for work already performed — these are earned wages.",
                ],
                [
                  <strong key="ni4">Accelerated vesting of stock / RSUs</strong>,
                  "Unvested equity can be valuable.",
                  "Ask for additional months of vesting (e.g., 3–12 months); your leverage is strongest during layoffs.",
                ],
                [
                  <strong key="ni5">Non-compete and non-solicit clauses</strong>,
                  "Restrictive covenants can limit future employment.",
                  "Negotiate to eliminate these clauses or narrow their duration and geographic scope.",
                ],
                [
                  <strong key="ni6">References and non-disparagement</strong>,
                  "A neutral or positive reference affects future job searches.",
                  "Insist on a mutual non-disparagement clause and specify who can speak on the company's behalf.",
                ],
                [
                  <strong key="ni7">Unused vacation / PTO payout</strong>,
                  "Accrued paid time off is money you already earned.",
                  "Argue that unused PTO should be paid separately from severance. In some states, payout is legally required.",
                ],
                [
                  <strong key="ni8">Outplacement services</strong>,
                  "Services like resume coaching or job placement help speed your job search.",
                  "Ask the employer to provide or fund outplacement services.",
                ],
              ]}
            />
            <Prose>
              <p>
                <strong>Non-negotiable items:</strong> Final pay for hours
                worked, reimbursement of expenses and earned commissions are
                legal obligations and should not be part of the severance
                negotiation.
              </p>
            </Prose>

            <SubTitle>4. Framing and Negotiation Scripts</SubTitle>
            <Prose>
              <p>
                Keep discussions professional and collaborative. Thank the
                employer for the offer, then calmly explain why you deserve
                better terms. Sample phrases:
              </p>
              <blockquote className="border-l-4 border-primary-orange pl-4 italic text-foreground/75">
                <p>&quot;I&apos;d like to discuss some adjustments to the severance terms to better reflect my contributions to the company.&quot;</p>
                <p className="mt-2">&quot;Given my tenure and performance, I believe an extension of benefits or an increased payout would be fair.&quot;</p>
                <p className="mt-2">&quot;To help with the transition, I&apos;d be willing to [offer assistance, sign a non-disparagement clause, etc.] in exchange for additional severance.&quot;</p>
              </blockquote>
            </Prose>

            <SubTitle>5. Timing Strategy and Process</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Pause before signing.</strong> The law requires employers to provide older employees at least 21 days to review.</li>
                <li><strong>Review and compare.</strong> Carefully read every clause. Compare your offer with those of coworkers where permissible.</li>
                <li><strong>Consult professionals and prepare a counteroffer.</strong> Draft a list of desired changes and be prepared to justify each request.</li>
                <li><strong>Negotiate and document.</strong> Conduct conversations via email or in meetings. After reaching agreement, ensure all terms are documented in writing.</li>
              </ul>
            </Prose>

            <SubTitle>6. Individual vs Collective: Comparison</SubTitle>
            <DataTable
              headers={["", "Individual Negotiation", "Collective Negotiation"]}
              rows={[
                ["Structure", "One-on-one discussions with HR or management.", "Group of affected employees presents unified demands through designated representatives."],
                ["Leverage", "Based on personal tenure, performance and potential legal claims.", "Amplified by numbers and potential public scrutiny."],
                ["Outcomes", "May yield incremental increases in pay, extended benefits.", "Can achieve broader improvements — e.g., Kickstarter United secured four months' severance."],
                ["Risk", "Lower visibility; outcomes are limited to your own package.", "Greater visibility; potential for retaliation or blacklisting. Group context offers solidarity."],
                ["Suitability", "Useful if you're negotiating a unique role or have distinct leverage.", "Best when multiple workers face similar terms and want consistent improvements."],
              ]}
            />

            <SubTitle>7. Red Flags and Pitfalls to Avoid</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Signing under pressure.</strong> Employees over 40 must receive a 21-day review period and 7-day revocation window.</li>
                <li><strong>Waiving rights unknowingly.</strong> Ensure you understand what you&apos;re giving up, especially regarding discrimination, retaliation or unpaid wages.</li>
                <li><strong>Overlooking restrictive covenants.</strong> Non-compete and non-solicitation clauses can severely limit future job opportunities.</li>
                <li><strong>Failing to negotiate bonuses, commissions and equity.</strong> These are earned wages and should be requested separately.</li>
                <li><strong>Relying on verbal agreements.</strong> All negotiated terms must be documented in writing.</li>
                <li><strong>Letting emotions dictate strategy.</strong> Stay calm and professional.</li>
              </ul>
            </Prose>

            <SubTitle>Conclusion</SubTitle>
            <Prose>
              <p>
                Negotiating your severance package is about more than securing
                a few extra weeks of pay; it&apos;s about safeguarding your
                financial stability and future career. Employers&apos; first
                offers are rarely final.
              </p>
              <p>
                By understanding your leverage, preparing thoroughly and framing
                your requests professionally, you can often improve the terms.
                Whether negotiating alone or with others, take the time to
                review, seek advice and document every agreement — your next
                chapter starts with the exit you secure today.
              </p>
            </Prose>
          </GuideSection>

          {/* ── Guide B ── */}
          <GuideSection id="guide-b" letter="B" title="Health Insurance Decision System for Laid-Off Workers">
            <Prose>
              <p>
                This guide provides a structured system to help workers choose
                a health-insurance option after losing employer coverage. Each
                section includes decision points, cost comparisons, timing
                traps and tips for maintaining care.
              </p>
            </Prose>

            <SubTitle>1. Understand Your Current Coverage</SubTitle>
            <Prose>
              <p>
                Before evaluating options, confirm{" "}
                <strong>when your employer-sponsored coverage ends</strong>.
                Many companies terminate coverage at the end of the month in
                which you leave; others end it immediately on your last day.
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Qualifying event notice</strong> — Employers must notify their health plan within <strong>30 days</strong>.</li>
                <li><strong>COBRA election notice</strong> — The plan has <strong>14 days</strong> after being notified to send you an election notice.</li>
              </ul>
            </Prose>

            <SubTitle>2. Overview of Options</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>COBRA continuation coverage</strong> — Stay on your employer&apos;s plan and pay the full premium plus up to a 2% administration fee.</li>
                <li><strong>Marketplace plan</strong> — Buy a policy through the ACA Marketplace. Special-enrollment rules apply, and subsidies may reduce the cost if your income qualifies.</li>
                <li><strong>Medicaid</strong> — A state program providing free or low-cost coverage to those with incomes below ~138% of the federal poverty level in states that expanded Medicaid.</li>
                <li><strong>Spouse&apos;s or domestic partner&apos;s plan</strong> — Enroll in a partner&apos;s employer plan.</li>
                <li><strong>Short-term plans</strong> — Temporary plans that may fill a gap but often exclude pre-existing conditions and essential benefits.</li>
              </ul>
            </Prose>

            <SubTitle>3. Decision Tree</SubTitle>
            <Prose>
              <ol className="ml-4 list-decimal space-y-4">
                <li>
                  <strong>Are you eligible for Medicaid?</strong> If your projected annual income is below 138% FPL (~$15,960 for an individual in 2026), you may qualify. If yes, apply — it is often free or low cost. If no, continue.
                </li>
                <li>
                  <strong>Do you need continuous care?</strong> If yes (keeping your doctors and prescriptions), COBRA may be safest. If no (minimal needs), a Marketplace plan may be cheaper.
                </li>
                <li>
                  <strong>Are you likely to qualify for Marketplace subsidies?</strong> If your projected income is between 100% and 400% FPL, you qualify for premium tax credits. In 2026, a Silver plan costs an average of $752/month before subsidies, Bronze ~$573/month, Platinum ~$1,012/month.
                </li>
                <li>
                  <strong>Do you have access to a spouse&apos;s employer plan?</strong> Employer plans often cost ~$120/month for the employee. If considered affordable by ACA standards, you cannot receive Marketplace subsidies.
                </li>
                <li>
                  <strong>Do you expect to start a new job soon?</strong> If yes (1–2 months), consider COBRA for a short period then drop it. If no, choose a plan for long-term stability.
                </li>
              </ol>
            </Prose>

            <SubTitle>4. Cost Comparisons</SubTitle>
            <DataTable
              headers={["Coverage type", "Avg. monthly premium (individual)", "Notes"]}
              rows={[
                [<strong key="c1">COBRA</strong>, "$400–$700 per person; family can exceed $1,500", "Full employer + employee share plus up to 2% fee."],
                [<strong key="c2">Marketplace Silver (ACA)</strong>, "$752/month on average", "Bronze ~$573; Platinum ~$1,012. Subsidies apply if income is 100–400% FPL."],
                [<strong key="c3">Employer coverage (when employed)</strong>, "$120/month avg. for employee", "Provided for comparison."],
                [<strong key="c4">Medicaid</strong>, "$0 or minimal", "For incomes <138% FPL in expansion states."],
                [<strong key="c5">Short-term plan</strong>, "Varies; often cheaper than Marketplace", "Excludes pre-existing conditions; last resort only."],
              ]}
            />

            <SubTitle>5. Timing Traps</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>COBRA election window</strong> — You have <strong>60 days</strong> from the later of your coverage end date or the COBRA election notice.</li>
                <li><strong>Marketplace special-enrollment window</strong> — Apply within <strong>60 days</strong> of losing job-based insurance. Coverage starts the first day of the following month.</li>
                <li><strong>Spouse&apos;s plan enrollment</strong> — Most employer plans allow mid-year enrollment when a spouse loses coverage.</li>
                <li><strong>New job waiting periods</strong> — If your next employer has a 30–90 day waiting period, plan coverage accordingly.</li>
                <li><strong>Don&apos;t forget dependents</strong> — Each family member must be listed on the COBRA election form.</li>
              </ul>
            </Prose>

            <SubTitle>6. Prescription Continuity Tips</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Ask for a 90-day supply</strong> to reduce refill frequency.</li>
                <li><strong>Set up automatic refills and home delivery.</strong></li>
                <li><strong>Check formularies</strong> when considering Marketplace plans.</li>
                <li><strong>Use discount programs</strong> like GoodRx if temporarily uninsured.</li>
                <li><strong>Request medical records</strong> in case you need to switch pharmacies or doctors.</li>
              </ul>
            </Prose>

            <SubTitle>7. Summary and Next Steps</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Gather information:</strong> Find out when your coverage ends and read your COBRA notice.</li>
                <li><strong>Estimate your annual household income</strong> to determine Medicaid or subsidy eligibility.</li>
                <li><strong>Compare costs and networks</strong> using the decision tree above.</li>
                <li><strong>Avoid timing traps:</strong> Mark the 60-day election window for both COBRA and Marketplace.</li>
                <li><strong>Negotiate where possible:</strong> Ask your employer to contribute to COBRA premiums during severance.</li>
                <li><strong>Maintain medication supply:</strong> Switch to 90-day prescriptions and set up auto-refills.</li>
              </ul>
            </Prose>
          </GuideSection>

          {/* ── Guide C ── */}
          <GuideSection id="guide-c" letter="C" title="Unemployment Benefits & Financial Protection: Deep-Dive Guide">
            <SubTitle>1. Overview of Unemployment Insurance (UI)</SubTitle>
            <Prose>
              <p>
                Unemployment insurance is not a federal benefit; each state runs
                its own program and pays benefits. States set their own
                eligibility rules, benefit amounts, work-search requirements and
                appeal procedures.
              </p>
              <p>
                <strong>Where to file:</strong> You usually file in the{" "}
                <strong>state where you worked</strong>. If you worked remotely
                or in a state different from where you live, contact your home
                state&apos;s unemployment office for help filing an interstate
                claim.
              </p>
            </Prose>

            <SubSubTitle>State Differences and Severance Interplay</SubSubTitle>
            <Prose>
              <p>Three major approaches exist:</p>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Non-deductible states:</strong> Severance does not reduce UI benefits. Examples: California, Washington, Kentucky, West Virginia.</li>
                <li><strong>Allocation/offset states:</strong> Severance is prorated over a number of weeks. Benefits are reduced dollar-for-dollar above a threshold.</li>
                <li><strong>Strict disqualification states:</strong> Severance is treated as wage continuation, so you cannot receive UI during the period covered by severance. Examples: Texas, Connecticut.</li>
              </ul>
            </Prose>

            <SubTitle>2. Filing &amp; Eligibility</SubTitle>
            <Prose>
              <p>To qualify in most states, you must:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Lose your job through no fault of your own (e.g., layoff).</li>
                <li>Earn sufficient wages in the &quot;base period&quot; set by your state.</li>
                <li>Be able and available to work.</li>
                <li>Actively look for a new job and keep records.</li>
              </ul>
            </Prose>

            <SubSubTitle>Common Mistakes That Delay or Deny Claims</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Not reporting earnings:</strong> You must report all wages from part-time or temporary work each week.</li>
                <li><strong>Not looking for work:</strong> Many states deny benefits if you don&apos;t actively seek work or keep records.</li>
                <li><strong>Being unavailable:</strong> Issues like lack of transportation or childcare can affect eligibility.</li>
                <li><strong>Assuming automatic eligibility:</strong> You must file a claim even if you paid into the system.</li>
              </ul>
            </Prose>

            <SubTitle>3. Severance &amp; Unemployment Benefits</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Severance counts as remuneration</strong> in many states, reducing benefits for the weeks to which the payment is allocated.</li>
                <li><strong>Lump-sum payments:</strong> If allocated to future weeks, benefits are reduced in those weeks.</li>
                <li><strong>Salary continuation:</strong> Weekly or monthly severance payments can delay benefits until payments end.</li>
              </ul>
            </Prose>

            <SubTitle>4. Maximizing Your Benefits</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>File promptly.</strong> Apply as soon as you become unemployed.</li>
                <li><strong>Gather documentation:</strong> Separation notices, pay stubs and severance agreements.</li>
                <li><strong>Keep meticulous records:</strong> Maintain a log of job searches (dates, employers contacted, outcomes).</li>
                <li><strong>Certify weekly</strong> on time, reporting any income.</li>
                <li><strong>Attend reemployment services</strong> as required.</li>
                <li><strong>Explore training programs:</strong> Some states waive work-search requirements for approved training programs.</li>
              </ul>
            </Prose>

            <SubTitle>5. Appeals: Don&apos;t Be Afraid to Challenge a Denial</SubTitle>
            <Prose>
              <p>
                If your claim is denied, you have a limited time (often 14–21
                days) to file an appeal. U.S. Department of Labor data show that{" "}
                <strong>28.7%</strong> of claimants succeed at lower-authority
                appeals and <strong>10.7%</strong> at higher-authority appeals.
              </p>
              <p>
                Bring documentation such as termination letters, severance
                agreements, pay stubs and job-search logs. Consider legal aid
                clinics or employment attorneys if your case is complex.
              </p>
            </Prose>

            <SubTitle>6. Resources &amp; How to Apply</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>USA.gov Unemployment Benefits Guide</strong> — A comprehensive starting point linking to state agencies.</li>
                <li><strong>CareerOneStop</strong> — Sponsored by the U.S. Department of Labor; allows you to choose your state and find application links.</li>
                <li><strong>State unemployment websites:</strong> California EDD, Texas Workforce Commission, New York NYSDOL, Washington ESD, Florida DEO.</li>
                <li><strong>Job centers and hotlines:</strong> National toll-free number: 1-877-US2-JOBS.</li>
                <li><strong>Legal aid and worker centers</strong> like the National Employment Law Project.</li>
              </ul>
            </Prose>
          </GuideSection>

          {/* ── Guide D ── */}
          <GuideSection id="guide-d" letter="D" title="Mental Health & Stabilization Guide">
            <Prose>
              <p>
                Job loss can bring a cascade of emotions. Even when layoffs are
                expected, they often trigger shock, anger, sadness, relief or a
                mix of all four. These responses are not a sign of weakness;
                they are normal reactions to a major life disruption.
              </p>
            </Prose>

            <SubTitle>Immediate Stabilization (First 72 Hours)</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Acknowledge your feelings.</strong> Allow yourself to experience whatever comes up. Suppressing emotions can prolong distress.</li>
                <li><strong>Limit major decisions.</strong> If possible, avoid making big financial or life decisions in the first few days.</li>
                <li><strong>Take care of your body.</strong> Eat regular meals, stay hydrated and aim for consistent sleep. Avoid excessive alcohol or drug use.</li>
                <li><strong>Stay connected.</strong> Reach out to family, friends or colleagues. Isolation can magnify stress.</li>
                <li><strong>Ground yourself in routine.</strong> Even small daily tasks can provide a sense of control.</li>
              </ul>
            </Prose>

            <SubTitle>Understanding Layoff-Specific Stress</SubTitle>
            <SubSubTitle>Common Emotional Reactions</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Shock/denial:</strong> You may feel numb or find it hard to believe what happened.</li>
                <li><strong>Anger/irritability:</strong> Anger towards your employer or yourself often masks fear or hurt.</li>
                <li><strong>Sadness/grief:</strong> A job provides structure, social connection and identity.</li>
                <li><strong>Anxiety/fear:</strong> Worrying about finances, your career and the future is common.</li>
                <li><strong>Relief:</strong> Some people experience relief — especially if the job was stressful.</li>
              </ul>
            </Prose>
            <SubSubTitle>Common Physical Reactions</SubSubTitle>
            <Prose>
              <p>
                Fatigue/low energy; sleep disturbances; changes in
                appetite/weight; headaches, stomach upset, muscle tension. If
                symptoms persist for more than a couple of weeks or interfere
                with your ability to function, consider seeking professional
                support.
              </p>
            </Prose>

            <SubTitle>Coping Strategies</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Maintain supportive relationships.</strong> Support groups for job seekers provide connection and validation.</li>
                <li><strong>Take care of your body.</strong> Regular exercise lowers stress and improves mood.</li>
                <li><strong>Practice mindfulness and relaxation.</strong> Deep breathing, meditation, yoga, or guided meditation apps.</li>
                <li><strong>Write or journal.</strong> Writing down thoughts and feelings provides clarity and can reduce rumination.</li>
                <li><strong>Engage in meaningful activities.</strong> Pursue hobbies, volunteer work or creative projects.</li>
                <li><strong>Set small goals.</strong> Break tasks into manageable steps.</li>
              </ul>
            </Prose>

            <SubTitle>Where to Go for Help</SubTitle>
            <SubSubTitle>Urgent or Crisis Support</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text 988 for free confidential support 24/7.</li>
                <li><strong>Veterans Crisis Line:</strong> Call 988 and press 1, text 838255.</li>
                <li><strong>Maternal Mental Health Hotline:</strong> Call or text 1-833-TLC-MAMA.</li>
                <li><strong>SAMHSA Disaster Distress Helpline:</strong> Call or text 1-800-985-5990.</li>
              </ul>
            </Prose>
            <SubSubTitle>Free and Low-Cost Therapy</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Employee Assistance Programs (EAPs):</strong> Free, confidential counseling and referrals. Ask your HR department for contact details. Using EAP services does not typically affect your employment record.</li>
                <li><strong>Community mental health centers:</strong> Local government or nonprofit clinics often offer sliding-scale counseling.</li>
                <li><strong>Nonprofit helplines and support groups:</strong> NAMI, Mental Health America, and local job-search support groups.</li>
                <li><strong>Online therapy platforms:</strong> Teletherapy services may offer lower costs and more flexible scheduling.</li>
                <li><strong>FindSupport.gov / Psychology Today Therapist Directory</strong> for finding licensed therapists.</li>
              </ul>
            </Prose>

            <SubTitle>Additional Self-Care Suggestions</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Structure your day.</strong> Balance job-search activities with self-care, social connection and relaxation.</li>
                <li><strong>Limit news consumption.</strong> Constantly checking news about layoffs can increase anxiety.</li>
                <li><strong>Practice gratitude.</strong> Writing down three things you&apos;re grateful for each day can help reframe negative thoughts.</li>
                <li><strong>Explore new skills.</strong> Use free or low-cost online courses to restore confidence.</li>
              </ul>
              <p className="text-xs italic text-muted-foreground">
                This guide is not a substitute for professional mental health
                care. If you or someone you know is in crisis, contact emergency
                services or a crisis hotline immediately.
              </p>
            </Prose>
          </GuideSection>

          {/* ── Guide E ── */}
          <GuideSection id="guide-e" letter="E" title="Immigration Survival Manual: Navigating Layoffs on H-1B & F-1 Visas">
            <Prose>
              <p>
                This guide is designed for employees on non-immigrant visas who
                are laid off or fear a layoff. It explains timelines, legal
                options and practical strategies for maintaining legal status in
                the United States.{" "}
                <strong>It is not legal advice</strong> — consult a qualified
                immigration attorney for case-specific guidance.
              </p>
            </Prose>

            <SubTitle>1. Immediate Timeline Overview</SubTitle>
            <Prose>
              <p>
                The critical countdown begins on your{" "}
                <strong>last day of work</strong>, not when severance or
                garden-leave pay ends.
              </p>
            </Prose>
            <DataTable
              headers={["Visa category", "Grace period after termination", "Notes"]}
              rows={[
                [
                  <strong key="v1">H-1B (specialty occupation)</strong>,
                  "Up to 60 days from last day of work or until I-94 expiration, whichever is shorter.",
                  "Discretionary; USCIS may shorten it. Leaving the U.S. ends the grace period immediately.",
                ],
                [
                  <strong key="v2">E-1/E-2/E-3, L-1, O-1, H-1B1, TN, etc.</strong>,
                  "Up to 60 days under the same regulation that applies to H-1B.",
                  "Always check your I-94; the grace period cannot extend beyond visa validity.",
                ],
                [
                  <strong key="v3">F-1 OPT (12 months)</strong>,
                  "90 days total unemployment permitted.",
                  "Unpaid internships and certain contract work count as employment if related to field.",
                ],
                [
                  <strong key="v4">F-1 STEM OPT Extension (24 months)</strong>,
                  "Additional 60 days, for a total of 150 days across the entire 36-month OPT period.",
                  "Only paid employment with E-Verify employers counts; unpaid work is not allowed.",
                ],
              ]}
            />
            <Callout>
              <p>
                <strong>The grace period cannot extend beyond the expiration date on your Form I-94.</strong> If your I-94 expires 25 days after job loss, your grace period is only 25 days.
              </p>
              <p className="mt-2">
                <strong>Leaving the U.S. ends the grace period.</strong> If you exit the country, you cannot re-enter on the same H-1B to use the remainder.
              </p>
            </Callout>

            <SubTitle>2. Strategy Options</SubTitle>
            <SubSubTitle>Transfer to a New Employer (H-1B Portability)</SubSubTitle>
            <Prose>
              <p>
                A new employer must file a <strong>Form I-129</strong> within
                the 60-day grace period. Once the petition is filed and receipt
                is issued, you may begin working for the new employer. Avoid
                starting work before the petition is filed — this counts as
                unauthorized employment.
              </p>
            </Prose>
            <SubSubTitle>Change of Status</SubSubTitle>
            <Prose>
              <p>If new H-1B employment is not possible:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Student (F-1) or dependent (H-4, L-2) visas:</strong> File a change-of-status application before the grace period ends.</li>
                <li><strong>Visitor (B-1/B-2) visa:</strong> A temporary bridge to prepare for departure or future plans. You cannot work on a visitor visa.</li>
                <li><strong>Adjustment of status (green card):</strong> Only possible if you have an approved I-140 and a current priority date.</li>
              </ul>
            </Prose>
            <SubSubTitle>Return Home and Prepare for Reentry</SubSubTitle>
            <Prose>
              <p>
                Departing the U.S. within the grace period avoids unlawful
                presence. You may later return with a new petition from another
                employer — often without going through the H-1B lottery if you
                were previously counted.
              </p>
            </Prose>

            <SubTitle>3. F-1 Student Survival: OPT and STEM OPT</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Standard OPT:</strong> Up to 90 days of unemployment.</li>
                <li><strong>STEM OPT Extension:</strong> Adds 60 days for a total of 150 days across both periods. Only paid employment with an E-Verify employer counts.</li>
                <li>Days spent outside the U.S. after termination count toward unemployment.</li>
                <li>Filing a STEM OPT application does <strong>not</strong> pause the unemployment clock.</li>
              </ul>
            </Prose>

            <SubTitle>4. What Not to Do</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Don&apos;t overstay the grace period.</strong> Creates unlawful presence and can trigger three- or ten-year reentry bars.</li>
                <li><strong>Don&apos;t work without authorization.</strong> Working before filing the petition is unauthorized employment.</li>
                <li><strong>Don&apos;t rely solely on severance.</strong> The grace period begins on the last work day, not the end of severance pay.</li>
                <li><strong>Don&apos;t leave and attempt to re-enter on the same visa during the grace period.</strong> Exiting the U.S. ends the H-1B grace period.</li>
                <li><strong>Don&apos;t ignore dependents.</strong> H-4 and F-2 dependents must also depart or change status.</li>
              </ul>
            </Prose>

            <SubTitle>5. Action Steps &amp; Resources</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Check your I-94 expiration immediately</strong> using the CBP online portal.</li>
                <li><strong>Contact an immigration attorney.</strong> Timely, case-specific advice is essential.</li>
                <li><strong>Notify your DSO</strong> if on F-1 OPT or STEM OPT. SEVIS reporting is mandatory.</li>
                <li><strong>Prepare documents for new employers:</strong> Resume, prior H-1B approval notices, passport, visa stamp, I-94, pay stubs.</li>
                <li><strong>Monitor USCIS announcements.</strong> Immigration policy evolves.</li>
                <li><strong>Join support communities</strong> of other visa holders who have navigated layoffs.</li>
              </ul>
            </Prose>
          </GuideSection>

          {/* ── Guide F ── */}
          <GuideSection id="guide-f" letter="F" title="Collective Action and Organizing Playbook">
            <Prose>
              <p>
                This playbook is designed to help workers understand what
                collective organizing looks like, how to pursue it safely, and
                how to weigh the risks and benefits. The goal is to provide a
                roadmap for those who want more than individual survival.
              </p>
            </Prose>

            <SubTitle>1. Why Organize?</SubTitle>
            <Prose>
              <p>
                Layoffs often leave workers feeling powerless. Acting together
                can change that. Under U.S. labor law, workers have the right
                to join together to improve wages and working conditions — this
                is called <strong>concerted activity</strong>. Even without a
                formally recognized union, employees can petition management,
                march on their boss or raise issues collectively.
              </p>
            </Prose>

            <SubTitle>2. What Is Collective Organizing?</SubTitle>
            <SubSubTitle>Concerted Activity</SubSubTitle>
            <Prose>
              <p>
                Concerted activity refers to actions taken by workers together
                to improve wages, hours or working conditions. These activities
                are protected under <strong>Section 7 of the National Labor
                Relations Act (NLRA)</strong> for most private-sector employees.
                Government employees, agricultural workers, independent
                contractors and supervisors are excluded.
              </p>
            </Prose>
            <SubSubTitle>Informal vs. Formal Organizing</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Informal organizing</strong> — Without a union contract, workers rely on petitions, open letters, spreadsheets and public pressure. Demands may be met voluntarily or ignored.</li>
                <li><strong>Formal organizing</strong> — Forming or joining a union brings the right to bargain collectively. This involves signing authorization cards, filing with the NLRB, holding a secret-ballot election and negotiating a contract.</li>
              </ul>
            </Prose>

            <SubTitle>3. Step-by-Step Organizing Guide</SubTitle>
            <SubSubTitle>3.1 Identify Shared Grievances</SubSubTitle>
            <Prose>
              <p>
                Talk to co-workers about wages, severance terms, working
                conditions and layoffs. Make sure you tie the issue to the group
                (e.g., &quot;We deserve better severance&quot;). Find common goals: higher
                severance, extended health benefits, immigration accommodations.
              </p>
            </Prose>
            <SubSubTitle>3.2 Build a Core Group</SubSubTitle>
            <Prose>
              <p>
                Nominate 3–5 trusted colleagues to coordinate communication.
                Determine whether to remain an informal committee or begin
                signing union authorization cards.
              </p>
            </Prose>
            <SubSubTitle>3.3 Secure Your Communications</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-1">
                <li>Do not organize via company email, Slack or internal chat. Use Signal, ProtonMail or personal phones.</li>
                <li>Collect personal contact info (phone numbers and non-work emails) in case accounts are disabled.</li>
                <li>Avoid company devices for organizing documents.</li>
              </ul>
            </Prose>
            <SubSubTitle>3.4 Develop Clear Demands</SubSubTitle>
            <Prose>
              <p>
                Be specific: &quot;12 weeks severance per year of service,&quot; &quot;extended
                COBRA for 6 months,&quot; &quot;recall rights for laid-off staff.&quot; Vague
                wish lists are easier to dismiss.
              </p>
            </Prose>
            <SubSubTitle>3.5 Choose Your Action</SubSubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Petitions and open letters</strong> — Gather signatures and present demands to management. Protected as concerted activity.</li>
                <li><strong>Public spreadsheets</strong> — Sharing information about severance or wages builds solidarity.</li>
                <li><strong>Work-to-rule or sick-outs</strong> — Groups may strictly follow job descriptions or take coordinated time off.</li>
                <li><strong>Walk-outs and strikes</strong> — Temporarily withholding labor is among the strongest tactics but carries higher risk.</li>
                <li><strong>Union election and bargaining</strong> — Sign cards, file with the NLRB and hold an election for a binding agreement.</li>
              </ul>
            </Prose>

            <SubTitle>4. Rights and Protections Under U.S. Law</SubTitle>
            <Prose>
              <p>
                Section 7 of the NLRA protects employees&apos; right to engage
                in &quot;concerted activities for the purpose of collective
                bargaining or other mutual aid or protection.&quot;
              </p>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Protected acts:</strong> Petitions, group discussions about pay or severance, open letters, marches on the boss and strikes when tied to working conditions.</li>
                <li><strong>Excluded categories:</strong> Government employees, agricultural workers, independent contractors and supervisors.</li>
                <li><strong>Documenting retaliation:</strong> Keep records of adverse actions like firing, demotion or reduced hours.</li>
                <li><strong>Filing a charge:</strong> You can file with the NLRB without a lawyer within six months of the retaliation.</li>
              </ul>
            </Prose>
            <SubSubTitle>Retaliation and Blacklisting</SubSubTitle>
            <Prose>
              <p>
                Retaliation is illegal, but it happens. Mapbox workers reported
                that after a failed union election, organizers were fired or
                given poor performance reviews. Mozilla agreed to pay $300,000
                to settle allegations that it refused to hire Cher Scarlett
                because of her labor activism. These cases highlight that while
                legal remedies exist, activism can impact career prospects.
              </p>
            </Prose>

            <SubTitle>5. Case Studies</SubTitle>
            <SubSubTitle>Kickstarter United — A Union Success Story</SubSubTitle>
            <Prose>
              <p>
                Kickstarter staff formed Kickstarter United, affiliated with
                OPEIU. Within two months they negotiated four months of salary
                for laid-off employees, four to six months of continued health
                insurance, recall rights for a year and release from
                non-compete clauses.
              </p>
            </Prose>
            <SubSubTitle>Google Employees&apos; Open Letter</SubSubTitle>
            <Prose>
              <p>
                In March 2023, more than 1,300 Google employees signed an open
                letter to CEO Sundar Pichai demanding a humane layoff process —
                freezing new hiring before layoffs, offering voluntary
                redundancies and giving laid-off workers priority for open
                roles. Organized via Discord and supported by the Alphabet
                Workers Union.
              </p>
            </Prose>
            <SubSubTitle>Mapbox Workers Union — Risks of Organizing</SubSubTitle>
            <Prose>
              <p>
                Mapbox workers attempted to form a union in 2021. During the
                election, 81 voted in favor and 123 against. Organizers alleged
                management retaliated by firing or intimidating union
                supporters, leading to unfair labor practice charges.
              </p>
            </Prose>
            <SubSubTitle>Make Amazon Pay — Global Protest</SubSubTitle>
            <Prose>
              <p>
                On Black Friday 2022, thousands of Amazon warehouse workers
                across more than 30 countries walked out as part of the &quot;Make
                Amazon Pay&quot; campaign, coordinated by UNI Global Union,
                Progressive International, Oxfam and Greenpeace.
              </p>
            </Prose>

            <SubTitle>6. Risk Analysis</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li><strong>Retaliation</strong> — Employers may respond with firings, demotions, poor performance reviews or threats.</li>
                <li><strong>Blacklisting</strong> — Prospective employers may avoid hiring known activists.</li>
                <li><strong>Immigration status</strong> — Workers on visas may have limited time to find new employment.</li>
                <li><strong>Financial cushion</strong> — Assess whether you can withstand a period without income if retaliation occurs.</li>
              </ul>
            </Prose>

            <SubTitle>7. External Organizations and Resources</SubTitle>
            <Prose>
              <ul className="ml-4 list-disc space-y-2">
                <li>
                  <strong>Tech Workers Coalition (TWC)</strong> — International network supporting solidarity and organizing.{" "}
                  <a href="https://techworkerscoalition.org" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">techworkerscoalition.org</a>
                </li>
                <li>
                  <strong>Emergency Workplace Organizing Committee (EWOC)</strong> — Joint project of DSA and United Electrical workers.{" "}
                  <a href="https://workerorganizing.org" target="_blank" rel="noopener noreferrer" className="text-primary-orange hover:underline">workerorganizing.org</a>
                </li>
                <li><strong>Alphabet Workers Union</strong> — Minority union of Google employees.</li>
                <li><strong>Traditional unions (CWA, OPEIU, SEIU)</strong> — Many national unions have tech worker locals or campaigns.</li>
              </ul>
            </Prose>

            <SubTitle>8. Summary</SubTitle>
            <Prose>
              <p>
                Collective action is a powerful tool for workers facing layoffs.
                By organizing with co-workers, you can negotiate better
                severance, influence company policies and build long-term worker
                power. Successful campaigns like Kickstarter United show that
                formal unionization can win significant gains, while informal
                efforts like the Google open letter demonstrate the potential of
                petitions and open letters.
              </p>
              <p>
                However, organizing carries risks — retaliation, blacklisting
                and legal battles are real. Use this playbook to navigate those
                challenges, evaluate your options and connect with organizations
                that can help you and your co-workers build solidarity.
              </p>
            </Prose>
          </GuideSection>

          {/* Bottom disclaimer */}
          <div className="mt-16 border-t border-border pt-8">
            <p className="text-xs leading-relaxed text-muted-foreground">
              This document is intended for informational purposes and does not
              constitute legal advice. Laws may change, and individual
              circumstances vary. Consult a qualified attorney or financial
              advisor for advice regarding your specific situation.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}
