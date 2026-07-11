import { Handler } from "@netlify/functions";
import { executeGeminiChat } from "../../services/geminiBackend";

export const handler: Handler = async (event, context) => {
  // CORS Preflight headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST instead." })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { message, history, image } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "The 'message' property is required in the body." })
      };
    }

    const response = await executeGeminiChat(message, history || [], image);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error: any) {
    console.error("Error in netlify function 'chat':", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        text: "I apologize, but I am currently experiencing an internal server issue or unable to access the required portals at this moment. Please try again shortly."
      })
    };
  }
};
