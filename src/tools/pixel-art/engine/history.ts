import type { PixelDiff } from './types';

export class PixelHistory {
  private undoStack: PixelDiff[][] = [];
  private redoStack: PixelDiff[][] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  push(diffs: PixelDiff[]): void {
    if (diffs.length === 0) return;
    this.undoStack.push(diffs);
    this.redoStack = [];
  }

  undo(grid: Uint8Array): PixelDiff[] | null {
    const diffs = this.undoStack.pop();
    if (!diffs) return null;
    for (let i = diffs.length - 1; i >= 0; i--) {
      const { index, prev } = diffs[i];
      if (index >= 0 && index < grid.length) {
        grid[index] = prev;
      }
    }
    this.redoStack.push(diffs);
    return diffs;
  }

  redo(grid: Uint8Array): PixelDiff[] | null {
    const diffs = this.redoStack.pop();
    if (!diffs) return null;
    for (let i = 0; i < diffs.length; i++) {
      const { index, next } = diffs[i];
      if (index >= 0 && index < grid.length) {
        grid[index] = next;
      }
    }
    this.undoStack.push(diffs);
    return diffs;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
