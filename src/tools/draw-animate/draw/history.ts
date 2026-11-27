export class CanvasHistory {
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private readonly maxSteps: number;

  constructor(maxSteps = 35) {
    this.maxSteps = maxSteps;
  }

  push(snapshot: ImageData): void {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxSteps) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(current: ImageData): ImageData | null {
    const prev = this.undoStack.pop();
    if (!prev) return null;
    this.redoStack.push(current);
    return prev;
  }

  redo(current: ImageData): ImageData | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(current);
    return next;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
