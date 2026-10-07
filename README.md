# Alta Heatmap

Act as a Senior Frontend Developer and design a Mobile-First Single Page Application (SPA) using React and Tailwind CSS. The project is named "Alta Heatmap," a real estate analytics tool with a premium, minimalist, and clean aesthetic directly inspired by Apple’s design philosophy (Jony Ive): abundant whitespace, elegant sans-serif typography, subtle rounded corners, and absolutely no text clutter.

The application must include the following modules and interactive features:

1. GLOBAL NAVIGATION & FILTERS (Top Area):

- A fixed top navigation bar featuring a sleek, geometric "A" logo in deep navy blue.

- Right below the navbar, include two interactive segmented controls (pill-shaped buttons joined together):

  * Filter 1 (Property Type): Options are "All", "Condo", "Co-op", "TH".

  * Filter 2 (Size): Options are "All", "1 Bed", "2 Bed", "3 Bed".

- Clicking any pill must instantly trigger an active visual state (navy blue background with white text), simulating a live data filter.

2. INTERACTIVE SIMPLIFIED VECTOR MAP (Center Screen):

- Using SVG or vector shapes, draw a stylized, abstract silhouette representing Manhattan (NYC), geometrically divided into polygons that represent key micro-neighborhoods (e.g., Upper West Side, Chelsea, Midtown, FiDi, Harlem).

- Include a fixed, elongated central green polygon clearly representing "Central Park".

- TEMPERATURE LOGIC: The map polygons must be dynamically colored using semi-transparent shades based on these business rules:

  * Sophisticated Magenta/Fuchsia: Represents a "HOT" market (Seller's Market - Less than 5 months of supply).

  * Premium Light Gray: Represents an "EVEN" market (Neutral Market - 5 to 6 months of supply).

  * Light Azure/Cyan Blue: Represents a "COLD" market (Buyer's Market - Over 6 months of supply).

- INTERACTION: Clicking or tapping a neighborhood polygon must trigger a subtle zoom or opacity feedback effect on that specific neighborhood and seamlessly reveal the Bottom Sheet.

3. FLOATING THERMAL LEGEND:

- Position a fixed, discrete horizontal legend bar in the bottom-left corner of the map, mapping the three colors to their labels: "🔥 HOT (Seller's)", "⬜ EVEN (Neutral)", "❄️ COLD (Buyer's)".

4. DYNAMIC BOTTOM SHEET (Mobile-First Information Panel):

- Design a bottom panel that smoothly slides up from the base of the screen when a neighborhood is selected. On mobile devices, it should occupy exactly one-third of the screen height by default.

- The panel must display data cleanly using an Apple-inspired layout:

  * The selected Neighborhood Name in a prominent, bold typeface (e.g., "Upper West Side").

  * A colored status badge showing the current thermal market state.

  * Four key metrics neatly structured in a clean 2x2 grid:

    - Supply (Months of Supply)

    - Avg DOM (Average Days on Market)

    - Avg Price/sqft (Average Price per Square Foot)

    - In Contract (Properties currently in contract)

  * LOCAL DUALITY LOGIC: Inside this panel, replicate the "Type" and "Size" segmented filters. If the user toggles a local filter here, simulate the metric numbers changing and instantly update the background map polygon color for that neighborhood (e.g., switching from 'All' to 'Condo' changes the neighborhood color from Gray to Magenta).

  * A highly visible call-to-action button at the bottom reading: "SEE LISTINGS".

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alta-heat-map.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e811fb8c-145c-43d2-87db-b462f939d53e).

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
