import ErrorScreen from "@/components/ErrorScreen";
import { errorMetadata } from "@/lib/status";

// With `output: "export"` this file is compiled to out/404.html.
export const metadata = errorMetadata();

export default function NotFound() {
  return <ErrorScreen />;
}
