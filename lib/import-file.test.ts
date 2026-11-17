import { describe, expect, it } from "vitest";
import {
  fileToTiptapContent,
  markdownToTiptapContent,
  titleFromFilename,
  txtToTiptapContent,
  validateImportFile,
} from "@/lib/import-file";

function textNodes(node: { content?: unknown[] } | undefined): string[] {
  if (!node?.content) {
    return [];
  }

  return node.content.flatMap((child) => {
    const value = child as { type?: string; text?: string; content?: unknown[] };
    if (value.type === "text" && value.text) {
      return [value.text];
    }
    return textNodes(value);
  });
}

describe("txtToTiptapContent", () => {
  it("splits paragraphs on blank lines", () => {
    const doc = txtToTiptapContent("Hello world.\n\nSecond paragraph.");
    expect(doc.type).toBe("doc");
    expect(doc.content).toHaveLength(2);
    expect(textNodes(doc.content?.[0] as { content?: unknown[] })).toEqual([
      "Hello world.",
    ]);
    expect(textNodes(doc.content?.[1] as { content?: unknown[] })).toEqual([
      "Second paragraph.",
    ]);
  });

  it("joins single newlines within a paragraph", () => {
    const doc = txtToTiptapContent("Line one\nLine two\n\nLine three");
    expect(doc.content).toHaveLength(2);
    expect(textNodes(doc.content?.[0] as { content?: unknown[] })).toEqual([
      "Line one Line two",
    ]);
  });
});

describe("markdownToTiptapContent", () => {
  it("preserves headings, bold, italic, and lists", () => {
    const doc = markdownToTiptapContent(`# Title

This is **bold** and *italic*.

- First
- Second

1. Alpha
2. Beta
`);

    const heading = doc.content?.[0] as {
      type: string;
      attrs?: { level: number };
    };
    expect(heading.type).toBe("heading");
    expect(heading.attrs?.level).toBe(1);
    expect(textNodes(doc.content?.[0] as { content?: unknown[] })).toEqual([
      "Title",
    ]);

    const paragraph = doc.content?.[1] as {
      type: string;
      content: Array<{ text?: string; marks?: Array<{ type: string }> }>;
    };
    expect(paragraph.type).toBe("paragraph");
    const bold = paragraph.content.find((node) =>
      node.marks?.some((mark) => mark.type === "bold")
    );
    const italic = paragraph.content.find((node) =>
      node.marks?.some((mark) => mark.type === "italic")
    );
    expect(bold?.text).toBe("bold");
    expect(italic?.text).toBe("italic");

    const bullet = doc.content?.[2] as { type: string };
    const numbered = doc.content?.[3] as { type: string };
    expect(bullet.type).toBe("bulletList");
    expect(numbered.type).toBe("orderedList");
    expect(textNodes(doc.content?.[2] as { content?: unknown[] })).toEqual([
      "First",
      "Second",
    ]);
    expect(textNodes(doc.content?.[3] as { content?: unknown[] })).toEqual([
      "Alpha",
      "Beta",
    ]);
  });
});

describe("fileToTiptapContent", () => {
  it("uses markdown conversion for .md files", () => {
    const doc = fileToTiptapContent("notes.md", "# Hello");
    expect(doc.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
    });
  });

  it("uses text conversion for .txt files", () => {
    const doc = fileToTiptapContent("notes.txt", "Hello\n\nWorld");
    expect(doc.content).toHaveLength(2);
    expect(doc.content?.[0]).toMatchObject({ type: "paragraph" });
  });
});

describe("validateImportFile", () => {
  it("rejects unsupported types", () => {
    expect(validateImportFile({ name: "photo.png", size: 10 })).toBe(
      "Only .txt and .md files are supported."
    );
  });

  it("rejects empty files", () => {
    expect(validateImportFile({ name: "notes.txt", size: 0 })).toBe(
      "This file is empty."
    );
  });

  it("rejects files larger than 1 MB", () => {
    expect(
      validateImportFile({ name: "notes.md", size: 1024 * 1024 + 1 })
    ).toBe("File is too large. Maximum size is 1 MB.");
  });
});

describe("titleFromFilename", () => {
  it("strips the extension", () => {
    expect(titleFromFilename("Meeting notes.md")).toBe("Meeting notes");
  });
});
