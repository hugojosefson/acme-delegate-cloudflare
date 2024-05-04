import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { isInternalIpAddressString } from "../src/ip.ts";

describe("ip", () => {
  it("10.20.30.40 should be internal", () => {
    assert(isInternalIpAddressString("10.20.30.40"));
  });
  it("8.8.8.8 should be external", () => {
    assert(!isInternalIpAddressString("8.8.8.8"));
  });
});
