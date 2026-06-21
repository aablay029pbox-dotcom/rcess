import { useEffect, useMemo, useState } from "react";
import {
  Newspaper,
  CalendarDays,
  Trophy,
  MapPinned,
  ClipboardList,
  Settings,
  CalendarCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { clearSession, getSession } from "@/lib/auth";
import {
  loadStore,
  saveStore,
  nanoId,
  buildSingleElimRounds,
  propagateWinners,
} from "@/lib/store";
import type {
  Bracket,
  MapInfo,
  NewsItem,
  NewsType,
  Sport,
  SummitInfo,
  ScoreRow,
  MatchSchedulePost,
  MatchScheduleStatus,
} from "@/lib/store";

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL DIRECTION (match Home):
// Neon-console / blueprint grid / glass panels.
// Dashboard layout, tabs bar, and content card mimic screenshot.
// ─────────────────────────────────────────────────────────────────────────────

function formatPosted(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function PortalHeader() {
  return (
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
          <div className="text-[11px] tracking-[0.45em] text-cyan-300/80">PARSU • RCESS</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">RCESS</div>
          <div className="mt-0.5 text-sm text-white/55">Dashboard</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className="bg-white/10 text-white border border-white/15 hover:bg-white/10">Live</Badge>
      </div>
    </div>
  );
}

function NewsEditor({
  item,
  onSave,
}: {
  item?: NewsItem;
  onSave: (next: NewsItem) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [type, setType] = useState<NewsType>(item?.type ?? "Announcement");

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">TITLE</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black/30 border-white/15 text-white placeholder:text-white/35"
          placeholder="Announcement title"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">TYPE</label>
        <Select value={type} onValueChange={(v) => setType(v as NewsType)}>
          <SelectTrigger className="bg-black/30 border-white/15 text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Announcement">Announcement</SelectItem>
            <SelectItem value="Update">Update</SelectItem>
            <SelectItem value="Reminder">Reminder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">BODY</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[140px] bg-black/30 border-white/15 text-white placeholder:text-white/35"
          placeholder="Write the announcement details"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          className="bg-cyan-300 text-black hover:bg-cyan-200"
          onClick={() => {
            if (!title.trim()) {
              toast.error("Title is required");
              return;
            }
            onSave({
              id: item?.id ?? nanoId(),
              title: title.trim(),
              body: body.trim(),
              type,
              postedAtIso: item?.postedAtIso ?? new Date().toISOString(),
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function ScheduleEditor({
  sports,
  onSave,
}: {
  sports: string[];
  onSave: (p: MatchSchedulePost) => void;
}) {
  const [sport, setSport] = useState<string>(sports[0] ?? "Basketball");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [status, setStatus] = useState<MatchScheduleStatus>("Starting");

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">SPORT</label>
        <Select value={sport} onValueChange={(v) => setSport(v)}>
          <SelectTrigger className="bg-black/30 border-white/15 text-white">
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">MATCHUP TITLE</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-black/30 border-white/15 text-white"
          placeholder="Team A vs Team B"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">LOCATION</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-black/30 border-white/15 text-white"
          placeholder="Main Court"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">TIME</label>
        <Input
          value={timeLocal}
          onChange={(e) => setTimeLocal(e.target.value)}
          type="datetime-local"
          className="bg-black/30 border-white/15 text-white"
        />
        <div className="text-xs text-white/35">This is the time shown to viewers.</div>
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">STATUS</label>
        <Select value={status} onValueChange={(v) => setStatus(v as MatchScheduleStatus)}>
          <SelectTrigger className="bg-black/30 border-white/15 text-white">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Starting">Starting</SelectItem>
            <SelectItem value="In Game">In Game</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-cyan-300 text-black hover:bg-cyan-200"
          onClick={() => {
            if (!title.trim()) {
              toast.error("Title is required");
              return;
            }
            if (!timeLocal.trim()) {
              toast.error("Time is required");
              return;
            }
            const timeIso = new Date(timeLocal).toISOString();
            onSave({
              id: nanoId(),
              sport,
              title: title.trim(),
              location: location.trim(),
              timeIso,
              status,
              postedAtIso: new Date().toISOString(),
            });
          }}
        >
          Post
        </Button>
      </div>
    </div>
  );
}

function SummitEditor({ value, onSave }: { value: SummitInfo; onSave: (v: SummitInfo) => void }) {
  const [draft, setDraft] = useState<SummitInfo>(value);
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">TITLE</label>
        <Input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">SUBTITLE</label>
        <Input
          value={draft.subtitle}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          className="bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">VENUE</label>
        <Input
          value={draft.venue}
          onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
          className="bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">DATE LABEL</label>
        <Input
          value={draft.dateLabel}
          onChange={(e) => setDraft({ ...draft, dateLabel: e.target.value })}
          className="bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">NOTES</label>
        <Textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          className="min-h-[120px] bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="flex justify-end">
        <Button className="bg-cyan-300 text-black hover:bg-cyan-200" onClick={() => onSave(draft)}>
          Save
        </Button>
      </div>
    </div>
  );
}

function MapEditor({ value, onSave }: { value: MapInfo; onSave: (v: MapInfo) => void }) {
  const [draft, setDraft] = useState<MapInfo>(value);
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">GOOGLE MAPS EMBED URL</label>
        <Input
          value={draft.embedUrl}
          onChange={(e) => setDraft({ ...draft, embedUrl: e.target.value })}
          className="bg-black/30 border-white/15 text-white"
          placeholder="https://www.google.com/maps/embed?..."
        />
        <div className="text-xs text-white/35">
          Use Google Maps → Share → Embed a map → copy the URL from the iframe.
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">NOTES</label>
        <Textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          className="min-h-[100px] bg-black/30 border-white/15 text-white"
        />
      </div>
      <div className="flex justify-end">
        <Button className="bg-cyan-300 text-black hover:bg-cyan-200" onClick={() => onSave(draft)}>
          Save
        </Button>
      </div>
    </div>
  );
}

function BracketEditor({
  value,
  sports,
  onSave,
}: {
  value?: Bracket;
  sports: string[];
  onSave: (b: Bracket) => void;
}) {
  const [sport, setSport] = useState<Sport>(value?.sport ?? sports[0] ?? "Basketball");
  const [name, setName] = useState(value?.name ?? "");
  const [teamsText, setTeamsText] = useState(
    (value?.teams ?? []).join("\n") || "Team A\nTeam B"
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">SPORT</label>
        <Select value={sport} onValueChange={(v) => setSport(v as Sport)}>
          <SelectTrigger className="bg-black/30 border-white/15 text-white">
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">BRACKET NAME</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-black/30 border-white/15 text-white"
          placeholder="e.g., Men's Division"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs tracking-[0.18em] text-white/60">TEAMS (ONE PER LINE)</label>
        <Textarea
          value={teamsText}
          onChange={(e) => setTeamsText(e.target.value)}
          className="min-h-[140px] bg-black/30 border-white/15 text-white"
        />
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-cyan-300 text-black hover:bg-cyan-200"
          onClick={() => {
            const teams = teamsText
              .split("\n")
              .map((t) => t.trim())
              .filter(Boolean);
            if (!name.trim()) {
              toast.error("Bracket name is required");
              return;
            }
            if (teams.length < 2) {
              toast.error("Add at least 2 teams");
              return;
            }
            const rounds = buildSingleElimRounds(teams);
            onSave({
              id: value?.id ?? nanoId(),
              sport,
              name: name.trim(),
              teams,
              rounds,
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const session = useMemo(() => getSession(), []);
  const isAdmin = session.role === "admin";
  const isViewer = session.role === "viewer";
  const role = session.role;

  const [store, setStore] = useState(() => loadStore());
  const [bracketSportFilter, setBracketSportFilter] = useState<"ALL" | string>("ALL");
  const [scheduleSportFilter, setScheduleSportFilter] = useState<"ALL" | string>("ALL");

  const canEditSettings = store.settings.permissions.settingsEditors.includes(role);
  const canEditBrackets = store.settings.permissions.bracketEditors.includes(role);
  const bracketAutoAdvance = store.settings.bracketAutoAdvance;

  useEffect(() => {
    // If not logged in at all, send to login
    if (session.role === "guest" && !session.email) navigate("/login");
  }, [navigate, session.email, session.role]);

  function commit(next: typeof store) {
    setStore(next);
    saveStore(next);
  }

  function commitIfAdmin(next: typeof store) {
    if (!isAdmin) {
      toast("Admin only");
      return;
    }
    commit(next);
  }

  function commitIfSettingsAllowed(next: typeof store) {
    if (!canEditSettings) {
      toast("No permission to edit Settings");
      return;
    }
    commit(next);
  }

  function commitIfBracketsAllowed(next: typeof store) {
    if (!canEditBrackets) {
      toast("No permission to edit Brackets");
      return;
    }
    commit(next);
  }

  const latestNews = store.news[0];

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 rcess-grid" aria-hidden />
      <div className="absolute inset-0 rcess-vignette" aria-hidden />
      <div className="absolute inset-0 rcess-scanlines" aria-hidden />
      <div className="absolute -inset-40 rcess-cornerglow" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-[1250px] px-6 md:px-10 py-10 md:py-12">
        <PortalHeader />

        <div className="mt-8 md:mt-10">
          <Card className="rcess-panel p-0">
            <div className="p-6 md:p-7">
              <div className="text-[11px] tracking-[0.45em] text-white/45">TAB SECTION</div>
              <div className="mt-2 text-2xl font-semibold">News Dashboard</div>
              {!isAdmin ? (
                <div className="mt-2 text-sm text-white/55">
                  You are viewing in <span className="text-white/75">read-only</span> mode for some sections.
                </div>
              ) : null}

              <Tabs defaultValue="news" className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <TabsList className="bg-black/25 border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="news" className="gap-2 data-[state=active]:bg-white/10">
                      <Newspaper className="h-4 w-4" /> News
                    </TabsTrigger>
                    <TabsTrigger value="summit" className="gap-2 data-[state=active]:bg-white/10">
                      <CalendarDays className="h-4 w-4" /> Summit Hub
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-white/10">
                      <Trophy className="h-4 w-4" /> Leaderboard
                    </TabsTrigger>
                    <TabsTrigger value="bracketing" className="gap-2 data-[state=active]:bg-white/10">
                      <Trophy className="h-4 w-4" /> Bracketing
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="gap-2 data-[state=active]:bg-white/10">
                      <CalendarCheck className="h-4 w-4" /> Match Schedule
                    </TabsTrigger>
                    <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-white/10">
                      <MapPinned className="h-4 w-4" /> Map
                    </TabsTrigger>
                    <TabsTrigger value="evaluation" className="gap-2 data-[state=active]:bg-white/10">
                      <ClipboardList className="h-4 w-4" /> Evaluation
                    </TabsTrigger>
                    {isAdmin ? (
                      <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-white/10">
                        <Settings className="h-4 w-4" /> Settings
                      </TabsTrigger>
                    ) : null}
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/10 text-white border border-white/15 hover:bg-white/10">Portal</Badge>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                      onClick={() => {
                        clearSession();
                        navigate("/");
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </div>

                {/* NEWS */}
                <TabsContent value="news" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{latestNews?.title ?? "No news"}</div>
                        <div className="mt-2 text-sm text-white/60">
                          {latestNews?.body ?? "Add a news item."}
                        </div>
                        <div className="mt-4 text-xs text-white/40">
                          Posted: {latestNews ? formatPosted(latestNews.postedAtIso) : "—"}
                        </div>
                      </div>
                      <Badge className="bg-white text-black hover:bg-white">{latestNews?.type ?? "Announcement"}</Badge>
                    </div>

                    {!isViewer ? (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-cyan-300 text-black hover:bg-cyan-200"
                            disabled={!isAdmin}
                            title={!isAdmin ? "Admin only" : undefined}
                          >
                            Add news
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/80 border-white/15 text-white">
                          <DialogHeader>
                            <DialogTitle>Add news</DialogTitle>
                          </DialogHeader>
                          <NewsEditor
                            onSave={(item) => {
                              commitIfAdmin({ ...store, news: [item, ...store.news] });
                              toast.success("News saved");
                            }}
                          />
                        </DialogContent>
                      </Dialog>

                      {latestNews ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-white/20 bg-transparent text-white hover:bg-white/10"
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin only" : undefined}
                            >
                              Edit latest
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/80 border-white/15 text-white">
                            <DialogHeader>
                              <DialogTitle>Edit latest news</DialogTitle>
                            </DialogHeader>
                            <NewsEditor
                              item={latestNews}
                              onSave={(next) => {
                                commitIfAdmin({
                                  ...store,
                                  news: [next, ...store.news.filter((n) => n.id !== next.id)],
                                });
                                toast.success("News updated");
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : null}
                    </div>
                    ) : null}
                  </div>
                </TabsContent>

                {/* SUMMIT */}
                <TabsContent value="summit" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="grid gap-2">
                      <div className="text-lg font-semibold">{store.summit.title}</div>
                      <div className="text-sm text-white/55">{store.summit.subtitle}</div>
                      <div className="mt-2 text-sm text-white/60">
                        <span className="text-white/45">Venue:</span> {store.summit.venue}
                      </div>
                      <div className="text-sm text-white/60">
                        <span className="text-white/45">Date:</span> {store.summit.dateLabel}
                      </div>
                      <div className="mt-2 text-xs text-white/40">{store.summit.notes}</div>
                    </div>

                    {!isViewer ? (
                      <div className="mt-5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-cyan-300 text-black hover:bg-cyan-200"
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin only" : undefined}
                            >
                              Edit summit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/80 border-white/15 text-white">
                            <DialogHeader>
                              <DialogTitle>Edit summit</DialogTitle>
                            </DialogHeader>
                            <SummitEditor
                              value={store.summit}
                              onSave={(v) => {
                                commitIfAdmin({ ...store, summit: v });
                                toast.success("Summit updated");
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>

                {/* MATCH SCHEDULE */}
                <TabsContent value="schedule" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Match Schedule</div>
                       

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="text-xs tracking-[0.18em] text-white/50">SPORT</div>
                          <Select value={scheduleSportFilter} onValueChange={(v) => setScheduleSportFilter(v as any)}>
                            <SelectTrigger className="h-9 w-[220px] bg-black/30 border-white/15 text-white">
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All sports</SelectItem>
                              {store.settings.sports.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isAdmin ? (
                          <Badge className="bg-white/10 text-white border border-white/15 hover:bg-white/10">Read-only</Badge>
                        ) : null}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-cyan-300 text-black hover:bg-cyan-200"
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin only" : undefined}
                            >
                              Add schedule
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/80 border-white/15 text-white">
                            <DialogHeader>
                              <DialogTitle>Add schedule post</DialogTitle>
                            </DialogHeader>

                            <ScheduleEditor
                              sports={store.settings.sports}
                              onSave={(post) => {
                                commitIfAdmin({ ...store, schedule: [post, ...(store.schedule ?? [])] });
                                toast.success("Schedule posted");
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {(() => {
                      const items = (store.schedule ?? [])
                        .filter((p) => p.status === 'Starting' || p.status === 'In Game')
                        .filter((p) => scheduleSportFilter === 'ALL' || p.sport === scheduleSportFilter)
                        .slice()
                        .sort((a, b) => new Date(a.timeIso).getTime() - new Date(b.timeIso).getTime());

                      const latest = items[0];
                      const rest = items.slice(1);

                      return (
                        <>
                          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-lg font-semibold">{latest ? latest.title : 'No matches posted'}</div>
                                <div className="mt-2 text-sm text-white/60">
                                  {latest ? (
                                    <>
                                      <span className="text-white/45">Time:</span>{' '}
                                      {new Date(latest.timeIso).toLocaleString()}
                                      {latest.location ? (
                                        <>
                                          {' '}• <span className="text-white/45">Location:</span> {latest.location}
                                        </>
                                      ) : null}
                                      {' '}• <span className="text-white/45">Sport:</span> {latest.sport}
                                    </>
                                  ) : (
                                    'Admins can post games that are Starting or In Game.'
                                  )}
                                </div>
                                {latest ? (
                                  <div className="mt-4 text-xs text-white/40">Posted: {new Date(latest.postedAtIso).toLocaleString()}</div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-white text-black hover:bg-white">{latest ? latest.status : 'Schedule'}</Badge>
                                {isAdmin && latest ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                    onClick={() => {
                                      commitIfAdmin({
                                        ...store,
                                        schedule: (store.schedule ?? []).filter((x) => x.id !== latest.id),
                                      });
                                      toast("Schedule removed");
                                    }}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {rest.map((p) => (
                              <div key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold">{p.title}</div>
                                    <div className="mt-1 text-sm text-white/55">
                                      <span className="text-white/45">Time:</span> {new Date(p.timeIso).toLocaleString()}
                                      {p.location ? <> • <span className="text-white/45">Location:</span> {p.location}</> : null}
                                      <> • <span className="text-white/45">Sport:</span> {p.sport}</>
                                    </div>
                                    <div className="mt-2 text-xs text-white/40">Posted: {new Date(p.postedAtIso).toLocaleString()}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-white/10 text-white border border-white/15 hover:bg-white/10">{p.status}</Badge>
                                    {!isViewer ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                      disabled={!isAdmin}
                                      title={!isAdmin ? "Admin only" : undefined}
                                      onClick={() => {
                                        commitIfAdmin({ ...store, schedule: (store.schedule ?? []).filter((x) => x.id !== p.id) });
                                        toast('Schedule removed');
                                      }}
                                    >
                                      Delete
                                    </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {items.length === 0 ? (
                              <div className="text-sm text-white/45">No Starting / In Game matches right now.</div>
                            ) : rest.length === 0 ? (
                              <div className="text-sm text-white/45">No other schedule posts.</div>
                            ) : null}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </TabsContent>

{/* MAP */}
                <TabsContent value="map" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Map</div>
                      </div>
                      {!isViewer ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-cyan-300 text-black hover:bg-cyan-200"
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin only" : undefined}
                            >
                              Edit map
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="bg-black/80 border-white/15 text-white">
                          <DialogHeader>
                            <DialogTitle>Edit map</DialogTitle>
                          </DialogHeader>
                          <MapEditor
                            value={store.map}
                            onSave={(v) => {
                              commitIfAdmin({ ...store, map: v });
                              toast.success("Map updated");
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      ) : null}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {store.map.embedUrl ? (
                        <iframe
                          title="Google map"
                          src={store.map.embedUrl}
                          className="h-[380px] w-full"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      ) : (
                        <div className="p-6 text-sm text-white/45">
                          No map embed URL set yet.
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-white/40">{store.map.notes}</div>
                  </div>
                </TabsContent>

                {/* LEADERBOARD */}
                <TabsContent value="leaderboard" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Leaderboard</div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          {!isViewer ? (
                          <Button
                            className="bg-cyan-300 text-black hover:bg-cyan-200"
                            disabled={!isAdmin}
                            title={!isAdmin ? "Admin only" : undefined}
                          >
                            Add row
                          </Button>
                          ) : null}
                        </DialogTrigger>
                        <DialogContent className="bg-black/80 border-white/15 text-white">
                          <DialogHeader>
                            <DialogTitle>Add leaderboard row</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <label className="text-xs tracking-[0.18em] text-white/60">TEAM</label>
                              <Input id="lb-team" className="bg-black/30 border-white/15 text-white" placeholder="Team name" />
                            </div>
                            <div className="grid gap-2">
                              <label className="text-xs tracking-[0.18em] text-white/60">POINTS</label>
                              <Input id="lb-points" type="number" className="bg-black/30 border-white/15 text-white" placeholder="0" />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                className="bg-cyan-300 text-black hover:bg-cyan-200"
                                onClick={() => {
                                  if (!isAdmin) return;
                                  const teamEl = document.getElementById('lb-team') as HTMLInputElement | null;
                                  const ptsEl = document.getElementById('lb-points') as HTMLInputElement | null;
                                  const team = (teamEl?.value ?? '').trim();
                                  const points = Number(ptsEl?.value ?? 0);
                                  if (!team) {
                                    toast.error('Team is required');
                                    return;
                                  }
                                  commitIfAdmin({
                                    ...store,
                                    leaderboard: [...store.leaderboard, { id: nanoId(), team, points: Number.isFinite(points) ? points : 0 }],
                                  });
                                  toast.success('Leaderboard row added');
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {store.leaderboard
                        .slice()
                        .sort((a, b) => b.points - a.points)
                        .map((row, idx) => (
                          <div
                            key={row.id}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 text-sm font-semibold">#{idx + 1}</div>
                              <div>
                                <div className="text-sm font-medium">{row.team}</div>
                                <div className="text-xs text-white/45">Points: {row.points}</div>
                              </div>
                            </div>

                            {!isViewer ? (
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                    disabled={!isAdmin}
                                    title={!isAdmin ? "Admin only" : undefined}
                                  >
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-black/80 border-white/15 text-white">
                                  <DialogHeader>
                                    <DialogTitle>Edit leaderboard row</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4">
                                    <div className="grid gap-2">
                                      <label className="text-xs tracking-[0.18em] text-white/60">TEAM</label>
                                      <Input
                                        defaultValue={row.team}
                                        id={`lb-team-${row.id}`}
                                        className="bg-black/30 border-white/15 text-white"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <label className="text-xs tracking-[0.18em] text-white/60">POINTS</label>
                                      <Input
                                        defaultValue={row.points}
                                        id={`lb-points-${row.id}`}
                                        type="number"
                                        className="bg-black/30 border-white/15 text-white"
                                      />
                                    </div>
                                    <div className="flex justify-end">
                                      <Button
                                        className="bg-cyan-300 text-black hover:bg-cyan-200"
                                        onClick={() => {
                                          if (!isAdmin) return;
                                          const teamEl = document.getElementById(`lb-team-${row.id}`) as HTMLInputElement | null;
                                          const ptsEl = document.getElementById(`lb-points-${row.id}`) as HTMLInputElement | null;
                                          const team = (teamEl?.value ?? '').trim();
                                          const points = Number(ptsEl?.value ?? 0);
                                          if (!team) {
                                            toast.error('Team is required');
                                            return;
                                          }
                                          commitIfAdmin({
                                            ...store,
                                            leaderboard: store.leaderboard.map((x) =>
                                              x.id === row.id ? { ...x, team, points: Number.isFinite(points) ? points : 0 } : x
                                            ),
                                          });
                                          toast.success('Leaderboard updated');
                                        }}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                disabled={!isAdmin}
                                title={!isAdmin ? "Admin only" : undefined}
                                onClick={() => {
                                  commitIfAdmin({
                                    ...store,
                                    leaderboard: store.leaderboard.filter((x) => x.id !== row.id),
                                  });
                                  toast('Row removed');
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                            ) : null}
                          </div>
                        ))}

                      {store.leaderboard.length === 0 ? (
                        <div className="text-sm text-white/45">No leaderboard rows yet.</div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

                {/* BRACKETING */}
                <TabsContent value="bracketing" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Bracketing</div>
                        <div className="mt-1 text-sm text-white/55">
                          Single-elimination bracket with winners advancing.
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="text-xs tracking-[0.18em] text-white/50">SPORT</div>
                          <Select
                            value={bracketSportFilter}
                            onValueChange={(v) => setBracketSportFilter(v as any)}
                          >
                            <SelectTrigger className="h-9 w-[220px] bg-black/30 border-white/15 text-white">
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All sports</SelectItem>
                              {store.settings.sports.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {isAdmin ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                >
                                  Manage sports
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-black/80 border-white/15 text-white">
                                <DialogHeader>
                                  <DialogTitle>Manage sports</DialogTitle>
                                </DialogHeader>

                                <div className="grid gap-4">
                                  <div className="grid gap-2">
                                    <label className="text-xs tracking-[0.18em] text-white/60">ADD SPORT</label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        id="new-sport"
                                        placeholder="e.g., Table Tennis"
                                        className="bg-black/30 border-white/15 text-white"
                                      />
                                      <Button
                                        className="bg-cyan-300 text-black hover:bg-cyan-200"
                                        onClick={() => {
                                          const el = document.getElementById("new-sport") as HTMLInputElement | null;
                                          const name = (el?.value ?? "").trim();
                                          if (!name) {
                                            toast.error("Sport name is required");
                                            return;
                                          }
                                          if (store.settings.sports.some((s) => s.toLowerCase() === name.toLowerCase())) {
                                            toast("Sport already exists");
                                            return;
                                          }
                                          commitIfAdmin({
                                            ...store,
                                            settings: {
                                              ...store.settings,
                                              sports: [...store.settings.sports, name],
                                            },
                                          });
                                          if (el) el.value = "";
                                          toast.success("Sport added");
                                        }}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="grid gap-2">
                                    <div className="text-xs tracking-[0.18em] text-white/60">CURRENT SPORTS</div>
                                    <div className="grid gap-2">
                                      {store.settings.sports.map((s) => (
                                        <div
                                          key={s}
                                          className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                                        >
                                          <div className="text-sm">{s}</div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                            onClick={() => {
                                              // remove sport + remove brackets that use it
                                              const nextSports = store.settings.sports.filter((x) => x !== s);
                                              if (nextSports.length === 0) {
                                                toast.error("At least one sport must remain");
                                                return;
                                              }
                                              const nextBrackets = store.brackets.filter((b) => b.sport !== s);
                                              commitIfAdmin({
                                                ...store,
                                                settings: { ...store.settings, sports: nextSports },
                                                brackets: nextBrackets,
                                              });
                                              if (bracketSportFilter === s) setBracketSportFilter("ALL");
                                              toast("Sport removed (and its brackets deleted)");
                                            }}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="text-xs text-white/35">
                                      Deleting a sport will also delete brackets under that sport.
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : null}
                        </div>
                      </div>
                      {!isViewer ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-cyan-300 text-black hover:bg-cyan-200"
                            disabled={!canEditBrackets}
                            title={!canEditBrackets ? "No permission" : undefined}
                          >
                            Add bracket
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/80 border-white/15 text-white">
                          <DialogHeader>
                            <DialogTitle>Add bracket</DialogTitle>
                          </DialogHeader>
                          <BracketEditor
                            sports={store.settings.sports}
                            onSave={(b) => {
                              commitIfBracketsAllowed({ ...store, brackets: [b, ...store.brackets] });
                              toast.success("Bracket saved");
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-4">
                      {store.brackets
                        .filter((b) => bracketSportFilter === "ALL" || b.sport === bracketSportFilter)
                        .map((b) => (
                        <div key={b.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{b.name}</div>
                              <div className="mt-1 text-xs text-white/45">Sport: {b.sport}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                    disabled={!canEditBrackets}
                                    title={!canEditBrackets ? "No permission" : undefined}
                                  >
                                    Edit teams/name
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-black/80 border-white/15 text-white">
                                  <DialogHeader>
                                    <DialogTitle>Edit bracket</DialogTitle>
                                  </DialogHeader>
                                  <BracketEditor
                                    value={b}
                                    sports={store.settings.sports}
                                    onSave={(next) => {
                                      commitIfBracketsAllowed({
                                        ...store,
                                        brackets: store.brackets.map((x) => (x.id === next.id ? next : x)),
                                      });
                                      toast.success("Bracket updated");
                                    }}
                                  />
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                disabled={!canEditBrackets}
                                title={!canEditBrackets ? "No permission" : undefined}
                                onClick={() => {
                                  commitIfBracketsAllowed({
                                    ...store,
                                    brackets: store.brackets.filter((x) => x.id !== b.id),
                                  });
                                  toast("Bracket removed");
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          {/* Rounds */}
                          <div className="mt-4 overflow-x-auto">
                            <div className="min-w-[900px] grid grid-cols-1 md:grid-flow-col md:auto-cols-[280px] gap-4">
                              {b.rounds.map((round, rIdx) => (
                                <div key={rIdx} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                  <div className="text-xs tracking-[0.25em] text-white/55">{round.name.toUpperCase()}</div>

                                  <div className="mt-3 grid gap-3">
                                    {round.matches.map((m, mIdx) => (
                                      <div
                                        key={m.id}
                                        className="rounded-lg border border-white/10 bg-black/30 p-3"
                                      >
                                        <div className="grid gap-2">
                                          {(["a", "b"] as const).map((sideKey) => {
                                            const side = m[sideKey];
                                            const isWinner = m.winner === sideKey;
                                            return (
                                              <div
                                                key={sideKey}
                                                className={`flex items-center justify-between gap-3 rounded-md border px-2.5 py-2 ${
                                                  isWinner
                                                    ? "border-cyan-300/50 bg-cyan-300/10"
                                                    : "border-white/10 bg-black/25"
                                                }`}
                                              >
                                                <div className="min-w-0">
                                                  <div className="truncate text-sm">
                                                    {side.team ?? <span className="text-white/35">TBD</span>}
                                                  </div>
                                                </div>

                                                <Input
                                                  value={side.score ?? ""}
                                                  onChange={(e) => {
                                                    if (!canEditBrackets) return;
                                                    const raw = e.target.value;
                                                    const val = raw === "" ? null : Number(raw);

                                                    const brackets = store.brackets.map((bb) => {
                                                      if (bb.id !== b.id) return bb;

                                                      // Deep clone rounds/matches minimally
                                                      const rounds = bb.rounds.map((rr) => ({
                                                        ...rr,
                                                        matches: rr.matches.map((mm) => ({
                                                          ...mm,
                                                          a: { ...mm.a },
                                                          b: { ...mm.b },
                                                        })),
                                                      }));

                                                      const match = rounds[rIdx].matches[mIdx];
                                                      match[sideKey].score = Number.isFinite(val as any) ? (val as any) : null;

                                                      // recompute + propagate winners downstream
                                                      propagateWinners(rounds, bracketAutoAdvance ? "auto" : "manual");

                                                      return { ...bb, rounds };
                                                    });

                                                    commitIfBracketsAllowed({ ...store, brackets });
                                                  }}
                                                  disabled={!canEditBrackets || !side.team}
                                                  inputMode="numeric"
                                                  className="w-20 bg-black/30 border-white/15 text-white disabled:opacity-60"
                                                  placeholder="-"
                                                />
                                              </div>
                                            );
                                          })}

                                          {!bracketAutoAdvance ? (
                                            <div className="mt-1 flex items-center gap-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                                disabled={!canEditBrackets || !m.a.team || !m.b.team}
                                                title={!canEditBrackets ? "No permission" : undefined}
                                                onClick={() => {
                                                  if (!canEditBrackets) return;
                                                  const brackets = store.brackets.map((bb) => {
                                                    if (bb.id !== b.id) return bb;
                                                    const rounds = bb.rounds.map((rr) => ({
                                                      ...rr,
                                                      matches: rr.matches.map((mm) => ({
                                                        ...mm,
                                                        a: { ...mm.a },
                                                        b: { ...mm.b },
                                                      })),
                                                    }));
                                                    const match = rounds[rIdx].matches[mIdx];
                                                    match.winner = "a";
                                                    propagateWinners(rounds, "manual");
                                                    return { ...bb, rounds };
                                                  });
                                                  commitIfBracketsAllowed({ ...store, brackets });
                                                }}
                                              >
                                                Advance A
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                                                disabled={!canEditBrackets || !m.a.team || !m.b.team}
                                                title={!canEditBrackets ? "No permission" : undefined}
                                                onClick={() => {
                                                  if (!canEditBrackets) return;
                                                  const brackets = store.brackets.map((bb) => {
                                                    if (bb.id !== b.id) return bb;
                                                    const rounds = bb.rounds.map((rr) => ({
                                                      ...rr,
                                                      matches: rr.matches.map((mm) => ({
                                                        ...mm,
                                                        a: { ...mm.a },
                                                        b: { ...mm.b },
                                                      })),
                                                    }));
                                                    const match = rounds[rIdx].matches[mIdx];
                                                    match.winner = "b";
                                                    propagateWinners(rounds, "manual");
                                                    return { ...bb, rounds };
                                                  });
                                                  commitIfBracketsAllowed({ ...store, brackets });
                                                }}
                                              >
                                                Advance B
                                              </Button>
                                            </div>
                                          ) : null}

                                          {rIdx === 0 ? (
                                            <div className="text-[11px] text-white/35">
                                              Match {(mIdx + 1)}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-white/35">
                            {bracketAutoAdvance ? (
                              <>Tip: Enter scores for both teams. Higher score advances. Ties are not allowed.</>
                            ) : (
                              <>Tip: Enter scores (optional), then manually choose the winner to advance.</>
                            )}
                          </div>
                        </div>
                      ))}

                      {store.brackets.filter((b) => bracketSportFilter === "ALL" || b.sport === bracketSportFilter).length === 0 ? (
                        <div className="text-sm text-white/45">No brackets for this sport yet.</div>
                      ) : null}
                    </div>
                  </div>
                </TabsContent>

{/* EVALUATION */}
                <TabsContent value="evaluation" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="text-lg font-semibold">Evaluation</div>
                    <div className="mt-2 text-sm text-white/55">Coming soon.</div>
                  </div>
                </TabsContent>

                {/* SETTINGS (admin only) */}
                {isAdmin ? (
                <TabsContent value="settings" className="mt-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Countdown Settings</div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                        <div className="text-sm font-medium">Permissions</div>
                        <div className="mt-1 text-xs text-white/45">
                          Choose which roles can edit Settings and Brackets.
                        </div>

                        <div className="mt-4 grid gap-4">
                          <div className="grid gap-2">
                            <div className="text-xs tracking-[0.18em] text-white/60">SETTINGS EDITORS</div>
                            <div className="flex flex-wrap gap-3">
                              {(["admin", "staff"] as const).map((r) => (
                                <label key={r} className="flex items-center gap-2 text-sm text-white/75">
                                  <Checkbox
                                    checked={store.settings.permissions.settingsEditors.includes(r)}
                                    disabled={!isAdmin}
                                    onCheckedChange={(v) => {
                                      if (!isAdmin) return;
                                      const next = new Set(store.settings.permissions.settingsEditors);
                                      if (v) next.add(r);
                                      else next.delete(r);
                                      setStore((prev) => ({
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          permissions: {
                                            ...prev.settings.permissions,
                                            settingsEditors: Array.from(next),
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  <span className="capitalize">{r}</span>
                                </label>
                              ))}
                            </div>
                            <div className="text-xs text-white/35">Only admins can change permission rules.</div>
                          </div>

                          <div className="grid gap-2">
                            <div className="text-xs tracking-[0.18em] text-white/60">BRACKETS EDITORS</div>
                            <div className="flex flex-wrap gap-3">
                              {(["admin", "sports"] as const).map((r) => (
                                <label key={r} className="flex items-center gap-2 text-sm text-white/75">
                                  <Checkbox
                                    checked={store.settings.permissions.bracketEditors.includes(r)}
                                    disabled={!isAdmin}
                                    onCheckedChange={(v) => {
                                      if (!isAdmin) return;
                                      const next = new Set(store.settings.permissions.bracketEditors);
                                      if (v) next.add(r);
                                      else next.delete(r);
                                      setStore((prev) => ({
                                        ...prev,
                                        settings: {
                                          ...prev.settings,
                                          permissions: {
                                            ...prev.settings.permissions,
                                            bracketEditors: Array.from(next),
                                          },
                                        },
                                      }));
                                    }}
                                  />
                                  <span className="capitalize">{r}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs tracking-[0.18em] text-white/60">TARGET ISO</label>
                        <Input
                          value={store.settings.countdownIso}
                          onChange={(e) =>
                            setStore((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, countdownIso: e.target.value },
                            }))
                          }
                          disabled={!canEditSettings}
                          className="bg-black/30 border-white/15 text-white disabled:opacity-60"
                          placeholder="2026-08-01T00:00:00+08:00"
                        />
                        <div className="text-xs text-white/35">
                          Format: ISO 8601, e.g. 2026-08-01T00:00:00+08:00
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <div>
                          <div className="text-sm font-medium">Close countdown page</div>
                          <div className="text-xs text-white/45">
                            When enabled, opening the countdown page redirects to login.
                          </div>
                        </div>
                        <Switch
                          checked={store.settings.countdownClosed}
                          onCheckedChange={(v) =>
                            setStore((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, countdownClosed: Boolean(v) },
                            }))
                          }
                          disabled={!canEditSettings}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                        <div>
                          <div className="text-sm font-medium">Bracket auto-advance</div>
                          <div className="text-xs text-white/45">
                            Auto: winner is decided by scores. Manual: admin selects who advances.
                          </div>
                        </div>
                        <Switch
                          checked={store.settings.bracketAutoAdvance}
                          onCheckedChange={(v) =>
                            setStore((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, bracketAutoAdvance: Boolean(v) },
                            }))
                          }
                          disabled={!canEditSettings}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          className="bg-cyan-300 text-black hover:bg-cyan-200"
                          disabled={!canEditSettings}
                          title={!canEditSettings ? "No permission" : undefined}
                          onClick={() => {
                            if (!canEditSettings) {
                              toast("No permission to edit Settings");
                              return;
                            }
                            // Save also persists permission rules
                            saveStore(store);
                            toast.success("Settings saved");
                          }}
                        >
                          Save settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                ) : null}
              </Tabs>
            </div>

            <div className="rcess-tab" aria-hidden />
          </Card>
        </div>

      
      </div>
    </div>
  );
}
