import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

function makeRouter() {
  return createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

function routeIdsFor(path: string) {
  return makeRouter()
    .matchRoutes(path)
    .map((m) => m.routeId);
}

// The root route renders a full <html> document shell that jsdom cannot mount
// inside a test container, so these tests verify route matching directly.
describe("App routing", () => {
  it("matches the public pages", () => {
    expect(routeIdsFor("/")).toContain("/");
    expect(routeIdsFor("/auth")).toContain("/auth");
  });

  it("places app pages behind the authenticated layout", () => {
    for (const path of ["/documents", "/shared", "/uploads", "/account", "/documents/abc"]) {
      expect(routeIdsFor(path)).toContain("/_authenticated");
    }
  });

  it("does not match unknown paths to a page", () => {
    const ids = routeIdsFor("/this-route-does-not-exist");
    expect(ids).not.toContain("/");
    expect(ids.some((id) => id.startsWith("/_authenticated/"))).toBe(false);
  });
});
