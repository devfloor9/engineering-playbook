// CSS owns the light/dark pairs so syntax and reading surfaces change together.
export default {
  plain: {
    color: 'var(--ep-on-surface)',
    backgroundColor: 'var(--ep-code-surface)',
  },
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: 'var(--ep-code-comment)'}},
    {types: ['keyword', 'atrule', 'attr-name', 'tag', 'selector'], style: {color: 'var(--ep-code-keyword)'}},
    {types: ['string', 'char', 'attr-value', 'url', 'regex'], style: {color: 'var(--ep-code-string)'}},
    {types: ['number', 'boolean', 'constant', 'variable', 'property', 'symbol', 'builtin'], style: {color: 'var(--ep-code-value)'}},
    {types: ['function', 'function-variable', 'class-name'], style: {color: 'var(--ep-code-function)'}},
    {types: ['inserted'], style: {color: 'var(--ep-success)'}},
    {types: ['deleted'], style: {color: 'var(--ep-error)'}},
    {types: ['changed'], style: {color: 'var(--ep-warning)'}},
  ],
};
