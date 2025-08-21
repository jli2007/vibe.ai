"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import useChatbot, { MessageDTO, MessagesResponse } from "@/hooks/useChatbot";
import useChatScroll from "@/hooks/chatbotAutoscroll";
import AlertFlash from "@/components/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  MessageCircleQuestion,
  SendHorizontal,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

const Starting_Message: MessageDTO = {
  text: "How can I help you today?",
  sender: "bot",
};

const App = () => {
  const { messages, sendMessage, setMessages } = useChatbot();
  const ref = useChatScroll(messages);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [previousMessages, setPreviousMessages] = useState<MessageDTO[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // info
  const [username, setUsername] = useState<string>("");
  const [pfp, setPfp] = useState<string>("/404profile.png");
  const [input, setInput] = useState<string>(
    "a playlist for a scenic drive in the alps"
  );
  const [copiedIndex, setCopiedIndex] = useState(null);

  // pages
  const [showSpotifyPage, setShowSpotifyPage] = useState<boolean>(true);
  const [shouldRenderSpotifyPage, setShouldRenderSpotifyPage] = useState(showSpotifyPage);
  const { supabase, signInWithOAuth, user, signOut } = useAuth();

  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.id) {
        setMessages([Starting_Message]);
        setIsInitialLoad(false);
        return;
      }

      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/supabase/get-messages/${user.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MessagesResponse = await response.json();

        if (data.success && data.messages && Array.isArray(data.messages)) {
          if (data.messages.length > 0) {
            const formattedMessages: MessageDTO[] = data.messages.map(
              (msg) => ({
                text: msg.text,
                sender: msg.sender,
              })
            );
            setMessages(formattedMessages);
          } else {
            // If no messages from API, set default
            setMessages([Starting_Message]);
          }
        } else {
          console.error("Error loading messages:", data.error);
        }
      } catch (error) {
        console.error("Error loading messages from API:", error);
      }

      setIsInitialLoad(false);
    };

    loadMessages();
  }, [user?.id, setMessages, supabase.auth]);

  useEffect(() => {
    // Don't save during initial load or if no user is signed in
    if (isInitialLoad || !user?.id || messages.length === 0) {
      setPreviousMessages(messages);
      return;
    }

    // Find new messages that weren't in the previous state
    const newMessages = messages.filter(
      (msg, index) =>
        index >= previousMessages.length ||
        msg.text !== previousMessages[index]?.text ||
        msg.sender !== previousMessages[index]?.sender
    );

    // Save each new message
    const saveNewMessages = async () => {
      for (const message of newMessages) {
        // Skip saving the default starting message
        if (
          message.text === Starting_Message.text &&
          message.sender === Starting_Message.sender
        ) {
          continue;
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
            continue;
          }

          const result = await response.json();
          if (!result.success) {
            console.error("Error saving message:", result.error);
          }
        } catch (error) {
          console.error("Error calling save-message API:", error);
        }
      }
    };

    if (newMessages.length > 0) {
      saveNewMessages();
    }

    // Update previous messages state
    setPreviousMessages(messages);
  }, [messages, user?.id, isInitialLoad, previousMessages, supabase.auth]);

  const clearMessages = async () => {
    if (!user?.id) {
      setMessages([Starting_Message]);
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/supabase/clear-messages/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MessagesResponse = await response.json();

      if (data.success && data.messages) {
        setMessages([Starting_Message]);
      } else {
        console.error("Error clearing messages:", data.error);
      }
    } catch (error) {
      console.error("Error clearing messages from API:", error);
    }
  };

  // set user on load if state is saved // !!!!! THIS GOTTA BE FIXED
  useEffect(() => {
    if (user) {
      setSignedIn(true);
    }
  }, [user]);

  // ensures mounted/unmounted properly when the visibility of sidebar changes
  useEffect(() => {
    if (showSpotifyPage) setShouldRenderSpotifyPage(true);
  }, [showSpotifyPage]);

  // remove # from url (supabase auth auto appends) and announce page state
  useEffect(() => {
    history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search
    );

    if (
      sessionStorage.getItem("redirectedAfterLogin") == "true" ||
      signedIn == true
    ) {
      setShowAlert(true);
    }

    const fetchSession = async () => {
      const session = await supabase.auth.getSession();

      console.log("SESSION", session);

      const accessToken = session.data.session?.provider_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/spotify/profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        }
      );

      const data = await res.json();

      console.log("SPOTIFY FETCH DATA", data);

      setUsername(data.displayName);
      setPfp(data.images[1].url);
    };

    fetchSession();
  }, [signedIn, supabase]);

  async function signInWithSpotify() {
    const { data, error } = await signInWithOAuth({
      provider: "spotify",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_HOST}/start`,
      },
    });
    console.log(data);
    if (error) {
      console.error("ERROR IN SIGNIN", error);
    }

    sessionStorage.setItem("redirectedAfterLogin", "true");
  }

  const parseBoldText = (text: string) => {
    // split text by **bold** patterns and map to JSX
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // remove the ** and make it bold
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold">
            {boldText}
          </strong>
        );
      }
      return part;
    });
  };

  const copyToClipboard = async (text: string, index: any) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="relative w-screen md:h-screen h-auto min-h-screen bg-stone-800">
      <div className="flex justify-center flex-row w-full h-full">
        {shouldRenderSpotifyPage && (
          <div className="w-[25%] relative h-full overflow-hidden">
            <AnimatePresence
              onExitComplete={() => setShouldRenderSpotifyPage(false)} // unmounts AFTER exit animation (avoids unmounting DURING)
            >
              {showSpotifyPage && ( // condition as the motion.div must become removed/hidden for onexitcomplete to complete
                <motion.div
                  key="sidebar"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.4 }}
                  className="absolute w-full h-full bg-stone-900 flex justify-start border-r"
                >
                  <div className="w-full flex justify-center">
                    <ArrowLeftFromLine
                      className="absolute text-stone-100/60 right-1 top-1/2 cursor-pointer"
                      onClick={() => setShowSpotifyPage(false)}
                    />
                    <h1 className="text-stone-100 p-2">
                      {username !== ""
                        ? "your spotify functions are here, " + username
                        : "sign in with spotify first"}
                    </h1>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {!shouldRenderSpotifyPage && (
          <AnimatePresence>
            <motion.div
              key="arrow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1 top-1/2 z-50"
            >
              <ArrowRightFromLine
                className="text-stone-100/60 cursor-pointer"
                onClick={() => setShowSpotifyPage(true)} // changes sidebar visibility to true --> in turn MOUNTS it via useeffect
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="relative w-full h-full border-b">
          <Button
            onClick={clearMessages}
            className="absolute left-4 top-4 z-50 p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400"
            title="Reload chat (Ctrl+Shift+D / Cmd+Shift+D)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div
            className="absolute inset-0 overflow-y-auto p-4 pt-16 pb-28"
            ref={ref}
          >
            <div className="flex flex-col gap-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      msg.sender === "user" ? "" : ""
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <Avatar className="w-8 h-8">
                        {" "}
                        <AvatarImage src={pfp} />
                        <AvatarFallback>profile</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-8 h-8">
                        {" "}
                        <AvatarImage src="/vibe.png" />
                        <AvatarFallback>bot</AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className="flex items-end gap-2 group">
                    <div
                      className={`p-3 rounded-lg max-w-xl break-words whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {parseBoldText(msg.text)}
                    </div>

                    <button
                      onClick={() => copyToClipboard(msg.text, index)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity delay-200 duration-500 p-2 rounded-md hover:bg-gray-200 ${
                        msg.sender === "user" ? "order-0" : ""
                      }`}
                      title="Copy message"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full h-full flex items-end justify-center pb-5 text-white">
            <div className="flex-1 flex flex-col">
              <div className="w-full flex items-center justify-center gap-1 z-50">
                <Input
                  onChange={(e) => setInput(e.target.value)}
                  className="w-[60%] bg-stone-700/75"
                  placeholder="playlist for a scenic drive in the alps"
                  value={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={() => {
                    handleSendMessage();
                  }}
                >
                  <SendHorizontal className="cursor-pointer" />
                </button>
              </div>
            </div>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button className="absolute right-0 top-0 p-5 m-3 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
                  {signedIn ? (
                    <Avatar>
                      <AvatarImage src={pfp} />
                      <AvatarFallback>profile</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar>
                      <AvatarImage src="/404profile.png" />
                      <AvatarFallback>404profile</AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-stone-900/50 text-stone-100 border-1 border-green1/70">
                <div className="grid gap-7">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none flex items-center justify-center w-full">
                      {!signedIn
                        ? "Connect Spotify to Vibe.ai"
                        : "Disconnect Spotify to Vibe.ai"}
                    </h4>
                  </div>

                  <div className="flex items-center justify-center w-full my-5">
                    <Button
                      onClick={() => {
                        if (!signedIn) {
                          signInWithSpotify();
                        } else {
                          signOut();
                          setSignedIn(false);
                          setPopoverOpen(false);
                          setShowAlert(true);
                        }
                      }}
                      className="p-3 rounded-lg bg-stone-700/50"
                    >
                      {!signedIn ? "configure" : "unconfigure"}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <AnimatePresence
              initial={false}
              onExitComplete={() => {
                // fixing the visibility issue (before fade out ends on alert component)
                setShowAlert(false);
                sessionStorage.setItem("redirectedAfterLogin", "false");
              }}
            >
              {showAlert && (
                <>
                  <AlertFlash
                    message={
                      sessionStorage.getItem("redirectedAfterLogin") == "true"
                        ? "IN"
                        : signedIn
                        ? "STATE"
                        : "OUT"
                    }
                    onClose={() => setShowAlert(false)}
                  />
                </>
              )}
            </AnimatePresence>

            <Button className="absolute right-0 bottom-0 p-1 m-3 px-5 text-md border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5 z-50">
              help <MessageCircleQuestion />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
