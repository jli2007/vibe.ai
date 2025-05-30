"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AlertFlash from "@/components/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "motion/react";

const App = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [open, setOpen] = useState(false);

  const { signInWithOAuth, user, signOut } = useAuth();

  // set user on load if state is saved
  useEffect(() => {
    if (user) {
      setSignedIn(true);

      // call .net get spotify
      setUsername("placeholder");
    }
  }, [user]);

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
  }, [signedIn]);

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

  return (
    <div className="relative w-screen md:h-screen h-auto min-h-screen bg-stone-800">
      <div className="flex justify-center flex-row w-full h-full">
        <div className="w-[25%] h-full bg-stone-900 flex justify-start border-r">
          <div className="w-full">
            <h1 className="text-stone-100 p-2">
              {username !== ""
                ? "welcome " + username
                : "sign in with spotify first"}
            </h1>
          </div>
        </div>

        <div className="w-[80%] h-full border-b">
          <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button className="absolute right-0 top-0 p-1 m-3 px-5 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
                  {signedIn ? "sign out" : "sign in"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-stone-900/50 text-stone-100 border-green1/70">
                <div className="grid gap-7">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none flex items-center justify-center w-full">
                      {!signedIn
                        ? "Connect Spotify to Veyebe"
                        : "Disconnect Spotify to Veyebe"}
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
                          setOpen(false);
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
              // fixing the visibility issue (before fade out ends on alert component)
              onExitComplete={() => {
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
        veyebe.ai
      </span> */}
    </div>
  );
};

export default App;
