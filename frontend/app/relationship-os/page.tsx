import type { Metadata } from "next";
import RelationshipOSDemo from "@/components/relationship-os/RelationshipOSDemo";

export const metadata: Metadata = {
  title: "Relationship OS Comparison | EcosystemOS AI",
  description: "Standalone comparison route for the Cohort Atlas Relationship OS demo.",
};

export default function RelationshipOSPage() {
  return <RelationshipOSDemo />;
}
