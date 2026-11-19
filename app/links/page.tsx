import type { Metadata } from "next";
import LinksDirectory from "@/components/LinksDirectory";

export const metadata: Metadata = {
  title: "Access Directory",
};

export default function Links() {
  return <LinksDirectory />;
}
