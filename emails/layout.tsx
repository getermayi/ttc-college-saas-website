import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export const colors = {
  primary: "#1f4d3a",
  accent: "#b14f26",
  ink: "#17211c",
  muted: "#55615a",
  sand: "#fbf7f0",
  border: "#e4d8c4",
};

export function EmailLayout({
  preview,
  children,
  footer,
}: {
  preview: string;
  children: ReactNode;
  footer?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.sand,
          fontFamily: "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <Section style={{ backgroundColor: colors.primary, padding: "20px 28px" }}>
            <Text
              style={{
                margin: 0,
                color: colors.sand,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
              }}
            >
              TTC Aalo
            </Text>
            <Text
              style={{
                margin: "2px 0 0",
                color: "#c9d6cd",
                fontSize: 12,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Teacher Training College, Aalo
            </Text>
          </Section>
          <Section style={{ padding: "28px" }}>{children}</Section>
          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section style={{ padding: "16px 28px" }}>
            <Text style={{ margin: 0, color: colors.muted, fontSize: 12, lineHeight: "18px" }}>
              {footer ??
                "Teacher Training College, Aalo · Bogdo, Aalo, West Siang, Arunachal Pradesh – 791001"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const text = { color: colors.ink, fontSize: 15, lineHeight: "24px", margin: "0 0 14px" } as const;
export const heading = {
  color: colors.ink,
  fontSize: 22,
  lineHeight: "30px",
  fontWeight: 700,
  margin: "0 0 16px",
  fontFamily: "Georgia, serif",
} as const;
export const button = {
  backgroundColor: colors.accent,
  color: "#ffffff",
  borderRadius: 999,
  padding: "12px 22px",
  fontWeight: 600,
  fontSize: 15,
  textDecoration: "none",
  display: "inline-block",
} as const;
