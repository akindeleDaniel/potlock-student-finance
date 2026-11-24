import { useState } from "react";
import { RotateCcw } from "lucide-react";
import useKudi from "../lib/useKudi";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Notice } from "./ui/notice";

/** "Reset demo data" with its confirm dialog. Used on Home and on the Report. */
export function ResetDemo({ className }: { className?: string }) {
  const { reset } = useKudi();
  const [done, setDone] = useState(false);

  return (
    <div className={className}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <RotateCcw className="size-4" />
            Reset demo data
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start over with the sample purses?</DialogTitle>
            <DialogDescription>
              This clears the money you added, everything you spent and your plan on this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep my data</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  reset();
                  setDone(true);
                }}
              >
                Reset everything
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {done ? (
        <Notice tone="success" className="mt-3">
          Demo data reset to the sample purse balances.
        </Notice>
      ) : null}
    </div>
  );
}

export default ResetDemo;
