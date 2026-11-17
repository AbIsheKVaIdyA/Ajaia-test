import { describe, expect, it } from "vitest";
import { canAccess, isOwner } from "@/lib/access";

describe("isOwner", () => {
  it("returns true when the user owns the document", () => {
    expect(isOwner("user-1", "user-1")).toBe(true);
  });

  it("returns false when the user does not own the document", () => {
    expect(isOwner("user-1", "user-2")).toBe(false);
  });
});

describe("canAccess", () => {
  const docId = "doc-1";

  it("allows the owner", () => {
    expect(
      canAccess("owner", docId, { ownerId: "owner", shares: [] })
    ).toBe(true);
  });

  it("allows a user who is in document_shares", () => {
    expect(
      canAccess("bob", docId, {
        ownerId: "alice",
        shares: [{ document_id: docId, user_id: "bob" }],
      })
    ).toBe(true);
  });

  it("denies a user with no ownership or share", () => {
    expect(
      canAccess("carol", docId, {
        ownerId: "alice",
        shares: [{ document_id: docId, user_id: "bob" }],
      })
    ).toBe(false);
  });

  it("denies a share for a different document", () => {
    expect(
      canAccess("bob", docId, {
        ownerId: "alice",
        shares: [{ document_id: "doc-2", user_id: "bob" }],
      })
    ).toBe(false);
  });

  it("denies access when the document does not exist", () => {
    expect(
      canAccess("alice", docId, { ownerId: null, shares: [] })
    ).toBe(false);
  });
});
