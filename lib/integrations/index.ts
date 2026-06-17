// ---------------------------------------------------------------------------
// Knowledge capture layer
// ---------------------------------------------------------------------------
// The interfaces here are the real contract. The local library + search are
// implemented (IndexedDB), so "Saved Content Library" and "Universal Search"
// work offline today. Notion/Obsidian are adapter stubs: the shape is final,
// but each needs auth + transport, which is the natural Claude Code milestone
// (OAuth flow for Notion, local REST / "obsidian://" URI for Obsidian).

export interface SavedItem {
  id: string;
  title: string;
  text: string; // selection or full article (markdown/plain)
  url: string;
  createdAt: number;
  tags?: string[];
}

export interface NoteTarget {
  readonly id: string; // 'notion' | 'obsidian' | 'local'
  readonly label: string;
  isConfigured(): Promise<boolean>;
  save(item: SavedItem): Promise<void>;
}

// --- Local library (works now) --------------------------------------------

const DB_NAME = 'afr-library';
const STORE = 'items';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const LocalLibrary: NoteTarget & {
  all(): Promise<SavedItem[]>;
  search(q: string): Promise<SavedItem[]>;
} = {
  id: 'local',
  label: 'Library',
  isConfigured: async () => true,
  async save(item) {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(item);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  },
  async all() {
    const db = await openDb();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result as SavedItem[]);
      req.onerror = () => rej(req.error);
    });
  },
  // Naive but instant full-text scan; swap for a lunr/minisearch index when
  // the library outgrows a few thousand items.
  async search(q) {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const items = await this.all();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.text.toLowerCase().includes(needle) ||
        i.tags?.some((t) => t.toLowerCase().includes(needle)),
    );
  },
};

// --- External adapters (stubs — final shape, no transport yet) -------------

export const NotionTarget: NoteTarget = {
  id: 'notion',
  label: 'Notion',
  isConfigured: async () => false,
  async save(_item) {
    // TODO(Claude Code milestone 7):
    //   1. OAuth: register a Notion integration, store token in storage.
    //   2. POST to https://api.notion.com/v1/pages with the saved database id.
    //   3. Map SavedItem → Notion blocks (title prop + paragraph children).
    throw new Error('Notion integration not configured');
  },
};

export const ObsidianTarget: NoteTarget = {
  id: 'obsidian',
  label: 'Obsidian',
  isConfigured: async () => false,
  async save(_item) {
    // TODO(Claude Code milestone 7):
    //   Option A: Local REST API plugin → PUT note to vault over localhost.
    //   Option B: open `obsidian://new?vault=...&content=...` URI.
    throw new Error('Obsidian integration not configured');
  },
};

export const TARGETS: NoteTarget[] = [LocalLibrary, NotionTarget, ObsidianTarget];
