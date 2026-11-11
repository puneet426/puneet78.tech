import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_2: BlogPost[] = [
  // ───────────────────────────── DAY 6 ─────────────────────────────
  sd({
    day: 6,
    kind: "Fundamentals",
    slug: "system-design-read-heavy-vs-write-heavy",
    title: "Read-Heavy vs Write-Heavy Systems",
    description:
      "How the read-to-write ratio decides your architecture: caches, replicas and CDNs for reads; queues, batching, LSM-tree storage and sharding for writes.",
    tags: ["Fundamentals", "Scalability", "Caching", "Databases"],
    intro: [
      "Every system reads data and writes data, but rarely in equal amounts. The ratio between the two is one of the most useful facts you can know about a system, because the techniques that make reads fast are different from the techniques that make writes fast.",
      "A cache, for example, speeds up reads. Adding a cache to a logging system that receives hundreds of thousands of writes per second and is rarely read solves nothing. These notes explain how to classify a workload and which tools belong to each side.",
    ],
    sections: [
      {
        heading: "What the terms mean",
        content: [
          "A system is read-heavy when read operations far outnumber writes. A social post is written once and read by thousands of people. A product page is updated a few times a day and viewed millions of times. Ratios of 100 to 1 or even 1000 to 1 are common.",
          "A system is write-heavy when it ingests data much more often than it serves it. A fitness band records a measurement every second, but the user looks at a summary once a day. Application logs, metrics, click streams, chat messages and vehicle location updates are all write-heavy.",
          "The ratio is found during requirement gathering by asking how often each main operation happens, and it is confirmed during estimation by calculating reads per second and writes per second separately.",
        ],
      },
      {
        heading: "Tools for read-heavy systems",
        content: [
          "The goal on the read side is to avoid doing the same expensive work repeatedly and to serve data from somewhere closer and cheaper than the primary database.",
        ],
        bullets: [
          "Cache: keep frequently requested data in memory (for example Redis or Memcached). A cache hit avoids the database entirely.",
          "Read replicas: copies of the database that serve only read queries. Writes go to the primary; reads are spread across replicas.",
          "CDN: images, videos and static files are served from edge servers near the user instead of from your origin.",
          "Denormalisation and precomputation: store data in the shape the read needs (for example a precomputed feed), so that reading is a simple lookup instead of a join.",
          "Indexes: speed up queries, at the cost of slower writes because every index must be updated.",
        ],
      },
      {
        heading: "Tools for write-heavy systems",
        content: [
          "The goal on the write side is to accept data quickly and durably, smooth out bursts, and spread the load over many machines.",
        ],
        bullets: [
          "Message queue: producers append to a queue such as Kafka and return immediately; consumers write to storage at a steady pace. The queue acts as a buffer during spikes.",
          "Batching: one write of a thousand rows is far cheaper than a thousand writes of one row, because the per-request overhead (network round trip, transaction, disk flush) is paid once.",
          "Write-optimised storage: databases built on LSM trees, such as Cassandra, turn random writes into sequential appends.",
          "Sharding: split the data over many machines so that write throughput grows with the number of shards.",
          "Fewer indexes and asynchronous secondary work: do the minimum in the write path and derive everything else later.",
        ],
      },
      {
        heading: "Why LSM trees suit writes and B-trees suit reads",
        content: [
          "Most relational databases store data in B-trees. A B-tree keeps rows sorted on disk in pages. Reads are efficient because a lookup walks a few levels of the tree. A write, however, must find the right page and modify it in place, which means random disk I/O and occasional page splits.",
          "An LSM tree (log-structured merge tree) takes the opposite approach. A write is appended to a log for durability and inserted into an in-memory sorted table. When that table fills, it is flushed to disk as an immutable sorted file. Background compaction merges those files. Writes are therefore sequential and very fast. Reads may need to check several files, so they are somewhat slower, and Bloom filters are used to skip files that cannot contain the key.",
          "The practical rule: B-tree engines favour read-heavy and transactional workloads, LSM-tree engines favour write-heavy workloads.",
        ],
      },
      {
        heading: "Why a cache does not help a write-heavy system",
        content: [
          "A cache is useful when the same data is read many times between changes. In a write-heavy system the data changes constantly, so each cached value is invalidated almost as soon as it is stored. The hit rate is low, and you have added a component that must be kept consistent with the database. The benefit is small and the complexity is real.",
          "The correct first move for a write-heavy system is a buffer in front of the storage, not a cache in front of the reads.",
        ],
      },
      {
        heading: "Most real systems are both",
        content: [
          "Workload classification applies to each component, not to the product as a whole. A chat application has a write-heavy message path, but profile photos are read-heavy. An e-commerce site has a read-heavy catalogue and a write-heavy order and inventory path during a sale. A video platform is read-heavy for playback and write-heavy for view-count events.",
          "A strong design therefore treats each data type separately and may use a different storage system for each one.",
        ],
        snippets: [
          {
            title: "Classifying components of one product",
            filename: "classification.txt",
            code: `Component               Reads vs writes     Main techniques
---------------------------------------------------------------------------
Product catalogue       read-heavy          cache, read replicas, CDN
Product images          read-heavy          object storage + CDN
Orders                  balanced, critical  SQL with transactions
Click / view events     write-heavy         queue, batching, LSM store
Search suggestions      read-heavy          precomputed index, cache
Driver locations        write-heavy         in-memory store, TTL, sharding`,
          },
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Ask for the read-to-write ratio during requirements, and confirm it in estimation.",
          "Read-heavy: cache, read replicas, CDN, precomputed views.",
          "Write-heavy: queue as a buffer, batching, write-optimised storage, sharding.",
          "Choose the database by access pattern: B-tree engines for reads and transactions, LSM engines for heavy writes.",
          "Classify each component separately; most systems contain both kinds.",
        ],
      },
    ],
    conclusion:
      "The read-to-write ratio tells you where the load is, and the load decides the architecture. Read-heavy data is served from caches, replicas and CDNs. Write-heavy data is buffered in queues, batched, stored in write-optimised engines and sharded. Apply the classification per component, because one product usually contains both workloads.",
  }),

  // ───────────────────────────── DAY 7 ─────────────────────────────
  sd({
    day: 7,
    kind: "Design",
    slug: "system-design-news-feed",
    title: "Design a News Feed: Fan-Out, the Celebrity Problem and Ranking",
    description:
      "Fan-out on read versus fan-out on write, why accounts with millions of followers break the simple model, and how the hybrid approach keeps the feed instant.",
    tags: ["News Feed", "Fan-Out", "Caching", "Social"],
    intro: [
      "A news feed shows a user the recent posts from the accounts they follow. A user may follow hundreds of accounts, and yet the feed is expected to appear the moment the app opens.",
      "The central design decision is when the feed is assembled: at the time of reading, or at the time of posting. These notes explain both models, where each one breaks, and the hybrid design that is the standard answer.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: a user can create a post, follow other users, and view a feed of posts from followed accounts, newest first.",
          "Non-functional: the feed loads quickly, around 200 ms.",
          "Non-functional: high availability. The feed should always load, even if it is slightly out of date.",
          "Consistency: it is acceptable for a new post to appear in followers' feeds a few seconds late. This is eventual consistency.",
          "Workload: read-heavy. Users open the feed far more often than they post.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 100 million daily active users, each opening the feed 10 times a day and posting once every two days. Feed reads are 1 billion per day, about 10,000 per second on average and 30,000 at peak. Posts are 50 million per day, about 500 per second. If the average user has 200 followers, 500 posts per second become 100,000 feed insertions per second when posts are pushed to followers. This last number is the cost of the fan-out on write model, and it is the reason workers and queues are needed.",
        ],
      },
      {
        heading: "3. API and data model",
        content: [],
        snippets: [
          {
            title: "API",
            filename: "api.http",
            code: `POST /api/v1/posts
Body:     { "text": "...", "mediaIds": ["m_91"] }
Response: 201 Created { "postId": "p_7781" }

GET /api/v1/feed?cursor=<opaque>&limit=20
Response: 200 OK { "posts": [ ... ], "nextCursor": "..." }

POST   /api/v1/users/{id}/follow
DELETE /api/v1/users/{id}/follow`,
          },
          {
            title: "Data model",
            filename: "schema.txt",
            code: `posts    (post_id PK, author_id, text, media_url, created_at)
follows  (follower_id, followee_id, created_at)   PK (follower_id, followee_id)
         + reverse index on followee_id  -> "who follows this author?"

Feed cache (Redis sorted set, one per user)
  key   : feed:{userId}
  member: postId
  score : post timestamp
  size  : capped at the newest ~800 entries`,
          },
        ],
      },
      {
        heading: "4. Fan-out on read (pull model)",
        content: [
          "In the pull model the feed is built when the user opens the app. The service fetches the list of followed accounts, queries the recent posts of each, merges them and sorts by time.",
          "Writing a post is cheap: one insert. Reading is expensive: a user who follows 500 accounts triggers hundreds of lookups and a merge on every refresh. Since reads are the dominant operation, this model puts the heavy work on the hot path, and feed latency becomes poor at scale.",
        ],
      },
      {
        heading: "5. Fan-out on write (push model)",
        content: [
          "In the push model the work is done when a post is created. The post is stored, and then a fan-out service looks up the author's followers and inserts the post ID into each follower's feed cache. When a follower opens the app, the feed is already assembled; reading it is a single range query on one key.",
          "Reads become very fast, which is what a read-heavy system needs. The cost is moved to the write side, and it is paid asynchronously: the post API returns as soon as the post is stored and a fan-out job is queued. Workers process the job in the background, which is why a new post may take a few seconds to reach all followers.",
        ],
        snippets: [
          {
            title: "Architecture (push model)",
            filename: "architecture.txt",
            code: `WRITE PATH
 Client --> Post service --> Posts DB
                 |
                 v
          Fan-out queue --> Fan-out workers --> Follow graph (who follows the author?)
                                   |
                                   v
                      Feed cache: ZADD feed:{followerId} for each follower

READ PATH
 Client --> Feed service --> Feed cache (post IDs)
                 |                + pull recent posts of followed celebrities, merge
                 v
            Post cache / Posts DB (hydrate IDs into full posts) --> rank --> response`,
          },
        ],
      },
      {
        heading: "6. The celebrity problem",
        content: [
          "Fan-out on write works when follower counts are modest. An account with 50 million followers breaks it: a single post requires 50 million cache insertions. The fan-out queue backs up, other users' posts are delayed behind it, and most of those insertions are wasted on followers who will not open the app before the entry is pushed out of their feed.",
          "This is known as the celebrity problem or the hot key problem, and it is the most important part of this design.",
        ],
      },
      {
        heading: "7. The hybrid model",
        content: [
          "The standard solution combines both models. For ordinary accounts, use fan-out on write. For accounts above a follower threshold, skip the fan-out entirely. Their posts are stored only in their own timeline.",
          "When a user opens the feed, the service reads the precomputed feed from the cache and, in addition, fetches the recent posts of the few celebrity accounts that user follows. It merges the two lists and returns the result. A user follows only a handful of such accounts, so this adds a small, bounded amount of read work, and the recent posts of a celebrity are themselves heavily cached because millions of users request them.",
          "A further optimisation is to fan out only to active users. There is no value in maintaining a feed cache for someone who has not opened the app in a month; their feed can be rebuilt with the pull model when they return.",
        ],
      },
      {
        heading: "8. Store IDs, not content",
        content: [
          "The feed cache holds post IDs only. The post content lives in a separate post cache and in the posts database. If full posts were copied into every follower's feed, a post with a million followers would be stored a million times, and editing or deleting it would require a million updates.",
          "With IDs only, the feed entry is a few bytes, and the read path performs a second step called hydration: fetch the posts for those IDs with one multi-get from the post cache. Deleted posts are simply dropped during hydration.",
        ],
      },
      {
        heading: "9. Ranking and pagination",
        content: [
          "The simplest feed is reverse chronological. A ranked feed adds a scoring step after the candidates are collected: each post receives a score based on signals such as recency, the viewer's past interaction with the author, and engagement on the post, and the top results are returned. In an interview it is enough to present ranking as a separate stage that takes candidate posts and returns an ordered list.",
          "Pagination should use a cursor, such as the timestamp or ID of the last post seen, rather than an offset. New posts arrive at the top continuously, and offset-based pages would shift and show duplicates.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Unfollow: remove that author's posts from the follower's feed cache lazily, or filter them out during hydration by checking the follow relationship.",
          "New follow: backfill a few recent posts from the newly followed account into the feed.",
          "Cache loss: the feed cache is derived data. If it is lost, rebuild it with the pull model from the posts database.",
          "Media: images and videos are stored in object storage and delivered by a CDN; the feed carries only URLs.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: fast feed, high availability, eventual consistency, read-heavy.",
          "Fan-out on write: push post IDs into each follower's feed cache in Redis, asynchronously.",
          "Celebrities: fan-out on read for high-follower accounts, merged at read time. This is the hybrid model.",
          "Feed cache stores IDs only; content is hydrated from a separate cache.",
          "Ranking: chronological first, then engagement-based scoring as a separate stage.",
        ],
      },
    ],
    conclusion:
      "Building the feed at read time is too slow for a read-heavy product, so posts are pushed into followers' feed caches when they are created. Accounts with very large follower counts are excluded from the push and merged in at read time. The cache stores only post IDs, content is hydrated separately, and ranking is applied as a final stage.",
  }),

  // ───────────────────────────── DAY 8 ─────────────────────────────
  sd({
    day: 8,
    kind: "Fundamentals",
    slug: "system-design-caching",
    title: "Caching: Patterns, Invalidation and Failure Modes",
    description:
      "Cache-aside, write-through and write-behind, TTL and LRU eviction, invalidation on update, and the three classic problems: stampede, penetration and avalanche.",
    tags: ["Caching", "Redis", "Fundamentals", "Performance"],
    intro: [
      "A cache stores the result of an expensive operation in fast storage, usually memory, so that the next request for the same data is served without repeating the work. It is the most common answer to 'this page is slow'.",
      "Adding a cache is easy. Keeping it correct is the real topic: what happens when the underlying data changes, when a popular entry expires, and when the cache itself fails. These notes cover the patterns and the problems.",
    ],
    sections: [
      {
        heading: "When a cache helps",
        content: [
          "A cache is valuable when data is read much more often than it changes, when computing or fetching it is expensive, and when slightly stale data is acceptable for some period. Before adding one, three questions should be answered: how often does the data change, how stale may it be, and what is the expected hit rate?",
          "Caches exist at several layers: the browser, the CDN, the API gateway, an application-level cache such as Redis or Memcached, and the database's own buffer cache. These notes focus on the application-level cache.",
        ],
      },
      {
        heading: "Cache-aside (lazy loading)",
        content: [
          "Cache-aside is the default pattern. The application checks the cache first. If the key is present, that is a cache hit and the value is returned immediately. If it is absent, that is a cache miss: the application reads the database, stores the result in the cache with a TTL, and returns it.",
          "Only data that is actually requested gets cached, and a cache failure does not break the system because the application can still read the database. The costs are that the first request for each key is slow, and that cached data can be stale until it expires or is invalidated.",
        ],
        snippets: [
          {
            title: "Cache-aside read and invalidate-on-write",
            filename: "cacheAside.js",
            code: `async function getProduct(id) {
  const key = "product:" + id;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);            // cache hit

  const product = await db.products.findById(id);   // cache miss
  const ttl = 300 + Math.floor(Math.random() * 60); // TTL with jitter
  await redis.set(key, JSON.stringify(product), "EX", ttl);
  return product;
}

async function updatePrice(id, price) {
  await db.products.update(id, { price });  // 1. update the source of truth
  await redis.del("product:" + id);         // 2. invalidate the cache entry
}`,
          },
        ],
      },
      {
        heading: "Other write patterns",
        content: [],
        bullets: [
          "Read-through: the same as cache-aside, but the cache library itself loads from the database on a miss. Application code is simpler.",
          "Write-through: every write goes to the cache and the database together. The cache is always fresh, but writes are slower and data that is never read is cached anyway.",
          "Write-behind (write-back): the write goes to the cache and is flushed to the database asynchronously. Writes are very fast, but data can be lost if the cache fails before the flush. Suitable only for data where that risk is acceptable.",
        ],
      },
      {
        heading: "TTL and eviction",
        content: [
          "Every key should have a time to live (TTL). After the TTL the entry is removed and the next read fetches fresh data. The TTL is the upper bound on staleness: a short TTL gives fresher data and a lower hit rate; a long TTL gives the opposite.",
          "Memory is finite, so when the cache is full it must evict something. The most common policy is LRU (least recently used), which removes the entry that has not been accessed for the longest time, on the assumption that recently used data will be used again. LFU (least frequently used) evicts the entry with the fewest accesses and suits workloads with stable popularity.",
        ],
      },
      {
        heading: "Cache invalidation",
        content: [
          "Suppose a product's price changes in the database but the cache still holds the old price. Waiting for the TTL means users see a wrong price for minutes. The fix is to invalidate on update: after writing to the database, delete the cache key. The next read misses and loads the new value.",
          "Deleting is preferred over updating the cache value. If two updates race, writing values to the cache can leave the older one in place permanently, whereas a delete is safe to repeat. The order also matters: update the database first, then delete the key. A small race window remains, where a concurrent reader re-populates the cache with the old value just after the delete, and the TTL acts as the safety net that bounds how long such an entry can live.",
        ],
      },
      {
        heading: "Cache stampede",
        content: [
          "A very popular key expires. In the same instant thousands of requests miss the cache, and every one of them runs the same expensive query against the database. This is a cache stampede, also called the thundering herd, and it can take the database down.",
        ],
        bullets: [
          "Request coalescing: only one request rebuilds the entry (using a lock or a single-flight mechanism); the others wait for its result or are served the previous value.",
          "TTL jitter: add a random offset to each TTL so that keys created together do not all expire together.",
          "Refresh ahead: for the hottest keys, refresh in the background shortly before expiry so users never see a miss.",
        ],
      },
      {
        heading: "Cache penetration and cache avalanche",
        content: [
          "Cache penetration happens when requests ask for keys that do not exist. Nothing is ever cached, so every request reaches the database. The defences are to cache the negative result ('not found') with a short TTL, and to place a Bloom filter in front of the cache that rejects IDs that cannot exist.",
          "A cache avalanche happens when a large part of the cache disappears at once, either because many keys share an expiry time or because a cache node fails. The entire read load lands on the database. The defences are TTL jitter, cache replicas with automatic failover, and rate limiting or circuit breaking on the database path so that the system degrades instead of collapsing.",
        ],
      },
      {
        heading: "What not to cache carelessly",
        content: [
          "Some data must be exact at the moment it is used: account balances, inventory during checkout, permissions. Serving a stale value there causes real damage. Such data is either read from the source of truth at the point of decision, or cached with great care and a very short TTL. Cache the product description freely; verify the stock count in the database before confirming the order.",
        ],
      },
      {
        heading: "Scaling the cache",
        content: [
          "A single cache node is limited by its memory. A cache cluster spreads keys over many nodes, usually with consistent hashing so that adding or removing a node moves only a small share of the keys. Each node can have a replica for availability. A useful sizing guideline is that a small part of the data receives most of the traffic, so caching roughly the hottest 20 percent of items is often enough to serve the large majority of reads.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Identify the read-heavy data and how stale it may be.",
          "Use the cache-aside pattern with a TTL on every key.",
          "Evict with LRU when memory is full.",
          "Invalidate on update: write the database, then delete the key.",
          "Protect against stampedes with request coalescing and TTL jitter; mention replicas for cache failure.",
        ],
      },
    ],
    conclusion:
      "A cache trades freshness for speed. Cache-aside with a TTL is the default pattern, LRU handles a full cache, and deleting the key after a database update keeps data correct. A complete answer also covers the failure modes: stampede when a hot key expires, penetration from missing keys, and avalanche when many keys or a node disappear together.",
  }),

  // ───────────────────────────── DAY 9 ─────────────────────────────
  sd({
    day: 9,
    kind: "Design",
    slug: "system-design-cab-booking",
    title: "Design a Cab Booking System: Geohash, Matching and Locks",
    description:
      "How millions of driver location updates are stored, how nearby drivers are found without scanning everyone, and how one driver is never given two rides.",
    tags: ["Ride Hailing", "Geohash", "Redis", "Concurrency"],
    intro: [
      "A cab booking system matches a rider who needs a ride with a nearby available driver, within a few seconds. Behind that simple experience are two hard problems: storing a continuous stream of location updates from every driver, and searching that data by geography.",
      "Calculating the distance from the rider to every driver and sorting the result does not scale beyond a small city. These notes explain the spatial indexing that replaces it, and the concurrency control that prevents double booking.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: a rider sees nearby drivers, requests a ride, and is matched with a driver.",
          "Functional: both sides see live location during the trip.",
          "Functional: fare calculation and payment (state it, then keep it out of the deep dive).",
          "Non-functional: matching completes within a few seconds.",
          "Non-functional: a driver must never be assigned to two rides at once. Correctness matters more than speed here.",
          "Workload: write-heavy, because every active driver sends location updates continuously.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 1 million active drivers, each sending a location update every 4 seconds. That is 250,000 writes per second. Assume 10 million rides per day, about 115 ride requests per second on average and several hundred at peak. Location writes outnumber ride requests by three orders of magnitude, so the location pipeline is the component to design most carefully.",
          "The latest location is small: a driver ID, latitude, longitude and timestamp, well under 100 bytes. One million drivers fit in about 100 MB of memory, so the current-location index can live entirely in RAM.",
        ],
      },
      {
        heading: "3. API",
        content: [],
        snippets: [
          {
            title: "Core endpoints",
            filename: "api.http",
            code: `# Driver app, every few seconds (over a persistent connection in practice)
PUT /api/v1/drivers/me/location
Body: { "lat": 28.6139, "lng": 77.2090, "heading": 120, "ts": 1767225600 }

# Rider app
GET  /api/v1/drivers/nearby?lat=28.61&lng=77.20&radius=3000
POST /api/v1/rides
Body:     { "pickup": {...}, "drop": {...}, "vehicleType": "sedan" }
Response: 202 Accepted { "rideId": "r_5531", "status": "MATCHING" }

# Driver app
POST /api/v1/rides/{rideId}/accept
POST /api/v1/rides/{rideId}/decline`,
          },
        ],
      },
      {
        heading: "4. Storing driver locations",
        content: [
          "Only the most recent location of a driver is needed for matching, and it is overwritten every few seconds. Writing each update to a disk-based relational database would waste a great deal of I/O on data that is obsolete almost immediately.",
          "The latest location is therefore kept in an in-memory store such as Redis, with a short TTL. If a driver's app stops sending updates, the entry expires and the driver automatically disappears from search results. If trip history is needed for billing or analytics, the same updates are also published to a queue and written to durable storage asynchronously, off the critical path.",
        ],
      },
      {
        heading: "5. Finding nearby drivers: geohash",
        content: [
          "A normal database index sorts by one dimension. Location has two, latitude and longitude, so an ordinary index cannot answer 'which points are near this point' efficiently. A spatial index solves this by converting two dimensions into one.",
          "A geohash divides the world into a grid. It splits the map into cells, splits each cell again, and continues; each split adds a character to a string. The result is that every cell has a short code, and cells that share a longer prefix are closer together. A six-character geohash covers roughly 1.2 km by 0.6 km; a seven-character one about 150 metres square.",
          "Each driver is indexed under the geohash of their current cell. To find drivers near a rider, compute the rider's cell and look up drivers in that cell and its eight neighbours. The neighbours are required because a rider standing at the edge of a cell may have the nearest driver just across the boundary. This reduces the candidate set from a million drivers to a few dozen, and only for those is an exact distance calculated.",
          "Redis supports this directly through its geospatial commands, which store members in a sorted set scored by geohash. Alternatives worth naming are quadtrees, which subdivide adaptively so dense areas get smaller cells, and hexagonal grid systems.",
        ],
        snippets: [
          {
            title: "Geospatial index in Redis",
            filename: "geo.redis",
            code: `# Driver location update (the index is sharded by city / region)
GEOADD drivers:delhi:available 77.2090 28.6139 driver:1042

# Rider requests a ride: nearest 10 available drivers within 3 km
GEOSEARCH drivers:delhi:available FROMLONLAT 77.2100 28.6145
          BYRADIUS 3 km ASC COUNT 10 WITHDIST`,
          },
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Driver app --location--> Location service --> Redis geo index (latest position, TTL)
                               |
                               +--> Kafka --> Trip history store / analytics

Rider app --request--> Ride service --> Matching service --> Redis geo index (candidates)
                           |                  |
                           |                  +--> ETA service (road network + traffic)
                           |                  +--> Lock: SET lock:driver:{id} NX EX 15
                           v                  +--> Notification to driver (push / WebSocket)
                       Rides DB (SQL): ride state machine
                       REQUESTED -> MATCHED -> ARRIVING -> IN_TRIP -> COMPLETED`,
          },
        ],
      },
      {
        heading: "6. Matching",
        content: [
          "The matching service takes the candidate drivers, ranks them, and offers the ride to the best one. The driver has a short time, for example 15 seconds, to accept. If the driver declines or does not respond, the offer moves to the next candidate. Offering to one driver at a time avoids several drivers accepting the same ride; some systems instead broadcast to a small group and take the first acceptance.",
          "The ride itself is a state machine stored in a relational database, because its transitions must be consistent and are tied to payment.",
        ],
      },
      {
        heading: "7. Preventing double booking",
        content: [
          "Two riders in the same area request a ride in the same second, and the nearest driver for both is the same person. If both matching requests read 'driver is available' and then both assign the driver, one driver has two rides. This is a race condition.",
          "The solution is to acquire a lock on the driver with an atomic operation before sending the offer. In Redis, the command SET with the NX option writes the key only if it does not already exist, in a single step. Exactly one of the two requests succeeds; the other sees the driver as taken and moves to the next candidate.",
          "The lock carries a TTL. If the matching service crashes while holding the lock, or the driver never responds, the lock expires on its own and the driver becomes available again. Without a TTL, a failure would leave the driver locked indefinitely. When the driver accepts, the ride and the driver's status are updated in the database in one transaction, which is the durable guarantee behind the short-lived lock.",
        ],
      },
      {
        heading: "8. Rank by ETA, not distance",
        content: [
          "Straight-line distance is misleading. A driver 400 metres away on the other side of a river or a highway divider may need ten minutes to arrive, while a driver 900 metres away on the same road needs three. After the geohash lookup produces candidates, an ETA service estimates the driving time for each one using the road network and current traffic, and candidates are ranked by that time.",
        ],
      },
      {
        heading: "9. Additional considerations",
        content: [],
        bullets: [
          "Sharding: partition the location index by city or region, since a rider is only ever matched with drivers in the same area.",
          "Dense areas: a fixed cell size returns too many drivers downtown and too few in suburbs. Expand the search radius progressively, or use an adaptive structure such as a quadtree.",
          "Live tracking: during a trip the driver's location is pushed to the rider over a WebSocket.",
          "Surge pricing: computed per cell from the ratio of ride requests to available drivers.",
          "Reliability: the location index is rebuilt naturally within seconds after a failure, because drivers keep sending updates.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: fast matching, no double booking, write-heavy location updates.",
          "Location updates: latest position in an in-memory store with a TTL.",
          "Nearby search: geohash cells, searching the rider's cell and its neighbours.",
          "Matching: atomic lock on the driver with a TTL, then a transactional ride update.",
          "Ranking: by ETA on the road network, not straight-line distance.",
        ],
      },
    ],
    conclusion:
      "Driver locations are a high-volume stream of short-lived data, so the latest position is kept in memory with a TTL. A geohash index turns 'find nearby drivers' into a lookup of a few grid cells. An atomic lock with a TTL guarantees that one driver receives one ride, and candidates are ranked by estimated arrival time.",
  }),

  // ───────────────────────────── DAY 10 ─────────────────────────────
  sd({
    day: 10,
    kind: "Fundamentals",
    slug: "system-design-back-of-the-envelope-estimation",
    title: "Back-of-the-Envelope Estimation Without a Calculator",
    description:
      "A repeatable method for estimating QPS, storage, bandwidth and server count, with the rounding tricks and reference numbers that make the arithmetic easy.",
    tags: ["Estimation", "Fundamentals", "Capacity Planning", "Interview"],
    intro: [
      "Back-of-the-envelope estimation is a quick, approximate calculation of the load a system must handle: requests per second, storage, bandwidth and number of servers. The purpose is not an exact figure. The purpose is to find the order of magnitude, because a system serving 100 requests per second and one serving 100,000 need different architectures.",
      "What is evaluated is the reasoning: clear assumptions, simple arithmetic, and a conclusion that feeds into the design. These notes give a method that works for any question.",
    ],
    sections: [
      {
        heading: "The method",
        content: [],
        bullets: [
          "State the assumptions: daily active users, actions per user per day, size of each item.",
          "Compute requests per second (QPS), separately for reads and writes.",
          "Apply a peak factor.",
          "Compute storage per day, per year and for the planning horizon.",
          "Compute bandwidth if media is involved.",
          "Translate the numbers into a design decision.",
        ],
      },
      {
        heading: "The one trick: a day has about 100,000 seconds",
        content: [
          "A day has 24 × 60 × 60 = 86,400 seconds. Rounding this to 100,000 makes every division trivial, and the error of about 15 percent is irrelevant for an order-of-magnitude estimate.",
          "The rule becomes: requests per day divided by 100,000 gives requests per second. One million requests per day is about 10 per second. One hundred million per day is about 1,000 per second. One billion per day is about 10,000 per second.",
        ],
      },
      {
        heading: "Worked example: QPS",
        content: [
          "Assume 10 million daily active users, and each user makes 10 requests per day. That is 100 million requests per day. Dividing by 100,000 gives about 1,000 requests per second on average.",
          "Traffic is never uniform. There are busy hours and quiet hours, so the system must be sized for the peak. A common assumption is that peak traffic is two to three times the average. The design target is therefore about 3,000 requests per second. If the read-to-write ratio is 10 to 1, that is roughly 2,700 reads and 300 writes per second at peak.",
        ],
      },
      {
        heading: "Worked example: storage",
        content: [
          "Assume 1 million new posts per day and 1 KB of text per post. One million times 1 KB is 1 GB per day. Over a year that is about 365 GB, and over five years a little under 2 TB. A single database server with replicas can hold this.",
          "Now add images. If each post has one image of 200 KB, storage is 200 times larger: 200 GB per day, about 73 TB per year, and roughly 365 TB in five years. This single change moves the design from one database to a distributed object store. It is also why images and videos are stored in object storage with only the URL kept in the database: mixing 200 KB blobs into database rows would make the database huge, slow to back up and expensive to replicate.",
          "Replication multiplies storage as well. With three copies of everything, 365 TB becomes more than 1 PB of raw capacity.",
        ],
        snippets: [
          {
            title: "Estimation written out",
            filename: "estimation.txt",
            code: `ASSUMPTIONS
  DAU                 = 10 M
  Requests per user   = 10 / day
  New posts           = 1 M / day
  Text per post       = 1 KB       Image per post = 200 KB
  Read : write        = 10 : 1

TRAFFIC
  Requests/day  = 10 M x 10          = 100 M
  Average QPS   = 100 M / 100,000    = ~1,000
  Peak QPS      = 3 x average        = ~3,000  (reads ~2,700, writes ~300)

STORAGE
  Text    1 M x 1 KB    = 1 GB/day   -> ~365 GB/year -> ~2 TB in 5 years
  Images  1 M x 200 KB  = 200 GB/day -> ~73 TB/year  -> ~365 TB in 5 years

BANDWIDTH (image upload)
  200 GB/day / 100,000 s = ~2 MB/s average ingress

DECISION
  -> several stateless app servers behind a load balancer
  -> cache for the read path (2,700 reads/s)
  -> object storage + CDN for images; database holds metadata only`,
          },
        ],
      },
      {
        heading: "Reference numbers worth memorising",
        content: [],
        snippets: [
          {
            title: "Powers of two and common sizes",
            filename: "reference.txt",
            code: `2^10 = ~1 thousand  = 1 KB        1 character (ASCII)     = 1 byte
2^20 = ~1 million   = 1 MB        Typical text record     = ~1 KB
2^30 = ~1 billion   = 1 GB        Compressed photo        = ~200 KB - 2 MB
2^40 = ~1 trillion  = 1 TB        1 minute of HD video    = ~50 - 100 MB
2^50                = 1 PB

1 day   = ~100,000 seconds (86,400)
1 month = ~2.5 million seconds
1 year  = ~30 million seconds

1 M  requests/day = ~12 QPS
100 M requests/day = ~1,200 QPS
1 B  requests/day = ~12,000 QPS`,
          },
          {
            title: "Typical latencies (order of magnitude)",
            filename: "latency.txt",
            code: `Read from memory                      ~100 ns
Read from SSD                         ~100 microseconds
Network round trip, same data centre  ~0.5 ms
Read from spinning disk (seek)        ~10 ms
Network round trip, cross-continent   ~150 ms

Takeaways: memory is far faster than disk; avoid cross-region calls in
the request path; a cache hit is roughly 100x cheaper than a disk read.`,
          },
        ],
      },
      {
        heading: "Estimating servers and cache size",
        content: [
          "For application servers, assume a throughput per server and divide. If one server handles about 500 requests per second for this workload, a peak of 3,000 requests per second needs 6 servers, and you would provision a few more for redundancy and deployments.",
          "For cache size, a common assumption is that 20 percent of the data serves 80 percent of the reads. If one day of posts is 1 GB of text, caching the hottest 20 percent takes about 200 MB, which fits on a single node. Estimates like this quickly show whether a component is a small box or a large cluster.",
        ],
      },
      {
        heading: "Always end with a design decision",
        content: [
          "Numbers that are calculated and then never used add nothing. Each estimate should lead to a sentence that begins 'so we need'. For example: 3,000 requests per second is beyond one server, so we need horizontal scaling behind a load balancer. Reads are ten times writes, so we need a cache and read replicas. Image storage is hundreds of terabytes, so we need object storage and a CDN. That link between numbers and architecture is the whole point of estimation.",
        ],
      },
      {
        heading: "Common mistakes",
        content: [],
        bullets: [
          "Calculating with exact numbers such as 86,400 and getting lost in arithmetic. Round aggressively.",
          "Not stating assumptions, so the listener cannot follow or correct the reasoning.",
          "Forgetting peak traffic and sizing for the average.",
          "Mixing units, most often bits with bytes or KB with MB. Write the unit beside every number.",
          "Spending ten minutes on estimation. Three to five minutes is enough.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "A day is about 100,000 seconds.",
          "Requests per day divided by 100,000 gives QPS.",
          "Peak is two to three times the average.",
          "Storage = items per day × size per item × retention × replication.",
          "Order of work: assumptions, then calculation, then design decision.",
        ],
      },
    ],
    conclusion:
      "Estimation is structured approximation. State the assumptions, divide daily volume by 100,000 to get requests per second, multiply by two or three for the peak, and multiply item counts by sizes for storage. Then turn each number into a design decision, because that is what the numbers are for.",
  }),
];
