import { Address, default as IPCIDR } from "npm:ip-cidr@4.0.0";

const INTERNAL_IP_RANGES: IPCIDR[] = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
  "fe80::/10",
].map((s) => new IPCIDR(s));

export function isInternalIp(ip: Address | IpAddressString): boolean {
  const address = typeof ip === "string" ? IPCIDR.createAddress(ip) : ip;
  return INTERNAL_IP_RANGES.some((range: IPCIDR) => range.contains(address));
}

export function isIpAddressString(ip: string): ip is IpAddressString {
  return isIpV4AddressString(ip) || isIpV6AddressString(ip);
}

export type IpAddressString = IpV4AddressString | IpV6AddressString;

export type IpV4AddressString = `${number}.${number}.${number}.${number}`;

export type IpV6AddressString = `${string}:${string}:${string}`;

export function isIpV4AddressString(ip: string): ip is IpV4AddressString {
  return /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ip);
}

export function isIpV6AddressString(ip: string): ip is IpV6AddressString {
  return /^([0-9a-fA-F]{1,4}:){0,7}::([0-9a-fA-F]{1,4}){0,7}$/.test(ip);
}
