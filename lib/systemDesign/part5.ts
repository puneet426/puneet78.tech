import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_5: BlogPost[] = [
  // ───────────────────────────── DAY 21 ─────────────────────────────
  sd({
    day: 21,
    kind: "Design",
    slug: "system-design-view-counter",
    title: "Design a View Counter: Counting at High Write Volume",
    description:
      "Why incrementing a database row on every view collapses under load, and how event streams, batching, sharded counters and deduplication give accurate counts at scale.",
    tags: ["Counter", "Write-Heavy", "Kafka", "Eventual Consistency"],
    intro: [
      "A view counter records how many times a video, post or page has been viewed and displays that number. The feature looks trivial: add one each time someone watches.",
      "The difficulty is volume and concentration. A popular video can receive tens of thousands of views per second, all targeting the same counter. These notes explain why the direct approach fails and how counting systems are built.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: record a view when a user watches a video; display the total view count for a video.",
          "Functional: count unique or valid views, so that refreshing the page repeatedly does not inflate the number.",
          "Non-functional: handle a very high write rate, including spikes on a single viral video.",
          "Non-functional: recording a view must not slow down or break playback.",
          "Consistency: the displayed count may lag by a few seconds. Eventual consistency is acceptable. (Counts used for billing or creator payouts need higher accuracy and are computed separately.)",
          "Workload: write-heavy for recording; read-heavy for displaying.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 1 billion views per day. That is about 10,000 writes per second on average, perhaps 50,000 at peak, and a single viral video may account for a large share of that at a given moment. Reads of the count are even more frequent, since the number is shown wherever the video appears. The count itself is tiny: 100 million videos with an 8-byte counter each is under 1 GB.",
        ],
      },
      {
        heading: "3. Why a direct database increment fails",
        content: [
          "The straightforward implementation runs an UPDATE that adds one to the video's row on every view. A relational database must lock the row for the duration of each update so that concurrent increments do not overwrite each other. When thousands of requests per second target the same row, they queue behind that lock. This is row lock contention.",
          "Each update also writes to the transaction log and to the replicas. Latency rises, connections pile up, and because the videos table also serves title and metadata queries, those slow down too. A feature that should be invisible ends up degrading the whole product.",
        ],
        snippets: [
          {
            title: "The contended statement",
            filename: "naive.sql",
            code: `-- Executed once per view. For a viral video, thousands of these per second
-- all wait for the same row lock.
UPDATE videos SET view_count = view_count + 1 WHERE id = 123;`,
          },
        ],
      },
      {
        heading: "4. Record events, aggregate later",
        content: [
          "The core idea is to separate recording a view from updating the count. When a view occurs, the service publishes a small event (video ID, user or device ID, timestamp) to a stream such as Kafka and returns at once. Appending to a log is cheap and has no contention on a shared row.",
          "A consumer reads the events and aggregates them in memory over a short window, for example five seconds. At the end of the window it writes one update per video: if a video received 40,000 views in the window, the database receives a single statement adding 40,000 instead of 40,000 statements adding one. This is batching, and it reduces the database write rate by several orders of magnitude.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `WRITE PATH
 Player --> View API --> Kafka topic "views" (partitioned by videoId)
                               |
                               v
                Stream aggregator (5-second windows, dedup)
                     |                          |
                     v                          v
        Redis: INCRBY views:{videoId} n   Counts DB: UPDATE ... + n   (one write per video per window)
                                                |
                                         Raw events --> data warehouse (exact counts, analytics)

READ PATH
 Client --> Video API --> Redis views:{videoId}  --(miss)-->  Counts DB`,
          },
          {
            title: "Batched aggregation",
            filename: "aggregator.js",
            code: `const pending = new Map(); // videoId -> views in the current window

function onViewEvent(event) {
  if (isDuplicate(event)) return;                     // see deduplication below
  pending.set(event.videoId, (pending.get(event.videoId) || 0) + 1);
}

setInterval(async () => {
  const batch = new Map(pending);
  pending.clear();
  for (const [videoId, n] of batch) {
    await db.query(
      "UPDATE video_counts SET views = views + $1 WHERE video_id = $2", [n, videoId]
    );
    await redis.incrby("views:" + videoId, n);
  }
  // commit Kafka offsets only after the batch is written
}, 5000);`,
          },
        ],
      },
      {
        heading: "5. Sharded counters",
        content: [
          "Where counts must be updated directly at a high rate, a single counter is split into several sub-counters, called shards. Each increment goes to one shard chosen at random or by hashing the request. Because writes are spread across N rows or keys, contention falls by a factor of N. The total is the sum of all shards, computed on read and cached.",
          "The trade-off is that reading is slightly more work, which is acceptable because the sum changes slowly relative to how often it is read and can be cached for a few seconds.",
        ],
        snippets: [
          {
            title: "A counter split into shards",
            filename: "sharded-counter.txt",
            code: `video_view_shards (video_id, shard_id, count)   PRIMARY KEY (video_id, shard_id)

 (123, 0)  4,812,551
 (123, 1)  4,809,120
 (123, 2)  4,815,004
 ...
 (123, 9)  4,811,377

 write: UPDATE ... SET count = count + 1 WHERE video_id = 123 AND shard_id = random(0..9)
 read : SELECT SUM(count) FROM video_view_shards WHERE video_id = 123   (cache the result)`,
          },
        ],
      },
      {
        heading: "6. Deduplication",
        content: [
          "A view count is only meaningful if it resists trivial inflation. Refreshing a page ten times should not add ten views, and a retried request should not count twice. The aggregator therefore checks each event against recent history before counting it.",
          "A simple rule is one view per user (or device) per video within a time window. This is implemented with a key such as seen:{videoId}:{userId} in Redis, set with a TTL using an atomic set-if-absent; the view is counted only if the key was newly created. For very high volumes, a Bloom filter gives the same check in far less memory at the cost of a small false-positive rate.",
          "If the requirement is the number of distinct viewers and not the number of views, a HyperLogLog estimates the count of unique users in a few kilobytes with an error of around one percent. Further rules, such as a minimum watch duration and bot filtering, are applied in the same stage.",
        ],
      },
      {
        heading: "7. Serving the count",
        content: [
          "Counts are read far more often than they change in a way a user could notice. The current value is kept in Redis and returned from there. The UI shows rounded values such as 1.2M, so a delay of a few seconds is invisible. This is a deliberate use of eventual consistency: the displayed number converges to the true value shortly after the views occur.",
        ],
      },
      {
        heading: "8. Accuracy and failure handling",
        content: [],
        bullets: [
          "The aggregator commits its position in the stream only after writing a batch. If it crashes, the uncommitted events are replayed. This is at-least-once processing, so a small overcount is possible unless the batch write is made idempotent, for example by storing the window ID with the update.",
          "Raw events are retained and also loaded into a data warehouse. A periodic batch job recomputes exact counts from them and corrects any drift in the fast counters. Combining a fast approximate path with a slow exact path is a common pattern.",
          "Hot videos: partitioning the stream by video ID keeps a video's events together for aggregation, but a single viral video can overload one partition. Adding a random suffix to the key for very hot videos spreads them, with the partial counts combined afterwards.",
          "The same design applies to likes, impressions, download counts and any other high-volume counter.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: very high write rate, eventual consistency acceptable, must not affect playback.",
          "Do not increment a database row per view: row lock contention.",
          "Publish view events to a stream and aggregate in batches.",
          "Use sharded counters where direct increments are needed, and deduplicate views.",
          "Serve counts from a cache; reconcile against raw events for exact numbers.",
        ],
      },
    ],
    conclusion:
      "A counter that is updated on every event becomes a point of contention. The scalable design records each view as an event, aggregates events in short windows, and applies one batched update per video. Sharded counters spread direct increments, deduplication keeps the number honest, a cache serves reads, and a batch job over the raw events provides the exact figure.",
  }),

  // ───────────────────────────── DAY 22 ─────────────────────────────
  sd({
    day: 22,
    kind: "Fundamentals",
    slug: "system-design-cdn",
    title: "Content Delivery Networks: How a CDN Makes a Global Site Fast",
    description:
      "Why distance creates latency, how edge servers cache content, what can and cannot be cached, TTLs and versioned file names, origin shielding and DDoS absorption.",
    tags: ["CDN", "Caching", "Performance", "Fundamentals"],
    intro: [
      "A content delivery network (CDN) is a geographically distributed set of servers that store copies of your content close to users. When a user requests an image, a script or a video chunk, it is delivered from a nearby server instead of from your own servers, which may be on another continent.",
      "If a site hosted in one country loads slowly for users in another, the cause is usually not server capacity, and a more powerful server will not fix it. The cause is distance. These notes explain why, and how a CDN addresses it.",
    ],
    sections: [
      {
        heading: "Latency comes from distance",
        content: [
          "Data travels through fibre at roughly two thirds of the speed of light, and it does not travel in a straight line; it passes through many routers and networks. A round trip between India and the east coast of the United States takes around 200 ms or more.",
          "Loading a page over HTTPS requires several round trips before any content arrives: one for the TCP handshake, one or two for the TLS handshake, then the request and response. After that, a typical page requests dozens of further files. A server that responds in 5 ms still delivers a slow page if every exchange spends 200 ms on the wire. Upgrading the server's CPU changes the 5 ms, not the 200 ms.",
        ],
      },
      {
        heading: "Edge servers and the origin",
        content: [
          "Your own servers, where the content is created and stored, are called the origin. The CDN operates edge servers in many locations around the world, called points of presence (PoPs).",
          "A user's request is directed to a nearby edge server, either by DNS, which returns the address of a close PoP, or by anycast routing, where the same IP address is announced from every PoP and the network delivers the request to the nearest one. If the edge server has the requested file in its cache, it returns it immediately. This is a cache hit, and the round trip is a few milliseconds. If it does not, a cache miss, the edge fetches the file from the origin, returns it to the user and stores it for subsequent requests.",
        ],
        snippets: [
          {
            title: "Request flow",
            filename: "architecture.txt",
            code: `User in Mumbai ---> Edge PoP (Mumbai) ---- cache HIT ----> response in ~10 ms
                          |
                          | cache MISS
                          v
                 Origin shield (regional cache)
                          |
                          | miss
                          v
                 Origin (app servers / object storage, e.g. in Virginia)

 The first user in a region pays the trip to the origin.
 Everyone after that, until the TTL expires, is served from the edge.`,
          },
        ],
      },
      {
        heading: "What a CDN can cache",
        content: [
          "Caching works for content that is the same for every user.",
        ],
        bullets: [
          "Static content: images, CSS, JavaScript bundles, fonts, video chunks, downloadable files. These are ideal and should always be served through a CDN.",
          "Public pages and API responses that are identical for everyone and change infrequently: a product page, an article, a list of categories. These can be cached for a short time.",
          "User-specific content: a cart, an account page, a personalised feed. These must not be cached at the edge as shared content, or one user would be shown another user's data. They are marked private or not cacheable.",
        ],
      },
      {
        heading: "Controlling the cache: TTL and headers",
        content: [
          "The origin tells the CDN and the browser how long a response may be reused through the Cache-Control header. The lifetime is the TTL. Until it expires, the cached copy is served without contacting the origin.",
          "A long TTL means more hits and less load on the origin, but changes take longer to appear. A short TTL means fresher content and more origin traffic. When a cached copy expires, the edge can revalidate it with a conditional request using an ETag: if the file has not changed, the origin replies 304 Not Modified with no body, which is much cheaper than sending the file again.",
        ],
        snippets: [
          {
            title: "Cache-Control for different content",
            filename: "headers.http",
            code: `# Fingerprinted static asset: cache for a year, never revalidate
Cache-Control: public, max-age=31536000, immutable

# HTML page: always check with the origin before reuse
Cache-Control: no-cache

# Public API response: browser 60 s, CDN 5 min, serve stale while refreshing
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=30

# Personal data: only the user's own browser may store it
Cache-Control: private, no-store`,
          },
        ],
      },
      {
        heading: "Updating cached files: versioned file names",
        content: [
          "Suppose style.css is cached for a year and you deploy a new design. Users and edge servers continue to use the old file. One option is to purge the file from the CDN, which sends an invalidation to every edge. Purging works but takes time to propagate and does not reach copies already stored in browsers.",
          "The standard solution is versioned file names, also called cache busting. The build process puts a hash of the file's contents in its name, for example style.3f9a1c.css. When the content changes, the name changes, so it is a new URL that no cache has seen. The HTML, which has a short TTL, refers to the new name. Old and new versions coexist safely, each file can be cached forever, and a rollback is simply the HTML pointing to the previous name again.",
        ],
      },
      {
        heading: "Pull and push CDNs",
        content: [
          "With a pull CDN, the edge fetches content from the origin on the first request and caches it. Setup is minimal and only content that is actually requested is stored. The first request in each location is slower. This is the common choice for websites.",
          "With a push CDN, you upload content to the CDN in advance. Nothing is fetched on demand, so even the first request is fast. It requires managing uploads and suits large files released on a schedule, such as software downloads or new video releases.",
        ],
      },
      {
        heading: "Origin shield",
        content: [
          "A CDN may have hundreds of PoPs. When a popular file expires or a new file is released, each PoP independently misses and requests it from the origin, producing a burst of identical requests.",
          "An origin shield is an additional caching layer between the edge servers and the origin. Edges send their misses to the shield, and the shield requests the file from the origin once and serves all the edges. This increases the overall hit ratio and protects the origin from miss storms.",
        ],
      },
      {
        heading: "Benefits beyond speed",
        content: [],
        bullets: [
          "Reduced origin load: most requests never reach your servers, which lowers compute and bandwidth cost.",
          "Availability: if the origin is briefly down, the CDN can continue serving cached content, including stale copies if configured.",
          "DDoS absorption: an attack is spread across the CDN's large global capacity and filtered at the edge instead of concentrating on your origin.",
          "TLS termination close to the user, which shortens the handshake, plus compression and image optimisation at the edge.",
          "Acceleration of dynamic requests: even uncacheable requests benefit from the edge's persistent, optimised connections to the origin.",
        ],
      },
      {
        heading: "Limitations and trade-offs",
        content: [],
        bullets: [
          "Stale content if TTLs and invalidation are not planned.",
          "Risk of caching private data if headers are wrong. Cache keys must include whatever makes responses differ.",
          "Cost is based on data transferred and can be significant for video.",
          "Rarely requested content has a low hit ratio and gains little.",
          "A CDN does not make slow origin logic or uncacheable database queries faster.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Latency for distant users comes from distance, not from server power.",
          "A CDN caches content on edge servers near users; the origin is contacted only on a miss.",
          "Cache static and public content; never cache user-specific responses as shared.",
          "Control freshness with TTLs, and deploy changes with versioned file names.",
          "Extras: origin shield to protect the origin, DDoS absorption, availability when the origin fails.",
        ],
      },
    ],
    conclusion:
      "A CDN removes distance from the request path by serving cached copies from edge servers near the user. It suits static and public content, is governed by Cache-Control and TTLs, and is updated reliably through versioned file names. It also reduces origin load, improves availability and absorbs attacks, which makes it a standard part of any read-heavy design.",
  }),

  // ───────────────────────────── DAY 23 ─────────────────────────────
  sd({
    day: 23,
    kind: "Design",
    slug: "system-design-unique-id-generator",
    title: "Design a Distributed Unique ID Generator",
    description:
      "Why auto-increment and UUIDs fall short in a distributed system, and how Snowflake-style IDs combine a timestamp, a machine ID and a sequence into a sortable 64-bit number.",
    tags: ["Unique ID", "Snowflake", "Distributed Systems", "Databases"],
    intro: [
      "Every order, message, payment and user needs an identifier that is unique. On a single database this is solved by an auto-increment column. Once the data is spread over many databases and the IDs are created by many servers, there is no longer one place that knows the next number.",
      "A distributed unique ID generator produces identifiers that never collide, without the servers having to coordinate on each request. These notes compare the common approaches and explain the Snowflake design in detail.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Unique: no two IDs are ever the same, across all servers and data centres.",
          "Sortable by time: an ID generated later is larger than one generated earlier, at least approximately. This lets data be ordered by ID and keeps database indexes efficient.",
          "Compact: fits in 64 bits, so that it can be stored as a BIGINT and indexed cheaply.",
          "Fast and highly available: tens of thousands of IDs per second per server, with no network call and no single point of failure.",
          "Numeric: some systems prefer integers over strings for storage and comparison.",
        ],
      },
      {
        heading: "2. Database auto-increment",
        content: [
          "A single database with an auto-increment column produces unique, ordered, compact IDs. Its limits appear with scale. Every ID requires a round trip to that database, so it is a bottleneck. If it fails, nothing in the system can create new records, so it is a single point of failure. And once the data is sharded, each shard has its own counter and they produce the same numbers.",
          "A partial fix is to run several databases with different offsets: with two servers, one generates odd numbers and the other even numbers. This works for a fixed, small number of servers, but adding a server later means changing the step size everywhere, and IDs are no longer ordered by time across servers.",
          "Sequential IDs also expose information. An outsider who creates two orders a day apart can subtract the IDs and learn how many orders the business received.",
        ],
      },
      {
        heading: "3. UUID",
        content: [
          "A UUID is a 128-bit value that any machine can generate on its own, with a negligible probability of collision. No coordination is required, which makes it simple and fully available.",
          "It fails two of the requirements. It is 128 bits, twice the target size, and is usually stored as a 36-character string. And the common random variant (version 4) has no order. Random primary keys are harmful to B-tree indexes: each insert lands on a random page, which causes page splits, poor cache locality and slower writes as the table grows. Newer time-ordered variants such as UUID version 7 and ULID fix the ordering problem by placing a timestamp first, but they remain 128 bits.",
        ],
      },
      {
        heading: "4. Range allocation (ticket server)",
        content: [
          "A central service hands out blocks of IDs, for example a thousand at a time, and each application server issues IDs from its block locally. This removes the per-ID round trip and was the approach used for the URL shortener earlier in this series. It gives compact numeric IDs, but they are only roughly ordered in time, and the allocation service must itself be made highly available.",
        ],
      },
      {
        heading: "5. Snowflake IDs",
        content: [
          "The Snowflake approach builds a 64-bit ID by concatenating three fields, so that each generator can create IDs independently and the result is still unique and time-ordered.",
        ],
        bullets: [
          "Sign bit, 1 bit: always zero, so that the ID is a positive number in languages with signed integers.",
          "Timestamp, 41 bits: milliseconds since a custom epoch chosen by the system, such as the start of 2020. Forty-one bits cover about 69 years.",
          "Machine ID, 10 bits: identifies the generator, allowing 1,024 nodes. It is often split into 5 bits for the data centre and 5 bits for the machine.",
          "Sequence, 12 bits: a counter that increments for each ID generated within the same millisecond on the same machine, allowing 4,096 IDs per millisecond.",
        ],
        snippets: [
          {
            title: "Bit layout of a 64-bit Snowflake ID",
            filename: "layout.txt",
            code: `  1 bit        41 bits                 10 bits         12 bits
+------+---------------------------+--------------+----------------+
|  0   |  timestamp (ms since      |  machine ID  |   sequence     |
| sign |  custom epoch)            |  (0 - 1023)  |   (0 - 4095)   |
+------+---------------------------+--------------+----------------+

 Capacity : 4,096 IDs per millisecond per machine = ~4 million per second per machine
 Lifetime : 2^41 ms = ~69 years from the chosen epoch
 Ordering : the timestamp is in the high bits, so numeric order = time order`,
          },
        ],
      },
      {
        heading: "6. Why this layout works",
        content: [
          "Uniqueness is guaranteed by construction. Two IDs generated on different machines differ in the machine ID. Two IDs generated on the same machine in different milliseconds differ in the timestamp. Two IDs generated on the same machine in the same millisecond differ in the sequence. No communication between machines is needed at generation time.",
          "Because the timestamp occupies the most significant bits, sorting by ID is the same as sorting by creation time, to millisecond precision. Across machines, IDs created in the same millisecond are not strictly ordered, so the property is described as roughly sortable, or k-sorted. That is sufficient for pagination, for range scans by time, and for append-friendly index inserts.",
        ],
        snippets: [
          {
            title: "Snowflake generator",
            filename: "snowflake.js",
            code: `const EPOCH = 1577836800000n; // 2020-01-01T00:00:00Z

class Snowflake {
  constructor(machineId) {
    this.machineId = BigInt(machineId); // 0..1023, unique per running instance
    this.lastTs = -1n;
    this.sequence = 0n;
  }

  nextId() {
    let ts = BigInt(Date.now());

    if (ts < this.lastTs) {
      throw new Error("Clock moved backwards; refusing to generate IDs");
    }

    if (ts === this.lastTs) {
      this.sequence = (this.sequence + 1n) & 4095n;   // 12 bits
      if (this.sequence === 0n) {
        // 4,096 IDs already issued in this millisecond: wait for the next one
        while (ts <= this.lastTs) ts = BigInt(Date.now());
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTs = ts;
    return ((ts - EPOCH) << 22n) | (this.machineId << 12n) | this.sequence;
  }
}`,
          },
        ],
      },
      {
        heading: "7. Assigning machine IDs",
        content: [
          "The scheme depends on every running generator having a different machine ID. If two instances share one, they can produce identical IDs. Machine IDs must therefore be assigned centrally, once, at startup: for example by a coordination service such as ZooKeeper or etcd that leases a free ID to each instance, or from static configuration tied to the host. This coordination happens only when a process starts, not on every ID, so it does not affect throughput or availability.",
        ],
      },
      {
        heading: "8. Clock problems",
        content: [
          "The design relies on the system clock, and clocks on different machines drift. Time synchronisation services correct drift, and a correction can move a machine's clock backwards. If the generator kept running with an earlier timestamp, it could reproduce an ID it has already issued.",
        ],
        bullets: [
          "Detect it: the generator remembers the last timestamp it used. If the current time is earlier, it does not generate.",
          "For a small backward jump, wait until the clock catches up to the last timestamp.",
          "For a large jump, fail fast, take the node out of service and raise an alert.",
          "Configure time synchronisation to slew the clock gradually instead of stepping it.",
          "On restart, a node should not issue IDs until its clock has passed the last timestamp it used before stopping.",
        ],
      },
      {
        heading: "9. Trade-offs and variations",
        content: [],
        bullets: [
          "The bit allocation can be tuned: more sequence bits for higher throughput per node, more machine bits for more nodes, or second-level timestamps for a longer lifetime.",
          "IDs reveal their creation time and are guessable in sequence. Where that matters, expose a separate random public identifier.",
          "Deployment: as a library embedded in each service (no network hop, but machine IDs must be managed for every instance) or as a small dedicated ID service.",
          "JavaScript numbers lose precision above 2^53, so 64-bit IDs should be sent to browsers as strings.",
        ],
        snippets: [
          {
            title: "Comparison of approaches",
            filename: "comparison.txt",
            code: `Approach              Unique  Time-sortable  Size      Coordination        Main weakness
-------------------------------------------------------------------------------------------
DB auto-increment     yes     yes            64 bit    every ID            bottleneck, single point of failure
UUID v4               yes*    no             128 bit   none                large, random index inserts
UUID v7 / ULID        yes*    yes            128 bit   none                large
Range allocation      yes     roughly        64 bit    per block           allocator must be highly available
Snowflake             yes     yes (k-sorted) 64 bit    machine ID at boot  depends on clocks

* probabilistic, with negligible collision chance`,
          },
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: unique, time-sortable, 64-bit, fast, no single point of failure.",
          "Auto-increment: bottleneck and single point of failure; does not work across shards.",
          "UUID: no coordination, but 128 bits and (v4) unordered.",
          "Snowflake: 41-bit timestamp, 10-bit machine ID, 12-bit sequence.",
          "Handle clock drift: never generate with a timestamp earlier than the last one used.",
        ],
      },
    ],
    conclusion:
      "A distributed ID generator must create unique identifiers without coordinating on each request. A Snowflake-style ID packs a millisecond timestamp, a machine ID and a per-millisecond sequence into 64 bits, which gives uniqueness by construction and ordering by time. Its two operational requirements are unique machine IDs and protection against clocks moving backwards.",
  }),

  // ───────────────────────────── DAY 24 ─────────────────────────────
  sd({
    day: 24,
    kind: "Fundamentals",
    slug: "system-design-monolith-vs-microservices",
    title: "Monolith vs Microservices: Choosing an Architecture for Your Team",
    description:
      "What each architecture gives you and what it costs, including distributed tracing, sagas and compensating actions, and why most products should begin as a well-structured monolith.",
    tags: ["Microservices", "Monolith", "Architecture", "Fundamentals"],
    intro: [
      "A monolith is an application built and deployed as a single unit. A microservices architecture splits the application into small services, each owning one business capability, deployed independently and communicating over the network.",
      "Neither is better in general. Microservices solve problems of scale, mostly organisational scale, and they introduce the problems of distributed systems. A team of five developers adopting microservices takes on those costs without having the problems they solve. The correct answer is 'it depends', followed by what it depends on.",
    ],
    sections: [
      {
        heading: "The monolith",
        content: [
          "In a monolith, all the modules, such as users, catalogue, orders and payments, live in one codebase, run in one process, and usually share one database. A call from one module to another is an ordinary function call.",
        ],
        bullets: [
          "Simple to develop: one repository, one build, the whole application runs on a laptop.",
          "Simple to deploy and operate: one artifact, one pipeline, one set of logs.",
          "Simple to debug: a single stack trace shows the entire path of a request.",
          "Strong consistency is easy: an operation that touches several modules is one database transaction.",
          "Fast: in-process calls have no network latency and cannot partially fail.",
        ],
      },
      {
        heading: "Where the monolith strains",
        content: [
          "The limits of a monolith appear as the codebase and the organisation grow.",
        ],
        bullets: [
          "Many teams change the same codebase and must coordinate every release. One team's unfinished work can block another team's deployment.",
          "Build, test and deployment times grow, so releases become less frequent and riskier.",
          "Scaling is all or nothing. If only the image-processing module needs more capacity, the entire application must still be replicated.",
          "A fault in one module, such as a memory leak, can bring down the whole process.",
          "The whole application is tied to one language, framework and runtime version.",
          "Without discipline, module boundaries erode and everything depends on everything else.",
        ],
      },
      {
        heading: "Microservices",
        content: [
          "In a microservices architecture each service implements one business capability, owns its own data store, and exposes an API. Other services use that API and never read its database directly. Each service is built, deployed and scaled on its own, typically by one small team.",
        ],
        bullets: [
          "Independent deployment: a team releases its service without waiting for anyone else.",
          "Independent scaling: capacity is added only where the load is.",
          "Fault isolation: when the recommendation service fails, checkout can continue.",
          "Team autonomy: clear ownership, and freedom to choose suitable technology per service.",
          "Smaller codebases that are easier to understand individually.",
        ],
        snippets: [
          {
            title: "The same product, two architectures",
            filename: "architecture.txt",
            code: `MONOLITH
 Client --> Load balancer --> [ Users | Catalogue | Orders | Payments ]  --> one database
                               one codebase, one deployable, in-process calls

MICROSERVICES
 Client --> API gateway --+--> User service      --> users DB
                          +--> Catalogue service --> catalogue DB
                          +--> Order service     --> orders DB
                          +--> Payment service   --> payments DB
                                    |
                          Message broker (events between services)
                          + service discovery, config, tracing, metrics, CI/CD per service`,
          },
        ],
      },
      {
        heading: "The costs of microservices",
        content: [
          "Splitting an application turns function calls into network calls, and that changes everything about how it behaves. The network is slow compared to memory, and it fails: requests time out, arrive twice or not at all. Every call between services needs timeouts, retries with backoff, and circuit breakers to stop a failing dependency from dragging down its callers.",
          "The operational surface multiplies. Each service needs its own pipeline, deployment configuration, monitoring, alerting and on-call ownership. The platform must provide service discovery, an API gateway, configuration and secret management, and usually container orchestration. Testing a feature that spans several services is harder, and versioned APIs must remain backward compatible because services are deployed at different times.",
        ],
      },
      {
        heading: "Debugging: distributed tracing",
        content: [
          "In a monolith, a failed request leaves one stack trace. In microservices, a single user action may pass through eight services, and each has its own logs on its own machines. Finding where a request slowed down or failed by reading logs separately is impractical.",
          "Distributed tracing addresses this. The first service to receive a request assigns it a trace ID, which is passed along in the headers of every downstream call. Each service records the time it spent as a span tagged with that trace ID. A tracing system collects the spans and reconstructs the full path of the request as a timeline, showing which service was called by which, how long each took, and where an error occurred. Including the trace ID in every log line ties logs to traces.",
        ],
      },
      {
        heading: "Data consistency: the saga pattern",
        content: [
          "In a monolith, placing an order can create the order, reserve stock and record the payment in one database transaction: all succeed or all are rolled back. With a separate database per service, no single transaction can span them, and distributed transactions using two-phase commit are slow and reduce availability.",
          "The saga pattern replaces one large transaction with a sequence of local transactions, one in each service. Each step commits on its own and then triggers the next step. If a step fails, the saga runs compensating actions that undo the steps already completed. A compensating action is a new operation that semantically reverses an earlier one: a refund reverses a charge, a release reverses a stock reservation.",
          "Sagas can be coordinated in two ways. In choreography, each service reacts to events published by the others, with no central controller. In orchestration, a dedicated orchestrator tells each service what to do and tracks the state of the saga. A saga gives eventual consistency, not isolation: for a short time the system is in an intermediate state, and the design must tolerate that.",
        ],
        snippets: [
          {
            title: "An order saga with compensation",
            filename: "saga.txt",
            code: `Step  Service      Action                 Compensating action
---------------------------------------------------------------------
1     Order        create order (PENDING)  cancel order
2     Inventory    reserve stock           release stock
3     Payment      charge customer         refund customer
4     Order        mark order CONFIRMED    -

Happy path : 1 -> 2 -> 3 -> 4
Payment fails at step 3:
             run compensation for 2 (release stock),
             then for 1 (cancel order).  The system ends in a consistent state.`,
          },
        ],
      },
      {
        heading: "What the decision depends on",
        content: [],
        bullets: [
          "Team size: with one or two teams, coordination in a monolith is cheap. With dozens of teams, independent deployment becomes valuable.",
          "Domain understanding: service boundaries are expensive to change. Until the domain is well understood, boundaries drawn early are likely to be wrong.",
          "Scaling profile: if components have very different load or resource needs, separating them pays off.",
          "Operational maturity: automated deployment, monitoring and on-call practices must exist before running many services.",
          "Stage of the product: early on, speed of change matters most, and a monolith changes fastest.",
        ],
      },
      {
        heading: "Monolith first",
        content: [
          "The widely recommended path is to start with a modular monolith: one deployable, but with strict internal module boundaries, where each module has its own tables and other modules use it only through a defined interface. This keeps development simple while preserving the ability to split later.",
          "When a specific pain appears, for example one module that needs to scale separately or a team that is blocked by shared releases, extract that module into a service. Repeating this gradually, with a routing layer directing traffic to the new service, is often called the strangler pattern. Services are then created in response to real needs with boundaries that have already proven themselves.",
          "A warning sign of a poor split is the distributed monolith: services that must be deployed together, that share a database, or that call each other synchronously in long chains. It carries the costs of both architectures and the benefits of neither.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "It depends on team size, domain clarity, scaling needs and operational maturity.",
          "Monolith: simple to build, deploy and debug, with easy transactions; strains with many teams.",
          "Microservices: independent deployment and scaling, fault isolation; cost is distributed-system complexity.",
          "New requirements: distributed tracing for debugging, sagas with compensating actions for consistency.",
          "Default: start with a modular monolith and extract services when a concrete need appears.",
        ],
      },
    ],
    conclusion:
      "A monolith optimises for simplicity and microservices optimise for independence. Microservices allow many teams to deploy and scale separately, at the price of network failures, operational overhead, distributed tracing and sagas in place of transactions. For a small team the monolith is the better starting point, kept modular so that services can be extracted when the need is real.",
  }),

  // ───────────────────────────── DAY 25 ─────────────────────────────
  sd({
    day: 25,
    kind: "Design",
    slug: "system-design-file-storage-and-sync",
    title: "Design a File Storage and Sync Service",
    description:
      "Chunking, delta sync, content-hash deduplication, separating metadata from blocks, change notifications across devices and handling conflicting edits.",
    tags: ["File Storage", "Sync", "Chunking", "Deduplication"],
    intro: [
      "A file storage and sync service lets a user store files in the cloud and keeps them synchronised across all their devices. A file saved on a laptop appears on the phone a moment later, and an edit made on one device reaches the others.",
      "Uploading the whole file again each time it changes is correct but wasteful: changing one paragraph of a 1 GB file would transfer 1 GB. These notes describe how chunking and metadata make sync efficient and reliable.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: upload and download files; organise them in folders.",
          "Functional: automatic sync across a user's devices; changes made offline sync when the device reconnects.",
          "Functional: file version history; sharing with other users.",
          "Non-functional: durability. A stored file must never be lost. This is the most important property.",
          "Non-functional: efficient use of bandwidth and storage; resumable transfers for large files.",
          "Non-functional: consistent metadata, so that all devices agree on the current state of a file.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 50 million users, 10 million of them active daily, each storing 10 GB on average. Total storage is 500 PB before replication and deduplication, which can only be held in distributed object storage. If each active user changes 20 files a day, that is 200 million file changes per day, about 2,000 per second, each producing metadata updates and notifications. Storage volume is enormous, while metadata traffic is moderate and needs strong consistency: two very different workloads.",
        ],
      },
      {
        heading: "3. Chunking",
        content: [
          "Files are not stored as single objects. The client splits each file into chunks, also called blocks, typically around 4 MB. Each chunk is identified by a cryptographic hash of its contents, such as SHA-256. The file is then described by an ordered list of chunk hashes.",
        ],
        bullets: [
          "Resumable transfers: if the connection drops, only the unfinished chunk is sent again, not the whole file.",
          "Parallelism: several chunks can be uploaded or downloaded at once.",
          "Delta sync: when a file changes, only the chunks that changed are uploaded.",
          "Deduplication: identical chunks are stored once.",
        ],
      },
      {
        heading: "4. Delta sync",
        content: [
          "When a file is modified, the client splits the new version into chunks and computes their hashes. It compares them with the hashes of the previous version. Chunks whose hashes are unchanged are already on the server. Only the new chunks are uploaded, and then the file's metadata is updated to the new list of hashes. Editing a small part of a 1 GB file transfers a few megabytes.",
          "With fixed-size chunks there is a weakness: inserting a single byte at the start of a file shifts every chunk boundary, so every hash changes. Content-defined chunking solves this by choosing boundaries from the data itself, using a rolling hash. An insertion then affects only the chunk in which it occurs, and the boundaries after it stay where they were.",
        ],
        snippets: [
          {
            title: "Delta sync on one changed chunk",
            filename: "delta-sync.txt",
            code: `Version 1 of report.pdf (16 MB)        Version 2 (one page edited)
  chunk 0  hash a41f...                  chunk 0  hash a41f...   unchanged
  chunk 1  hash 77c2...                  chunk 1  hash 77c2...   unchanged
  chunk 2  hash 0be9...                  chunk 2  hash d5a0...   CHANGED -> upload 4 MB
  chunk 3  hash 93e1...                  chunk 3  hash 93e1...   unchanged

Uploaded: 1 chunk (4 MB) instead of 16 MB.
Metadata: new version row with chunk list [a41f, 77c2, d5a0, 93e1].`,
          },
        ],
      },
      {
        heading: "5. Deduplication",
        content: [
          "Because a chunk is stored under the hash of its contents, two identical chunks have the same key. Before uploading, the client sends the list of hashes to the server and asks which ones it does not have. Chunks that already exist, whether from an earlier version of the same file, from another file, or from another user, are not uploaded or stored again. The server simply adds a reference.",
          "A popular file that thousands of users store is kept once. Each chunk has a reference count, and a chunk is physically deleted only when no file version refers to it any more. Cross-user deduplication can reveal whether a particular file already exists on the service, so some designs restrict deduplication to a single account.",
        ],
      },
      {
        heading: "6. Metadata and block storage",
        content: [
          "The system stores two kinds of data and keeps them separate. The chunk contents are large, immutable blobs. They go to object storage, which is cheap, effectively unlimited, and designed for very high durability through replication or erasure coding across zones.",
          "The metadata is small and structured: users, folder hierarchy, file names, versions, the ordered list of chunk hashes for each version, sharing permissions and device sync state. It needs transactions and strong consistency, because renaming a folder or committing a new version must be atomic and all devices must see the same result. A relational database, sharded by user or workspace, is the usual choice.",
        ],
        snippets: [
          {
            title: "Metadata schema (simplified)",
            filename: "schema.txt",
            code: `files          (file_id PK, owner_id, parent_folder_id, name, latest_version, is_deleted)
file_versions  (file_id, version, size, created_at, device_id)      PK (file_id, version)
version_chunks (file_id, version, seq, chunk_hash)                  PK (file_id, version, seq)
chunks         (chunk_hash PK, size, ref_count, storage_location)
changes        (owner_id, cursor BIGINT, file_id, version, op)      -- per-user change journal
devices        (device_id PK, user_id, last_synced_cursor)`,
          },
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Device A (sync client: watcher, chunker, local index)
   |  1. changed file -> chunk + hash
   |  2. "which of these hashes are missing?" ------> Metadata service --> Metadata DB (SQL)
   |  3. upload only missing chunks ---------------> Block service ----> Object storage
   |  4. commit new version (expected base version) -> Metadata service
   |                                                      |
   |                                              change event (queue)
   |                                                      v
Device B  <------ long poll / WebSocket: "changes available" -- Notification service
   |  5. fetch changes since last cursor ----------> Metadata service
   |  6. download new chunks ----------------------> Block service / CDN
   |  7. rebuild the file locally`,
          },
        ],
      },
      {
        heading: "7. Upload flow",
        content: [
          "The order of operations ensures that other devices never see a file whose data is incomplete. The client first uploads the missing chunks to the block service. Only when all chunks are safely stored does it ask the metadata service to commit the new version. The commit is a single transaction that writes the version, its chunk list and an entry in the user's change journal. If the client crashes midway, no version was committed; the orphaned chunks are removed later by garbage collection, and the upload can be resumed.",
        ],
      },
      {
        heading: "8. Notifying other devices",
        content: [
          "After a commit, the user's other devices need to learn that something changed. Polling the server every few seconds from every device would be wasteful. Instead each online device keeps a long-lived connection to a notification service, using long polling or a WebSocket. When a change is committed, an event is published and the notification service tells the user's connected devices that changes are available.",
          "The notification carries no file data. On receiving it, the device asks the metadata service for all changes since its last synced cursor, downloads the chunks it lacks, and assembles the new version. A device that was offline does exactly the same when it reconnects: it presents its cursor and receives everything it missed. The per-user change journal with a monotonically increasing cursor is what makes sync reliable.",
        ],
      },
      {
        heading: "9. Conflicts",
        content: [
          "Two devices may edit the same file while one or both are offline. Both edits are based on version 5. Device A syncs first and creates version 6. When device B tries to commit, it states that its change is based on version 5, but the server's latest is now 6.",
          "The server detects this with optimistic concurrency control: a commit is accepted only if its base version equals the current latest version. Device B's commit is rejected. For ordinary files the content cannot be merged automatically, so the client keeps both: the server's version remains the main file, and device B's version is saved alongside it as a conflicted copy with the device name and date. No work is lost, and the user decides which to keep. Real-time collaborative editors solve this differently, with operational transformation or CRDTs.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Version history: older versions are just older chunk lists. Unchanged chunks are shared between versions, so history is cheap. A retention policy removes old versions and decrements chunk reference counts.",
          "Integrity: the hash of each downloaded chunk is verified, which detects corruption in storage or transit.",
          "Security: encryption in transit and at rest; downloads through short-lived signed URLs.",
          "Cost: rarely accessed chunks are moved to cheaper cold storage tiers.",
          "Client efficiency: compress chunks, limit bandwidth use, and batch many small file changes.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: durability first, efficient sync across devices, consistent metadata.",
          "Split files into chunks identified by content hash.",
          "Delta sync uploads only changed chunks; deduplication stores identical chunks once.",
          "Metadata in a transactional database, chunk data in object storage.",
          "Notify devices of changes over a long-lived connection; resolve version conflicts with conflicted copies.",
        ],
      },
    ],
    conclusion:
      "A sync service treats a file as a list of content-addressed chunks. That single idea provides resumable uploads, delta sync and deduplication. Chunk data lives in durable object storage, while a transactional metadata store records versions and a per-user change journal. Devices are notified of changes and pull what they are missing, and conflicting edits are preserved as separate copies.",
  }),
];
