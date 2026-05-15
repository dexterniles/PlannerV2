type PMNode = {
  type?: string;
  text?: string;
  content?: PMNode[];
};

export function proseMirrorToPlainText(doc: unknown, limit = 120): string {
  const parts: string[] = [];
  const walk = (node: PMNode) => {
    if (node.text) parts.push(node.text);
    if (node.content) node.content.forEach(walk);
  };
  if (doc && typeof doc === "object") walk(doc as PMNode);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}
