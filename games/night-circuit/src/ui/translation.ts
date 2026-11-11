import dictionary from '../data/en.json';
import career from '../data/career.json';
import races from '../data/races.json';
import district from '../data/district.json';
import appearance from '../data/appearance.json';
import { preferences } from '../core/preferences';
const normalize = (text: string) =>
  text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const escape = (text: string) =>
  [...text].map((c) => ('\\^$.*+?()[]{}|'.includes(c) ? '\\' + c : c)).join('');
const entries = new Map(
  Object.entries(dictionary).map(([k, v]) => [
    normalize(k).toLocaleLowerCase('it'),
    v,
  ]),
);
const phrasePattern = new RegExp(
  '(?<![\\p{L}\\p{N}_])(?:' +
    [...entries.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join('|') +
    ')(?![\\p{L}\\p{N}_])',
  'giu',
);
const names = [
  ...career.models,
  ...career.makers,
  ...career.rivals,
  ...career.districts,
  ...career.magazines,
  ...career.sponsors,
  ...races.events,
  ...district.pois,
  ...appearance.wheels,
  ...Object.values(appearance.slots).flatMap((s) =>
    s.options.filter((o) => o.name.startsWith('Velyra')),
  ),
].map((p) => p.name);
const namePattern = new RegExp(
  [...new Set(names)]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join('|'),
  'giu',
);
const cache = new Map<string, string>();
export function english(value: string): string {
  const cached = cache.get(value);
  if (cached !== undefined) return cached;
  if (!value.trim()) return value;
  const text = normalize(value),
    exact = entries.get(text.toLocaleLowerCase('it'));
  let result: string;
  if (exact) result = text === text.toUpperCase() ? exact.toUpperCase() : exact;
  else {
    const proper: string[] = [];
    const hidden = text.replace(namePattern, (match) => {
      proper.push(match);
      return `\uE000${proper.length - 1}\uE001`;
    });
    result = hidden
      .replace(phrasePattern, (match) => {
        const e = entries.get(match.toLocaleLowerCase('it'))!;
        return match === match.toUpperCase() ? e.toUpperCase() : e;
      })
      .replace(/\uE000(\d+)\uE001/g, (_, n: string) => proper[Number(n)]);
  }
  result = value.match(/^\s*/)?.[0] + result + (value.match(/\s*$/)?.[0] ?? '');
  if (cache.size > 4096) cache.clear();
  cache.set(value, result);
  return result;
}
export const t = (value: string) =>
  preferences.language === 'en' ? english(value) : value;
const originals = new WeakMap<Node, { source: string; output: string }>();
const attrOriginals = new WeakMap<
  Element,
  Map<string, { source: string; output: string }>
>();
let observer: MutationObserver | undefined;
function apply(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'KBD', 'CODE'].includes(parent.tagName))
      return;
    if (!/\p{L}/u.test(node.nodeValue ?? '')) return;
    const value = node.nodeValue ?? '',
      old = originals.get(node),
      source = old && old.output === value ? old.source : value,
      output = t(source);
    if (output !== value) node.nodeValue = output;
    originals.set(node, { source, output });
    return;
  }
  if (node instanceof Element) {
    for (const attr of [
      'aria-label',
      'aria-valuetext',
      'title',
      'placeholder',
    ]) {
      const value = node.getAttribute(attr);
      if (!value) continue;
      let map = attrOriginals.get(node);
      if (!map) {
        map = new Map();
        attrOriginals.set(node, map);
      }
      const old = map.get(attr),
        source = old && old.output === value ? old.source : value,
        output = t(source);
      if (output !== value) node.setAttribute(attr, output);
      map.set(attr, { source, output });
    }
  }
  for (const child of node.childNodes) apply(child);
}
export function setLanguage(language: 'it' | 'en') {
  const changed = document.documentElement.lang !== language;
  preferences.language = language;
  document.documentElement.lang = language;
  if (changed) window.dispatchEvent(new Event('nc-language'));
  apply(document.body);
  observer ??= new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData' || r.type === 'attributes')
        apply(r.target);
      else for (const node of r.addedNodes) apply(node);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-valuetext', 'title', 'placeholder'],
  });
}
