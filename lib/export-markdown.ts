import type { JSONContent } from "@tiptap/core";

export function filenameFromTitle(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);

  return cleaned || "document";
}

export function tiptapToMarkdown(doc: JSONContent): string {
  const blocks = (doc.content ?? [])
    .map(blockToMarkdown)
    .filter((block) => block.length > 0);

  return blocks.join("\n\n");
}

function blockToMarkdown(node: JSONContent): string {
  if (node.type === "heading") {
    const level = Math.min(Math.max(Number(node.attrs?.level) || 1, 1), 2);
    const text = inlineToMarkdown(node.content ?? []);
    return text ? `${"#".repeat(level)} ${text}` : "";
  }

  if (node.type === "paragraph") {
    return inlineToMarkdown(node.content ?? []);
  }

  if (node.type === "bulletList") {
    return listToMarkdown(node, false);
  }

  if (node.type === "orderedList") {
    return listToMarkdown(node, true);
  }

  if (node.content?.length) {
    return node.content.map(blockToMarkdown).filter(Boolean).join("\n\n");
  }

  return node.text ?? "";
}

function listToMarkdown(node: JSONContent, ordered: boolean): string {
  return (node.content ?? [])
    .map((item, index) =>
      listItemToMarkdown(item, ordered ? `${index + 1}.` : "-")
    )
    .filter(Boolean)
    .join("\n");
}

function listItemToMarkdown(item: JSONContent, marker: string): string {
  const children = item.content ?? [];
  if (children.length === 0) {
    return `${marker} `;
  }

  return children
    .map((child, index) => {
      if (child.type === "bulletList" || child.type === "orderedList") {
        return indent(blockToMarkdown(child));
      }

      const text = blockToMarkdown(child);
      if (index === 0) {
        return `${marker} ${text}`.trimEnd();
      }

      return indent(text);
    })
    .join("\n");
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
}

function inlineToMarkdown(nodes: JSONContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") {
        return "  \n";
      }

      if (node.type === "text") {
        return applyMarks(node.text ?? "", node.marks ?? []);
      }

      if (node.content?.length) {
        return inlineToMarkdown(node.content);
      }

      return node.text ?? "";
    })
    .join("");
}

function applyMarks(
  text: string,
  marks: Array<{ type: string }>
): string {
  if (!text) {
    return "";
  }

  let result = text;
  if (marks.some((mark) => mark.type === "code")) {
    result = `\`${result}\``;
  }
  if (marks.some((mark) => mark.type === "italic")) {
    result = `*${result}*`;
  }
  if (marks.some((mark) => mark.type === "bold")) {
    result = `**${result}**`;
  }
  return result;
}
