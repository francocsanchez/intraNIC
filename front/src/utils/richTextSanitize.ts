import DOMPurify from "dompurify";

const sanitizeConfig = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "blockquote",
    "br",
    "col",
    "colgroup",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "hr",
    "i",
    "li",
    "ol",
    "p",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "style"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export const sanitizeRichTextHtml = (value: string) => DOMPurify.sanitize(value, sanitizeConfig);

export const richTextToPlainText = (value: string) => {
  const sanitized = sanitizeRichTextHtml(value);
  const html = typeof window !== "undefined" ? window.document.createElement("div") : null;

  if (!html) {
    return sanitized.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  html.innerHTML = sanitized;
  return (html.textContent || "").replace(/\s+/g, " ").trim();
};

export const hasMeaningfulRichText = (value: string) => richTextToPlainText(value).length > 0;
