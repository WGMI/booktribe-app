"use client";
import { useTransition } from "react";
import { respondToSwap } from "@/lib/actions";

export default function SwapActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  function handle(action: "accepted" | "declined") {
    startTransition(() => respondToSwap(requestId, action));
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle("accepted")}
        disabled={isPending}
        className="flex-1 bg-[#3b6934] text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        Accept
      </button>
      <button
        onClick={() => handle("declined")}
        disabled={isPending}
        className="flex-1 border border-[#dbc1bd] text-[#554240] text-xs font-semibold py-2 rounded-lg hover:border-[#85332a] hover:text-[#85332a] transition-colors disabled:opacity-60"
      >
        Decline
      </button>
    </div>
  );
}
