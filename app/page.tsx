import { IssuesList } from "@/components/issues-list";
import { Navbar } from "@/components/navbar";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Issues Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your project issues
          </p>
        </div>
        <IssuesList currentUser={user} />
      </main>
    </div>
  );
}
