import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { loadStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";


type Ticks = { days: string; hours: string; minutes: string; seconds: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function computeTicks(target: Date): Ticks {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (!Number.isFinite(diff) || diff <= 0) {
    return { days: "0", hours: "00", minutes: "00", seconds: "00" };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  };
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="relative flex-1 min-w-[150px]">
      <div className="rcess-unit" />
      <div className="relative z-10 h-full px-6 py-6">
        <div className="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums text-white">
          {value}
        </div>
        <div className="mt-2 text-[11px] tracking-[0.32em] text-white/55">{label}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);

  function onLogoClick() {
    // Triple-click within a short window → go to login page
    clickCountRef.current += 1;
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);

    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
      clickTimerRef.current = null;
    }, 700);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      navigate("/login");
    }
  }

  const [store, setStore] = useState(() => loadStore());

  // keep in sync if settings were changed in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "rcess.portal.store.v1") setStore(loadStore());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const target = useMemo(() => new Date(store.settings.countdownIso), [store.settings.countdownIso]);
  const [ticks, setTicks] = useState<Ticks>(() => computeTicks(target));

  useEffect(() => {
    // If countdown is closed, redirect to login
    if (store.settings.countdownClosed) {
      navigate("/login");
      return;
    }

    const id = window.setInterval(() => setTicks(computeTicks(target)), 250);
    return () => window.clearInterval(id);
  }, [navigate, store.settings.countdownClosed, target]);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background layers */}
      <div className="absolute inset-0 rcess-grid" aria-hidden />
      <div className="absolute inset-0 rcess-vignette" aria-hidden />
      <div className="absolute inset-0 rcess-scanlines" aria-hidden />
      <div className="absolute -inset-40 rcess-cornerglow" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1250px] px-6 md:px-10 py-10 md:py-12">
        {/* Top header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rcess-logoWrap">
              <button
                type="button"
                onClick={onLogoClick}
                className="group block"
                aria-label="Logo (triple-click for login)"
              >
                <img
                  src={logo}
                  alt="Organization logo"
                  className="h-12 w-12 rounded-full bg-white object-contain p-1 transition-transform duration-200 group-active:scale-[0.98]"
                />
              </button>
            </div>

            <div>
              <div className="text-[11px] tracking-[0.45em] text-cyan-300/80">
                PARSU • RCESS
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">RCESS</div>
              <div className="mt-0.5 text-sm text-white/55">
                Regional Civil Engineering Students Summit
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <div className="text-[11px] tracking-[0.45em] text-orange-200/80">
              COUNTDOWN • GENERAL ACCESS
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="mt-8 md:mt-10">
          <Card className="rcess-panel p-0">
            <div className="p-6 md:p-7">
              <div className="rcess-subbar">
                <div className="text-sm font-medium">Coming Soon</div>
                <div className="text-sm text-white/55">(subject to change)</div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <Unit value={ticks.days} label="DAYS" />
                  <Unit value={ticks.hours} label="HOURS" />
                  <Unit value={ticks.minutes} label="MINUTES" />
                  <Unit value={ticks.seconds} label="SECONDS" />
                </div>
              </div>
            </div>

            {/* subtle right "tab" like in screenshot */}
            <div className="rcess-tab" aria-hidden />
          </Card>
        </div>

        
      </div>
    </div>
  );
}
