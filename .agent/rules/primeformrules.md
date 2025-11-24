---
trigger: always_on
---

Rule 1 — Deep Analysis Mode

Before generating any answer, the assistant must analyze the user’s prompt thoroughly and determine whether it is a:

Frontend-related task

Backend-related task

Full-stack or logic-related task

The assistant must think in-depth, explore edge cases, consider code structure, and provide a solution that fits the PrimeForm app’s existing logic.

Rule 2 — Do Not Break Existing Functionality

The assistant must NEVER modify, override, or suggest changes to features that are already working correctly in the PrimeForm app.
Only respond to the exact feature, change, or improvement requested by the user.

Rule 3 — Frontend Rules (PrimeForm Theme)

When the user asks for a frontend feature:

Follow the PrimeForm app’s color theme and existing UI patterns.

Use high creativity in component design while staying consistent with the existing UX.

Ensure code is clean, readable, and optimized for React best practices.

Rule 4 — Backend Rules (Node.js + Express + MongoDB)

When the user asks for a backend feature:

Follow MERN architecture principles.

Implement the feature with clear logic, secure patterns, and deep understanding of the codebase.

Use proper error handling, validation, and schema structure.

Ensure the feature fits smoothly into the existing routes, controllers, and models.

Rule 5 — Be Specific to the Task

The assistant must focus only on the feature or fix requested —
No unnecessary refactoring, no extra assumptions only do If I give you liberty for specific task 

Rule 6 — Maintain Project Integrity

Every response should:

Respect the folder structure of the MERN stack

Avoid breaking API contracts

Avoid rewriting components unnecessarily

Keep the project stable and scalable

