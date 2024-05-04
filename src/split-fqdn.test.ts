import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { FQDomain, isFQDomain } from "./domain.ts";
import { splitFqdn } from "./split-fqdn.ts";

const cases = [
  [
    "_acme-challenge.local.hugojosefson.net.",
    [
      "_acme-challenge.local.hugojosefson.net.",
      "local.hugojosefson.net.",
      "hugojosefson.net.",
      "net.",
    ],
  ],
  ["_acme-challenge.hugojosefson.se.", [
    "_acme-challenge.hugojosefson.se.",
    "hugojosefson.se.",
    "se.",
  ]],
] as const;

describe("splitFqdn", () => {
  for (const [input, expected] of cases) {
    it(`should split ${input} correctly`, () => {
      assert(isFQDomain(input));
      assert(expected.every(isFQDomain));
      const actual = splitFqdn(input);
      assertEquals(actual, expected as unknown as FQDomain[]);
    });
  }
});
