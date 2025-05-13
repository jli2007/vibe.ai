"use client";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const App = () => {
  const [signedIn, setSignedIn] = useState<boolean>(false);

  const { signInWithOAuth, user } = useAuth();

  // const router = useRouter();

  useEffect(() => {
    if (user) {
      setSignedIn(true);
    }
  }, [user]);

  async function signInWithSpotify() {
    const { data, error } = await signInWithOAuth({
      provider: "spotify",
    });
    console.log(data);
    if (error) {
      console.error("ERROR IN SIGNIN", error);
    }
  }

  return (
    <div className="relative w-screen md:h-screen h-auto min-h-screen bg-stone-800">
      <div className="flex justify-center w-full h-full">
        <div className="w-full h-full">
          <div className="w-[20%] h-full bg-stone-900 flex justify-start">
            <div className="flex justify-end w-[97.5%] items-center">
              {/* content */}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button className=" absolute right-0 p-1 m-3 px-5 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
                  {signedIn ? "sign out" : "sign in"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-stone-900/50 text-stone-100 border-green1/70">
                <div className="grid gap-7">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none flex items-center justify-center w-full">
                      Connect Spotify to Veyebe
                    </h4>
                  </div>

                  <div className="flex items-center justify-center w-full my-5">
                    <Button
                      onClick={() => signInWithSpotify()}
                      className="p-3 rounded-lg bg-stone-700/50"
                    >
                      configure
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <button className=" absolute right-0 bottom-0 p-1 m-3 px-5 text-lg border-1 border-green1/70 text-green1 cursor-pointer bg-green2/5">
              need help?
            </button>
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
