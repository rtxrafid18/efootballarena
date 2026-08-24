# eFootball Arena

Create a slick, highly user-friendly, and responsive eFootball tournament web application with a modern dark theme mixing SofaScore UI clarity and FIFA World Cup aesthetic (maroon #800020 and gold #e5b842 accents).

Design & Match Center Rules (Ultra-Clean UI):

SofaScore Match Cards: Show team logos, live/finished badges, and scorelines.

Minimal Goal Timeline: Below each match card, display ONLY goal scorer names with exact minutes (e.g., '⚽ Messi 34', 88'').

Awards Logic & Automation Rules (CRITICAL):

Golden Boot (100% Automated): Automatically calculates top goalscorers directly from the goal events entered in match cards.

Golden Ball (Smart Auto-Calculation): Automatically ranks the best overall tournament player based on a weighted formula: Total Goals + Total Assists + MVP points.

MVP (Man of the Match) Selection: In the Admin Panel, allow the admin to select/assign the 'MVP' for each completed match.

Top Assists & Golden Gloves (Dedicated Admin Input): Provide clean, dedicated admin management tables to manually update/edit player assist counts and goalkeeper clean sheet/save stats (so match cards stay clutter-free).

Tournament System & Cloud Storage:

Format Switcher (Admin Switchable): Easily toggle between 48 Teams Group Stage (12 Groups) and Direct Knockout Mode (Round of 32).

Supabase Cloud Database: Integrated with Supabase so all match results, group standings, awards calculations, and settings remain permanently saved in the cloud across all devices."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://efootballarena.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/02fb4b44-fb15-4005-a2d3-88157721ebc8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
