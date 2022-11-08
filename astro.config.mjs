import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';
import compress from "astro-compress";

import remarkRemoveComments from 'remark-remove-comments';
import remarkBreaks from 'remark-breaks';
import remarkDirective from 'remark-directive';
import remarkHeadingId from 'remark-heading-id';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';
import { u } from 'unist-builder';


const termTypes = {
  'a': 'appellation',
  'c': 'character',
  'd': 'character',  // screenplay character
  'l': 'clan',
  'm': 'strongpointmini',
  'p': 'strongpoint',
  'q': 'ca',
  'r': 'rumor',
  's': 'selection',
  't': 'term',
};

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
function transformTerms() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'textDirective' && node.name.length === 1) {
        const data = node.data ??= {};
        //const hast = h('span', node.attributes);
        data.hName = 'span';
        data.hProperties = {
          className: [`taco-${termTypes[node.name]}`],
        };
        let [ id, text ] = node.children[0].value.split(':');
        if (node.name === 'a' || node.name === 'q' || node.name === 'r') text = `“${text}”`;
        if (node.name === 'p') text = text.replace(/\s/g, '');
        node.children[0].value = text;
        //data.hProperties = hast.hProperties;
      };
    });
  };
}

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
function transformCollapse() {
  const isCollapse = node => node.type === 'textDirective' && node.name === 'collapse';
  return (tree) => {
    const nodes = [];
    visitParents(tree, (node, ancestors) => {
      if (isCollapse(node)) {
        nodes.push(ancestors[ancestors.length - 1]);
      }
    });
    for (const node of nodes) {
      const directiveIndex = node.children.findIndex(isCollapse);
      node.type = 'parent';
      node.data = { hName: 'details' };
      node.children.splice(directiveIndex, 2, u('html', '</summary>'));
      node.children.unshift(u('html', '<summary>'));
    }
  };
}

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
function compactHeadingSceneId() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'heading') {
        const sceneId = /^c(\d+)$/.exec(node.data?.id)?.[1];
        if (sceneId?.length > 3) {
          node.data.hProperties.id = node.data.id = `c${parseInt(sceneId, 10) % 1000}`;
        }
      };
    });
  };
}


// https://astro.build/config
export default defineConfig({
  base: '/tacticsogre',
  build: {
    format: 'file',
  },
  markdown: {
    remarkPlugins: [
      remarkRemoveComments,
      remarkBreaks,
      remarkDirective,
      remarkGfm,
      transformTerms,
      transformCollapse,
      remarkHeadingId,
      compactHeadingSceneId,
    ],
  },
  integrations: [
    compress({
      html: {
        removeComments: true,
      },
    }),
  ],
  vite: {
    build: {
      assetsInlineLimit: '0',
    },
    plugins: [yaml()],
  },
});
