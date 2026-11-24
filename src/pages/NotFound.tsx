import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Not found · Kudi";
  }, []);
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="font-display text-6xl font-semibold text-accent/30">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold">That page is not part of Kudi yet.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your purses are still where you left them.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Back to my purses
      </Link>
    </div>
  );
}
