"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, PlayCircle, Globe, FileText, Code2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useCreateResourceLink, useResourceLinks } from "@/hooks/use-appwrite";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddResourceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
}

type LinkType = "youtube" | "notion" | "drive" | "github" | "website" | "other";

const LINK_TYPES: { value: LinkType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "youtube", label: "YouTube", icon: PlayCircle, color: "#FF0000" },
  { value: "notion", label: "Notion", icon: FileText, color: "#000000" },
  { value: "drive", label: "Google Drive", icon: FileText, color: "#4285F4" },
  { value: "github", label: "GitHub", icon: Code2, color: "#6e5494" },
  { value: "website", label: "Website", icon: Globe, color: "#8B5CF6" },
  { value: "other", label: "Other", icon: LinkIcon, color: "#6B7280" },
];

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function detectLinkType(url: string): LinkType {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return "youtube";
  if (lowerUrl.includes("notion.so") || lowerUrl.includes("notion.site")) return "notion";
  if (lowerUrl.includes("drive.google.com")) return "drive";
  if (lowerUrl.includes("github.com")) return "github";
  return "website";
}

export function AddResourceLinkModal({
  isOpen,
  onClose,
  subjectId,
}: AddResourceLinkModalProps): React.ReactNode {
  const createResourceLink = useCreateResourceLink();
  const { data: resourceLinksData } = useResourceLinks(subjectId);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [manualType, setManualType] = useState<LinkType | null>(null);
  const [description, setDescription] = useState("");

  const type = useMemo<LinkType>(() => {
    if (manualType) {
      return manualType;
    }
    return url ? detectLinkType(url) : "website";
  }, [manualType, url]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      toast.error("Title and URL are required");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const existingLinks = resourceLinksData ?? [];
    const sortOrder = existingLinks.length;

    createResourceLink.mutate({
      subject_id: subjectId,
      exam_id: null,
      title: title.trim(),
      url: url.trim(),
      type,
      description: description.trim() || null,
      thumbnail_url: null,
      sort_order: sortOrder,
      deleted_at: null,
    }, {
      onSuccess: () => {
        toast.success("Resource link added!");
        handleClose();
      },
      onError: () => {
        toast.error("Failed to create resource link");
      },
    });
  };

  const handleClose = (): void => {
    setTitle("");
    setUrl("");
    setManualType(null);
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent),0.15)] flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-[rgb(var(--accent))]" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Add Resource</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., DSA Playlist, Course Notes"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]"
                />
              </div>

              {/* Link Type Selector */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LINK_TYPES.map((linkType) => {
                    const Icon = linkType.icon;
                    return (
                      <button
                        key={linkType.value}
                        type="button"
                          onClick={() => setManualType(linkType.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                          type === linkType.value
                            ? "bg-[rgba(var(--accent),0.15)] ring-2 ring-[rgba(var(--accent),0.5)]"
                            : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: type === linkType.value ? "rgb(var(--accent))" : linkType.color }}
                        />
                        <span className="text-xs font-medium text-foreground">{linkType.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this resource about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)] resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[rgb(var(--accent))] hover:opacity-90 text-white font-semibold transition-opacity"
              >
                Add Resource
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
