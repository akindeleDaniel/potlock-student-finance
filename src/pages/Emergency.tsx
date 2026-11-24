import { useEffect, useRef, useState } from "react";
import { CircleStop, ShieldCheck, Video } from "lucide-react";
import { MoneyField, Pagelede, SectionTitle } from "../components/Bits";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Notice } from "../components/ui/notice";
import useKudi from "../lib/useKudi";
import { dayLabel, money, round2, runEmergencyCheck } from "../lib/money";

interface Verdict {
  amount: number;
  verdict: "approved" | "review";
  reasons: string[];
  requestId: string;
}

const MIN_DESCRIPTION = 20;

export default function Emergency() {
  const { state, recordEmergency, release } = useKudi();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipState, setClipState] = useState<"idle" | "recording" | "recorded" | "unavailable" | "skipped">("idle");
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [released, setReleased] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);

  const balance = state.balances.emergency ?? 0;

  useEffect(() => {
    document.title = "Emergency release · Kudi";
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setClipState("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "video/webm" });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setClipUrl(url);
        setClipState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setClipState("recording");
    } catch {
      setClipState("unavailable");
    }
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
    } catch {
      setClipState("unavailable");
    }
  }

  function onCheck(e: React.FormEvent) {
    e.preventDefault();
    setReleased(null);
    setVerdict(null);
    const text = description.trim();
    if (text.length < MIN_DESCRIPTION) {
      setError("Explain what happened in at least 20 characters.");
      return;
    }
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount you need.");
      return;
    }
    if (parsed > balance) {
      setError("That is more than the emergency purse holds.");
      return;
    }
    const hasClip = clipState === "recorded";
    const result = runEmergencyCheck({ description: text, amount: round2(parsed), hasClip, balance });
    const id = "req-" + Date.now();
    recordEmergency({ amount: round2(parsed), description: text, verdict: result.verdict, reasons: result.reasons, hadClip: hasClip });
    setError(null);
    setVerdict({ amount: round2(parsed), verdict: result.verdict, reasons: result.reasons, requestId: id });
  }

  function onRelease() {
    if (!verdict) return;
    const latest = state.requests[0];
    if (latest) release(latest.id);
    setReleased(money(verdict.amount) + " released from the emergency purse.");
    setVerdict(null);
    setAmount("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Emergency release</SectionTitle>
        <Pagelede>
          The emergency purse is for surprises. Explain what happened and record a short clip, and the check decides whether to release it.
        </Pagelede>
      </div>

      <Notice tone="info" title="Demo check">
        This verdict comes from simple rules on this device. It is a stand-in for the AI review that comes later.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <form onSubmit={onCheck} className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">Emergency purse balance</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{money(balance)}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="emergency-description" className="block text-sm font-medium">
              What happened?
            </label>
            <textarea
              id="emergency-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              rows={4}
              placeholder="My phone screen cracked and I need it repaired before my exams next week."
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              <span>At least 20 characters, in your own words.</span>
              <span className="tabular-nums">{description.trim().length}/20</span>
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h2 className="text-sm font-medium">Record a short clip</h2>
            <p className="mt-1 text-xs text-muted-foreground">Ten seconds is plenty. The clip never leaves this device.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {clipState === "recording" ? (
                <Button type="button" variant="accent" onClick={stopRecording} className="w-full sm:w-auto">
                  <CircleStop className="size-4" />
                  Stop recording
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={startRecording} className="w-full sm:w-auto" disabled={clipState === "recorded"}>
                  <Video className="size-4" />
                  {clipState === "recorded" ? "Clip recorded" : "Record a clip"}
                </Button>
              )}
              {clipState === "recorded" || clipState === "unavailable" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setClipState("skipped");
                    setClipUrl(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Continue without a clip
                </Button>
              ) : null}
            </div>
            {clipState === "recorded" && clipUrl ? (
              <div className="mt-3 space-y-1.5">
                <video src={clipUrl} controls className="w-full rounded-lg border border-border" />
                <p className="text-xs text-muted-foreground">Your clip (not uploaded anywhere)</p>
              </div>
            ) : null}
            {clipState === "unavailable" ? (
              <Notice tone="warning" className="mt-3">
                No camera here. You can continue without a clip.
              </Notice>
            ) : null}
            {clipState === "skipped" ? <p className="mt-3 text-xs text-muted-foreground">Clip skipped. Requests without a clip are referred for review.</p> : null}
          </div>

          <MoneyField id="emergency-amount" label="Amount you need" value={amount} onChange={(v) => { setAmount(v); setError(null); }} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAmount(balance > 0 ? String(round2(balance / 2)) : "")}
            className="-mt-3 underline underline-offset-4"
          >
            Half of it
          </Button>

          {error ? <Notice tone="danger">{error}</Notice> : null}
          {released ? <Notice tone="success" title={released} /> : null}

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <ShieldCheck className="size-4" />
            Run the demo check
          </Button>
        </form>

        <div className="space-y-4">
          {verdict ? (
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">The check is done</h2>
                <Badge tone={verdict.verdict === "approved" ? "success" : "warning"}>
                  {verdict.verdict === "approved" ? "Approved" : "Referred for review"}
                </Badge>
              </div>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{money(verdict.amount)}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {verdict.reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
              {verdict.verdict === "approved" ? (
                <Button onClick={onRelease} className="mt-4 w-full sm:w-auto">
                  Release {money(verdict.amount)}
                </Button>
              ) : (
                <p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  Your emergency money stays where it is until it is approved.
                </p>
              )}
            </section>
          ) : null}

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Previous requests</h2>
            {state.requests.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No emergency requests yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {state.requests.map((request) => (
                  <li key={request.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{request.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {dayLabel(request.at)} · {request.hadClip ? "with a clip" : "no clip"}
                        {request.released ? " · released" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{money(request.amount)}</p>
                      <Badge tone={request.verdict === "approved" ? "success" : "warning"} className="mt-1">
                        {request.verdict === "approved" ? "Approved" : "Referred"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
