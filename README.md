# What We Will — Community Platform

A community membership platform for job seekers and mutual support. Members can connect through a directory, groups, DMs, events, and polls—all in one place.

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Language:** TypeScript
- **Database & Auth:** [Supabase](https://supabase.com) (PostgreSQL, RLS, Auth)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) (Radix primitives)
- **Icons:** [lucide-react](https://lucide-react.github.io/lucide-react/)
- **Dates:** [date-fns](https://date-fns.org) v3
- **Video:** Jitsi (public or JWT via `NEXT_PUBLIC_JITSI_APP_ID`)

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- A [Supabase](https://supabase.com) project (free tier works)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/What-We-Will/community-platform.git
cd community-platform
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (for Jitsi JWT / 8x8 JaaS):

```env
NEXT_PUBLIC_JITSI_APP_ID=your-jaas-app-id
```

Get the Supabase values from your project’s **Settings → API** in the Supabase dashboard. If you have not created a blank new Supabase project for this repo please do so now. 

### 3. Database


Apply migrations so the schema and RLS policies exist:

```bash
npx supabase db push
```

Or, if using Supabase CLI linked to your project:

```bash
npx supabase migration up
```

**NOTE**: If the above command gives an error `Cannot find project ref. Have you run supabase link?` run these commands and then retry the above command:

```bash
npx supabase login
```

Link to your Supabase project, selecting the appropriate project:

```bash
npx supabase link
```

**NOTE**:Migrations live in `supabase/migrations/` and run in order (e.g. `001_profiles.sql` → `014_events.sql`).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up via the auth flow;

To manually approve yourself, open Supabase > Table Editor > "profiles". You should see a row for your user. Change the "approval_status" column from "pending" to "approved".

After onboarding you’ll see the main app (dashboard, events, groups, messages, members, profile).

---

## Project structure

```
├── app/
│   ├── (app)/                    # Authenticated app (sidebar, layout)
│   │   ├── dashboard/            # Dashboard with cards (polls, events, chats, groups)
│   │   ├── events/               # Events list, create, detail, edit
│   │   ├── groups/               # Groups list + [slug] hub (chat, members, events, etc.)
│   │   ├── members/              # Member directory + [userId] profile
│   │   ├── messages/            # Inbox + [conversationId] thread
│   │   ├── onboarding/           # New-user onboarding
│   │   └── profile/              # My profile
│   ├── (auth)/                   # Login, signup (no sidebar)
│   ├── auth/callback/            # OAuth callback
│   └── page.tsx                  # Landing page
├── components/
│   ├── auth/                     # OAuth buttons, etc.
│   ├── dashboard/                # Dashboard cards (WelcomeBanner, PollsCard, etc.)
│   ├── events/                   # EventCard, CreateEventForm, EditEventForm, RsvpButtons, etc.
│   ├── groups/                   # GroupCard, GroupHeader, CreateGroupDialog, etc.
│   ├── landing/                  # Landing page sections
│   ├── messages/                # ConversationList, MessageInput, ConversationView, etc.
│   ├── shared/                   # UserAvatar (reused everywhere)
│   ├── ui/                       # shadcn primitives (Button, Card, Dialog, etc.)
│   └── video/                    # Jitsi wrapper, QuickCallButton
├── lib/
│   ├── actions/                  # Server Actions (messages, polls, jitsi)
│   ├── supabase/                 # createClient (server + client), proxy
│   ├── utils/                    # time, status, avatar, events (type config), video
│   ├── conversations.ts          # fetchRecentConversations (server)
│   ├── events.ts                 # createEvent, fetchUpcomingEvents, fetchEventWithDetails
│   ├── groups.ts                 # createGroup, joinGroup, leaveGroup, slugs
│   ├── messages.ts               # findExistingDM, createDMConversation
│   ├── polls.ts                  # fetchActivePolls
│   ├── storage.ts                # File upload helpers
│   ├── types.ts                  # Shared TS types (Profile, Event, Group, etc.)
│   └── utils.ts                  # cn() etc.
├── supabase/
│   └── migrations/               # SQL migrations (profiles, messaging, groups, polls, events, storage)
└── proxy.ts                      # Next.js proxy (not middleware)
```

### Main features (by area)

| Area | What it does |
|------|----------------|
| **Auth & onboarding** | Sign up / login (email + OAuth), onboarding flow, redirect to dashboard |
| **Profiles** | Display name, avatar, headline, bio, resume upload, “open to referrals” |
| **Members** | Directory with search/filters, public profile pages |
| **Messages** | DMs and group chats, Realtime, typing indicators, unread badges, file attachments |
| **Groups** | Create/join/leave, group chat, admin member management, join requests, Events tab |
| **Dashboard** | Welcome banner, new members, recent chats, community polls, my groups, upcoming events |
| **Events** | Create/edit/delete events, RSVP (going/maybe/declined), list + calendar view, video link (Jitsi) |
| **Polls** | Community-wide polls, vote, create poll (dialog + server action) |

---

## Conventions (for contributors)

- **Next.js 16:** `params` and `searchParams` are **Promises**—always `await` them (e.g. `const { eventId } = await params`).
- **Auth in Server Components:** Use `supabase.auth.getUser()`, not `getSession()`.
- **Server vs client:** Prefer Server Components. Add `"use client"` only when you need state, event handlers, or browser APIs (e.g. forms, RSVP buttons, realtime).
- **Server Actions:** Live in `app/.../actions.ts` or `lib/actions/` with `"use server"`. Import non–`"use server"` helpers (e.g. `lib/events.ts`) from there as needed.
- **Supabase:** Server code uses `createClient()` from `@/lib/supabase/server`; client code uses `@/lib/supabase/client`.
- **Styling:** Tailwind + shadcn. Reuse `UserAvatar`, `formatRelativeTime`, `eventTypeConfig`, etc. from `lib/` and `components/shared/`.
- **New UI:** Add components via `npx shadcn@latest add <component>` when you need a new primitive.

---

## How to contribute
1. **Read the [AI use policy](AI_POLICY.md)** 
2. **Fork** the repo and clone your fork.
3. **Create a branch** (e.g. `feature/your-feature` or `fix/issue-123`).
4. **Set up locally** (see [Getting started](#getting-started)) and make your changes.
5. **Run lint:** `npm run lint`
6. **Run build:** `npm run build`
7. **Open a PR** against `main` with a short description of what you changed and why.

### Good first contributions
Check the Github Issues in the repo to find some good first issues to tackle.

- **UI/UX:** Improve accessibility (labels, focus, contrast) or responsive behavior. If you find a bug in the UI, please create an issue ticket, and propose a way to address it.
- **Tests:** Add tests for utilities in `lib/` or key user flows (if a test setup is added).
- **Docs:** Improve this README or add inline comments in a tricky file.

### Where to look for work

- **Dashboard:** `app/(app)/dashboard/`, `components/dashboard/`
- **Events:** `app/(app)/events/`, `components/events/`, `lib/events.ts`
- **Groups:** `app/(app)/groups/`, `components/groups/`, `lib/groups.ts`
- **Messages:** `app/(app)/messages/`, `components/messages/`, `lib/conversations.ts`, `lib/messages.ts`
- **Types and shared logic:** `lib/types.ts`, `lib/utils/`

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Video calls

The app uses Jitsi for event and group video. By default it uses the community server (**meet.jit.si**); room names are generated in `lib/utils/video.ts` (e.g. `whatwewill-event-<id>`). For 8x8 JaaS, set `NEXT_PUBLIC_JITSI_APP_ID` and configure JWT in `lib/actions/jitsi.ts`.

---

## Deploy

You can deploy to [Vercel](https://vercel.com) (or any Next.js host). Set the same env vars in the project settings and ensure the Supabase project allows your deployment URL in Auth and (if used) redirect URLs.
