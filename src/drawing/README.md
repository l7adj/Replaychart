# ReplayChart Drawing Engine

This folder contains the professional drawing-engine structure for ReplayChart.

The goal is to keep drawing tools separated into clear layers:

- `core/`: interaction, selection, dragging, history, and orchestration.
- `geometry/`: pure math using time/price domain values.
- `tools/`: tool behavior definitions, point requirements, creation rules, and previews.
- `objects/`: serializable drawing-object models.
- `renderers/`: canvas rendering helpers.
- `fibonacci/`: Fibonacci-specific levels, settings, calculations, and labels.
- `persistence/`: versioned save/load schemas.
- `state/`: stores for tool, selection, drawing objects, and history.

Rule: drawing objects must be stored in market coordinates `{ time, price }`, never as screen pixels. Pixel conversion happens only during render, hit testing, and pointer interaction.
