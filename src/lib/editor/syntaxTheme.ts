import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/** CSS class prefix — colors live in `styles/editor-syntax.css` via `--syntax-*` vars. */
const c = {
  comment: "tl-syn-comment",
  keyword: "tl-syn-keyword",
  string: "tl-syn-string",
  number: "tl-syn-number",
  bool: "tl-syn-bool",
  function: "tl-syn-function",
  type: "tl-syn-type",
  variable: "tl-syn-variable",
  parameter: "tl-syn-parameter",
  property: "tl-syn-property",
  tag: "tl-syn-tag",
  punctuation: "tl-syn-punctuation",
  operator: "tl-syn-operator",
  regexp: "tl-syn-regexp",
  meta: "tl-syn-meta",
  heading: "tl-syn-heading",
  emphasis: "tl-syn-emphasis",
  link: "tl-syn-link",
  invalid: "tl-syn-invalid",
} as const;

/**
 * Syntax highlighting for the code editor.
 * Uses CSS classes (not inline colors) so Settings → Syntax can update live via `--syntax-*`.
 */
export const editorHighlightStyle = HighlightStyle.define([
  { tag: t.comment, class: c.comment },
  { tag: [t.lineComment, t.blockComment, t.docComment], class: c.comment },

  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword], class: c.keyword },
  { tag: [t.operatorKeyword, t.self, t.null, t.atom], class: c.keyword },

  { tag: [t.string, t.docString, t.character, t.attributeValue], class: c.string },
  { tag: [t.number, t.integer, t.float], class: c.number },
  { tag: t.bool, class: c.bool },

  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: c.function },
  { tag: t.labelName, class: c.function },

  { tag: [t.className, t.typeName, t.namespace, t.definition(t.typeName)], class: c.type },

  { tag: [t.variableName, t.name], class: c.variable },
  { tag: t.definition(t.variableName), class: c.variable },
  { tag: t.local(t.variableName), class: c.variable },
  { tag: t.special(t.variableName), class: c.parameter },

  { tag: [t.propertyName, t.attributeName], class: c.property },
  { tag: t.definition(t.propertyName), class: c.property },

  { tag: [t.tagName], class: c.tag },
  { tag: [t.angleBracket, t.squareBracket, t.paren, t.brace], class: c.punctuation },
  {
    tag: [
      t.separator,
      t.derefOperator,
      t.arithmeticOperator,
      t.logicOperator,
      t.bitwiseOperator,
      t.compareOperator,
      t.operator,
    ],
    class: c.operator,
  },

  { tag: t.regexp, class: c.regexp },
  { tag: t.meta, class: c.meta },
  { tag: [t.heading, t.strong], class: c.heading, fontWeight: "bold" },
  { tag: t.emphasis, class: c.emphasis, fontStyle: "italic" },
  { tag: t.link, class: c.link, textDecoration: "underline" },
  { tag: t.invalid, class: c.invalid },
]);

export const editorSyntaxHighlighting = syntaxHighlighting(editorHighlightStyle, {
  fallback: true,
});
