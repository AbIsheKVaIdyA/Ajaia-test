import type { JSONContent } from "@tiptap/core";
import { lexer, type Token, type Tokens } from "marked";

const TITLE_MAX = 200;
const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const MAX_IMPORT_BYTES = 1024 * 1024;
export const IMPORT_EXTENSIONS = ["txt", "md"] as const;

export type ImportExtension = (typeof IMPORT_EXTENSIONS)[number];

export function getImportExtension(filename: string): ImportExtension | null {
  const match = filename.toLowerCase().match(/\.([^.]+)$/);
  if (!match) {
    return null;
  }

  if (match[1] === "txt" || match[1] === "md") {
    return match[1];
  }

  return null;
}

export function validateImportFile(file: {
  name: string;
  size: number;
}): string | null {
  if (getImportExtension(file.name) === null) {
    return "Only .txt and .md files are supported.";
  }

  if (file.size > MAX_IMPORT_BYTES) {
    return "File is too large. Maximum size is 1 MB.";
  }

  if (file.size === 0) {
    return "This file is empty.";
  }

  return null;
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  if (!base) {
    return "Untitled document";
  }

  return base.slice(0, TITLE_MAX);
}

export function fileToTiptapContent(
  filename: string,
  text: string
): JSONContent {
  const extension = getImportExtension(filename);
  if (extension === "md") {
    return markdownToTiptapContent(text);
  }

  return txtToTiptapContent(text);
}

export function txtToTiptapContent(text: string): JSONContent {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return EMPTY_DOC;
  }

  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    })),
  };
}

export function markdownToTiptapContent(markdown: string): JSONContent {
  const content = blocksToTiptap(lexer(markdown));
  return content.length > 0 ? { type: "doc", content } : EMPTY_DOC;
}

function blocksToTiptap(tokens: Token[]): JSONContent[] {
  const blocks: JSONContent[] = [];

  for (const token of tokens) {
    if (token.type === "space" || token.type === "hr" || token.type === "def") {
      continue;
    }

    if (token.type === "heading") {
      const heading = token as Tokens.Heading;
      blocks.push({
        type: "heading",
        attrs: { level: Math.min(Math.max(heading.depth, 1), 2) },
        content: inlineToTiptap(heading.tokens ?? []),
      });
      continue;
    }

    if (token.type === "paragraph") {
      blocks.push(paragraphFromTokens(tokenChildren(token)));
      continue;
    }

    if (token.type === "list") {
      blocks.push(listToTiptap(token as Tokens.List));
      continue;
    }

    if (token.type === "blockquote") {
      blocks.push(...blocksToTiptap(tokenChildren(token)));
      continue;
    }

    if (token.type === "code") {
      blocks.push({
        type: "paragraph",
        content: token.text ? [{ type: "text", text: token.text }] : undefined,
      });
      continue;
    }

    if (token.type === "text") {
      if (token.tokens?.length) {
        blocks.push(paragraphFromTokens(token.tokens));
      } else if (token.text) {
        blocks.push({
          type: "paragraph",
          content: [{ type: "text", text: token.text }],
        });
      }
    }
  }

  return blocks;
}

function listToTiptap(token: Tokens.List): JSONContent {
  return {
    type: token.ordered ? "orderedList" : "bulletList",
    content: token.items.map((item) => ({
      type: "listItem",
      content: listItemContent(item.tokens),
    })),
  };
}

function listItemContent(tokens: Token[]): JSONContent[] {
  const content: JSONContent[] = [];
  let inlineTokens: Token[] = [];

  function flushInline() {
    if (inlineTokens.length === 0) {
      return;
    }

    content.push(paragraphFromTokens(inlineTokens));
    inlineTokens = [];
  }

  for (const token of tokens) {
    if (token.type === "list") {
      flushInline();
      content.push(listToTiptap(token as Tokens.List));
      continue;
    }

    if (token.type === "paragraph") {
      flushInline();
      content.push(paragraphFromTokens(tokenChildren(token)));
      continue;
    }

    if (token.type === "space") {
      continue;
    }

    inlineTokens.push(token);
  }

  flushInline();
  return content.length > 0 ? content : [{ type: "paragraph" }];
}

function paragraphFromTokens(tokens: Token[]): JSONContent {
  const content = inlineToTiptap(tokens);
  return content.length > 0
    ? { type: "paragraph", content }
    : { type: "paragraph" };
}

function inlineToTiptap(tokens: Token[]): JSONContent[] {
  const nodes: JSONContent[] = [];

  for (const token of tokens) {
    if (token.type === "text") {
      if (token.tokens?.length) {
        nodes.push(...inlineToTiptap(token.tokens));
      } else if (token.text) {
        nodes.push({ type: "text", text: token.text });
      }
      continue;
    }

    if (token.type === "strong") {
      nodes.push(...withMark(inlineToTiptap(tokenChildren(token)), "bold"));
      continue;
    }

    if (token.type === "em") {
      nodes.push(...withMark(inlineToTiptap(tokenChildren(token)), "italic"));
      continue;
    }

    if (token.type === "codespan" && token.text) {
      nodes.push({
        type: "text",
        text: token.text,
        marks: [{ type: "code" }],
      });
      continue;
    }

    if (token.type === "link") {
      nodes.push(...inlineToTiptap(tokenChildren(token)));
      continue;
    }

    if (token.type === "br") {
      nodes.push({ type: "hardBreak" });
      continue;
    }

    if (token.type === "escape" && token.text) {
      nodes.push({ type: "text", text: token.text });
      continue;
    }

    if ("tokens" in token && Array.isArray(token.tokens)) {
      nodes.push(...inlineToTiptap(token.tokens));
      continue;
    }

    if ("text" in token && typeof token.text === "string" && token.text) {
      nodes.push({ type: "text", text: token.text });
    }
  }

  return nodes;
}

function tokenChildren(token: Token): Token[] {
  return "tokens" in token && Array.isArray(token.tokens) ? token.tokens : [];
}

function withMark(nodes: JSONContent[], markType: string): JSONContent[] {
  return nodes.map((node) => {
    if (node.type !== "text") {
      return node;
    }

    return {
      ...node,
      marks: [...(node.marks ?? []), { type: markType }],
    };
  });
}
