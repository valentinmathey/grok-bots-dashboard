import { describe, expect, it } from "vitest";
import { hashPostId } from "./scroll-to-post";

describe("hashPostId", () => {
  it("extrae el id", () => {
    expect(hashPostId("#post-abc-123")).toBe("abc-123");
    expect(hashPostId("#post-")).toBeNull();
    expect(hashPostId("#otra")).toBeNull();
    expect(hashPostId("")).toBeNull();
  });
});
