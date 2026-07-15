import { describe, expect, it } from "vitest";
import { parseYouTubePlaylistFeed } from "./recent-videos";

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <title>Test Playlist</title>
  <entry>
    <id>yt:video:abc12345678</id>
    <yt:videoId>abc12345678</yt:videoId>
    <title>First Workshop</title>
    <published>2026-01-15T12:00:00+00:00</published>
  </entry>
  <entry>
    <id>yt:video:def98765432</id>
    <yt:videoId>def98765432</yt:videoId>
    <title>Second &amp; Latest Workshop</title>
    <published>2026-02-01T12:00:00+00:00</published>
  </entry>
</feed>`;

describe("parseYouTubePlaylistFeed", () => {
  it("parses video entries from playlist RSS", () => {
    const videos = parseYouTubePlaylistFeed(SAMPLE_FEED, 5);

    expect(videos).toHaveLength(2);
    expect(videos[0]).toMatchObject({
      id: "abc12345678",
      title: "First Workshop",
      url: "https://www.youtube.com/watch?v=abc12345678",
      thumbnailUrl: "https://i.ytimg.com/vi/abc12345678/mqdefault.jpg",
    });
    expect(videos[1].title).toBe("Second & Latest Workshop");
  });

  it("respects the limit", () => {
    expect(parseYouTubePlaylistFeed(SAMPLE_FEED, 1)).toHaveLength(1);
  });

  it("drops unparseable published dates to an empty string", () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <entry>
    <id>yt:video:abc12345678</id>
    <yt:videoId>abc12345678</yt:videoId>
    <title>Malformed Date Workshop</title>
    <published>not-a-real-date</published>
  </entry>
</feed>`;

    const [video] = parseYouTubePlaylistFeed(feed);

    expect(video.publishedAt).toBe("");
  });

  it("keeps a valid RFC 3339 published date", () => {
    const [video] = parseYouTubePlaylistFeed(SAMPLE_FEED);
    expect(video.publishedAt).toBe("2026-01-15T12:00:00+00:00");
  });
});
