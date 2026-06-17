import { defineConfig } from 'wxt';

// WXT config. The React module wires up @vitejs/plugin-react for the popup
// entrypoint automatically. Content scripts stay framework-free for speed.
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ADHD & Focus Reader',
    description:
      'Distraction-free reading: reader mode, bionic text, pacing, dyslexia fonts, and calm themes — on any site.',
    // Minimal permission surface. We deliberately avoid host_permissions
    // beyond <all_urls> for the content script and use activeTab semantics
    // where possible to keep store review friction low.
    permissions: ['storage', 'contextMenus', 'scripting'],
    host_permissions: ['<all_urls>'],
    // Icons live in public/icon/ and are served from the extension root.
    icons: {
      16: '/icon/icon-16.png',
      32: '/icon/icon-32.png',
      48: '/icon/icon-48.png',
      96: '/icon/icon-96.png',
      128: '/icon/icon-128.png',
    },
    action: {
      default_title: 'Focus Reader',
      default_icon: {
        16: '/icon/icon-16.png',
        32: '/icon/icon-32.png',
        48: '/icon/icon-48.png',
        128: '/icon/icon-128.png',
      },
    },
    commands: {
      'toggle-reader': {
        suggested_key: { default: 'Alt+R' },
        description: 'Toggle reader mode on the current page',
      },
      'toggle-autopace': {
        suggested_key: { default: 'Alt+P' },
        description: 'Start/stop autopace scrolling',
      },
    },
    // Reading fonts must be reachable from the content script's @font-face so
    // they render on third-party pages, not just the popup.
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
