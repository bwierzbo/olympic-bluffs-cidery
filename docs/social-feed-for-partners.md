# Olympic Bluffs Instagram feed for partner sites

Olympic Bluffs Cidery & Lavender Farm publishes its Instagram posts as a public JSON feed. Partner sites, such as the Sequim Lavender Growers Association, can show our latest posts without an Instagram API account of their own.

## Endpoint

```
GET https://www.olympicbluffs.com/api/social/feed
```

No key or login. CORS is open (`Access-Control-Allow-Origin: *`), so a browser can call it from any site.

| Parameter | Default | Notes |
|---|---|---|
| `limit` | `12` | 1 to 50 posts, newest first. |
| `tag` | none | Only posts whose caption has this hashtag. Leave out the `#`, for example `?tag=sequimlavender`. Matches the whole tag only, so `sequimlavender` doesn't match `#sequimlavenderfestival`. |

Example: `https://www.olympicbluffs.com/api/social/feed?tag=sequimlavender&limit=6`

The response is cached for 5 minutes. A new Instagram post shows up in the feed within about 30 minutes.

## Response

```json
{
  "source": "https://www.olympicbluffs.com",
  "updatedAt": "2026-10-30T18:00:00.000Z",
  "posts": [
    {
      "id": "17900000000000000",
      "caption": "First press of the season…",
      "mediaType": "IMAGE",
      "imageUrl": "https://….public.blob.vercel-storage.com/social/17900000000000000/0.jpg",
      "videoUrl": null,
      "media": [{ "type": "IMAGE", "url": "https://…/0.jpg" }],
      "permalink": "https://www.instagram.com/p/…/",
      "postedAt": "2026-10-29T21:14:03.000Z"
    }
  ]
}
```

- `mediaType` is `IMAGE`, `VIDEO` (including Reels) or `CAROUSEL_ALBUM`.
- `imageUrl` is always set. It's the photo, the video's cover, or the first item of an album, so it works as a thumbnail for every post.
- `videoUrl` is the MP4 for `VIDEO` posts, otherwise `null`.
- `media` lists every photo and video in an album, in order. Each entry is `{ type, url, cover? }`, where `cover` is a video's cover image.
- `permalink` opens the post on Instagram. Please link each post there.
- The image and video URLs are our own copies and don't expire, so you can hot-link them.

## Copy-paste embed

Paste this where the feed should appear. It has no dependencies and shows a square grid that links to Instagram. Change `TAG` and `LIMIT` to suit.

```html
<div id="olympic-bluffs-feed"></div>
<script>
  (function () {
    var TAG = 'sequimlavender'; // '' for all posts
    var LIMIT = 8;
    var root = document.getElementById('olympic-bluffs-feed');
    var url = 'https://www.olympicbluffs.com/api/social/feed?limit=' + LIMIT + (TAG ? '&tag=' + encodeURIComponent(TAG) : '');

    root.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px';

    fetch(url)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function (data) {
        data.posts.forEach(function (post) {
          var a = document.createElement('a');
          a.href = post.permalink;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.style.cssText = 'position:relative;display:block;aspect-ratio:1;overflow:hidden;background:#eee';

          var img = document.createElement('img');
          img.src = post.imageUrl;
          img.loading = 'lazy';
          img.alt = (post.caption || 'Instagram post from Olympic Bluffs').split('\n')[0].slice(0, 120);
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
          a.appendChild(img);

          if (post.mediaType !== 'IMAGE') {
            var badge = document.createElement('span');
            badge.textContent = post.mediaType === 'VIDEO' ? '▶' : '❐';
            badge.setAttribute('aria-label', post.mediaType === 'VIDEO' ? 'Video' : 'Album');
            badge.style.cssText = 'position:absolute;top:6px;right:8px;color:#fff;font-size:18px;text-shadow:0 1px 3px rgba(0,0,0,.6)';
            a.appendChild(badge);
          }
          root.appendChild(a);
        });
      })
      .catch(function () {
        root.innerHTML = '<a href="https://www.instagram.com/olympicbluffscideryandlavender/" target="_blank" rel="noopener noreferrer">See Olympic Bluffs on Instagram</a>';
      });
  })();
</script>
```

## Server-side use

If your site renders on the server (WordPress, Next.js and so on), fetch the same URL and cache it for at least 5 minutes. Please don't request it more than about once a minute.

## Questions

Contact Olympic Bluffs at the email on https://www.olympicbluffs.com/visit.
