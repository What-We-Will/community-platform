/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const validInput = {
  display_name: "Jane Doe",
  skills: ["TypeScript"],
  open_to_referrals: true,
};

describe("updateProfile — cache revalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an error when user is not authenticated", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    // Act
    const result = await updateProfile(validInput);

    // Assert
    expect(result).toEqual({ error: "You must be signed in to update your profile." });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("should revalidate /members, /events, and /dashboard — but not /profile — on successful update", async () => {
    // Arrange
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }),
    } as any);

    // Act
    const result = await updateProfile(validInput);

    // Assert
    expect(result).toEqual({});
    expect(mockRevalidatePath).toHaveBeenCalledWith("/members");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/events");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRevalidatePath).not.toHaveBeenCalledWith("/profile");
  });
});
