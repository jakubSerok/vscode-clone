import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type TemplateFile = {
  filename: string;
  fileExtension: string;
  content: string;
};

type TemplateFolder = {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
};

function buildTemplateTreeFromPaths(files: { path: string; content: string }[]): TemplateFolder {
  const root: TemplateFolder = {
    folderName: "Root",
    items: [],
  };

  const ensureFolder = (folder: TemplateFolder, parts: string[]): TemplateFolder => {
    let current = folder;
    for (const part of parts) {
      if (!part) continue;
      let next = current.items.find(
        (item): item is TemplateFolder => "folderName" in item && item.folderName === part
      );
      if (!next) {
        next = { folderName: part, items: [] };
        current.items.push(next);
      }
      current = next;
    }
    return current;
  };

  for (const file of files) {
    const segments = file.path.split("/");
    const fileName = segments.pop() || "file";
    const folderParts = segments;

    const lastDotIndex = fileName.lastIndexOf(".");
    const filename = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const fileExtension = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : "";

    const parentFolder = ensureFolder(root, folderParts);
    const templateFile: TemplateFile = {
      filename,
      fileExtension,
      content: file.content,
    };
    parentFolder.items.push(templateFile);
  }

  return root;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      githubRepoFullName,
      githubRepoUrl,
      title,
      description,
      template,
    }: {
      githubRepoFullName: string;
      githubRepoUrl: string;
      title?: string;
      description?: string;
      template?: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
    } = body;

    if (!githubRepoFullName || !githubRepoUrl) {
      return new NextResponse("Missing GitHub repository data", { status: 400 });
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

    // Fetch repository tree (list of all files)
    const treeRes = await fetch(
      `https://api.github.com/repos/${githubRepoFullName}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!treeRes.ok) {
      const text = await treeRes.text();
      console.error("GitHub tree API error", treeRes.status, text);
      return new NextResponse("Failed to fetch repository tree from GitHub", {
        status: 500,
      });
    }

    const treeData = await treeRes.json();
    const treeFiles = (treeData.tree || []).filter((item: any) => item.type === "blob");

    const filesWithContent: { path: string; content: string }[] = [];

    for (const file of treeFiles) {
      const filePath = file.path as string;

      // Skip very large files by heuristic (GitHub tree does not give size reliably here)
      // and common binary artifacts
      if (
        filePath.includes("node_modules") ||
        filePath.startsWith(".") ||
        filePath.endsWith(".png") ||
        filePath.endsWith(".jpg") ||
        filePath.endsWith(".jpeg") ||
        filePath.endsWith(".gif") ||
        filePath.endsWith(".ico") ||
        filePath.endsWith(".svg")
      ) {
        continue;
      }

      const contentRes = await fetch(
        `https://api.github.com/repos/${githubRepoFullName}/contents/${encodeURIComponent(
          filePath
        )}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      if (!contentRes.ok) {
        console.warn("Skipping file due to GitHub content API error", filePath);
        continue;
      }

      const contentData = await contentRes.json();

      if (contentData.encoding === "base64" && contentData.content) {
        const decoded = Buffer.from(contentData.content, "base64").toString("utf-8");
        filesWithContent.push({ path: filePath, content: decoded });
      }
    }

    const templateTree = buildTemplateTreeFromPaths(filesWithContent);

    const playground = await db.playground.create({
      data: {
        title: title || githubRepoFullName,
        description,
        template: template || "REACT",
        userId,
        githubRepoFullName,
        githubRepoUrl,
      },
    });

    await db.templateFile.create({
      data: {
        playgroundId: playground.id,
        content: JSON.stringify(templateTree),
      },
    });

    return NextResponse.json(playground);
  } catch (error) {
    console.error("/api/github/import error", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
