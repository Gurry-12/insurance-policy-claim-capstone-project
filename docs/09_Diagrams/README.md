# Diagrams

> Diagram gallery for the whole project. All diagrams are Mermaid so they render
> on GitHub and are maintainable in Markdown.

## Purpose

Central place for every architecture and flow diagram. Documents elsewhere
**link here** instead of inlining diagrams, keeping this folder the single
source of diagram truth.

## Index

| Folder | Contents |
|---|---|
| `Sequence_Diagrams/` | Auth/OTP/login, quote→purchase→payment, claim lifecycle, token refresh |
| `Class_Diagrams/` | Backend class structure (strategy family, layered) + package dependencies |
| `ER_Diagrams/` | Entity-relationship overview (detailed column-level ER in `../04_Database/ER_Diagram.md`) |
| `Activity_Diagrams/` | Business process activity/state diagrams (purchase, claim, user lifecycle…) |
| `Flowcharts/` | Process flowcharts (payment activation, auth, password reset) |

## How to reference a diagram

From any doc, link to the file: `../09_Diagrams/Sequence_Diagrams/README.md`.
Keep inline Mermaid to small, self-contained snippets only.

## Rendering

Mermaid renders automatically on GitHub. For local editing, use the Mermaid
live editor or VS Code Mermaid preview.

## Related

- `../08_Workflows/` — the flow narratives that these diagrams illustrate
- `../04_Database/ER_Diagram.md` — authoritative column-level ER diagram
- `../06_Backend/JWT.md` — token lifecycle sequence
