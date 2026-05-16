import type { Metadata } from "next";
import RelationshipOSDemo from "@/components/relationship-os/RelationshipOSDemo";

export const metadata: Metadata = {
  title: "X Combinator Relationship OS",
  description: "Relationship OS demo for ecosystem teams.",
};

export default function RelationshipOSPage() {
  return <RelationshipOSDemo />;
}
