# Drawing Core

This folder is reserved for the interaction engine.

Planned modules:

- `DrawingManager.ts`: owns all drawings and render invalidation.
- `InteractionController.ts`: receives pointer events and routes them to tools, selection, drag, or chart pan.
- `SelectionController.ts`: selected object, hover object, multi-select later.
- `DragController.ts`: handle dragging and body dragging.
- `ToolController.ts`: active tool lifecycle, draft points, preview points.
- `HistoryController.ts`: undo/redo stack.
- `RenderLoop.ts`: requestAnimationFrame scheduler.

Current project still uses `src/components/DrawingLayer.tsx`; this folder will be integrated gradually so the live app does not break.
