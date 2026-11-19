import ErrorScreen from "@/components/ErrorScreen";
import { errorMetadata } from "@/lib/status";

// /error is kept as an alias of / so existing links and proxy error-page settings keep working.
export const metadata = errorMetadata();

export default function ErrorPage() {
  return <ErrorScreen />;
}
