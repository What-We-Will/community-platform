import type { ReactNode } from "react";

// ─── Internal primitives (mirrors the resource-guide content vocabulary) ──────

function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="mt-12 scroll-mt-20">
      <h2 className="font-bebas text-3xl uppercase text-primary-orange sm:text-4xl">
        {children}
      </h2>
      <div className="mt-1 h-0.5 w-full bg-primary-orange" aria-hidden="true" />
    </div>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-base leading-relaxed">{children}</p>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 list-disc space-y-1 pl-6 text-base leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ─── Source copy (What We Will Community Guidelines) ─────────────────────────

const GUIDING_PRINCIPLES = [
  "Tech is Not Neutral, Nor is It Apolitical",
  "Intention without Strategy is Chaos",
  "Lack of Inclusion is a Risk/Crisis Management Issue",
  "Prioritize the Most Vulnerable",
];

const ALLY_TIPS = [
  "Assume good intent.",
  "Listen and question to understand.",
  "Acknowledge and respect differences and similarities.",
  "Learning leaves; stories/names stay here.",
  "Seek common ground.",
  "Speak from your own experience.",
  "Listen for facts, feelings, and needs, not tone.",
  "Trust marginalized peoples' emotional responses.",
  "Embrace discomfort.",
  "Accept responsibility for unintended impact.",
];

const EXPECTED_BEHAVIORS = [
  "Participate authentically and actively. In doing so, you contribute to the health of this community.",
  "Exercise consideration and respect in your speech and actions. This does NOT include tone policing the voices of the marginalized and most vulnerable.",
  "Attempt collaboration before conflict.",
  "Refrain from demeaning, discriminatory, or harassing behavior and speech.",
];

const GUIDELINES: { title: string; body?: ReactNode }[] = [
  { title: "We practice solidarity, not charity." },
  {
    title: "Confidentiality is the default.",
    body: (
      <>
        <Paragraph>
          Our members are people, not leads. Please do not collect, scrape,
          export, or extract member information. Using our space to build sales
          or marketing lists for outreach without permission will result in
          immediate removal.
        </Paragraph>
        <Paragraph>
          If you see something that doesn&apos;t sit right — a rude comment,
          spam, anything off — please DM one of the Admins or submit a report
          through the workflow.
        </Paragraph>
      </>
    ),
  },
  {
    title: "Critique systems, not people.",
    body: (
      <Paragraph>
        Bad employer behavior exists, so does harmful AI deployment, and unjust
        policies. It&apos;s fair game to call all that out. It is not okay to
        harass, dox, or target individuals (specific managers, co-workers, or
        other business representatives) by name in ways meant to incite public
        backlash. Channel anger at the structure, not at people either in this
        space or individually in society.
      </Paragraph>
    ),
  },
  {
    title: "Respect people's names, pronouns, identities, and boundaries.",
    body: (
      <>
        <Paragraph>
          Everyone deserves to feel respected — regardless of race, gender,
          sexuality, ability, nationality, caste, background, belief, or where
          they are in their journey. Disrespect, harassment, or discrimination
          of any kind will not be tolerated.
        </Paragraph>
        <Paragraph>
          Harassing defined: to annoy persistently; to create an unpleasant or
          hostile situation for, especially by uninvited and unwelcome verbal or
          physical conduct.
        </Paragraph>
        <Paragraph>The following behaviors are expected and requested:</Paragraph>
        <BulletList items={EXPECTED_BEHAVIORS} />
      </>
    ),
  },
  {
    title: "This is an organizing space, not a venting space.",
    body: (
      <Paragraph>
        We are a supportive community, and as such, we ask that you keep venting
        to private spaces and be respectful of others&apos; beliefs, backgrounds,
        and personal choices.
      </Paragraph>
    ),
  },
  {
    title: "Be mindful of crisis moments.",
    body: (
      <Paragraph>
        We are a supportive community, and we offer a safe place to go during a
        layoff. Please be mindful of crisis moments such as layoffs and other
        forms of income loss. We ask that you be supportive and only offer help
        when it is asked for and appropriate.
      </Paragraph>
    ),
  },
  {
    title:
      "Self-promotion has a time and place; be mindful of when it is appropriate.",
    body: (
      <Paragraph>
        We are here to support you in any aspect that pertains to our mission
        statement and directives. As such, we ask that you limit self-promotion
        to appropriate topics and subject matter such as projects and
        initiatives that are in line with the organization&apos;s goals and
        beliefs.
      </Paragraph>
    ),
  },
  {
    title: "Moderators are workers too.",
    body: (
      <Paragraph>
        Our moderators are workers and operate on a volunteer basis. Please
        respect their time, efforts, and boundaries.
      </Paragraph>
    ),
  },
  {
    title:
      "We advocate for mindful use of technology and companies that support ethics over profits.",
    body: (
      <Paragraph>
        We ask that you refrain from using AI in this space. AI is a powerful
        tool, but this space is built for genuine human connection.
      </Paragraph>
    ),
  },
  { title: "Mentorship and learning are always welcome." },
];

/**
 * The single source of truth for the Community Guidelines copy.
 *
 * Rendered both on the standalone /community-guidelines page and (via a link)
 * from the onboarding agreement step, so the text members agree to is always
 * the text they can read.
 */
export function GuidelinesContent() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-bebas text-4xl uppercase text-primary-orange sm:text-5xl">
        Community Guidelines
      </h1>

      <SectionTitle id="context">Context</SectionTitle>
      <Paragraph>
        A primary goal of this space is to be inclusive to the largest number of
        participants with the most varied and diverse backgrounds possible. We
        are committed to providing a friendly, safe, and welcoming environment
        for all, regardless of gender, sexual orientation, ability, ethnicity,
        socioeconomic status, and religion (or lack thereof).
      </Paragraph>
      <Paragraph>
        We do this by aligning every decision with Guiding Principles:
      </Paragraph>
      <BulletList items={GUIDING_PRINCIPLES} />

      <SectionTitle id="tips-for-allies">Tips for Allies</SectionTitle>
      <BulletList items={ALLY_TIPS} />
      <Paragraph>Thank you for being here.</Paragraph>

      <SectionTitle id="the-guidelines">The Guidelines</SectionTitle>
      <ol className="list-none p-0">
        {GUIDELINES.map((guideline, index) => (
          <li
            key={guideline.title}
            id={`guideline-${index + 1}`}
            className="mt-8 scroll-mt-20"
          >
            <h3 className="font-bebas text-2xl uppercase text-accent-blue">
              {index + 1}. {guideline.title}
            </h3>
            {guideline.body}
          </li>
        ))}
      </ol>
    </article>
  );
}
