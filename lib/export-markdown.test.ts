import { describe, expect, it } from "vitest";
import {
  filenameFromTitle,
  tiptapToMarkdown,
} from "@/lib/export-markdown";

describe("tiptapToMarkdown", () => {
  it("preserves headings, bold, italic, and lists", () => {
    const markdown = tiptapToMarkdown({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " and " },
            { type: "text", text: "italic", marks: [{ type: "italic" }] },
            { type: "text", text: "." },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second" }],
                },
              ],
            },
          ],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Alpha" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Beta" }],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(markdown).toBe(
      [
        "# Title",
        "This is **bold** and *italic*.",
        "- First\n- Second",
        "1. Alpha\n2. Beta",
      ].join("\n\n")
    );
  });
});

describe("filenameFromTitle", () => {
  it("falls back when the title is empty", () => {
    expect(filenameFromTitle("   ")).toBe("document");
  });
});
