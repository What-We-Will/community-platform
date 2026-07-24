import React from "react";

// ─── Internal primitives (mirrors the resource-guide content vocabulary) ──────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 scroll-mt-20">
      <h2 className="font-bebas text-3xl uppercase text-primary-orange sm:text-4xl">
        {children}
      </h2>
      <div className="mt-1 h-0.5 w-full bg-primary-orange" />
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-base leading-relaxed">{children}</p>;
}

function Guideline({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <h3 className="font-bebas text-2xl uppercase text-accent-blue">
        {n}. {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Guiding principles + ally tips (short bullet lists) ──────────────────────

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
  "Trust marginalized peoples’ emotional responses.",
  "Embrace discomfort.",
  "Accept responsibility for unintended impact.",
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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-bebas text-4xl uppercase text-primary-orange sm:text-5xl">
        Community Guidelines
      </h1>

      <SectionTitle>Context</SectionTitle>
      <Paragraph>
        A primary goal of this space is to be inclusive to the largest number of
        participants with the most varied and diverse backgrounds possible. We
        are committed to providing a friendly, safe, and welcoming environment
        for all, regardless of gender, sexual orientation, ability, ethnicity,
        socioeconomic status, and religion (or lack thereof).
      </Paragraph>
      <Paragraph>
        We do this by aligning every decision with our Guiding Principles:
      </Paragraph>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-base leading-relaxed">
        {GUIDING_PRINCIPLES.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <SectionTitle>Tips for Allies</SectionTitle>
      <ul className="mt-4 list-disc space-y-1 pl-6 text-base leading-relaxed">
        {ALLY_TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <Paragraph>Thank you for being here.</Paragraph>

      <SectionTitle>The Guidelines</SectionTitle>

      <Guideline n={1} title="We practice solidarity, not charity." />

      <Guideline n={2} title="Confidentiality is the default.">
        <Paragraph>
          Our members are people, not leads. Please do not collect, scrape,
          export, or extract member information. Using our space to build sales
          or marketing lists for outreach without permission will result in
          immediate removal.
        </Paragraph>
        <Paragraph>
          If you see something that doesn’t sit right — a rude comment, spam,
          anything off — please DM one of the Admins or submit a report through
          the workflow.
        </Paragraph>
      </Guideline>

      <Guideline n={3} title="Critique systems, not people.">
        <Paragraph>
          Bad employer behavior exists, so does harmful AI deployment, and
          unjust policies. It&rsquo;s fair game to call all that out. It is not
          okay to harass, dox, or target individuals (specific managers,
          co-workers, or other business representatives) by name in ways meant
          to incite public backlash. Channel anger at the structure, not at
          people either in this space or individually in society.
        </Paragraph>
      </Guideline>

      <Guideline
        n={4}
        title="Respect people’s names, pronouns, identities, and boundaries."
      >
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
        <ul className="mt-2 list-disc space-y-1 pl-6 text-base leading-relaxed">
          <li>
            Participate authentically and actively. In doing so, you contribute
            to the health of this community.
          </li>
          <li>
            Exercise consideration and respect in your speech and actions. This
            does NOT include tone policing the voices of the marginalized and
            most vulnerable.
          </li>
          <li>Attempt collaboration before conflict.</li>
          <li>
            Refrain from demeaning, discriminatory, or harassing behavior and
            speech.
          </li>
        </ul>
      </Guideline>

      <Guideline n={5} title="This is an organizing space, not a venting space.">
        <Paragraph>
          We are a supportive community, and as such, we ask that you keep
          venting to private spaces and be respectful of others’ beliefs,
          backgrounds, and personal choices.
        </Paragraph>
      </Guideline>

      <Guideline n={6} title="Be mindful of crisis moments.">
        <Paragraph>
          We are a supportive community, and we offer a safe place to go during a
          layoff. Please be mindful of crisis moments such as layoffs and other
          forms of income loss. We ask that you be supportive and only offer help
          when it is asked for and appropriate.
        </Paragraph>
      </Guideline>

      <Guideline
        n={7}
        title="Self-promotion has a time and place; be mindful of when it is appropriate."
      >
        <Paragraph>
          We are here to support you in any aspect that pertains to our mission
          statement and directives. As such, we ask that you limit self-promotion
          to appropriate topics and subject matter such as projects and
          initiatives that are in line with the organization’s goals and beliefs.
        </Paragraph>
      </Guideline>

      <Guideline n={8} title="Moderators are workers too.">
        <Paragraph>
          Our moderators are workers and operate on a volunteer basis. Please
          respect their time, efforts, and boundaries.
        </Paragraph>
      </Guideline>

      <Guideline
        n={9}
        title="We advocate for mindful use of technology and companies that support ethics over profits."
      >
        <Paragraph>
          We ask that you refrain from using AI in this space. AI is a powerful
          tool, but this space is built for genuine human connection.
        </Paragraph>
      </Guideline>

      <Guideline n={10} title="Mentorship and learning are always welcome." />
    </div>
  );
}
