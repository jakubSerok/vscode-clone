"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Clock, ExternalLink, Search } from "lucide-react";

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  private: boolean;
  updated_at: string;
  owner?: {
    login?: string;
    avatar_url?: string;
  };
}

const GithubRepoModal = ({ isOpen, onClose }: GithubRepoModalProps) => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GithubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchRepos = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const res = await fetch("/api/github/repos");
        if (res.status === 401) {
          toast.error("You must be logged in to use GitHub integration.");
          setLoading(false);
          return;
        }
        if (res.status === 400) {
          toast.error("Connect your GitHub account first by signing in with GitHub.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          toast.error("Failed to load repositories from GitHub.");
          setLoading(false);
          return;
        }
        const data: GithubRepo[] = await res.json();
        setRepos(data);
        setFilteredRepos(data);
      } catch (error) {
        console.error("Failed to fetch GitHub repos", error);
        toast.error("Unexpected error while loading GitHub repositories.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredRepos(repos);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredRepos(
      repos.filter((repo) =>
        [repo.name, repo.full_name, repo.description ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [searchQuery, repos]);

  const handleImport = async () => {
    if (!selectedRepoId) return;
    const repo = repos.find((r) => String(r.id) === selectedRepoId);
    if (!repo) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubRepoFullName: repo.full_name,
          githubRepoUrl: repo.html_url,
          title: repo.name,
          description: repo.description ?? undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to import repository.");
        setSubmitting(false);
        return;
      }

      const playground = await res.json();
      toast.success("Repository imported to playground.");
      onClose();
      router.push(`/playground/${playground.id}`);
    } catch (error) {
      console.error("GitHub import failed", error);
      toast.error("Unexpected error while importing repository.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setSearchQuery("");
          setSelectedRepoId(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#e93f3f]">
            Select a GitHub Repository
          </DialogTitle>
          <DialogDescription>
            Choose one of your GitHub repositories to open in the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Loading repositories from GitHub...
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <p className="font-medium mb-1">No repositories found</p>
              <p className="text-sm">
                Try adjusting your search, or make sure your GitHub account has repositories.
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedRepoId || ""}
              onValueChange={(value) => setSelectedRepoId(value)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02]
                    ${
                      String(repo.id) === selectedRepoId
                        ? "border-[#E93F3F] shadow-[0_0_0_1px_#E93F3F,0_8px_20px_rgba(233,63,63,0.15)]"
                        : "hover:border-[#E93F3F] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                    }
                    `}
                    onClick={() => setSelectedRepoId(String(repo.id))}
                  >
                    {String(repo.id) === selectedRepoId && (
                      <div className="absolute top-2 left-2 bg-[#E93F3F] text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-2">
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {repo.owner?.avatar_url ? (
                          <Image
                            src={repo.owner.avatar_url}
                            alt={repo.owner.login || "Owner avatar"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {repo.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm break-all">
                            {repo.full_name}
                          </p>
                          {repo.private && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          {repo.language && <span>{repo.language}</span>}
                          <span>•</span>
                          <span>
                            Updated {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto flex items-center gap-1 text-xs text-[#E93F3F] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on GitHub <ExternalLink size={12} />
                    </a>

                    <RadioGroupItem value={String(repo.id)} id={String(repo.id)} className="sr-only" />
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-4 pt-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock size={14} className="mr-1" />
            <span>
              {selectedRepoId ? "Ready to import selected repository" : "Select a repository to continue"}
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              className="bg-[#E93F3F] hover:bg-[#d03636] text-white"
              disabled={!selectedRepoId || submitting}
              onClick={handleImport}
            >
              {submitting ? "Importing..." : "Import Repository"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GithubRepoModal;
