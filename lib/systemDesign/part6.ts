import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_6: BlogPost[] = [
  // ───────────────────────────── DAY 26 ─────────────────────────────
  sd({
    day: 26,
    kind: "Fundamentals",
    slug: "system-design-api-design",
    title: "API Design: Resources, Status Codes, Pagination and Idempotency",
    description:
      "How to design a clean REST API: resource naming, correct use of HTTP methods and status codes, offset versus cursor pagination, idempotency keys, versioning and rate limiting.",
    tags: ["API Design", "REST", "Pagination", "Fundamentals"],
    intro: [
      "An API is the contract between a service and its clients. Once other teams or external developers build against it, changing it is expensive, so it deserves careful design at the start. In a system design interview, the API step comes right after requirements and shows whether the requirements were understood.",
      "An endpoint named /getAllOrders illustrates several common mistakes at once: a verb in the URL, no pagination, and no thought about growth. These notes cover the conventions of a well-designed REST API.",
    ],
    sections: [
      {
        heading: "Resources and HTTP methods",
        content: [
          "REST models an application as a set of resources, which are the nouns of the system: users, orders, products. Each resource has a URL. The action to perform is expressed by the HTTP method, not by the URL. This gives a uniform, predictable interface: a developer who has seen one endpoint can guess the others.",
        ],
        bullets: [
          "Use plural nouns for collections: /orders, and /orders/{id} for one item.",
          "Do not put verbs in paths. GET /orders replaces /getAllOrders; DELETE /orders/42 replaces /deleteOrder?id=42.",
          "Express relationships by nesting, one level deep: /users/42/orders.",
          "Use query parameters for filtering, sorting and field selection: /orders?status=shipped&sort=-createdAt.",
          "Be consistent in naming style, date formats (ISO 8601 in UTC) and identifiers across the whole API.",
        ],
        snippets: [
          {
            title: "Verb-style versus resource-style",
            filename: "endpoints.http",
            code: `# Avoid
GET  /getAllOrders
POST /createOrder
POST /updateOrderStatus
GET  /deleteOrder?id=42

# Prefer
GET    /v1/orders?status=shipped&limit=20     list (filtered, paginated)
POST   /v1/orders                             create
GET    /v1/orders/42                          read one
PATCH  /v1/orders/42                          partial update
PUT    /v1/orders/42                          full replacement
DELETE /v1/orders/42                          delete
GET    /v1/users/7/orders                     orders of one user
POST   /v1/orders/42/cancellation             an action modelled as a sub-resource`,
          },
        ],
      },
      {
        heading: "Method semantics: safe and idempotent",
        content: [
          "HTTP methods carry defined semantics that clients, proxies and caches rely on. A safe method does not change state. An idempotent method has the same effect whether it is called once or many times, which means it can be retried without harm.",
        ],
        snippets: [
          {
            title: "HTTP methods",
            filename: "methods.txt",
            code: `Method   Purpose                   Safe   Idempotent   Notes
--------------------------------------------------------------------------------
GET      read                      yes    yes          cacheable; never changes data
POST     create / trigger action   no     no           retry may create a duplicate
PUT      replace the resource      no     yes          same request twice = same state
PATCH    partial update            no     not always   depends on the operation
DELETE   remove                    no     yes          deleting twice leaves it deleted`,
          },
        ],
      },
      {
        heading: "Status codes",
        content: [
          "The status code tells the client the outcome without parsing the body. An API that returns 200 OK with an error message inside breaks every generic client, retry policy and monitoring tool. The first digit gives the class: 2xx success, 3xx redirection, 4xx the client made a mistake, 5xx the server failed.",
        ],
        snippets: [
          {
            title: "Status codes you should know",
            filename: "status-codes.txt",
            code: `200 OK                    success with a body
201 Created               resource created; include a Location header
202 Accepted              accepted for asynchronous processing
204 No Content            success with no body (for example after DELETE)

400 Bad Request           malformed or invalid input
401 Unauthorized          not authenticated (missing or invalid credentials)
403 Forbidden             authenticated, but not allowed
404 Not Found             resource does not exist
409 Conflict              conflicts with current state (duplicate, version mismatch)
422 Unprocessable Entity  well-formed but fails validation
429 Too Many Requests     rate limit exceeded; include Retry-After

500 Internal Server Error unexpected server fault
502 / 503 / 504           bad gateway / service unavailable / gateway timeout`,
          },
          {
            title: "A consistent error body",
            filename: "error.json",
            code: `{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be at least 1.",
    "details": [ { "field": "items[0].quantity", "issue": "min:1" } ],
    "requestId": "req_8f31c2"
  }
}`,
          },
        ],
      },
      {
        heading: "Pagination",
        content: [
          "An endpoint that returns a whole collection works with ten rows in development and fails with ten million in production: the query is slow, the response is huge, and the client cannot display it anyway. Every list endpoint must be paginated, with a default and a maximum page size.",
          "Offset pagination uses a limit and an offset: skip the first N rows and return the next 20. It is simple and allows jumping to any page. It has two problems. The database still has to read and discard all the skipped rows, so deep pages become slow. And if rows are inserted or deleted while the user is paging, items shift, and the user sees duplicates or misses items.",
          "Cursor pagination, also called keyset pagination, avoids both. The response includes a cursor that marks the position of the last item returned. The next request sends that cursor, and the query uses an indexed condition to continue from that point. Performance is constant no matter how deep the page, and results are stable when data changes. The limitations are that the client cannot jump to an arbitrary page and the sort order must be based on a unique, indexed key. For feeds, timelines and any large or frequently changing list, cursor pagination is the right choice.",
        ],
        snippets: [
          {
            title: "Offset versus cursor",
            filename: "pagination.sql",
            code: `-- OFFSET: reads and throws away 100,000 rows to return 20
SELECT * FROM orders ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100000;

-- CURSOR (keyset): jumps straight to the position using the index
SELECT * FROM orders
WHERE (created_at, id) < ('2026-11-05T10:15:00Z', 98231)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- API
-- GET /v1/orders?limit=20&cursor=eyJjIjoiMjAyNi0xMS0wNVQxMDoxNTowMFoiLCJpIjo5ODIzMX0
-- Response: { "data": [ ... ], "nextCursor": "eyJjIjoi...", "hasMore": true }
-- The cursor is an opaque, encoded value; clients must not construct it.`,
          },
        ],
      },
      {
        heading: "Idempotency for POST",
        content: [
          "A client sends POST /orders and the connection drops before the response arrives. The client cannot know whether the order was created. If it retries and the first request did succeed, there are now two orders. Since POST is not idempotent by definition, the API has to provide idempotency explicitly for any operation where a duplicate is harmful.",
          "The client generates a unique idempotency key for each logical operation and sends it in a header. The server records the key together with the response. If a request arrives with a key it has already processed, the server returns the stored response and does nothing else. Retries become safe, for both clients and intermediate services.",
        ],
        snippets: [
          {
            title: "Idempotent create",
            filename: "idempotency.http",
            code: `POST /v1/orders
Idempotency-Key: 2b6f7c1e-93a4-4f0b-8a67-51d1c2a9e0f4
Content-Type: application/json

{ "items": [ { "productId": "p_12", "quantity": 1 } ] }

-> first call : 201 Created   { "id": "o_5512", "status": "PLACED" }
-> retry      : 201 Created   { "id": "o_5512", "status": "PLACED" }   (same order, not a new one)`,
          },
        ],
      },
      {
        heading: "Versioning",
        content: [
          "APIs change. Adding an optional field or a new endpoint is backward compatible and needs no new version. Removing or renaming a field, changing a type or changing behaviour breaks existing clients, and mobile apps in particular cannot be forced to update. Breaking changes therefore go into a new version while the old one continues to work for a published deprecation period.",
          "The most common scheme puts the version in the path, such as /v1/orders. It is explicit and easy to route and debug. Alternatives are a version header or a media type parameter. Whichever is chosen, include it from the first release.",
        ],
      },
      {
        heading: "Rate limiting and security",
        content: [],
        bullets: [
          "Rate limiting protects the service from abuse and from buggy clients. Requests over the limit receive 429 with a Retry-After header, and limit headers tell clients how much quota remains.",
          "Authentication establishes who the caller is (tokens over HTTPS); authorisation checks what they may access. Check ownership on every resource: being logged in does not entitle a user to read /orders/43 if it belongs to someone else.",
          "Validate all input on the server and enforce maximum sizes for bodies and page limits.",
          "Do not expose internal details in error messages or put sensitive data in URLs, which are logged.",
        ],
      },
      {
        heading: "REST, gRPC and GraphQL",
        content: [
          "REST over JSON is the default for public and browser-facing APIs because it is simple, cacheable and universally supported. gRPC uses a binary format with strictly typed contracts and supports streaming, which makes it efficient for internal service-to-service calls. GraphQL lets the client specify exactly which fields it needs in one request, which helps when different clients need different shapes of data, at the cost of more complex caching and server-side query control. Mention the alternatives where they fit, and default to REST otherwise.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Model resources as plural nouns and use HTTP methods for actions.",
          "Return accurate status codes and a consistent error format.",
          "Paginate every list; prefer cursor pagination for large or changing data.",
          "Make unsafe operations retry-safe with idempotency keys.",
          "Version the API from day one and protect it with authentication and rate limiting.",
        ],
      },
    ],
    conclusion:
      "A good API is predictable. Resources are nouns, HTTP methods state the action, status codes state the outcome, lists are paginated with cursors, creation is made idempotent with a key, and breaking changes are isolated behind a version. These conventions let clients and infrastructure behave correctly without special knowledge of your service.",
  }),

  // ───────────────────────────── DAY 27 ─────────────────────────────
  sd({
    day: 27,
    kind: "Design",
    slug: "system-design-real-time-leaderboard",
    title: "Design a Real-Time Leaderboard With Redis Sorted Sets",
    description:
      "Why sorting the scores table on every request does not scale, how a sorted set gives rank and top-N in logarithmic time, and how to handle ties, durability and very large boards.",
    tags: ["Leaderboard", "Redis", "Sorted Set", "Real-Time"],
    intro: [
      "A leaderboard ranks players by score and shows the top players along with each player's own rank. In a real-time leaderboard the ranking reflects new scores immediately, even with millions of players whose scores change constantly.",
      "A relational query with ORDER BY score returns the correct answer, but repeating a sort over millions of rows on every request is too slow. The standard solution is a data structure that stays sorted as scores change.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: update a player's score when they earn points.",
          "Functional: show the top N players, for example the top 10 or top 100.",
          "Functional: show a given player's rank and score, and the players immediately above and below them.",
          "Functional (ask): daily, weekly and all-time boards; boards per region or among friends.",
          "Non-functional: real-time. A score change is reflected in the ranking within about a second.",
          "Non-functional: low latency for reads and writes, and no loss of scores.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 10 million daily active players, each finishing 10 games per day. That is 100 million score updates per day, about 1,000 per second on average and several thousand at peak. Leaderboard views are of a similar or higher order. One entry needs a player ID and a score; with data structure overhead, allow about 100 bytes per player. Ten million players therefore need roughly 1 GB of memory, which fits on a single node.",
        ],
      },
      {
        heading: "3. Why sorting in the database fails",
        content: [
          "With an index on the score column, the top 10 query is fast. The problems are elsewhere. Finding a player's rank means counting how many players have a higher score, which scans a large part of the index and is slow for a player in the middle of the table. Thousands of such queries per second cannot be sustained.",
          "At the same time, every score update modifies that index, so a table with a high write rate is also being scanned heavily, and reads and writes compete. Caching the top 10 helps that one query, but it does not help rank lookups, which are different for every player.",
        ],
        snippets: [
          {
            title: "Queries that become slow at scale",
            filename: "naive.sql",
            code: `-- Top 10: acceptable with an index on score
SELECT player_id, score FROM scores ORDER BY score DESC LIMIT 10;

-- Rank of one player: counts every player above them
SELECT COUNT(*) + 1 AS player_rank
FROM scores
WHERE score > (SELECT score FROM scores WHERE player_id = 42);`,
          },
        ],
      },
      {
        heading: "4. The Redis sorted set",
        content: [
          "A Redis sorted set stores unique members, each with a numeric score, and keeps them ordered by score at all times. Internally it combines a hash table, which finds a member's score in constant time, with a skip list, which maintains the order and records the span of each link so that a member's position can be computed without counting one by one.",
          "As a result, adding or updating a score, and finding a member's rank, each take O(log N) time. Reading the top K takes O(log N + K). For ten million members, log N is about 23 steps. The ordering is maintained incrementally on each write, so nothing is ever sorted at read time.",
        ],
        snippets: [
          {
            title: "Leaderboard operations",
            filename: "leaderboard.redis",
            code: `# Player 42 earns 50 points
ZINCRBY lb:global 50 player:42                    -> O(log N)

# Top 10, highest first, with scores
ZREVRANGE lb:global 0 9 WITHSCORES                -> O(log N + 10)

# Rank of player 42 (0-based, highest score = rank 0)
ZREVRANK lb:global player:42                      -> O(log N)

# Score of player 42
ZSCORE lb:global player:42                        -> O(1)

# Five players above and five below player 42 (suppose their rank is 1500)
ZREVRANGE lb:global 1495 1505 WITHSCORES`,
          },
        ],
      },
      {
        heading: "5. High-level design",
        content: [
          "Scores must not be accepted directly from the client, because a modified client could submit any value. The game server, which knows the result of the match, reports the score to a score service. The score service writes the event to a durable database and updates the sorted set. The leaderboard service reads rankings from Redis and fetches display details such as names and avatars from a profile cache.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Game server (authoritative result)
        |
        v
  Score service ------------> Scores DB (durable source of truth: score events + totals)
        |
        +--> Redis sorted sets
               lb:global
               lb:daily:2026-11-08      (EXPIRE after a few days)
               lb:weekly:2026-W45
               lb:region:in

Client --> Leaderboard service --> Redis: ZREVRANGE / ZREVRANK
                    |
                    +--> Profile cache (names, avatars for the returned player IDs)

Optional: push top-10 changes to connected clients over WebSocket`,
          },
          {
            title: "API",
            filename: "api.http",
            code: `POST /internal/v1/scores                      (called by game servers only)
Body: { "playerId": 42, "points": 50, "matchId": "m_9912" }

GET /v1/leaderboards/global?top=10
Response: { "entries": [ { "rank": 1, "playerId": 7, "name": "...", "score": 98200 }, ... ] }

GET /v1/leaderboards/global/players/42?around=5
Response: { "rank": 1501, "score": 43150, "neighbours": [ ... ] }`,
          },
        ],
      },
      {
        heading: "6. Ties",
        content: [
          "When two players have the same score, Redis orders them by member name, which is arbitrary from the players' point of view. The usual rule is that the player who reached the score first ranks higher. Since a sorted set has one numeric score per member, the tie-breaker is encoded into that number.",
          "One method is a composite score: multiply the real score by a large constant and add a term that decreases as time passes, so that an earlier achievement produces a slightly larger number. The composite must stay within the 53 bits of integer precision of a double, which limits the ranges of both parts. An alternative is to keep the plain score in Redis and resolve ties when reading, using a timestamp stored elsewhere.",
        ],
        snippets: [
          {
            title: "Composite score with a time tie-breaker",
            filename: "tiebreak.js",
            code: `const MAX_TS = 9999999999;            // seconds, far in the future

// Higher score wins; for equal scores, the earlier timestamp wins.
function compositeScore(score, achievedAtSeconds) {
  return score * 1e10 + (MAX_TS - achievedAtSeconds);
}

// score 500 at t = 1767225600  ->  5000000000000 + 8232774399
// score 500 at t = 1767225700  ->  5000000000000 + 8232774299   (ranks lower)
// Keep score * 1e10 below 2^53 (about 9.0e15), i.e. scores under ~900,000.`,
          },
        ],
      },
      {
        heading: "7. Source of truth and recovery",
        content: [
          "Redis holds data in memory. Persistence options and replicas reduce the risk of loss, but the leaderboard should be treated as a derived view, not as the system of record. Every score event is written to a durable database first. If the Redis data is lost, the sorted sets are rebuilt by replaying totals from the database.",
          "To avoid counting a match twice when a request is retried, score updates carry the match ID and are applied idempotently. A replica with automatic failover keeps the leaderboard available during a node failure.",
        ],
      },
      {
        heading: "8. Time-based boards",
        content: [
          "Daily and weekly leaderboards are separate sorted sets whose key contains the period, such as lb:daily:2026-11-08. Each score update is applied to the global set and to the sets for the current day and week. Old sets are given an expiry so that they are removed automatically. A new period starts with an empty set simply because its key does not exist yet, so no reset job is needed.",
        ],
      },
      {
        heading: "9. Scaling beyond one node",
        content: [
          "A single sorted set must live on one node, and one node handles tens of millions of members. Beyond that, or for higher throughput, the board is partitioned.",
        ],
        bullets: [
          "Natural partitions: separate boards per region, per game mode or per league. Most products need exactly these boards anyway.",
          "Sharding by score range: each shard holds one band of scores. A player's global rank is their rank within the shard plus the total number of players in all higher shards. Players move between shards as their scores change.",
          "Sharding by player ID: writes are spread evenly, and the global top N is obtained by taking the top N from each shard and merging. Exact rank requires querying every shard.",
          "Approximate rank: for players far from the top, an exact position rarely matters. A percentile computed from a histogram of score buckets ('top 12 percent') is cheap and sufficient.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: real-time updates, top N, a player's own rank, low latency.",
          "Do not sort in the database per request: rank queries are too slow.",
          "Use a Redis sorted set: increment, range and rank in O(log N).",
          "Break ties with a timestamp encoded in the score; keep a durable database as the source of truth.",
          "For very large boards, partition by region or score range, and use approximate ranks.",
        ],
      },
    ],
    conclusion:
      "A leaderboard needs a structure that remains ordered as scores change. A Redis sorted set provides updates, top-N reads and rank lookups in logarithmic time. The durable record of scores lives in a database from which the board can be rebuilt, ties are broken with a time component, periodic boards are separate keys with expiry, and very large boards are partitioned.",
  }),

  // ───────────────────────────── DAY 28 ─────────────────────────────
  sd({
    day: 28,
    kind: "Fundamentals",
    slug: "system-design-consistent-hashing",
    title: "Consistent Hashing: Adding and Removing Servers Without Moving Everything",
    description:
      "Why hash mod N remaps almost every key when the server count changes, and how a hash ring with virtual nodes limits movement to about one N-th of the keys.",
    tags: ["Consistent Hashing", "Distributed Systems", "Sharding", "Fundamentals"],
    intro: [
      "When data or requests are spread over several servers, something must decide which server is responsible for each key. The decision has to be deterministic, so that the same key always reaches the same server, and it should distribute keys evenly.",
      "The obvious formula is the hash of the key modulo the number of servers. It works well until the number of servers changes. Consistent hashing is the technique that keeps the mapping stable when servers are added or removed.",
    ],
    sections: [
      {
        heading: "The problem with hash mod N",
        content: [
          "With N servers, the formula server = hash(key) mod N distributes keys evenly and is trivial to compute. The difficulty is that the result depends on N. If a server is added or one fails, N changes, and the formula gives a different answer for most keys.",
          "Going from 4 servers to 5, a key stays on the same server only if its hash gives the same remainder for both divisors, which is true for about one key in five. Roughly 80 percent of keys are remapped. For a cache cluster this means nearly every lookup suddenly misses and the full load falls on the database. For a sharded database it means moving almost all the data. A routine operation, adding one server, becomes a system-wide disruption.",
        ],
        snippets: [
          {
            title: "Keys remapped when going from 4 to 5 servers",
            filename: "mod-n.txt",
            code: `hash(key)   mod 4   mod 5   moved?
------------------------------------
   10         2       0     yes
   11         3       1     yes
   12         0       2     yes
   13         1       3     yes
   14         2       4     yes
   15         3       0     yes
   16         0       1     yes
   17         1       2     yes
   18         2       3     yes
   19         3       4     yes
   20         0       0     no
   21         1       1     no

Only hashes whose remainders happen to match stay in place:
about 1 in 5. Around 80% of all keys move.`,
          },
        ],
      },
      {
        heading: "The hash ring",
        content: [
          "Consistent hashing removes N from the formula. Picture the output range of the hash function, for example 0 to 2^32 - 1, bent into a circle so that the largest value is followed by zero. This circle is the hash ring.",
          "Each server is placed on the ring at the position given by hashing its identifier, such as its name or address. Each key is placed on the ring by hashing the key with the same function. The rule for ownership is: from the key's position, move clockwise until the first server is reached. That server owns the key. Each server is thus responsible for the arc of the ring between the previous server and itself.",
        ],
        snippets: [
          {
            title: "Keys and servers on a ring",
            filename: "ring.txt",
            code: `                     0 / 2^32
                        |
               k4 .     |     . S1 (pos 12)
                         \\   /
        S4 (pos 88) ------+------ k1 (pos 20)
                         /   \\
               k3 .     |     . S2 (pos 37)
                        |
                    S3 (pos 61)

 Ownership (first server clockwise from the key):
   k1 (20) -> S2 (37)        k3 (70) -> S4 (88)
   k2 (45) -> S3 (61)        k4 (95) -> S1 (12, wraps around past zero)`,
          },
        ],
      },
      {
        heading: "Adding and removing a server",
        content: [
          "Suppose a new server S5 is added at a position between S2 and S3. The only keys affected are those between S2 and S5: they used to travel clockwise to S3 and now stop at S5. Every other key still reaches the same server as before.",
          "Suppose S2 is removed. The keys it owned continue clockwise to the next server, S3. No other keys are affected. In both cases, the keys that move are those of a single arc. With N servers, that is on average K/N of the K keys, compared with nearly all of them under hash mod N. This is the minimal possible disruption: only the data that must move to or from the changed server moves.",
        ],
      },
      {
        heading: "The problem of uneven distribution",
        content: [
          "With only one position per server, the arcs are not equal. Hash positions are effectively random, so one server may own a long arc and receive far more keys than another. Removal makes it worse: when a server leaves, its entire load is added to the next server clockwise, which may then be overloaded and fail, passing an even larger load to its neighbour. This chain reaction is a cascading failure.",
        ],
      },
      {
        heading: "Virtual nodes",
        content: [
          "The solution is to place each physical server on the ring many times. Each placement is a virtual node, created by hashing the server's name with a different suffix: S1#1, S1#2, up to S1#200. A server then owns many small arcs scattered around the ring instead of one large arc.",
          "With a hundred or more virtual nodes per server, the total share of each server averages out and the distribution becomes close to even. When a server is removed, its many small arcs are inherited by many different servers, so the extra load is spread across the cluster and no single neighbour is overwhelmed. When a server is added, it takes a little from each existing server.",
          "Virtual nodes also provide weighting. A machine with twice the capacity is given twice as many virtual nodes and so receives about twice the keys. This handles clusters with mixed hardware.",
        ],
      },
      {
        heading: "Implementation",
        content: [
          "The ring is stored as a sorted collection of virtual node positions, each mapped to its physical server. To find the owner of a key, hash the key and binary-search for the first position greater than or equal to it, wrapping to the first entry if none is found. A lookup costs O(log V) where V is the total number of virtual nodes, and the structure occupies a small amount of memory.",
        ],
        snippets: [
          {
            title: "A consistent hash ring with virtual nodes",
            filename: "hashRing.js",
            code: `const crypto = require("crypto");

function hash(str) {
  // first 4 bytes of MD5 as an unsigned 32-bit integer
  return crypto.createHash("md5").update(str).digest().readUInt32BE(0);
}

class HashRing {
  constructor(virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
    this.ring = [];            // sorted array of { pos, node }
  }

  addNode(node, weight = 1) {
    for (let i = 0; i < this.virtualNodes * weight; i++) {
      this.ring.push({ pos: hash(node + "#" + i), node });
    }
    this.ring.sort((a, b) => a.pos - b.pos);
  }

  removeNode(node) {
    this.ring = this.ring.filter((entry) => entry.node !== node);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const h = hash(key);
    let lo = 0, hi = this.ring.length;          // binary search: first pos >= h
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].pos < h) lo = mid + 1; else hi = mid;
    }
    return this.ring[lo % this.ring.length].node; // wrap around the ring
  }
}

const ring = new HashRing();
["cache-a", "cache-b", "cache-c"].forEach((n) => ring.addNode(n));
ring.getNode("user:42");   // always the same node until the ring changes`,
          },
        ],
      },
      {
        heading: "Replication on the ring",
        content: [
          "The ring also gives a simple rule for placing replicas. To store R copies of a key, continue clockwise from the key's position and choose the next R distinct physical servers, skipping virtual nodes that belong to a server already selected. This ordered list of servers is sometimes called the preference list. If the first server is down, the request goes to the next one in the list.",
        ],
      },
      {
        heading: "Where it is used",
        content: [],
        bullets: [
          "Distributed caches: client libraries choose the cache node for a key, so that adding or losing a node invalidates only a fraction of the cache.",
          "Distributed databases in the Dynamo family, such as Cassandra and DynamoDB, partition and replicate data around a ring.",
          "Load balancers: route a given user or session to the same backend, with minimal reassignment when backends change.",
          "CDNs and object stores: decide which server holds which object.",
          "Sharded services in general, whenever the set of shards is expected to change.",
        ],
      },
      {
        heading: "Limitations and alternatives",
        content: [],
        bullets: [
          "Consistent hashing balances the number of keys, not the traffic. A single extremely popular key still lands on one server and must be handled separately, for example by replication or caching.",
          "When a node joins, the affected data still has to be copied to it, and this must be done without disrupting service.",
          "All clients must share the same view of the ring; membership is distributed by a coordination service or a gossip protocol.",
          "Fixed hash slots are a related approach: Redis Cluster divides the key space into 16,384 slots and assigns slots to nodes, moving slots when the cluster changes.",
          "Rendezvous hashing and jump consistent hashing achieve similar goals with different trade-offs.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "hash(key) mod N remaps almost all keys when N changes.",
          "Consistent hashing places servers and keys on a ring; a key belongs to the first server clockwise.",
          "Adding or removing a server moves only about K/N keys.",
          "Virtual nodes even out the distribution, spread load on failure and allow weighting.",
          "Used in distributed caches, Dynamo-style databases and load balancers.",
        ],
      },
    ],
    conclusion:
      "Modulo hashing ties every key's location to the number of servers, so any change in that number moves nearly everything. Consistent hashing maps servers and keys onto a ring, which confines the effect of a change to one arc and about one N-th of the keys. Virtual nodes make the distribution even and prevent a failed server's load from falling on a single neighbour.",
  }),

  // ───────────────────────────── DAY 29 ─────────────────────────────
  sd({
    day: 29,
    kind: "Low-Level Design",
    slug: "low-level-design-parking-lot",
    title: "Low-Level Design: Parking Lot",
    description:
      "A complete object-oriented design: requirements, entities and relationships, strategy pattern for spot assignment and pricing, the open-closed principle and thread-safe spot allocation.",
    tags: ["Low-Level Design", "OOP", "Design Patterns", "Concurrency"],
    intro: [
      "Low-level design (LLD), also called object-oriented design, is about the structure of the code inside one application: which classes exist, what each is responsible for, how they relate, and how the design accommodates change. The parking lot is the most common LLD question.",
      "High-level design asks which services and databases to use. Low-level design asks which classes and interfaces to write. Writing code immediately skips the part that is being assessed. The approach in these notes is: requirements, entities, relationships, design patterns, then code for the core flows.",
    ],
    sections: [
      {
        heading: "1. Requirements and assumptions",
        content: [
          "As with high-level design, the first step is to fix the scope. The following is a reasonable set of requirements; each one should be confirmed, since they affect the class design.",
        ],
        bullets: [
          "The parking lot has multiple floors, and each floor has many spots.",
          "Spot types: motorcycle, compact (car) and large (truck). Vehicle types: motorcycle, car and truck. A vehicle parks in a spot of a suitable type.",
          "There are multiple entry and exit gates.",
          "On entry, a spot is assigned and a ticket is issued. On exit, the fee is calculated from the duration and vehicle type, payment is taken, and the spot is freed.",
          "If no suitable spot is available, entry is refused.",
          "The design should allow new vehicle types, pricing rules and payment methods to be added easily.",
          "Out of scope unless asked: reservations in advance, electric charging, monthly passes.",
        ],
      },
      {
        heading: "2. Identify the entities",
        content: [
          "Read the requirements and pick out the nouns; they become candidate classes. The verbs become methods. Each class should have one clear responsibility.",
        ],
        bullets: [
          "Vehicle: licence number and type. Subtypes or an enum for Motorcycle, Car, Truck.",
          "ParkingSpot: identifier, type, floor, and whether it is occupied and by which vehicle.",
          "ParkingFloor: a collection of spots; can report free spots by type.",
          "Ticket: identifier, vehicle, spot, entry time, exit time, status.",
          "ParkingLot: the facade that owns the floors and offers the park and unpark operations.",
          "EntryGate and ExitGate: where vehicles interact with the system.",
          "SpotAssignmentStrategy: decides which free spot a vehicle receives.",
          "PricingStrategy: calculates the fee for a ticket.",
          "Payment: amount, method and status.",
        ],
      },
      {
        heading: "3. Relationships",
        content: [
          "State how the classes are connected, because the type of relationship determines ownership and lifetime. Composition means the part cannot exist without the whole. Association means one object refers to another that exists independently.",
        ],
        snippets: [
          {
            title: "Class relationships",
            filename: "class-diagram.txt",
            code: `ParkingLot  1 ----<> *  ParkingFloor  1 ----<> *  ParkingSpot       (composition)
ParkingLot  ----------> SpotAssignmentStrategy   <<interface>>     (uses)
ParkingLot  ----------> PricingStrategy          <<interface>>     (uses)

Ticket  ---> Vehicle        (association: which vehicle)
Ticket  ---> ParkingSpot    (association: which spot)
Ticket  ---> Payment        (0..1, created at exit)

Vehicle  <|-- Motorcycle | Car | Truck                             (inheritance)

SpotAssignmentStrategy  <|.. NearestSpotStrategy | LowestFloorStrategy
PricingStrategy         <|.. HourlyPricing | FlatRatePricing | WeekendPricing
PaymentMethod           <|.. CashPayment | CardPayment | UpiPayment`,
          },
        ],
      },
      {
        heading: "4. Enums and core entities",
        content: [
          "The basic types come first. Which spot types can hold which vehicle types is kept as data in one place, so that the rule can change without editing the classes that use it.",
        ],
        snippets: [
          {
            title: "Types and entities",
            filename: "entities.ts",
            code: `enum VehicleType { MOTORCYCLE, CAR, TRUCK }
enum SpotType    { MOTORCYCLE, COMPACT, LARGE }
enum TicketStatus { ACTIVE, PAID }

// Which spot types can hold which vehicle, in order of preference
const ALLOWED_SPOTS: Record<VehicleType, SpotType[]> = {
  [VehicleType.MOTORCYCLE]: [SpotType.MOTORCYCLE, SpotType.COMPACT],
  [VehicleType.CAR]:        [SpotType.COMPACT, SpotType.LARGE],
  [VehicleType.TRUCK]:      [SpotType.LARGE],
};

class Vehicle {
  constructor(readonly licenceNumber: string, readonly type: VehicleType) {}
}

class ParkingSpot {
  private vehicle: Vehicle | null = null;

  constructor(readonly id: string, readonly floor: number, readonly type: SpotType) {}

  isFree(): boolean { return this.vehicle === null; }

  // Returns false if another vehicle took the spot first
  tryOccupy(vehicle: Vehicle): boolean {
    if (this.vehicle !== null) return false;
    this.vehicle = vehicle;
    return true;
  }

  release(): void { this.vehicle = null; }
}

class Ticket {
  exitTime: Date | null = null;
  status = TicketStatus.ACTIVE;

  constructor(
    readonly id: string,
    readonly vehicle: Vehicle,
    readonly spot: ParkingSpot,
    readonly entryTime: Date,
  ) {}
}`,
          },
        ],
      },
      {
        heading: "5. The strategy pattern",
        content: [
          "Two parts of the system are certain to change: how a spot is chosen and how the fee is calculated. One operator wants the spot nearest to the entrance; another wants to fill the lowest floors first. Pricing may be hourly today, with a weekend rate or a daily cap tomorrow.",
          "If these rules were written as if-else blocks inside ParkingLot, every new rule would require modifying and retesting that class. The strategy pattern avoids this. Each family of algorithms is defined behind an interface, each variant is a separate class implementing that interface, and ParkingLot holds a reference to the interface without knowing which variant it has. Changing the behaviour means supplying a different object.",
        ],
        snippets: [
          {
            title: "Strategies for spot assignment and pricing",
            filename: "strategies.ts",
            code: `interface SpotAssignmentStrategy {
  findSpot(floors: ParkingFloor[], vehicle: Vehicle): ParkingSpot | null;
}

class LowestFloorStrategy implements SpotAssignmentStrategy {
  findSpot(floors: ParkingFloor[], vehicle: Vehicle): ParkingSpot | null {
    for (const type of ALLOWED_SPOTS[vehicle.type]) {
      for (const floor of floors) {
        const spot = floor.firstFreeSpot(type);
        if (spot) return spot;
      }
    }
    return null;
  }
}

interface PricingStrategy {
  calculate(ticket: Ticket, exitTime: Date): number;
}

class HourlyPricing implements PricingStrategy {
  constructor(private ratePerHour: Record<VehicleType, number>) {}

  calculate(ticket: Ticket, exitTime: Date): number {
    const ms = exitTime.getTime() - ticket.entryTime.getTime();
    const hours = Math.max(1, Math.ceil(ms / 3_600_000)); // minimum one hour
    return hours * this.ratePerHour[ticket.vehicle.type];
  }
}

// A new rule is a new class. Existing classes are not modified.
class FlatRatePricing implements PricingStrategy {
  constructor(private flatFee: number) {}
  calculate(): number { return this.flatFee; }
}`,
          },
        ],
      },
      {
        heading: "6. The open-closed principle",
        content: [
          "The benefit of the strategy pattern is described by the open-closed principle, the O in SOLID: software entities should be open for extension and closed for modification. A new pricing rule or a new assignment policy is added by writing a new class. The ParkingLot class, which is already tested and working, is not touched.",
          "The same reasoning applies to vehicle types. Because the compatibility between vehicles and spots is a table, supporting an electric vehicle or a bus means adding entries, not rewriting conditionals spread across the code. The other SOLID principles are visible too: each class has a single responsibility, and ParkingLot depends on interfaces, not on concrete implementations (dependency inversion).",
        ],
      },
      {
        heading: "7. The core flows",
        content: [
          "ParkingLot is a facade: gates call two simple methods and do not need to know about floors, strategies or tickets. Parking finds a spot, occupies it and issues a ticket. Unparking calculates the fee, takes payment, frees the spot and closes the ticket.",
        ],
        snippets: [
          {
            title: "ParkingLot",
            filename: "ParkingLot.ts",
            code: `class ParkingFloor {
  constructor(readonly level: number, private spots: ParkingSpot[]) {}

  firstFreeSpot(type: SpotType): ParkingSpot | null {
    return this.spots.find((s) => s.type === type && s.isFree()) ?? null;
  }
}

class ParkingLot {
  private activeTickets = new Map<string, Ticket>();

  constructor(
    private floors: ParkingFloor[],
    private assignment: SpotAssignmentStrategy,
    private pricing: PricingStrategy,
  ) {}

  park(vehicle: Vehicle): Ticket {
    // Retry: another gate may take the chosen spot between find and occupy
    for (let attempt = 0; attempt < 3; attempt++) {
      const spot = this.assignment.findSpot(this.floors, vehicle);
      if (!spot) throw new Error("Parking lot is full for this vehicle type");

      if (spot.tryOccupy(vehicle)) {
        const ticket = new Ticket(crypto.randomUUID(), vehicle, spot, new Date());
        this.activeTickets.set(ticket.id, ticket);
        return ticket;
      }
    }
    throw new Error("Could not assign a spot, please retry");
  }

  unpark(ticketId: string, payment: PaymentMethod): number {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) throw new Error("Invalid or already used ticket");

    const exitTime = new Date();
    const fee = this.pricing.calculate(ticket, exitTime);
    payment.pay(fee);                      // throws if the payment fails

    ticket.exitTime = exitTime;
    ticket.status = TicketStatus.PAID;
    ticket.spot.release();
    this.activeTickets.delete(ticketId);
    return fee;
  }
}

interface PaymentMethod { pay(amount: number): void; }`,
          },
        ],
      },
      {
        heading: "8. Concurrency: two gates, one spot",
        content: [
          "With several entry gates, two vehicles can arrive at the same moment. Both gates ask for a free spot, both find spot A-12 free, and both assign it. Two tickets now point to one spot. This is the same check-then-act race condition seen in the flash sale and cab booking designs.",
          "The check and the update must be atomic. In the code above, tryOccupy does both in one step and reports whether it succeeded, and park retries with another spot if it lost the race. In a multithreaded language, tryOccupy must be protected with a lock on the spot or implemented with an atomic compare-and-set, so that exactly one thread succeeds. Locking a single spot is preferable to locking the entire parking lot, which would force all gates to wait for each other.",
          "If the system runs on several servers with a shared database, the same guarantee is obtained with a conditional update that occupies the spot only if it is still free, or with a row lock inside a transaction.",
        ],
        snippets: [
          {
            title: "Atomic spot allocation",
            filename: "locking.txt",
            code: `// In-process (Java-style): per-spot lock or compare-and-set
class ParkingSpot {
    private final AtomicReference<Vehicle> vehicle = new AtomicReference<>(null);

    boolean tryOccupy(Vehicle v) {
        return vehicle.compareAndSet(null, v);   // only one thread can succeed
    }
}

-- Shared database: conditional update, then check affected rows
UPDATE parking_spots
SET    occupied_by = :licence
WHERE  id = :spotId AND occupied_by IS NULL;
-- 1 row  -> the spot is yours        0 rows -> someone else took it, pick another`,
          },
        ],
      },
      {
        heading: "9. Singleton versus dependency injection",
        content: [
          "There is one parking lot, so it is common to implement ParkingLot as a singleton: a class with a private constructor and a static method that returns the only instance. This guarantees one shared state for all gates.",
          "The singleton has drawbacks. It is global state, its dependencies are hidden inside it, and it is difficult to replace in a unit test. The alternative is dependency injection: create one ParkingLot object when the application starts and pass it to the gates through their constructors. There is still exactly one instance, but it is created and supplied explicitly, and tests can construct a small parking lot with fake strategies. Mentioning the singleton and then explaining why injection is preferable demonstrates judgement about patterns, not just knowledge of them.",
        ],
      },
      {
        heading: "10. Extending the design",
        content: [],
        bullets: [
          "New vehicle type: add an enum value and a row in the compatibility table.",
          "New pricing rule: a new PricingStrategy implementation, chosen through configuration.",
          "New payment method: a new PaymentMethod implementation.",
          "Display boards showing free spots per floor: the observer pattern, where floors notify displays when a spot changes state.",
          "Faster spot lookup: keep a set or min-heap of free spots per type per floor, so finding a spot does not scan all spots.",
          "Persistence: repository interfaces for tickets and spots, so the storage can be swapped without changing the domain classes.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Start with requirements and assumptions, not code.",
          "Identify entities: ParkingLot, ParkingFloor, ParkingSpot, Vehicle, Ticket, Payment, and their relationships.",
          "Use the strategy pattern for spot assignment and pricing.",
          "Follow the open-closed principle: new behaviour is a new class.",
          "Make spot allocation atomic for concurrent gates, and prefer dependency injection to a singleton.",
        ],
      },
    ],
    conclusion:
      "A low-level design is judged on structure. Fix the requirements, derive the entities and their relationships, isolate the parts that will change behind interfaces with the strategy pattern, and make spot allocation atomic so that concurrent gates cannot assign the same spot. The resulting design accepts new vehicle types, pricing rules and payment methods without changes to the classes that already work.",
  }),

  // ───────────────────────────── DAY 30 ─────────────────────────────
  sd({
    day: 30,
    kind: "Fundamentals",
    slug: "system-design-interview-framework",
    title: "The Complete System Design Interview Framework",
    description:
      "A step-by-step structure for any system design question: requirements, estimation, API, data model, high-level design, deep dives and trade-offs, with a time plan and a reference of building blocks.",
    tags: ["Interview", "Framework", "Fundamentals", "Trade-offs"],
    intro: [
      "The previous twenty-nine articles in this series covered individual systems and concepts. This final article puts them into a single structure that can be applied to any system design question, including ones you have never seen.",
      "A system design interview is not a test of whether you reach one correct architecture; there is none. It evaluates how you reason: whether you clarify the problem, make sensible assumptions, compare options and explain your decisions. The most common way to fail is poor time management, such as spending thirty minutes on a detailed database schema and never reaching the overall design. A framework prevents that.",
    ],
    sections: [
      {
        heading: "The framework at a glance",
        content: [
          "For a 45-minute interview, the following allocation works well. The exact minutes are a guide; the order matters more.",
        ],
        snippets: [
          {
            title: "Time plan",
            filename: "framework.txt",
            code: `Step  What                                   Time      Output
---------------------------------------------------------------------------------
1     Requirements (functional, non-func.)   ~5 min    agreed feature list, scope, constraints
2     Estimation                             ~3 min    QPS, storage, read/write ratio
3     API design                             ~4 min    3-5 core endpoints
4     Data model                             ~4 min    main entities, keys, database choice
5     High-level design                      ~10 min   diagram covering every requirement
6     Deep dives                             ~12 min   2-3 hard problems solved in detail
7     Trade-offs, bottlenecks, wrap-up       ~5 min    failure handling, limits, summary`,
          },
        ],
      },
      {
        heading: "Step 1: Requirements",
        content: [
          "Begin by asking questions. List the functional requirements, meaning the three or four core features, and propose what to leave out of scope. Then establish the non-functional requirements: the number of users, the expected latency, the availability target, whether consistency or availability is more important, and whether data loss is tolerable.",
          "Finish this step by stating the summary aloud and getting agreement. Everything that follows will be justified by reference to these requirements. Day 4 of this series covers this step in detail.",
        ],
      },
      {
        heading: "Step 2: Estimation",
        content: [
          "Turn the requirements into approximate numbers: requests per second for reads and writes, storage per year, and bandwidth if media is involved. Use round numbers and say each assumption. The goal is to learn the scale and the read-to-write ratio, and to draw a conclusion from them, such as 'this is read-heavy at about 10,000 requests per second, so caching and replicas will be central'. Keep it to a few minutes. Day 10 covers the method.",
        ],
      },
      {
        heading: "Step 3: API design",
        content: [
          "Define the main endpoints: the method, the path, the important request fields and the response. Three to five endpoints are enough. This step makes the functional requirements concrete and often reveals questions that were missed, for example whether a list needs pagination or whether a create operation must be idempotent. Day 26 covers API conventions.",
        ],
      },
      {
        heading: "Step 4: Data model",
        content: [
          "List the main entities, their key fields and how they relate. Identify the primary access patterns, meaning the queries that will run most often, and choose the type of database for each kind of data with a reason: relational where transactions and relationships matter, a key-value or wide-column store for simple high-volume access, object storage for large files. Mention the partition key if the data will be sharded.",
          "Keep this at the right level of detail. The entities, keys and database choice are needed; every column and index is not. Spending the interview on an exhaustive schema is the classic time-management mistake.",
        ],
      },
      {
        heading: "Step 5: High-level design",
        content: [
          "Draw the end-to-end architecture: clients, load balancer or API gateway, application services, databases, caches, queues, and external systems. Start with the simplest design that satisfies the functional requirements, then walk through each core use case from the client to the data store and back, explaining what each component does.",
          "Make sure every functional requirement from step 1 is covered by the diagram before going deeper. A complete simple design is worth more than a partial sophisticated one. Then improve it where the non-functional requirements demand: add a cache for read load, a queue for slow or spiky work, replicas for availability.",
        ],
        snippets: [
          {
            title: "A generic starting architecture",
            filename: "architecture.txt",
            code: `Clients (web / mobile)
      |
     CDN  (static content, media)
      |
Load balancer / API gateway  (TLS, auth, rate limiting)
      |
Stateless application services  ---->  Cache (Redis)
      |               |
      |               +--> Message queue --> Workers (async jobs, notifications, fan-out)
      v
Primary database (leader) --> Read replicas          Object storage (files, images, video)
      |
   Shards (when one database is not enough)

Around everything: monitoring, logging, alerting`,
          },
        ],
      },
      {
        heading: "Step 6: Deep dives",
        content: [
          "This is where most of the evaluation happens. Choose the two or three hardest parts of the system and examine them in detail. Often the interviewer will direct you; if not, propose the areas yourself. The hard part is usually different for each system, which is what the design articles in this series were about.",
        ],
        bullets: [
          "URL shortener: unique ID generation without collisions.",
          "News feed: fan-out and the celebrity problem.",
          "Chat: message delivery, ordering and offline users.",
          "Flash sale and cab booking: race conditions and atomic operations.",
          "Payments: idempotency, uncertain states and reconciliation.",
          "Video streaming: transcoding, chunking and CDN delivery.",
          "Any system: what happens when a component fails, and what happens at ten times the load.",
        ],
      },
      {
        heading: "Step 7: Trade-offs, bottlenecks and wrap-up",
        content: [
          "Close by reviewing the design critically. Identify single points of failure and how each is removed. Name the bottleneck that would appear first as traffic grows. State the main trade-offs you made, for example accepting eventual consistency in the feed in exchange for speed and availability. Mention monitoring: which metrics and alerts would show that the system is healthy. If time remains, say what you would add next. Then summarise the design in three or four sentences.",
        ],
      },
      {
        heading: "Think aloud",
        content: [
          "The interviewer can evaluate only what is said. Silent thinking followed by a finished diagram hides the reasoning, which is the thing being assessed. Explain what you are considering, which options exist and why you choose one.",
          "A useful habit is to attach 'because' to every decision. Not 'I will use Redis', but 'I will use Redis here because the feed is read a hundred times more often than it is written and we need responses under 200 milliseconds'. Not 'I will use Kafka', but 'I will put a queue here because sending the notification is slow and should not delay the response'. A decision without a reason is a guess; a decision with a reason linked to a requirement is engineering.",
        ],
      },
      {
        heading: "When the requirements change",
        content: [
          "Interviewers often change the problem midway: the traffic is now ten times higher, or the system must work across regions, or a new feature is required. This is not a sign that your design was wrong. It tests whether you can adapt.",
          "Respond by identifying which part of the design is affected and what breaks first under the new condition, then adjust that part. If traffic grows tenfold, which component saturates first: the database writes, the cache memory, a single queue partition? Address that component and explain the consequence. Avoid starting again from the beginning, and avoid defending the original design as if it must not change.",
        ],
      },
      {
        heading: "A reference of building blocks",
        content: [
          "Most designs are assembled from the same components. Knowing which problem each one solves makes it quick to choose.",
        ],
        snippets: [
          {
            title: "Problem to building block",
            filename: "toolbox.txt",
            code: `Problem                                    Building block
-------------------------------------------------------------------------------
One server is not enough                   horizontal scaling + load balancer
Read-heavy, repeated reads                 cache, read replicas, CDN
Write-heavy, bursts                        message queue, batching, LSM-based store
Too much data for one database             sharding, consistent hashing
Slow work inside a request                 asynchronous processing with workers
Users far from the servers                 CDN, multi-region deployment
Large files                                object storage + CDN, chunked upload
Server must push to client                 WebSocket or Server-Sent Events
Concurrent updates to one resource         atomic operation, lock with TTL, transaction
Retries and duplicates                     idempotency keys, deduplication
Component failure                          replication, failover, health checks
Abuse or overload                          rate limiting, backpressure, circuit breaker
Nearby search                              geohash or quadtree
Prefix search                              trie with precomputed results
Ranking by score                           sorted set
Unique IDs across servers                  Snowflake-style ID generator
Transaction across services                saga with compensating actions`,
          },
        ],
      },
      {
        heading: "Common mistakes",
        content: [],
        bullets: [
          "Starting to design without asking about requirements.",
          "Going deep on one area, such as the database schema, before the whole system is outlined.",
          "Naming technologies without giving a reason for them.",
          "Designing for extreme scale that the requirements never asked for.",
          "Ignoring failures: no mention of what happens when a server, cache or database is down.",
          "Working in silence, or not listening to the interviewer's hints.",
          "Presenting a design as perfect instead of acknowledging its trade-offs.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements first: features, scale, consistency versus availability, scope.",
          "Estimate briefly to find the scale and the read-to-write ratio.",
          "Define the API and the data model at the right level of detail.",
          "Draw a complete high-level design before going deep.",
          "Deep dive into two or three hard problems, then close with trade-offs and failure handling.",
          "Think aloud, and give a 'because' for every decision.",
        ],
      },
    ],
    conclusion:
      "Every system design answer follows the same path: requirements, estimation, API, data model, high-level design, deep dives and trade-offs. Manage the time so that the whole system is covered before any one part is explored in depth, explain the reasoning behind each choice, and treat changed requirements as a prompt to adapt. With this structure and the building blocks from this series, an unfamiliar question becomes a matter of applying known ideas in a clear order.",
  }),
];
