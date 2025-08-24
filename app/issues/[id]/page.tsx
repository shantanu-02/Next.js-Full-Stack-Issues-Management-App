import { IssueDetail } from "@/components/issue-detail";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default async function IssueDetailPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const issueId = params.id;

  return <IssueDetail issueId={issueId} currentUser={user} />;
}
