import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (ext === "txt") {
      text = buffer.toString("utf-8");

    } else if (ext === "pdf") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import("pdf-parse") as any;
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const result = await pdfParse(buffer);
      text = result.text;

    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;

    } else {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}` },
        { status: 415 }
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "File appears to be empty or unreadable" }, { status: 422 });
    }

    return NextResponse.json({ text: trimmed });
  } catch (err) {
    console.error("[extract] Error:", err);
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 });
  }
}
