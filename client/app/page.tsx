// landing
"use client";
import { useRouter } from 'next/navigation'

export default function Home() {
  const router=  useRouter();
  return (
    <div className="relative w-screen min-h-screen h-auto bg-stone-800">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_rgba(30,215,96,0.25)_0%,_transparent_60%)] transition-all duration-300" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,_rgba(30,215,96,0.15)_10%,_transparent_40%)] transition-all duration-300" />
      <div className="flex justify-center">
        <div className="flex justify-between w-[97.5%] items-center">
          <span className="p-2 m-2 text-2xl text-transparent bg-clip-text bg-linear-to-r from-green1 via-green2 to-green3 bg-size-200 animate-gradient-x">
            v.aibe
          </span>
          <button className="p-1 m-3 px-5 text-lg border-1 border-green2/70 text-green2 cursor-pointer bg-green2/5" onClick={() => router.push('/start')}>
            get started
          </button>
        </div>
      </div>
      <div className="w-full h-full flex items-center justify-center text-center">
        <span id="title" className="relative w-full text-6xl mt-[10%] text-green2 font-bold  overflow-hidden py-5 m-0" style={{ textShadow: '2px 2px 6px rgba(110, 255, 163, 0.75)' }}>
          playlist via prompt.
          <div className="absolute top-0 left-0 w-full h-full z-[2] mix-blend-darken pointer-events-none">
            <div className="aurora__item"></div>
            <div className="aurora__item"></div>
            <div className="aurora__item"></div>
            <div className="aurora__item"></div>
          </div>
        </span>
      </div>
    </div>
  );
}
