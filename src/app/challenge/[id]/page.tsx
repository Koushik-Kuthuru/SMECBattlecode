
"use client";
import { useSearchParams } from "next/navigation";
import ChallengeWorkspace from "./workspace";
import ChallengeDetail from "./_components/challenge-detail";

export default function ChallengePageRouter() {
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');
  const isVirtualBattle = !!contestId;

  if (isVirtualBattle) {
    return <ChallengeWorkspace contestId={contestId as string} />;
  }

  return <ChallengeDetail />;
}
