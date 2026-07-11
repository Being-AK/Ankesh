export interface GeminiResponse {
    text: string;
    sources?: { title: string; uri: string }[];
}

export const sendMessageToGemini = async (
    message: string, 
    history: { role: string, parts: { text: string }[] }[],
    image?: { mimeType: string; data: string }
): Promise<GeminiResponse> => {
    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                history,
                image
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error calling backend chat API:", error);
        return {
            text: "I apologize, but I am currently experiencing a connection issue or unable to access the required portals at this moment. Please try again shortly."
        };
    }
};
