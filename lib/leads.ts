/** Derives a simple, reportable source label from UTM tags and referrer. */
export function deriveSource(utmSource?: string | null, referrer?: string | null, utmMedium?: string | null) {
  const s = (utmSource ?? "").toLowerCase();
  const m = (utmMedium ?? "").toLowerCase();
  if (s) {
    if (/(facebook|fb|meta|ig|instagram)/.test(s))
      return m.includes("paid") || m.includes("cpc") || m.includes("ads")
        ? "Meta Ads"
        : "Facebook / Instagram";
    if (/google/.test(s)) return m.includes("cpc") || m.includes("paid") ? "Google Ads" : "Google";
    if (/whatsapp|wa/.test(s)) return "WhatsApp";
    if (/youtube/.test(s)) return "YouTube";
    if (/sms/.test(s)) return "SMS";
    if (/poster|qr|print|flyer/.test(s)) return "Posters / QR";
    return utmSource!.slice(0, 40);
  }
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (/facebook|instagram|fb\.com|l\.facebook/.test(host)) return "Facebook / Instagram";
      if (/google\./.test(host)) return "Google";
      if (/whatsapp/.test(host)) return "WhatsApp";
      if (/youtube/.test(host)) return "YouTube";
      return `Referral: ${host}`.slice(0, 40);
    } catch {
      return "Referral";
    }
  }
  return "Direct";
}
