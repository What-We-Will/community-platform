import type { User } from "@supabase/supabase-js";
import { ActionNetworkFormEmbed } from "./action-network-form-embed";

export function LandingJoinCommunity({ user: _user }: { user?: User | null }) {
  return (
    <section id="newsletter" className="scroll-mt-20 bg-muted px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="px-6 py-10 md:px-10 md:py-12">
          <h2 className="text-center text-5xl font-bebas">
            Join Our Mailing List
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
            Whether you&apos;ve been laid off, you&apos;re anxious about your
            chosen profession, or you just want to fight for change—you can make
            a difference. Come be part of the solution. Join us in building the
            collective power we need to win.
          </p>
          <div className="mt-8 w-full">
            <ActionNetworkFormEmbed />
          </div>
        </div>
      </div>
    </section>
  );
}
