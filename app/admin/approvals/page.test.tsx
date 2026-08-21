/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { buildMockSupabaseClient } from "@/lib/__tests__/supabase-mock";
import { makeBaseProfile } from "@/lib/__tests__/factories";
import type { Profile } from "@/lib/types";
import ApprovalsPage from "./page";

const { createClient, createServiceClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient }));
vi.mock("./actions", () => ({ approveUser: vi.fn(), rejectUser: vi.fn() }));

type Links = Pick<Profile, "linkedin_url" | "github_url" | "portfolio_url">;

function mockPending(links: Partial<Links>) {
  const profile = makeBaseProfile({ approval_status: "pending", ...links });
  const { client } = buildMockSupabaseClient({
    tables: { profiles: { data: [profile], error: null } },
  });

  createClient.mockResolvedValue(client);
  createServiceClient.mockReturnValue({
    auth: {
      admin: {
        getUserById: vi
          .fn()
          .mockResolvedValue({ data: { user: { email: "jane@example.com" } } }),
      },
    },
  });
}

async function renderPage() {
  render(await ApprovalsPage());
}

// The render-time isHttpsUrl filter (ADR-0007) is the backstop for legacy rows
// and future write-path mistakes: no DB constraint enforces the scheme, so a
// stored http:/javascript: link must never reach an href here.
describe("Pending approvals page — verification links are scheme-guarded at render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render only the https link when stored schemes are mixed", async () => {
    mockPending({
      linkedin_url: "http://linkedin.com/in/jane",
      github_url: "javascript:alert(1)",
      portfolio_url: "https://jane.dev",
    });

    await renderPage();

    expect(screen.getByRole("link", { name: /website/i })).toHaveAttribute(
      "href",
      "https://jane.dev"
    );
    expect(screen.queryByRole("link", { name: /linkedin/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /github/i })).toBeNull();

    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("http://linkedin.com/in/jane");
    expect(hrefs).not.toContain("javascript:alert(1)");
  });

  it("should show the empty state when every stored link fails the scheme guard", async () => {
    mockPending({ linkedin_url: "http://linkedin.com/in/jane" });

    await renderPage();

    expect(screen.getByText(/no verification link provided/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /linkedin/i })).toBeNull();
  });

  it("should render all three links when every scheme is https", async () => {
    mockPending({
      linkedin_url: "https://linkedin.com/in/jane",
      github_url: "https://github.com/jane",
      portfolio_url: "https://jane.dev",
    });

    await renderPage();

    expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/jane"
    );
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/jane"
    );
    expect(screen.getByRole("link", { name: /website/i })).toHaveAttribute(
      "href",
      "https://jane.dev"
    );
  });
});
