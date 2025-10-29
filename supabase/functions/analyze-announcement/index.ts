import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();
    
    if (!title || !content) {
      throw new Error("Title and content are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing announcement:", { title, contentLength: content.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes announcements and provides structured metadata. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: `Analyze this announcement and provide:
1. A concise summary (2-3 sentences)
2. A category (one of: Policy Updates, General Info, Events, Technical, HR Updates, Operations)
3. A priority level (high, medium, or low) based on urgency and impact

Title: ${title}
Content: ${content}

Respond with JSON in this exact format:
{
  "summary": "your summary here",
  "category": "category name",
  "priority": "high|medium|low"
}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_announcement",
              description: "Analyze an announcement and extract metadata",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A concise 2-3 sentence summary of the announcement"
                  },
                  category: {
                    type: "string",
                    enum: ["Policy Updates", "General Info", "Events", "Technical", "HR Updates", "Operations"],
                    description: "The category that best fits this announcement"
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "The priority level based on urgency and impact"
                  }
                },
                required: ["summary", "category", "priority"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_announcement" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", data);

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log("Analysis result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-announcement:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});