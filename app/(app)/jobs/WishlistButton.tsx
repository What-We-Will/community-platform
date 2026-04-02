"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "./community-actions";

interface Props {
  jobPostingId: string;
  company: string;
  position: string;
  url?: string | null;
  initialWishlisted: boolean;
}

export function WishlistButton({ jobPostingId, company, position, url, initialWishlisted }: Props) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  // Sync with server state when job or initialWishlisted changes (e.g. after refresh or switching jobs)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWishlisted(initialWishlisted);
  }, [jobPostingId, initialWishlisted]);

  async function handleClick() {
    setLoading(true);
    if (wishlisted) {
      await removeFromWishlist(jobPostingId);
      setWishlisted(false);
    } else {
      const res = await addToWishlist(jobPostingId, company, position, url ?? undefined);
      if (res.error !== "already_wishlisted") setWishlisted(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={wishlisted ? "secondary" : "outline"}
      size="sm"
      className="gap-1.5 shrink-0"
      onClick={handleClick}
      disabled={loading}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : wishlisted ? (
        <BookmarkCheck className="size-3.5 text-primary" />
      ) : (
        <Bookmark className="size-3.5" />
      )}
      {wishlisted ? "Wishlisted" : "Add to Wishlist"}
    </Button>
  );
}
