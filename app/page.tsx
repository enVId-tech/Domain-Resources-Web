import ErrorScreen from "@/components/ErrorScreen";
import { errorMetadata } from "@/lib/status";

// The root is the "origin is down" page: this site is what Cloudflare serves when the server is offline.
export const metadata = errorMetadata();

export default function Home() {
  return <ErrorScreen />;
}
