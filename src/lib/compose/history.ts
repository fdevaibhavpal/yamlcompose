import type { ComposeProject } from "@/types/compose";

export interface HistoryEntry {
  label: string;
  project: ComposeProject;
}

/**
 * A simple linear undo/redo stack over ComposeProject snapshots.
 *
 * Each mutation function in mutations.ts returns a brand-new ComposeProject
 * (never mutates its input), so undo/redo is just "move the cursor and swap
 * in the snapshot at that position" — no inverse-operation bookkeeping needed.
 */
export class ComposeHistory {
  private entries: HistoryEntry[];
  private cursor: number;
  private readonly limit: number;

  constructor(initial: ComposeProject, limit = 100) {
    this.entries = [{ label: "Initial state", project: initial }];
    this.cursor = 0;
    this.limit = limit;
  }

  get current(): ComposeProject {
    return this.entries[this.cursor].project;
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }

  get canRedo(): boolean {
    return this.cursor < this.entries.length - 1;
  }

  /** Records a new state, discarding any redo branch past the current cursor. */
  push(project: ComposeProject, label: string): void {
    this.entries = this.entries.slice(0, this.cursor + 1);
    this.entries.push({ label, project });
    if (this.entries.length > this.limit) {
      this.entries.shift();
    }
    this.cursor = this.entries.length - 1;
  }

  undo(): ComposeProject | null {
    if (!this.canUndo) return null;
    this.cursor--;
    return this.current;
  }

  redo(): ComposeProject | null {
    if (!this.canRedo) return null;
    this.cursor++;
    return this.current;
  }

  /** Replaces the entire history with a single fresh state (e.g. after loading YAML directly). */
  reset(project: ComposeProject, label = "Loaded"): void {
    this.entries = [{ label, project }];
    this.cursor = 0;
  }

  get undoLabel(): string | null {
    return this.canUndo ? this.entries[this.cursor].label : null;
  }

  get redoLabel(): string | null {
    return this.canRedo ? this.entries[this.cursor + 1].label : null;
  }
}
