/**
 * @vitest-environment node
 */
import { createRequire } from "node:module";
import { version as installedReact } from "react";
import { version as installedReactDom } from "react-dom";

// The App Router renders with the React build bundled inside next, not the `react`
// package; unit tests use the latter. If next moves this internal path, fail loudly.
const { version: bundledReact } = createRequire(import.meta.url)(
  "next/dist/compiled/react",
) as { version: string };

const releaseLine = (version: string) => version.split(".").slice(0, 2).join(".");

describe("React version that unit tests run against", () => {
  it("should match the release line next bundles for production when next is upgraded", () => {
    const tested = releaseLine(installedReact);

    const shipped = releaseLine(bundledReact);

    expect(tested).toBe(shipped);
  });

  it("should be the same exact version for react and react-dom when either is bumped", () => {
    const reactVersion = installedReact;

    const reactDomVersion = installedReactDom;

    expect(reactDomVersion).toBe(reactVersion);
  });
});
