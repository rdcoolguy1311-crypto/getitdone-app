
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }

  try {
    const body = await req.json();
    const question = String(body.question || "").trim();

    if (!question || question.length > 2000) {
      return new Response(
        JSON.stringify({
          error: "Please enter a question under 2,000 characters."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "The AI tutor isn't configured yet. Please try again later."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "You are GetItDone's friendly AI Study Tutor for school students. " +
            "Explain concepts clearly in age-appropriate language. " +
            "Help students understand and solve problems step by step. " +
            "Ask guiding questions when useful instead of simply giving answers. " +
            "Do not pretend to know facts you are unsure about.",
          input: question,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "The tutor couldn't answer right now. Please try again."
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    return new Response(
      JSON.stringify({
        answer: answer || "I couldn't generate an answer. Please try again."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
