<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";

const props = defineProps<{
  content: string;
}>();

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true
});

function sanitizeLanguage(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
}

function escapeAttr(value: string) {
  return markdown.utils.escapeHtml(value).replace(/"/g, "&quot;");
}

function renderCodeBlock(code: string, language: string) {
  const lang = sanitizeLanguage(language);
  const label = lang || "text";
  const encodedCode = encodeURIComponent(code);
  const className = lang ? ` class="language-${escapeAttr(lang)}"` : "";

  return [
    '<div class="md-code-block">',
    '<div class="md-code-block__bar">',
    `<span class="md-code-block__lang">${escapeAttr(label)}</span>`,
    `<button class="md-code-block__copy" type="button" data-md-copy="${encodedCode}">复制</button>`,
    "</div>",
    `<pre><code${className}>${markdown.utils.escapeHtml(code)}</code></pre>`,
    "</div>"
  ].join("");
}

markdown.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const language = token.info.trim().split(/\s+/)[0] ?? "";
  return renderCodeBlock(token.content, language);
};

markdown.renderer.rules.code_block = (tokens, idx) => renderCodeBlock(tokens[idx].content, "");

const defaultLinkOpen = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");

  return defaultLinkOpen ? defaultLinkOpen(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
};

const renderedHtml = computed(() => markdown.render(props.content));

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>("[data-md-copy]");

  if (!button) {
    return;
  }

  const encodedCode = button.dataset.mdCopy ?? "";
  const originalText = button.textContent ?? "复制";

  try {
    await copyText(decodeURIComponent(encodedCode));
    button.textContent = "已复制";
    button.classList.add("md-code-block__copy--done");
  } catch {
    button.textContent = "复制失败";
  }

  window.setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("md-code-block__copy--done");
  }, 1200);
}
</script>

<template>
  <div class="markdown-body" @click="handleClick" v-html="renderedHtml"></div>
</template>

<style scoped>
.markdown-body {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.72;
  word-break: break-word;
}

.markdown-body :deep(> * + *) {
  margin-top: 0.76em;
}

.markdown-body :deep(p) {
  margin: 0;
}

.markdown-body :deep(strong) {
  color: #0f172a;
  font-weight: 700;
}

.markdown-body :deep(em) {
  color: #475569;
}

.markdown-body :deep(a) {
  color: #2563eb;
  font-weight: 650;
  text-decoration: none;
  border-bottom: 1px solid rgba(37, 99, 235, 0.22);
}

.markdown-body :deep(a:hover) {
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.42);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 1.1em 0 0.35em;
  color: #111827;
  font-weight: 760;
  line-height: 1.25;
}

.markdown-body :deep(h1) {
  font-size: 1.45rem;
}

.markdown-body :deep(h2) {
  font-size: 1.22rem;
}

.markdown-body :deep(h3) {
  font-size: 1.08rem;
}

.markdown-body :deep(h4) {
  font-size: 0.98rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.35rem;
  margin-bottom: 0;
}

.markdown-body :deep(li + li) {
  margin-top: 0.34em;
}

.markdown-body :deep(li::marker) {
  color: #6366f1;
  font-weight: 700;
}

.markdown-body :deep(blockquote) {
  margin: 0.8rem 0;
  padding: 0.75rem 0.9rem;
  border-left: 3px solid rgba(99, 102, 241, 0.55);
  border-radius: 0 12px 12px 0;
  background: rgba(99, 102, 241, 0.08);
  color: #475569;
}

.markdown-body :deep(hr) {
  height: 1px;
  margin: 1rem 0;
  border: none;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.28), transparent);
}

.markdown-body :deep(:not(pre) > code) {
  padding: 0.12rem 0.35rem;
  border-radius: 6px;
  background: rgba(79, 70, 229, 0.1);
  color: #4338ca;
  font-size: 0.9em;
  font-weight: 650;
}

.markdown-body :deep(.md-code-block) {
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #0f172a;
  box-shadow: 0 18px 40px -28px rgba(15, 23, 42, 0.55);
}

.markdown-body :deep(.md-code-block__bar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 34px;
  padding: 0.42rem 0.72rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.045);
}

.markdown-body :deep(.md-code-block__lang) {
  overflow: hidden;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.markdown-body :deep(.md-code-block__copy) {
  flex: 0 0 auto;
  min-width: 48px;
  height: 24px;
  padding: 0 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 650;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.markdown-body :deep(.md-code-block__copy:hover),
.markdown-body :deep(.md-code-block__copy--done) {
  border-color: rgba(125, 211, 252, 0.42);
  background: rgba(14, 165, 233, 0.18);
  color: #f8fafc;
}

.markdown-body :deep(pre) {
  margin: 0;
  overflow-x: auto;
  padding: 0.85rem 0.95rem 0.95rem;
  color: #e5e7eb;
  font-size: 12.5px;
  line-height: 1.62;
  tab-size: 2;
}

.markdown-body :deep(pre code) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.markdown-body :deep(table) {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  border-radius: 12px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 0.55rem 0.68rem;
  border: 1px solid rgba(100, 116, 139, 0.18);
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(99, 102, 241, 0.08);
  color: #334155;
  font-weight: 750;
}

.markdown-body :deep(td) {
  background: rgba(255, 255, 255, 0.52);
}
</style>
