import { Check, Copy, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { ConnectButton } from "./ConnectButton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Notice } from "./ui/notice";
import { useGdBalance } from "../lib/goodbuild/gooddollar";
import { useWallet } from "../lib/useWallet";
import { shortAddress } from "../lib/utils";

/**
 * The wallet panel: the connection, the network it is on, and the G$ balance.
 * Everything here comes from GoodBuild's useWallet() and useGdBalance(); nothing is hand-rolled.
 */
export function WalletCard() {
  const { account, walletName, connect, disconnect, connecting, networkName, onRightNetwork, wrongNetwork, switchNetwork, error } = useWallet();
  const gd = useGdBalance();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent" aria-hidden="true">
            <Wallet className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold leading-tight">Your wallet</h2>
            <p className="text-xs text-muted-foreground">Optional. Your purses work without one.</p>
          </div>
        </div>
        {account ? (
          <Badge tone={onRightNetwork ? "success" : wrongNetwork ? "warning" : "default"}>
            {onRightNetwork ? "Connected" : wrongNetwork ? "Wrong network" : "Connected"}
          </Badge>
        ) : (
          <Badge tone="default">Not connected</Badge>
        )}
      </div>

      {!account ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Connect a wallet to show your address and G$ balance in Kudi. Your budget and purses are still saved on this device.
          </p>
          <ConnectButton />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-muted/70 px-2.5 py-1.5 font-medium tabular-nums">{shortAddress(account)}</span>
            <Button variant="outline" size="sm" onClick={copyAddress} aria-label="Copy wallet address">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              <LogOut className="size-4" />
              Disconnect
            </Button>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Network</dt>
              <dd className="font-medium">{networkName}</dd>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Wallet</dt>
              <dd className="font-medium">{walletName ?? "Connected wallet"}</dd>
            </div>
          </dl>

          {wrongNetwork ? (
            <Notice tone="warning" title="Your wallet is on another network.">
              <Button variant="outline" size="sm" className="mt-2" onClick={switchNetwork}>
                Switch to {networkName}
              </Button>
            </Notice>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">G$ balance</span>
            <span className="font-medium tabular-nums">
              {!gd.available ? "Not on this network" : gd.loading ? "Reading…" : gd.formatted ? gd.formatted + " G$" : gd.error ? "—" : "0 G$"}
            </span>
          </div>
          {gd.error ? <Notice tone="danger">{gd.error}</Notice> : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Demo: the purses hold naira figures on this device only. Nothing here takes a payment or moves funds.
          </p>
        </div>
      )}

      {error ? <Notice tone="danger" className="mt-3">{error}</Notice> : null}
      {!account ? <p className="mt-3 text-xs text-muted-foreground">{connecting ? "Waiting for your wallet…" : "The app's network is " + networkName + "."}</p> : null}
      {account && !onRightNetwork && !wrongNetwork ? <p className="mt-2 text-xs text-muted-foreground">Reading the network…</p> : null}
      {account && onRightNetwork ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-success">
          <Check className="size-3.5" aria-hidden="true" />
          You are on {networkName}.
        </p>
      ) : null}
    </section>
  );
}

export default WalletCard;
