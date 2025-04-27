import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid'

// refer https://vitepress.dev/reference/site-config for details
export default withMermaid(defineConfig({
  lang: 'en-US',
  title: 'LibEntity',
  description: 'Type-safe, state-driven business entities for Java',

  markdown: {
    config: (md) => {
      // mermaid(md)
    }
  },

  themeConfig: {
    footer: {
      message: 'Released under the MIT License. Made with ☕, 💡 and lots of Java love.',
      copyright: 'Copyright © 2025-present Paulo Suzart'
    },
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'Concepts', link: '/concepts/' },
      {
        text: 'Integrations',
        items: [
          { text: 'Annotations', link: '/integrations/annotations/' },
          { text: 'Spring Boot', link: '/integrations/spring/' },
          { text: 'Jooq', link: '/integrations/jooq/' },
        ]
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is LibEntity?', link: '/guide' },
          { text: 'Quick Start', link: '/guide#quick-start' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Overview', link: '/concepts/' },
          { text: 'Entities', link: '/concepts/entities' },
          { text: 'Fields', link: '/concepts/fields' },
          { text: 'Actions', link: '/concepts/actions' },
          { text: 'Filters', link: '/concepts/filters' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          {
            text: 'Annotations',
            items: [
              { text: 'Overview', link: '/integrations/annotations/' },
              { text: 'Instance Factories', link: '/integrations/annotations/instance-factory' },
              { text: 'Requirements', link: '/integrations/annotations/requirements' }
            ]
          },
          { text: 'Spring Boot', link: '/integrations/spring/' },
          { text: 'Jooq', link: '/integrations/jooq/' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
  },

  // Theme configuration
  appearance: 'light',
  base: '/lib-entity-doc/',

  // Custom CSS
  head: [
    [
      'style',
      {},
      `
      :root {
        --vp-c-bg: #ffffff;
        --vp-c-text: #2c3e50;
        
        --vp-c-brand: #ff8c00;
        --vp-c-brand-light: #ffa500;
        --vp-c-brand-lighter: #ffb84d;
        --vp-c-brand-dark: #cc7000;
        --vp-c-brand-darker: #995400;
        
        --vp-home-hero-name-color: #ff8c00;
        --vp-button-brand-bg: #ff8c00;
        --vp-button-brand-hover-bg: #ffa500;
        
        --vp-c-bg-alt: #fafafa;
        --vp-c-divider: #e5e5e5;
        --vp-c-divider-light: #f0f0f0;
        
        --vp-c-text-1: #2c3e50;
        --vp-c-text-2: #476582;
        --vp-c-text-3: #90a4b7;
        
        --vp-c-bg-soft: #f9f9f9;
        --vp-c-bg-mute: #f1f1f1;
        
        --vp-custom-block-tip-border: var(--vp-c-brand);
        --vp-custom-block-tip-text: var(--vp-c-brand-darker);
        --vp-custom-block-tip-bg: var(--vp-c-brand-lighter);
      }

      .dark {
        --vp-c-bg: #1a1a1a;
        --vp-c-bg-alt: #242424;
        --vp-c-bg-soft: #2f2f2f;
        --vp-c-bg-mute: #3a3a3a;
        
        --vp-c-divider: #333333;
        --vp-c-divider-light: #383838;
        
        --vp-c-text-1: #ffffff;
        --vp-c-text-2: #aaaaaa;
        --vp-c-text-3: #82868c;
      }
    `,
    ],
  ],
}));
