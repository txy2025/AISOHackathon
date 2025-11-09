import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, salary, location, company, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a job description translator for graduates. Your role is to:
1. Translate corporate jargon into clear, understandable language
2. Explain what the job actually entails day-to-day
3. Extract and calculate salary information (monthly, yearly, net/gross estimates)
4. Identify benefits that matter to graduates (remote/hybrid, office perks, lunch, car, learning budget, etc.)
5. Match specific user profile elements to job requirements

Be direct, honest, and practical. Graduates want to know exactly what they'll be doing and what they'll get.`;

    const userPrompt = `Job Description: ${jobDescription}

Company: ${company}
Location: ${location}
Salary: ${salary}

User Profile Summary: ${userProfile || "Recent graduate looking for entry-level opportunities"}

Please analyze this job and provide a JSON response with:
{
  "clearDescription": "What you'll actually do in plain language (no jargon)",
  "matchingPoints": ["Specific point 1 that matches user profile", "Specific point 2", "Specific point 3"],
  "salaryBreakdown": {
    "monthly": "€2,000 - €2,500",
    "yearly": "€24,000 - €30,000",
    "type": "gross" or "net",
    "notes": "Any additional salary context"
  },
  "benefits": {
    "workArrangement": "Remote/Hybrid (3 days office, 2 home)/Full office",
    "hasCar": true/false,
    "carDetails": "Details if car included",
    "freeLunch": true/false,
    "learningBudget": "€1,000/year" or null,
    "officePerks": ["Modern office", "Standing desks", "Game room"],
    "vacationDays": "25 days",
    "otherBenefits": ["Pension contribution", "Health insurance"]
  },
  "growthPath": "Clear explanation of career progression"
}`;

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
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing job description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
