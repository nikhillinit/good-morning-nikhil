import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout, { metadata } from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Bebas_Neue: () => ({ variable: "--font-display" }),
}));

vi.mock("@/components/ClientShell", () => ({
  ClientShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("RootLayout", () => {
  it("exports share metadata for social previews", () => {
    expect(metadata.metadataBase?.toString()).toBe(
      "https://good-morning-nikhil.vercel.app/",
    );
    expect(metadata.openGraph?.title).toBe("Good Morning, Nikhil");
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
    });
  });

  it("renders a noscript fallback message", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>child</div>
      </RootLayout>,
    );

    expect(html).toContain("<noscript>");
    expect(html).toContain(
      "This experience requires JavaScript. Please enable it and refresh.",
    );
  });
});
