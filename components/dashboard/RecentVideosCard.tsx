import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, PlaySquare } from "lucide-react";
import {
  fetchRecentVideos,
  WORKSHOPS_PLAYLIST_URL,
} from "@/lib/youtube/recent-videos";

export async function RecentVideosCard() {
  const videos = await fetchRecentVideos(4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlaySquare className="size-4 text-primary-orange" />
          Recent Workshops
        </CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length > 0 ? (
          <div className="space-y-3">
            <ul className="space-y-3">
              {videos.map((video) => (
                <li key={video.id}>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 rounded-lg transition-colors hover:bg-muted/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary-orange">
                        {video.title}
                      </p>
                      {video.publishedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(video.publishedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-1 w-full gap-1.5"
            >
              <a
                href={WORKSHOPS_PLAYLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View all workshops
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <AlertCircle className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No workshops loaded yet.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a
                href={WORKSHOPS_PLAYLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on YouTube
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
