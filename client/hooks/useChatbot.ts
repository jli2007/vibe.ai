import { useState } from "react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([{ text: "How can I help you today?", sender: "bot" } ]);

  const sendMessage = async (message: string) => {
    const newMessages: Message[] = [
      ...messages,
      { text: message, sender: "user" },
    ];
    setMessages(newMessages);

    try {
      console.log("sending,", message);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/openai/response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        }
      );

      const data = await response.json();

      console.log(data.content[0].text);

      const botMessage = data.content[0].text
      setMessages([...newMessages, { text: botMessage, sender: "bot" }]);
    } catch (error) {
      console.error("error in chatbot request: ", error);
    }
  };
  return { messages, sendMessage };
};

export default useChatbot;
