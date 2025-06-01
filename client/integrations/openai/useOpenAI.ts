// must rewrite into server .net

import axios from "axios";

export const useOpenAI = async (prompt: string) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "From the given prompt, extract and categorize relevant information into the following: 'artists', 'genres', 'vibes', and 'energy'. Leave any category empty if not applicable. Return a clean JSON object with these keys.",
          },

          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const res = response.data.choices[0].message.content;
    const parsed = JSON.parse(res);

    //JSON parsed format
    return parsed;
  } catch (e) {
    console.log("ERROR IN OPENAI", e);
  }
};
