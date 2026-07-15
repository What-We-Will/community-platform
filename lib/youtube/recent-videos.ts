/** Workshop playlist — same source as /social "Watch Our Past Workshops". */
export const WORKSHOPS_PLAYLIST_ID = "PLNlQ1uwiLdQDPRV_DQXtNjc5fKNe95b8c";

export const WORKSHOPS_PLAYLIST_URL = `https://www.youtube.com/playlist?list=${WORKSHOPS_PLAYLIST_ID}`;

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  url: string;
  thumbnailUrl: string;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseYouTubePlaylistFeed(
  xml: string,
  limit = 5
): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  for (const entry of xml.split("<entry>").slice(1)) {
    if (videos.length >= limit) break;

    const videoId =
      entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ??
      entry.match(/<id>yt:video:([^<]+)<\/id>/)?.[1];
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    const publishedRaw = entry.match(/<published>([^<]+)<\/published>/)?.[1];

    if (!videoId || !title) continue;

    // Drop unparseable dates; an Invalid Date throws in formatDistanceToNow.
    const publishedAt =
      publishedRaw && !Number.isNaN(Date.parse(publishedRaw)) ? publishedRaw : "";

    videos.push({
      id: videoId,
      title: decodeXmlEntities(title),
      publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    });
  }

  return videos;
}

export async function fetchRecentVideos(
  limit = 4
): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${WORKSHOPS_PLAYLIST_ID}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return parseYouTubePlaylistFeed(await res.text(), limit);
  } catch {
    return [];
  }
}
