import { NextResponse } from "next/server";

const KNOWN_STORES: Record<string, string> = {
  "amazon.ca": "Amazon",
  "amazon.com": "Amazon",
  "target.com": "Target",
  "walmart.ca": "Walmart",
  "walmart.com": "Walmart",
  "bestbuy.ca": "Best Buy",
  "bestbuy.com": "Best Buy",
  "etsy.com": "Etsy",
  "ikea.com": "IKEA",
  "sephora.com": "Sephora",
  "nike.com": "Nike",
  "adidas.com": "Adidas",
  "chapters.indigo.ca": "Indigo",
  "thebay.com": "The Bay",
};

function extractStoreName(url: string, publisher?: string | null): string {
  if (publisher) return publisher;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, name] of Object.entries(KNOWN_STORES)) {
      if (hostname.endsWith(domain)) return name;
    }
    const base = hostname.split(".")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Failed to parse URL" });
    }

    const result = await res.json();

    if (result.status !== "success" || !result.data) {
      return NextResponse.json({ success: false, error: "Could not extract product info" });
    }

    const { data } = result;

    let price: number | null = null;
    if (data.price?.amount != null) {
      const parsed = parseFloat(String(data.price.amount).replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) price = parsed;
    }

    return NextResponse.json({
      success: true,
      data: {
        title: data.title ?? null,
        image_url: data.image?.url ?? null,
        price,
        currency: data.price?.currency ?? "CAD",
        store_name: extractStoreName(url, data.publisher),
        product_url: url,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ success: false, error: "Request timed out. Please fill in the details manually." });
    }
    return NextResponse.json({ success: false, error: "Failed to parse URL" });
  }
}
