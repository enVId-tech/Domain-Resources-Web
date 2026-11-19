import type { Metadata } from "next";
import ErrorScreen from "@/components/ErrorScreen";

// With `output: "export"` this file is compiled to out/404.html.
export const metadata: Metadata = {
  title: "404 Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return <ErrorScreen />;
}
