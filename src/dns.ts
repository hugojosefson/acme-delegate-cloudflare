export const RECORD_TYPES: Deno.RecordType[] = ["A", "AAAA", "CNAME", "ANAME"];
export type ResolveDnsResponse =
  | string[]
  | Deno.CAARecord[]
  | Deno.MXRecord[]
  | Deno.NAPTRRecord[]
  | Deno.SOARecord[]
  | Deno.SRVRecord[]
  | string[][];
