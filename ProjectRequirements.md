📄 Generic Requirements Document (GRD) – Primeform App
1. 📌 Project Context

Primeform is a mobile-first gym and fitness application built with:

Frontend: React Native (Expo / bare workflow).

Backend: Node.js with Express.js.

Database: MongoDB Atlas.

The app combines AI-powered personalized plans with general fitness tools, providing users with an elite, luxury experience through a navy blue background + golden text theme.

2. 🎯 Phase-wise Requirements
Phase 1 – Authentication & Security

User registration (email, username, password).

User login with JWT tokens for session management.

Forgot password & reset password flow (via email).

Basic profile setup (name, age, gender, weight, height).

Phase 2 – Home Pages

AI-Generated Fitness & Diet Plans:

User inputs goals (muscle gain, weight loss, strength).

AI generates personalized workout routines + diet plans.

Progress Trackers:

Track workouts completed, calories burned, weight updates.

Display progress in golden-highlighted charts & animations.

General Exercises Section:

Predefined list of exercises (push-ups, pull-ups, squats, planks).

Each exercise includes animated demo/video for proper form.

User can use this without AI customization.

Phase 3 – Profile Section

User profile management.

Update weight, height, goals, personal info.

View workout history & diet history.

Achievements & badges (visual rewards).

Phase 4 – Subscription Plans

Free Plan: Access to general exercises + limited AI features.

Premium Plan:

Access to AI-generated personalized plans.

Access to certified gym teachers/trainers (live/recorded guidance).

Additional custom meal planning.

Payment integration (Apple Pay / Google Pay / Stripe).

Phase 5 – Streaks & Engagement

Daily check-in system (like Snapchat streaks).

Users earn a streak for every day they complete a workout.

Golden streak counter displayed on profile.

If user misses a day → streak breaks (motivation mechanic).

Possible rewards/unlocks for long streaks.

3. 🎨 Design Principles

Theme: Navy Blue background, Golden text/icons.

UI: Minimalist, elegant, elite vibe.

Animations: React Native Reanimated + Lottie for smooth exercise demos.

UX: Seamless navigation (stack + bottom tabs).

4. 📂 Technical Structure Guidelines

Frontend:

components/ for reusable UI.

pages/ for main screens.

services/ for API calls.

hooks/ for custom logic.

store/ for state management.

Backend:

controllers/ for business logic.

routes/ for endpoints.

models/ for schemas.

middleware/ for auth/validation.

config/ for DB setup.

5. 🌍 External Considerations

App Store / Play Store compliance for design + payments.

Scalability: APIs + database must handle future features.

Data Privacy: JWT, password hashing, GDPR compliance.

Performance: Optimize animations, caching for AI responses.