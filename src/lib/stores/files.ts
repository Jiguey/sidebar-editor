import { writable, derived } from "svelte/store";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
  expanded?: boolean;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

function createFilesStore() {
  const { subscribe, set, update } = writable<{
    tree: FileEntry[];
    openFiles: OpenFile[];
    activeFilePath: string | null;
    workspacePath: string | null;
  }>({
    tree: [],
    openFiles: [],
    activeFilePath: null,
    workspacePath: null,
  });

  return {
    subscribe,
    setTree: (tree: FileEntry[]) => {
      update((state) => ({ ...state, tree }));
    },
    setWorkspacePath: (path: string) => {
      update((state) => ({ ...state, workspacePath: path }));
    },
    toggleExpanded: (path: string) => {
      update((state) => {
        const toggleInTree = (entries: FileEntry[]): FileEntry[] => {
          return entries.map((entry) => {
            if (entry.path === path) {
              return { ...entry, expanded: !entry.expanded };
            }
            if (entry.children) {
              return { ...entry, children: toggleInTree(entry.children) };
            }
            return entry;
          });
        };
        return { ...state, tree: toggleInTree(state.tree) };
      });
    },
    setChildren: (path: string, children: FileEntry[]) => {
      update((state) => {
        const setInTree = (entries: FileEntry[]): FileEntry[] => {
          return entries.map((entry) => {
            if (entry.path === path) {
              return { ...entry, children, expanded: true };
            }
            if (entry.children) {
              return { ...entry, children: setInTree(entry.children) };
            }
            return entry;
          });
        };
        return { ...state, tree: setInTree(state.tree) };
      });
    },
    openFile: (file: OpenFile) => {
      update((state) => {
        const exists = state.openFiles.find((f) => f.path === file.path);
        if (exists) {
          return { ...state, activeFilePath: file.path };
        }
        return {
          ...state,
          openFiles: [...state.openFiles, file],
          activeFilePath: file.path,
        };
      });
    },
    closeFile: (path: string) => {
      update((state) => {
        const openFiles = state.openFiles.filter((f) => f.path !== path);
        let activeFilePath = state.activeFilePath;
        if (activeFilePath === path) {
          activeFilePath = openFiles.length > 0 ? openFiles[openFiles.length - 1].path : null;
        }
        return { ...state, openFiles, activeFilePath };
      });
    },
    setActiveFile: (path: string) => {
      update((state) => ({ ...state, activeFilePath: path }));
    },
    updateFileContent: (path: string, content: string) => {
      update((state) => ({
        ...state,
        openFiles: state.openFiles.map((f) =>
          f.path === path ? { ...f, content, isDirty: true } : f
        ),
      }));
    },
    markSaved: (path: string) => {
      update((state) => ({
        ...state,
        openFiles: state.openFiles.map((f) =>
          f.path === path ? { ...f, isDirty: false } : f
        ),
      }));
    },
  };
}

export const files = createFilesStore();

export const activeFile = derived(files, ($files) =>
  $files.openFiles.find((f) => f.path === $files.activeFilePath) ?? null
);
