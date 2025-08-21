import { useState} from "react";
import { useAuth } from "@/context/AuthContext";

export interface MessageDTO {
  text: string;
  sender: "user" | "bot";
}

export interface MessagesResponse {
  messages: MessageDTO[];
  success: boolean;
  error?: string;
}

const useChatbot = () => {
  const [messages, setMessages] = useState<MessageDTO[]>([{ text: "How can I help you today?", sender: "bot" }]);
  const { user, supabase } = useAuth();

  // Helper function to save message to database
  const saveMessageToDatabase = async (message: MessageDTO): Promise<boolean> => {
    if (!user?.id) {
      console.log("No user signed in, skipping message save");
      return false;
    }

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/supabase/save-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Text: message.text,
            Sender: message.sender,
            UserId: user.id,
          }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to save message: ${response.status}`);
        return false;
      }

      const result = await response.json();
      if (!result.success) {
        console.error("Error saving message:", result.error);
        return false;
      }

      console.log("Message saved successfully");
      return true;
    } catch (error) {
      console.error("Error calling save-message API:", error);
      return false;
    }
  };

  const sendMessage = async (message: string) => {
    // Create user message
    const userMessage: MessageDTO = { text: message, sender: "user" };
    
    const newMessages: MessageDTO[] = [
      ...messages,
      userMessage,
    ];
    setMessages(newMessages);

    // Save user message to database
    if (user?.id) {
      await saveMessageToDatabase(userMessage);
    }

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

      const botMessage: MessageDTO = { 
        text: data.content[0].text, 
        sender: "bot" 
      };
      
      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);

      // Save bot message to database
      if (user?.id) {
        await saveMessageToDatabase(botMessage);
      }
    } catch (error) {
      console.error("error in chatbot request: ", error);
    }
  };

  return { messages, sendMessage, setMessages };
};

export default useChatbot;