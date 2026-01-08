import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChartSuggestion {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  xAxis: string;
  yAxis: string;
  reason: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, sampleRows } = await req.json();
    
    if (!headers || !sampleRows) {
      throw new Error("Missing headers or sample data");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a data visualization expert. Analyze the provided spreadsheet data and suggest the best charts to visualize it.

Rules:
- Suggest 2-4 charts that would be most insightful for this data
- Consider the data types: use categorical data for x-axis in bar/pie charts, numeric for y-axis
- Use line/area charts for time series or sequential data
- Use pie charts only when showing parts of a whole (limited categories)
- Each suggestion must use actual column names from the data

Respond with a JSON array of chart suggestions.`;

    const userPrompt = `Analyze this spreadsheet data and suggest the best charts:

Columns: ${headers.join(", ")}

Sample data (first 5 rows):
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Suggest 2-4 optimal charts. For each chart, specify the type (bar/line/pie/area), a descriptive title, which column to use for x-axis, which for y-axis, and a brief reason why this visualization is useful.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_charts",
              description: "Return chart suggestions for the data",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["bar", "line", "pie", "area"] },
                        title: { type: "string" },
                        xAxis: { type: "string" },
                        yAxis: { type: "string" },
                        reason: { type: "string" }
                      },
                      required: ["type", "title", "xAxis", "yAxis", "reason"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_charts" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract suggestions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No suggestions returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const suggestions: ChartSuggestion[] = parsed.suggestions;

    // Validate that suggested columns exist in headers
    const validSuggestions = suggestions.filter(s => 
      headers.includes(s.xAxis) && headers.includes(s.yAxis)
    );

    return new Response(
      JSON.stringify({ suggestions: validSuggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in suggest-charts function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
