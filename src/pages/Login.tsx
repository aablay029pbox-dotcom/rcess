import { useState } from "react";
import { useLocation } from "wouter";
import { login as doLogin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background layers (shared utility classes from index.css) */}
      <div className="absolute inset-0 rcess-grid" aria-hidden />
      <div className="absolute inset-0 rcess-vignette" aria-hidden />
      <div className="absolute inset-0 rcess-scanlines" aria-hidden />
      <div className="absolute -inset-40 rcess-cornerglow" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[980px] px-6 md:px-10 py-10 md:py-12">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rcess-logoWrap">
              <img
                src={logo}
                alt="Organization logo"
                className="h-12 w-12 rounded-full bg-white object-contain p-1"
              />
            </div>

            <div>
              <div className="text-[11px] tracking-[0.45em] text-cyan-300/80">
                PARSU • RCESS
              </div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">Login</div>
              <div className="mt-2 text-xs text-white/40">
                Try: <span className="text-white/60">admin/admin</span>, <span className="text-white/60">staff/staff</span>, <span className="text-white/60">sports/sports</span>, <span className="text-white/60">viewer/viewer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          <Card className="rcess-panel p-0">
            <div className="p-6 md:p-7">
              <div className="rcess-subbar">
                <div className="text-sm font-medium">Sign in</div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 md:p-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs tracking-[0.18em] text-white/60">
                      EMAIL
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user"
                      className="bg-black/30 border-white/15 text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs tracking-[0.18em] text-white/60">
                      PASSWORD
                    </label>
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="bg-black/30 border-white/15 text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      className="bg-cyan-300 text-black hover:bg-cyan-200"
                      onClick={() => {
                        const s = doLogin(email, password);
                        if (s.role === "admin") {
                          toast.success("Logged in as admin");
                        } else if (s.role === "viewer") {
                          toast("Logged in as viewer (read-only)");
                        } else {
                          toast("Logged in (read-only)");
                        }
                        navigate("/dashboard");
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                      onClick={() => history.back()}
                    >
                      Back
                    </Button>
                  </div>

                 
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
