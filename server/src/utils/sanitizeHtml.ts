import DOMPurify from "isomorphic-dompurify";

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

export const richTextToPlainText = (value: string) =>
  sanitizeRichTextHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const hasMeaningfulRichText = (value: string) => richTextToPlainText(value).length > 0;
