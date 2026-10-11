import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data/public";

export const alt = "Teacher Training College, Aalo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const s = await getSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#173b2c",
        color: "#fbf7f0",
        padding: 72,
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            background: "#b14f26",
            transform: "rotate(45deg)",
            borderRadius: 8,
          }}
        />
        <div style={{ fontSize: 36, fontWeight: 700, marginLeft: 16 }}>{s.shortName}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 700, maxWidth: 950 }}>{s.tagline}</div>
        <div style={{ fontSize: 30, marginTop: 28, color: "#c9d6cd", fontFamily: "sans-serif" }}>
          {`B.Ed. · RGU affiliated · NCTE recognised · ${s.addressLine}, ${s.state}`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          height: 14,
          background: "repeating-linear-gradient(90deg,#b14f26 0 28px,transparent 28px 40px)",
        }}
      />
    </div>,
    size,
  );
}
