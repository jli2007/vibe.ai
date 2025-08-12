"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
  SendHorizontal,
} from "lucide-react";

const App = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  // info
  const [username, setUsername] = useState<string>("");
  const [pfp, setPfp] = useState<string>("/404profile.png");
  const [input, setInput] = useState<string>("a playlist for a scenic drive in the alps");

  // pages
  const [showSpotifyPage, setShowSpotifyPage] = useState<boolean>(true);
  const [shouldRenderSpotifyPage, setShouldRenderSpotifyPage] =
    useState(showSpotifyPage);

  const { supabase, signInWithOAuth, user, signOut } = useAuth();

  // set user on load if state is saved // IS THIS NEEDED?
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

  // sends input to openai
  const sendInput = async () => {
    console.log("sending,", input)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/openai/response`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      }
    );

    const data = await res.json();
    console.log(data.content[0].text);
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
              className="absolute left-1 top-1/2"
            >
              <ArrowRightFromLine
                className="text-stone-100/60 cursor-pointer"
                onClick={() => setShowSpotifyPage(true)} // changes sidebar visibility to true --> in turn MOUNTS it via useeffect
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex-1 flex flex-col">
          <div className="w-full h-full border-b">
            <div className="w-full h-full flex items-end justify-center pb-5 text-white">
              <div className="w-full flex items-center justify-center gap-1">
                <Input
                  onChange={(e) => setInput(e.target.value)}
                  className="w-[60%] bg-stone-700/30"
                  placeholder="playlist for a scenic drive in the alps"
                  value={input}
                />
                <button onClick={sendInput}>
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
              <PopoverContent className="bg-stone-900/50 text-stone-100 border-green1/70">
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

            <Button className=" absolute right-0 bottom-0 p-1 m-3 px-5 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
              need help?
            </Button>
          </div>
        </div>
      </div>

      {/* <span className="p-2 m-2 text-2xl text-transparent bg-clip-text bg-linear-to-r from-green1 via-green2 to-green3 bg-size-200 animate-gradient-x">
        Vibe.ai
      </span> */}
    </div>
  );
};

export default App;
