import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const account = await db.account.findFirst({
      where: {
        userId,
        provider: "github",
      },
    });

    if (!account || !account.accessToken) {
      return new NextResponse("GitHub account not connected", { status: 400 });
    }

    const res = await fetch("https://api.github.com/user/repos?per_page=100", {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("GitHub API error", res.status, text);
      return new NextResponse("Failed to fetch repositories from GitHub", {
        status: 500,
      });
    }

    const data = await res.json();

    const mapped = (data as any[]).map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      private: repo.private,
      updated_at: repo.updated_at,
      owner: {
        login: repo.owner?.login,
        avatar_url: repo.owner?.avatar_url,
      },
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("/api/github/repos error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
