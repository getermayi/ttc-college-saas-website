import { cacheLife } from "next/cache";

export async function FooterYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
