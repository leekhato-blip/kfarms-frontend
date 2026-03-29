import { describe, expect, it } from "vitest";
import { findPlatformDemoUser, isPlatformDemoHost } from "./platformDevSession";

describe("platformDevSession", () => {
  it("allows hosted demo sessions on localhost and Render preview hosts", () => {
    expect(isPlatformDemoHost("localhost")).toBe(true);
    expect(isPlatformDemoHost("127.0.0.1")).toBe(true);
    expect(isPlatformDemoHost("kfarms-app-staging.onrender.com")).toBe(true);
    expect(isPlatformDemoHost("roots.example.com")).toBe(false);
  });

  it("finds the kato platform demo user by username and email", () => {
    expect(findPlatformDemoUser("kato")?.email).toBe("leekhato@gmail.com");
    expect(findPlatformDemoUser("leekhato@gmail.com")?.username).toBe("kato");
  });
});
