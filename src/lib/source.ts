import type { Channel, Direction, Source } from "./options";

/** The source to record on a contact from its first activity. */
export function inferSource(direction: Direction, channel: Channel): Source {
  if (direction === "outbound") return "outbound";
  if (channel === "website" || channel === "referral" || channel === "email") return channel;
  return "other";
}
