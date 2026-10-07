import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildHeatmap, parseHeatmapParams } from "@/lib/heatmap-data";

// GET /api/heatmap?propertyType=all|condo|co-op|th&bedrooms=all|1|2|3|4+
export const Route = createFileRoute("/api/heatmap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const parsed = parseHeatmapParams(new URL(request.url).searchParams);
        if (!parsed) {
          return Response.json(
            {
              error: "Invalid query parameters",
              expected: {
                propertyType: ["all", "condo", "co-op", "th"],
                bedrooms: ["all", "1", "2", "3", "4+"],
              },
            },
            { status: 400 },
          );
        }
        return Response.json(buildHeatmap(parsed.type, parsed.bedrooms), {
          headers: { "Cache-Control": "public, max-age=300" },
        });
      },
    },
  },
});
