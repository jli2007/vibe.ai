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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sparkles,
  LogIn,
} from "lucide-react";

const App = () => {
  const { messages, sendMessage, setMessages } = useChatbot();
  const ref = useChatScroll(messages);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const [showWelcomeInfo, setShowWelcomeInfo] = useState(true);
  const [isBotTalking, setIsBotTalking] = useState<boolean>(false);

  const [username, setUsername] = useState<string>("");
  const [pfp, setPfp] = useState<string>("/404profile.png");
  const [input, setInput] = useState<string>(
    "a playlist for a scenic drive in the alps"
  );
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [showSpotifyPage, setShowSpotifyPage] = useState<boolean>(true);
  const [shouldRenderSpotifyPage, setShouldRenderSpotifyPage] = useState(showSpotifyPage);
  const [showSpotifyFunctions, setShowSpotifyFunctions] = useState<boolean>(false);
  const [needsSpotifyReauth, setNeedsSpotifyReauth] = useState<boolean>(false);
  const { supabase, signInWithOAuth, user, signOut } = useAuth();

  useEffect(() => {
    // Load messages when user changes
    const loadMessages = async () => {
      if (!user) {
        setMessages([]);
        setUsername("");
        setPfp("/404profile.png");
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
          const formattedMessages: MessageDTO[] = data.messages.map((msg) => ({
            text: msg.text,
            sender: msg.sender,
          }));
          setMessages(formattedMessages);

          // Hide welcome info if there are existing messages
          if (formattedMessages.length > 0) {
            setShowWelcomeInfo(false);
            setShowSpotifyFunctions(true);
          }
        } else {
          console.error("Error loading messages:", data.error);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading messages from API:", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [user, setMessages, supabase.auth]);

  const clearMessages = async () => {
    if (!user?.id) {
      setMessages([]);
      setShowWelcomeInfo(true);
      setShowSpotifyFunctions(false);
      return;
    }

    // no need to clear if its already empty
    if (!messages || messages.length === 0) {
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

      if (data.success) {
        setMessages([]);
        setShowWelcomeInfo(true);
        setShowSpotifyFunctions(false);
      } else {
        console.error("Error clearing messages:", data.error);
      }
    } catch (error) {
      console.error("Error clearing messages from API:", error);
    }
  };

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
      user // Use user instead of user
    ) {
      setShowAlert(true);
    }

    const handleMissingSpotifyToken = () => {
      // Set flag to show that Spotify needs re-authentication
      setNeedsSpotifyReauth(true);

      // Set fallback values but don't sign the user out completely
      setUsername(user?.user_metadata?.full_name || user?.email || "User");
      setPfp("/404profile.png");

      console.log("Spotify re-authentication required");
    };

    const fetchSession = async () => {
      // Only fetch if user exists
      if (!user) {
        setUsername("");
        setPfp("/404profile.png");
        setNeedsSpotifyReauth(false);
        return;
      }

      try {
        const session = await supabase.auth.getSession();
        console.log("INITIAL SESSION", session);

        let currentSession = session.data.session;

        // If we have a session but no provider_token, try to refresh
        if (currentSession && !currentSession.provider_token) {
          console.log(
            "No provider token found, attempting to refresh session..."
          );

          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            handleMissingSpotifyToken();
            return;
          }

          // Use the refreshed session
          currentSession = refreshData.session;
          console.log("REFRESHED SESSION", currentSession);
        }

        // Now check for provider token
        if (currentSession?.provider_token) {
          // Reset the reauth flag since we have a token
          setNeedsSpotifyReauth(false);

          const accessToken = currentSession.provider_token;

          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/spotify/profile`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({ accessToken }),
              }
            );

            if (res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                console.log("SPOTIFY FETCH DATA", data);

                setUsername(data.displayName || "User");
                setPfp(
                  data.images?.[1]?.url ||
                    data.images?.[0]?.url ||
                    "/404profile.png"
                );
              } else {
                console.error("Server returned non-JSON response");
                handleMissingSpotifyToken();
              }
            } else {
              console.error("Failed to fetch Spotify profile:", res.status);
              // If it's a 401, the token might be expired
              if (res.status === 401) {
                handleMissingSpotifyToken();
              } else {
                handleMissingSpotifyToken();
              }
            }
          } catch (fetchError) {
            console.error(
              "Network error fetching Spotify profile:",
              fetchError
            );
            handleMissingSpotifyToken();
          }
        } else {
          // Still no provider token after refresh
          console.warn("No provider token available after refresh");
          handleMissingSpotifyToken();
        }
      } catch (error) {
        console.error("Error in fetchSession:", error);
        handleMissingSpotifyToken();
      }
    };
    fetchSession();
  }, [user, supabase]);

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

  // Add a function to handle Spotify re-authentication
  const handleSpotifyReauth = async () => {
    try {
      // First, try to sign out and sign back in with Spotify
      const { error } = await signInWithOAuth({
        provider: "spotify",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_HOST}/start`,
        },
      });

      if (error) {
        console.error("Error re-authenticating with Spotify:", error);
      } else {
        sessionStorage.setItem("redirectedAfterLogin", "true");
        setNeedsSpotifyReauth(false);
      }
    } catch (error) {
      console.error("Error in Spotify re-authentication:", error);
    }
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

  const getInputPlaceholder = () => {
    if (!user) {
      return "Sign in to start chatting...";
    }
    if (showSpotifyFunctions) {
      return "Use functions on the left, or describe a new playlist...";
    }
    return "playlist for a scenic drive in the alps";
  };

  const handleMessageSend = async () => {
    // Don't allow sending messages if user is not signed in
    if (!user) {
      return;
    }

    if (input.trim()) {
      // Hide welcome info when first message is sent
      if (showWelcomeInfo) {
        setShowWelcomeInfo(false);
      }

      setIsBotTalking(true);

      try {
        await sendMessage(input);
        setInput("");
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        // Clear loading state after message is sent
        setIsBotTalking(false);
      }
    }
  };

  const TypingIndicator = () => {
    return (
      <div className="flex items-end gap-3 justify-start">
        <div className="flex-shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/vibe.png" />
            <AvatarFallback>bot</AvatarFallback>
          </Avatar>
        </div>

        <div className="p-3 rounded-lg bg-gray-300 text-gray-800 max-w-xl">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">Vibe is thinking</span>
            <div className="flex gap-1 ml-2">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SpotifyReauthNotification = () => {
    if (!needsSpotifyReauth || !user) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 bg-amber-600/20 backdrop-blur-md border border-amber-500/30 rounded-lg p-3 mx-4"
      >
        <div className="flex items-center gap-3 text-amber-200">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Spotify connection expired</span>
          <Button
            onClick={handleSpotifyReauth}
            className="bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 text-xs px-3 py-1 h-auto"
          >
            Reconnect
          </Button>
        </div>
      </motion.div>
    );
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
                  <div className="w-full h-full flex flex-col">
                    <ArrowLeftFromLine
                      className="absolute text-stone-100/60 right-1 top-2 cursor-pointer z-10"
                      onClick={() => setShowSpotifyPage(false)}
                    />

                    <div className="p-4">
                      <h1 className="text-stone-100 text-sm font-medium mb-4">
                        {user ? (
                          <div className="flex items-center gap-2">
                            <span>{`Spotify Functions - ${username}`}</span>
                            {needsSpotifyReauth && (
                              <div
                                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                                title="Spotify needs reconnection"
                              />
                            )}
                          </div>
                        ) : (
                          "Sign in with Spotify first"
                        )}
                      </h1>

                      {showSpotifyFunctions && user && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-stone-300 text-sm font-medium tracking-wide">
                              Spotify Actions
                            </h2>
                            <Button
                              onClick={clearMessages}
                              className="bg-slate-600/20 hover:bg-slate-600/40 border border-slate-500/30 text-slate-300 text-xs px-3 py-1.5 h-auto flex items-center gap-1"
                              title="Start a new request"
                            >
                              <RotateCcw className="w-3 h-3" />
                              New Request
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {/* Create New Playlist */}
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Button
                                className="relative w-full text-left justify-start bg-green-600/15 hover:bg-green-600/25 border border-green-500/30 text-green-200 text-sm h-auto py-4 px-4 rounded-lg backdrop-blur-sm overflow-hidden"
                                onClick={() => {
                                  console.log("Create new playlist clicked");
                                }}
                              >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-400/10 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full translate-y-2 -translate-x-2"></div>

                                {/* Spotify icon placeholder */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-green-400/40 rounded-full"></div>
                                </div>

                                <div className="flex flex-col items-start relative z-10">
                                  <span className="font-semibold text-green-100">
                                    Create New Playlist
                                  </span>
                                  <span className="text-xs text-green-300/80 mt-0.5">
                                    Generate a fresh playlist with all
                                    suggestions
                                  </span>
                                </div>
                              </Button>
                            </div>

                            {/* Add to Existing Playlist */}
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative w-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 rounded-lg backdrop-blur-sm overflow-hidden p-4">
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full translate-y-2 -translate-x-2"></div>

                                {/* Playlist icon placeholder */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-blue-400/40 rounded-sm"></div>
                                  <div className="w-1 h-1 bg-blue-400/40 rounded-full ml-0.5"></div>
                                </div>

                                <div className="flex flex-col space-y-3 relative z-10">
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold text-blue-100">
                                      Add to Existing Playlist
                                    </span>
                                    <span className="text-xs text-blue-300/80 mt-0.5">
                                      Select songs to add to your playlists
                                    </span>
                                  </div>

                                  <Select>
                                    <SelectTrigger className="w-full bg-blue-600/20 border-blue-500/40 text-blue-200 text-xs h-8">
                                      <SelectValue placeholder="Choose playlist..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-stone-800 border-blue-500/40">
                                      <SelectItem value="liked">
                                        Liked Songs
                                      </SelectItem>
                                      <SelectItem value="chill">
                                        Chill Vibes
                                      </SelectItem>
                                      <SelectItem value="workout">
                                        Workout Mix
                                      </SelectItem>
                                      <SelectItem value="road-trip">
                                        Road Trip Hits
                                      </SelectItem>
                                      <SelectItem value="focus">
                                        Focus Music
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            {/* Save Individual Songs */}
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Button
                                className="relative w-full text-left justify-start bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-200 text-sm h-auto py-4 px-4 rounded-lg backdrop-blur-sm overflow-hidden"
                                onClick={() => {
                                  console.log("Save individual songs clicked");
                                }}
                              >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full translate-y-2 -translate-x-2"></div>

                                {/* Heart icon placeholder */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-400/20 rounded-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-purple-400/40 rounded-full relative">
                                    <div className="absolute top-0 left-1 w-1 h-1 bg-purple-400/60 rounded-full"></div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-start relative z-10">
                                  <span className="font-semibold text-purple-100">
                                    Individual Songs
                                  </span>
                                  <span className="text-xs text-purple-300/80 mt-0.5">
                                    Add selected tracks to your library
                                  </span>
                                </div>
                              </Button>
                            </div>

                            {/* Preview Songs */}
                            <div className="relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <Button
                                className="relative w-full text-left justify-start bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/30 text-orange-200 text-sm h-auto py-4 px-4 rounded-lg backdrop-blur-sm overflow-hidden"
                                onClick={() => {
                                  console.log("Preview songs clicked");
                                }}
                              >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full -translate-y-4 translate-x-4"></div>
                                <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full translate-y-2 -translate-x-2"></div>

                                {/* Play icon placeholder */}
                                <div className="absolute top-2 right-2 w-6 h-6 bg-orange-400/20 rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[4px] border-l-orange-400/60 border-y-[2px] border-y-transparent ml-0.5"></div>
                                </div>

                                <div className="flex flex-col items-start relative z-10">
                                  <span className="font-semibold text-orange-100">
                                    Preview Songs
                                  </span>
                                  <span className="text-xs text-orange-300/80 mt-0.5">
                                    Listen to 30-second previews
                                  </span>
                                </div>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CHANGE: Added message when functions aren't visible yet */}
                      {!showSpotifyFunctions && user && (
                        <p className="text-stone-400 text-xs">
                          Functions will appear after you send a message
                        </p>
                      )}
                    </div>
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
          <div
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 w-[97.5%] bg-gradient-to-tr from-gray-600/45 to-gray-600/30 backdrop-blur-md rounded-lg drop-shadow-2xl border border-white/10 
                          before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent before:rounded-lg before:pointer-events-none"
          >
            <div className="flex justify-between items-center mx-2 p-1">
              <Button
                onClick={clearMessages}
                className=" p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400"
                title="Reload chat (Ctrl+Shift+D / Cmd+Shift+D)"
                disabled={!user}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-green-500 to-green-300 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                Vibe.ai
              </h1>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button className="p-5 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
                    {user ? (
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
                <PopoverContent className="bg-stone-900/90 text-stone-100 border-1 border-green1/70">
                  <div className="grid gap-7">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none flex items-center justify-center w-full">
                        {!user
                          ? "Connect Spotify to Vibe.ai"
                          : "Disconnect Spotify to Vibe.ai"}
                      </h4>
                    </div>

                    <div className="flex items-center justify-center w-full my-5">
                      <Button
                        onClick={() => {
                          if (!user) {
                            signInWithSpotify();
                          } else {
                            signOut();
                            setUsername("");
                            setPfp("/404profile.png");
                            setMessages([]);
                            setShowWelcomeInfo(true);
                            setShowSpotifyFunctions(false);
                            setPopoverOpen(false);
                            setShowAlert(true);
                          }
                        }}
                        className="p-3 rounded-lg bg-stone-700/50"
                      >
                        {!user ? "configure" : "unconfigure"}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <SpotifyReauthNotification />

          <div
            className="absolute inset-0 overflow-y-auto p-4 pt-16 pb-28"
            ref={ref}
          >
            {/* Welcome Info Component */}
            <AnimatePresence>
              {showWelcomeInfo && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center min-h-[50vh]"
                >
                  <div className="bg-gradient-to-br from-stone-700/40 to-stone-800/40 backdrop-blur-sm border border-stone-600/30 rounded-xl p-8 max-w-md text-center">
                    <div className="flex justify-center mb-4">
                      {user ? (
                        <Sparkles className="w-12 h-12 text-green-400 animate-pulse" />
                      ) : (
                        <LogIn className="w-12 h-12 text-orange-400 animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-stone-100 mb-3">
                      {user ? "Welcome to Vibe.ai" : "Sign In Required"}
                    </h3>
                    <p className="text-stone-300 mb-4 leading-relaxed">
                      {user
                        ? "I'm here to help you create the perfect playlists for any mood or occasion. Start typing a message below to begin our conversation!"
                        : "Please connect your Spotify account to use Vibe.ai's playlist creation features. Click the profile button in the top right to sign in."}
                    </p>
                    {!user && (
                      <Button
                        onClick={signInWithSpotify}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in with Spotify
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
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
                        <AvatarImage src={pfp} />
                        <AvatarFallback>profile</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-8 h-8">
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
              <AnimatePresence>
                {isBotTalking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="w-full h-full flex items-end justify-center pb-5 text-white">
            <div className="flex-1 flex flex-col">
              <div className="w-full flex items-center justify-center gap-1 z-50">
                <Input
                  onChange={(e) => setInput(e.target.value)}
                  className={`w-[60%] ${
                    user && !isBotTalking
                      ? "bg-stone-700/75"
                      : "bg-stone-700/50 text-stone-500 cursor-not-allowed"
                  }`}
                  placeholder={
                    isBotTalking
                      ? "Vibe is responding..."
                      : getInputPlaceholder()
                  }
                  value={input}
                  disabled={!user || isBotTalking}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && user && !isBotTalking) {
                      e.preventDefault();
                      handleMessageSend();
                    }
                  }}
                />
                <button
                  onClick={handleMessageSend}
                  disabled={!user || isBotTalking}
                  className={
                    user && isBotTalking ? "" : "opacity-50 cursor-not-allowed"
                  }
                >
                  {isBotTalking ? (
                    <div className="w-5 h-5 border-2 border-stone-500 border-t-green-400 rounded-full animate-spin"></div>
                  ) : (
                    <SendHorizontal className="cursor-pointer" />
                  )}
                </button>
              </div>
            </div>

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
                        : user
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
