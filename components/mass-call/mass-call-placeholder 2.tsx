import { CalendarClock } from "lucide-react";

export function MassCallPlaceholder() {
  return (
    <section className="bg-white px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-orange/10">
          <CalendarClock className="size-8 text-primary-orange" />
        </div>
        <h2 className="mt-6 font-bebas text-3xl text-dark-blue sm:text-4xl">
          Coming Soon
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We&apos;re building out this page. Check back soon for upcoming mass
          call dates, past recordings, and session notes.
        </p>
      </div>
    </section>
  );
}
