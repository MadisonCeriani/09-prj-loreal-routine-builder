addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { model, messages, max_tokens, tools } = await request.json();

    // Validate required fields
    if (!model || !messages || !max_tokens) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Prepare the payload for OpenAI API
    const payload = {
      model,
      messages,
      max_tokens,
      tools: tools || [], // Include tools if provided
    };

    const apiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!apiResponse.ok) {
      return new Response(`OpenAI API error: ${apiResponse.status}`, {
        status: apiResponse.status,
      });
    }

    const data = await apiResponse.json();

    // Return the response from OpenAI API
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(`Internal Server Error: ${error.message}`, {
      status: 500,
    });
  }
}
