import type { Metadata } from "next";
import ErrorScreen from "@/components/ErrorScreen";

// /error shows the error page with a 200 status: handy for testing and for linking to it.
export const metadata: Metadata = {
  title: "Error",
  robots: { index: false },
};

export default function ErrorPage() {
  return <ErrorScreen />;
}
