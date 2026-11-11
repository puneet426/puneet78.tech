import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_3: BlogPost[] = [
  // ───────────────────────────── DAY 11 ─────────────────────────────
  sd({
    day: 11,
    kind: "Design",
    slug: "system-design-search-autocomplete",
    title: "Design Search Autocomplete: Tries, Top-K and Offline Updates",
    description:
      "How suggestions appear within milliseconds of each keystroke: a trie with precomputed top results per node, built offline from search logs and served from cache.",
    tags: ["Autocomplete", "Trie", "Search", "Caching"],
    intro: [
      "Search autocomplete, also called typeahead, suggests complete queries while the user is still typing. After two or three letters the most popular matching searches are already displayed.",
      "A SQL query with LIKE 'prefix%' on a table of past searches gives the right result on a small dataset, but it cannot meet the latency requirement at scale. These notes describe the data structure and the pipeline that make autocomplete fast.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: for a typed prefix, return the top 5 suggestions ordered by popularity.",
          "Non-functional: very low latency. Suggestions must feel instant, so the budget is roughly 100 ms end to end, which leaves only a few milliseconds for the lookup itself.",
          "Non-functional: high availability. If autocomplete is down, search must still work.",
          "Freshness: suggestions do not need to reflect searches made a second ago. Updating every few hours is acceptable (ask whether trending queries need faster updates).",
          "Workload: extremely read-heavy. Every keystroke is a read; the dataset changes slowly.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 10 million daily active users, 10 searches each, and about 10 keystrokes per search that could each trigger a request. That is 1 billion requests per day, or about 10,000 per second on average and 30,000 at peak. The traffic is higher than the search traffic itself, which is why reducing requests on the client and caching aggressively are part of the design.",
        ],
      },
      {
        heading: "3. Why a LIKE query is not enough",
        content: [
          "A prefix query can use a B-tree index, but the database still has to find every row that starts with the prefix and then sort them by popularity. For a short prefix such as 'i' that may be millions of rows. Doing this on every keystroke for thousands of requests per second is far too slow and too expensive.",
        ],
      },
      {
        heading: "4. The trie",
        content: [
          "A trie, or prefix tree, stores strings character by character. The root is empty. Each edge adds one character, so the node reached by following 'i', 'p', 'l' represents the prefix 'ipl'. All queries that share a prefix share the same path. Finding the node for a prefix of length L takes L steps, no matter how many queries are stored.",
          "Reaching the node is fast, but collecting suggestions is not. Under the node for 'i' there may be millions of complete queries. Walking the entire subtree to find the five most popular ones is again too slow.",
        ],
      },
      {
        heading: "5. Precomputing the top K at every node",
        content: [
          "The key optimisation is to store, at each node, the top 5 suggestions for that prefix. The work of ranking is done when the trie is built, not when it is queried. A lookup becomes: walk down L nodes, return the list stored there. That is a few memory accesses.",
          "This uses more memory, since each node carries a small list, and it makes updates more expensive, since changing one query's popularity may affect the lists of all its prefixes. Both costs are acceptable because the system is read-heavy and updates are done in bulk.",
        ],
        snippets: [
          {
            title: "Trie node with cached top suggestions",
            filename: "trie.js",
            code: `class TrieNode {
  constructor() {
    this.children = new Map(); // char -> TrieNode
    this.top = [];             // precomputed: [{ query, score }], max 5
  }
}

function suggest(root, prefix) {
  let node = root;
  for (const ch of prefix) {
    node = node.children.get(ch);
    if (!node) return [];      // no query starts with this prefix
  }
  return node.top;             // O(length of prefix), no subtree scan
}`,
          },
        ],
      },
      {
        heading: "6. Where popularity comes from",
        content: [
          "Popularity is derived from search logs. Every completed search is written to a log stream. Updating the trie on every search would mean a write for every query and constant changes to a structure that is being read at high volume.",
          "Instead, the logs are processed offline. A batch job aggregates the logs every few hours and produces a table of query and frequency, usually with more weight given to recent days so that old trends fade. From that table a new trie is built, and the serving machines switch from the old version to the new one atomically. The serving path never modifies the trie, which keeps it simple and fast.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `SERVING PATH (online, read-only)
 Browser --debounce--> CDN / edge cache --> Autocomplete service --> In-memory trie
                                                   |                 (replicated, sharded)
                                                   +--> Redis: prefix -> top 5 (hot prefixes)

BUILD PATH (offline, every few hours)
 Search service --> Search logs (Kafka) --> Aggregation job --> query frequency table
                                                                     |
                                                                     v
                                                  Trie builder --> trie snapshot (object storage)
                                                                     |
                                                                     v
                                                  Serving nodes load the new snapshot and swap`,
          },
        ],
      },
      {
        heading: "7. Reducing the number of requests",
        content: [
          "Sending a request on every keystroke is wasteful, because a user typing quickly does not read suggestions for intermediate prefixes. The client applies debouncing: it waits until the user has paused for a short interval, for example 150 ms, before sending a request. Any request still in flight for an older prefix is cancelled or ignored.",
          "The client also caches results for the session, so deleting a character shows the previous suggestions without a network call.",
        ],
        snippets: [
          {
            title: "Client-side debounce",
            filename: "debounce.js",
            code: `function debounce(fn, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

const fetchSuggestions = debounce(async (prefix) => {
  const res = await fetch("/api/v1/suggest?q=" + encodeURIComponent(prefix));
  render(await res.json());
}, 150);

input.addEventListener("input", (e) => fetchSuggestions(e.target.value));`,
          },
        ],
      },
      {
        heading: "8. Caching",
        content: [
          "Autocomplete results are the same for everyone (ignoring personalisation) and change only when the trie is rebuilt. That makes them ideal for caching. Responses for a prefix carry a Cache-Control header so that the browser and the CDN can serve them. Short, popular prefixes receive most of the traffic and are answered at the edge without reaching the service at all.",
        ],
      },
      {
        heading: "9. Scaling the trie",
        content: [
          "The trie is replicated across several servers for availability and read throughput. If it does not fit in the memory of one machine, it is sharded by prefix: for example, queries starting with a to m on one group of servers and n to z on another.",
          "A naive alphabetical split is uneven, because far more queries begin with 's' than with 'x'. The shard boundaries should be chosen from the observed distribution of queries, and a small mapping service records which shard owns which prefix range so that boundaries can be adjusted.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Trending queries: a separate streaming job can compute a small set of rapidly rising queries and merge them into results, without waiting for the batch rebuild.",
          "Typos: handled by a separate spelling-correction or fuzzy-matching component; a plain trie matches exact prefixes only.",
          "Filtering: offensive or unsafe suggestions are removed with a blocklist when the trie is built.",
          "Personalisation: the user's own recent searches are kept on the client or in a small per-user store and merged in front of the global results.",
          "Alternative: a search engine with completion suggesters, or precomputed prefix-to-results entries in a key-value store, follow the same principle of precomputation.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: top 5 by popularity, very low latency, read-heavy.",
          "Data structure: a trie with the top 5 precomputed at every node.",
          "Updates: offline aggregation of search logs, periodic rebuild and atomic swap.",
          "Traffic reduction: client-side debouncing, browser and CDN caching of popular prefixes.",
          "Scale: replicate the trie and shard it by prefix according to the real distribution.",
        ],
      },
    ],
    conclusion:
      "Autocomplete is fast because nothing is computed at query time. A trie finds the prefix in a few steps, each node already holds its top suggestions, popularity is calculated offline from logs, and debouncing and caching keep most requests away from the servers.",
  }),

  // ───────────────────────────── DAY 12 ─────────────────────────────
  sd({
    day: 12,
    kind: "Fundamentals",
    slug: "system-design-load-balancer",
    title: "Load Balancers: Scaling Out, Algorithms and High Availability",
    description:
      "Vertical versus horizontal scaling, routing algorithms, health checks, stateless servers, layer 4 versus layer 7, and how the load balancer itself avoids being a single point of failure.",
    tags: ["Load Balancer", "Scalability", "High Availability", "Fundamentals"],
    intro: [
      "A load balancer sits in front of a group of servers and distributes incoming requests among them. It is what allows a website to keep working when hundreds of thousands of people arrive at once, for example when exam results are published.",
      "These notes explain why adding servers is preferred over buying a bigger one, how a load balancer chooses a server, how it detects failures, and how the load balancer itself is made reliable.",
    ],
    sections: [
      {
        heading: "Vertical versus horizontal scaling",
        content: [
          "Vertical scaling means making one machine more powerful: more CPU, more memory, faster disks. It is simple, because the application does not change. It has two limits. There is a largest machine you can buy, and the price rises steeply as you approach it. More importantly, one machine is a single point of failure: when it goes down, the whole service goes down.",
          "Horizontal scaling means adding more machines and sharing the work among them. Capacity grows by adding servers, and the failure of one server removes only a fraction of capacity. The cost is that something must distribute requests among the servers and the application must be written so that any server can handle any request. That distributor is the load balancer.",
        ],
      },
      {
        heading: "What a load balancer does",
        content: [],
        bullets: [
          "Distributes requests across a pool of servers so that no single server is overloaded.",
          "Detects unhealthy servers and stops sending them traffic.",
          "Allows servers to be added or removed without clients noticing, which enables scaling and zero-downtime deployments.",
          "Often terminates TLS, so that certificates and encryption are handled in one place.",
          "Presents a single address to clients and hides the internal topology.",
        ],
        snippets: [
          {
            title: "Typical placement",
            filename: "architecture.txt",
            code: `                    DNS  ->  virtual IP
                               |
               +---------------+---------------+
               |  Load balancer (active)       |  <-- heartbeat -->  Load balancer (standby)
               +---------------+---------------+
                               |
        +----------------------+----------------------+
        v                      v                      v
   App server 1           App server 2           App server 3      (stateless)
        |                      |                      |
        +----------------------+----------------------+
                               v
              Shared state: Redis (sessions), database`,
          },
        ],
      },
      {
        heading: "Routing algorithms",
        content: [],
        bullets: [
          "Round robin: requests go to servers in turn. Simple and fair when all servers are identical and requests cost about the same.",
          "Weighted round robin: servers with more capacity receive proportionally more requests.",
          "Least connections: a new request goes to the server with the fewest active connections. Better when request durations vary widely or connections are long-lived, such as WebSockets.",
          "Least response time: prefers servers that are currently answering fastest.",
          "IP hash or consistent hashing: the same client or key always maps to the same server. Useful for cache locality or when some session affinity is required.",
        ],
      },
      {
        heading: "Why round robin is not always enough",
        content: [
          "Round robin counts requests, not work. If some requests take 10 ms and others take 10 seconds, one server can receive several heavy requests in a row and become overloaded while its neighbours are idle. Least connections corrects this by looking at how busy each server actually is at the moment of the decision.",
        ],
      },
      {
        heading: "Health checks",
        content: [
          "A load balancer must not send traffic to a dead server. It runs health checks: every few seconds it sends a small request to each server, typically an HTTP request to a dedicated endpoint such as /health. If a server fails several consecutive checks, it is removed from rotation. When it passes several checks again, it is added back.",
          "A good health endpoint verifies that the application can do real work, for example that it can reach its database, without being so strict that a brief dependency glitch removes every server at once. Passive health checking complements this: the load balancer watches real responses and ejects a server that returns many errors.",
        ],
      },
      {
        heading: "Sessions and stateless servers",
        content: [
          "Suppose a user logs in and the session is stored in the memory of server 1. The next request is routed to server 2, which has no record of the session, and the user appears logged out.",
          "One fix is sticky sessions, where the load balancer always sends a given user to the same server. This works but has drawbacks: load becomes uneven, and when that server fails or is replaced, all its sessions are lost.",
          "The better fix is to make servers stateless. Session data is moved to a shared store such as Redis, or carried by the client in a signed token. Any server can then handle any request. Stateless servers are the easiest thing in a system to scale: adding capacity means starting more identical instances, and removing one loses nothing.",
        ],
      },
      {
        heading: "Layer 4 versus layer 7",
        content: [
          "A layer 4 load balancer works at the transport layer. It sees IP addresses and TCP or UDP ports, and forwards packets without looking at their contents. It is very fast and can handle any protocol, but it cannot make decisions based on the request itself.",
          "A layer 7 load balancer works at the application layer. It understands HTTP, so it can read the URL, headers and cookies. This allows content-based routing: requests to /api go to one group of servers, requests to /images go to another, and requests with a particular header go to a canary version. It can also terminate TLS, compress responses and retry failed requests. It does more work per request, so it is somewhat slower, which rarely matters in practice.",
          "Large systems commonly use both: a layer 4 balancer at the edge to spread connections across a fleet of layer 7 balancers or API gateways.",
        ],
      },
      {
        heading: "The load balancer as a single point of failure",
        content: [
          "If every request passes through one load balancer and it fails, the entire service is unreachable, no matter how many healthy servers sit behind it. The load balancer must be redundant too.",
          "The common arrangement is an active-standby pair. Two load balancers share a virtual IP address. The active one handles traffic, and the standby monitors it with heartbeats. If the heartbeats stop, the standby takes over the virtual IP within seconds. An active-active arrangement runs several load balancers at once, with DNS or network-level routing spreading traffic among them. Managed cloud load balancers provide this redundancy for you. The design goal has a name: no single point of failure.",
        ],
      },
      {
        heading: "Global load balancing",
        content: [
          "When a service runs in several regions, traffic must first be sent to the right region. This is done with DNS-based routing, which returns different addresses depending on the user's location or the health of each region, or with anycast, where the same IP address is announced from many locations and the network delivers each user to the nearest one. Within the region, the local load balancers described above take over.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Scale horizontally, not vertically, and put a load balancer in front.",
          "Algorithm: round robin for uniform requests, least connections for uneven or long-lived ones.",
          "Health checks remove failed servers from rotation.",
          "Keep servers stateless; store sessions in a shared store.",
          "Run load balancers as an active-standby pair, and know the difference between layer 4 and layer 7.",
        ],
      },
    ],
    conclusion:
      "A load balancer makes horizontal scaling possible by spreading requests over many servers and routing around failures. Choose the algorithm to match the workload, keep application servers stateless so any of them can serve any request, and make the load balancer itself redundant so that it does not become the single point of failure it was meant to remove.",
  }),

  // ───────────────────────────── DAY 13 ─────────────────────────────
  sd({
    day: 13,
    kind: "Design",
    slug: "system-design-flash-sale",
    title: "Design a Flash Sale System: No Overselling Under Extreme Load",
    description:
      "How to sell 100 items to millions of simultaneous buyers: atomic stock decrement, waiting rooms, queues, reservations with expiry and idempotent orders.",
    tags: ["Flash Sale", "Concurrency", "Redis", "E-Commerce"],
    intro: [
      "A flash sale offers a small quantity of a product at a fixed time, for example 100 phones at noon, to a very large number of buyers. Within a second the stock is gone. The system faces two problems together: an extreme traffic spike, and the need to never sell more items than exist.",
      "Reading the stock from the database, checking that it is greater than zero and then creating the order is the obvious implementation, and it is the one that produces 120 orders for 100 phones. These notes explain why, and how the correct design works.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: a limited stock is sold starting at a fixed time; each user may buy at most one unit.",
          "Functional: a successful buyer places an order and pays within a time limit.",
          "Non-functional: no overselling, under any level of concurrency. This is the hard correctness requirement.",
          "Non-functional: the system stays available during the spike, and the rest of the site is not affected by it.",
          "Non-functional: fairness. Earlier requests should generally win, and bots should not take the stock.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 5 million users are waiting when the sale opens and most of them press Buy in the first few seconds. That is on the order of a million requests per second, for 100 units of stock. More than 99.99 percent of requests must fail, and they should fail as early and as cheaply as possible. The design is essentially a funnel: each layer rejects most of the traffic so that only a few hundred requests ever reach the order service and the database.",
        ],
      },
      {
        heading: "3. The race condition",
        content: [
          "The naive flow has three separate steps: read the stock, check that it is positive, write the decremented value. Suppose one unit remains. Two requests read the stock at the same time and both see 1. Both pass the check. Both write 0 and both create an order. Two phones have been sold and only one exists.",
          "This is a race condition: the result depends on the timing of concurrent operations. With thousands of concurrent requests the overselling is not an edge case, it happens on every sale.",
        ],
        snippets: [
          {
            title: "Check-then-act (incorrect)",
            filename: "naive.sql",
            code: `-- Request A and request B run these statements at the same time

SELECT stock FROM items WHERE id = 7;        -- both read: 1
-- application: if (stock > 0) ...           -- both pass
UPDATE items SET stock = 0 WHERE id = 7;     -- both write
INSERT INTO orders (...) VALUES (...);       -- two orders, one phone`,
          },
        ],
      },
      {
        heading: "4. Atomic decrement",
        content: [
          "The fix is to make read, check and write a single indivisible operation. In a relational database this can be done with a conditional update: decrement the stock only where the stock is still positive, and treat 'zero rows affected' as sold out. The database guarantees that two such updates cannot both take the last unit.",
          "At flash-sale traffic levels even this is too much load for the database, so the stock counter is moved to Redis before the sale begins. Redis executes commands one at a time, which makes each command atomic. The DECR command decrements and returns the new value in one step. If the result is zero or more, the request has won a unit. If it is negative, the stock is exhausted and the request is rejected. A short Lua script can combine the stock check, the per-user purchase check and the decrement into one atomic unit.",
        ],
        snippets: [
          {
            title: "Atomic alternatives",
            filename: "atomic.txt",
            code: `-- SQL: conditional update, check affected rows
UPDATE items SET stock = stock - 1 WHERE id = 7 AND stock > 0;
-- 1 row affected  -> success        0 rows affected -> sold out

-- Redis Lua script: one user, one unit, no overselling
-- KEYS[1] = stock:7     KEYS[2] = buyers:7     ARGV[1] = userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
  return -1                               -- this user already bought
end
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock <= 0 then
  return 0                                -- sold out
end
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 1                                  -- reserved`,
          },
        ],
      },
      {
        heading: "5. Protecting the system from the spike",
        content: [
          "Correct stock handling is not sufficient if the services collapse under a million requests per second. The traffic is reduced in layers before it reaches anything expensive.",
        ],
        bullets: [
          "Static content from a CDN: the sale page, images and scripts are served from the edge. The countdown uses server time so that clients cannot start early.",
          "Virtual waiting room: users are placed in a queue and admitted in controlled batches. Only admitted users receive a token that allows them to call the buy endpoint.",
          "Rate limiting and bot protection at the gateway: per-user and per-IP limits, and a challenge for suspicious clients.",
          "Fast rejection: once stock reaches zero, a flag is set and the gateway answers 'sold out' immediately without calling any service.",
          "Order queue: the few requests that win a unit are written to a queue, and order workers create orders in the database at a rate it can sustain.",
        ],
        snippets: [
          {
            title: "Architecture: a funnel",
            filename: "architecture.txt",
            code: `5,000,000 users
      |
      v
 CDN (static sale page)                         <- absorbs page loads
      |
 Waiting room + API gateway (rate limit, bots)  <- admits a small, steady flow
      |
 Sale service --> Redis: atomic stock decrement <- 100 succeed, the rest get "sold out"
      |
 Order queue (Kafka / SQS)                      <- buffer
      |
 Order workers --> Orders DB (SQL)  --> Payment service
      |
 Reservation expiry job (returns unpaid stock)`,
          },
        ],
      },
      {
        heading: "6. Reservations with expiry",
        content: [
          "Decrementing the stock reserves a unit for the user; it is not yet a sale. If the user never completes the payment, that unit would be locked forever. Each reservation therefore has an expiry time, for example ten minutes. If payment succeeds within that time, the order is confirmed. If not, the reservation is cancelled and the unit is returned to stock so that someone else can buy it.",
          "Expiry can be implemented with a delayed message that fires after ten minutes and checks the order status, or with a periodic job that scans for unpaid orders past their deadline. The order is a small state machine: RESERVED, then PAID or EXPIRED.",
        ],
      },
      {
        heading: "7. Idempotency",
        content: [
          "On a slow network a user may press Buy twice, or the app may automatically retry a request that timed out. Without protection this could create two orders or consume two units. Each purchase attempt carries an idempotency key, a unique identifier generated by the client. The server stores the key with the result of the first request. When the same key arrives again, the server returns the stored result instead of processing the request a second time. The per-user set in the Lua script gives a second layer of protection for the one-unit-per-user rule.",
        ],
      },
      {
        heading: "8. Failure cases",
        content: [],
        bullets: [
          "Redis failure during the sale: run Redis with replication and persistence, and treat the database as the source of truth. On recovery, recompute remaining stock as initial stock minus confirmed and active reservations. It is safer to pause the sale briefly than to risk overselling.",
          "Worker failure: the order message remains in the queue and is processed again; the idempotency key prevents a duplicate order.",
          "Payment timeout: do not assume failure. Check the payment status before releasing the reservation.",
          "Isolation: run the sale on separate service instances and a separate Redis so that the spike cannot bring down normal shopping.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: no overselling, survive the spike, one unit per user.",
          "Stock: atomic decrement in Redis (or a conditional UPDATE), never check-then-act.",
          "Traffic: CDN, waiting room, rate limiting, then a queue in front of the order service.",
          "Reservation with a TTL: unpaid stock returns to the pool.",
          "Idempotency keys so that retries and double clicks create one order.",
        ],
      },
    ],
    conclusion:
      "Overselling is caused by separating the stock check from the stock update, and it is prevented by making them one atomic operation. Everything else in a flash sale design is a funnel that rejects excess traffic early: CDN, waiting room, rate limits and a queue. Reservations expire so that unpaid stock is released, and idempotency keys make retries safe.",
  }),

  // ───────────────────────────── DAY 14 ─────────────────────────────
  sd({
    day: 14,
    kind: "Fundamentals",
    slug: "system-design-sql-vs-nosql",
    title: "SQL vs NoSQL: Choosing a Database With a Reason",
    description:
      "What relational and non-relational databases each guarantee, the four NoSQL families, how SQL scales, and a decision rule based on access patterns.",
    tags: ["Databases", "SQL", "NoSQL", "Fundamentals"],
    intro: [
      "Every system design includes the question 'which database will you use?' The expected answer is not a product name. It is a choice followed by a reason, and the reason comes from the data and how it will be accessed.",
      "'It is scalable' is not a reason: both families can scale, and no database is best in general. These notes compare the two families and give a rule for deciding between them.",
    ],
    sections: [
      {
        heading: "SQL (relational) databases",
        content: [
          "A relational database stores data in tables with a fixed schema: every row in a table has the same columns, with defined types. Tables are linked by keys, and the database can combine them with joins. Examples are PostgreSQL and MySQL.",
          "The defining feature is the transaction with ACID guarantees.",
        ],
        bullets: [
          "Atomicity: all the statements in a transaction take effect, or none do. A money transfer never debits one account without crediting the other.",
          "Consistency: every transaction leaves the data in a valid state according to the declared constraints (unique keys, foreign keys, checks).",
          "Isolation: concurrent transactions do not interfere with each other; the result is as if they ran one after another.",
          "Durability: once a transaction is committed, it survives a crash.",
        ],
      },
      {
        heading: "When to choose SQL",
        content: [
          "Choose a relational database when correctness is more important than raw scale, when the data is naturally relational, and when you need flexible queries. Payments, orders, bank accounts, inventory and bookings belong here. A double-spent rupee or a seat sold twice is a business failure, and transactions with constraints are the simplest way to prevent it.",
          "SQL is also the safe default when the query patterns are not yet known, because joins and secondary indexes let you ask new questions of the data without restructuring it.",
        ],
      },
      {
        heading: "NoSQL databases",
        content: [
          "NoSQL is a family of databases that give up some relational features, usually joins and multi-row transactions, in exchange for easier horizontal scaling and a flexible schema. There are four main types, and they are quite different from each other.",
        ],
        bullets: [
          "Key-value stores (Redis, DynamoDB): a value is fetched by its key. Extremely fast and simple. Suitable for sessions, caches, counters and user preferences.",
          "Document stores (MongoDB): each record is a JSON-like document that can contain nested fields and arrays, and documents in one collection need not share a structure. Suitable for product catalogues, content and user profiles.",
          "Wide-column stores (Cassandra, HBase): rows are grouped by a partition key and sorted within the partition. Designed for very high write throughput and large datasets. Suitable for chat messages, activity logs, time-series and sensor data.",
          "Graph databases (Neo4j): store nodes and relationships, and traverse relationships efficiently. Suitable for social graphs, recommendations and fraud detection.",
        ],
      },
      {
        heading: "When to choose NoSQL",
        content: [
          "Choose NoSQL when the scale is very large, when the access pattern is simple and known in advance (most often 'get by key' or 'get a range within a partition'), when the workload is write-heavy, or when the structure of the data varies from record to record. Chat messages, event logs, sessions and feeds fit these conditions.",
          "The price is that the data model must be designed around the queries. In a relational database you model the entities and query them however you like. In most NoSQL databases you first list the queries and then design tables whose keys answer them directly, often duplicating data to avoid joins.",
        ],
        snippets: [
          {
            title: "The same data, modelled two ways",
            filename: "modelling.txt",
            code: `RELATIONAL (normalised, joined at read time)
  users   (id PK, name, email UNIQUE)
  orders  (id PK, user_id FK -> users.id, total, status, created_at)
  items   (id PK, order_id FK -> orders.id, product_id, qty, price)

  SELECT o.id, o.total, i.product_id, i.qty
  FROM orders o JOIN items i ON i.order_id = o.id
  WHERE o.user_id = 42;

DOCUMENT (denormalised, read in one lookup)
  {
    "_id": "order_981",
    "userId": 42,
    "status": "PAID",
    "total": 1499,
    "items": [
      { "productId": "p_12", "qty": 1, "price": 999 },
      { "productId": "p_40", "qty": 2, "price": 250 }
    ]
  }

WIDE-COLUMN (query-first design)
  messages_by_conversation
    PRIMARY KEY ((conversation_id), sent_at)   -- one partition = one chat, sorted by time`,
          },
        ],
      },
      {
        heading: "Does SQL scale?",
        content: [
          "Yes. A relational database scales reads with read replicas and scales writes and storage with sharding, where the data is split across several database servers by a shard key. Many very large products run on sharded relational databases.",
          "The difference is in the effort. In most NoSQL systems, partitioning is built in: you choose a partition key and the database distributes and rebalances the data. In a traditional relational setup, sharding needs more planning: choosing the shard key, routing queries, and accepting that joins and transactions across shards become difficult. Distributed SQL databases (sometimes called NewSQL) aim to provide both the relational model and automatic horizontal scaling.",
        ],
      },
      {
        heading: "Consistency models",
        content: [
          "Relational databases default to strong consistency: after a write commits, every read sees it. Many NoSQL databases default to eventual consistency: replicas converge over time, and a read immediately after a write may return the old value. This is often described as BASE (basically available, soft state, eventually consistent) in contrast to ACID.",
          "The distinction is less rigid than it once was. Several NoSQL databases offer tunable consistency or even transactions, and relational replicas can lag. The question to ask of any database is what it guarantees for the specific operations you need.",
        ],
      },
      {
        heading: "Polyglot persistence",
        content: [
          "Large systems rarely use a single database. Each kind of data is stored in the system that suits it: orders and payments in a relational database, the product catalogue in a document store, sessions and carts in Redis, messages or events in a wide-column store, product search in a search engine, and images in object storage. This approach is called polyglot persistence. The trade-off is operational: more systems to run, monitor and keep in sync.",
        ],
      },
      {
        heading: "A decision rule",
        content: [],
        bullets: [
          "List the main queries and how often each runs. This is the access pattern.",
          "If you need multi-row transactions, strong consistency or joins across entities, choose SQL.",
          "If you need massive write throughput or storage with simple key-based access, choose NoSQL.",
          "If you choose NoSQL, name the type and why: key-value, document, wide-column or graph.",
          "If the system has several kinds of data, use more than one database and say which data goes where.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Start from the access pattern, not from a product name.",
          "Strong consistency and relationships: SQL with ACID transactions.",
          "Very large scale, flexible schema, simple access: NoSQL.",
          "Specify the NoSQL type: key-value, document or wide-column.",
          "Use both when the data calls for it: polyglot persistence.",
        ],
      },
    ],
    conclusion:
      "SQL databases offer a fixed schema, joins and ACID transactions, and are the right choice where correctness and relationships matter. NoSQL databases offer flexible schemas and built-in horizontal scaling for simple, high-volume access patterns. The choice should always be justified by how the data is read and written, and large systems commonly use several databases side by side.",
  }),

  // ───────────────────────────── DAY 15 ─────────────────────────────
  sd({
    day: 15,
    kind: "Design",
    slug: "system-design-video-streaming",
    title: "Design a Video Streaming Platform: Transcoding, Chunks and CDN",
    description:
      "The upload pipeline, transcoding into multiple qualities, segmenting video into chunks, adaptive bitrate streaming and CDN delivery, explained end to end.",
    tags: ["Video Streaming", "CDN", "Transcoding", "Adaptive Bitrate"],
    intro: [
      "A video streaming platform lets users upload videos and lets a much larger audience watch them on any device and any network. When the network becomes weak, the picture quality drops but playback continues without stopping.",
      "That behaviour is impossible if the video is one large file downloaded from one server. These notes describe the two pipelines of a streaming platform: the upload and processing path, and the playback path.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: upload a video; watch a video.",
          "Functional: playback works on phones, laptops and TVs, at different resolutions.",
          "Non-functional: playback starts quickly and buffering is minimal, on fast and slow networks.",
          "Non-functional: high availability for playback; uploaded videos are never lost (durability).",
          "Workload: very read-heavy. A video is uploaded once and may be watched millions of times.",
          "Out of scope unless asked: recommendations, comments, live streaming.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 10 million daily active users watching 5 videos each: 50 million views per day. Assume 100,000 uploads per day with an average source size of 500 MB: 50 TB of new source video per day, and after transcoding into several qualities perhaps 100 TB per day in total. Over a year that is tens of petabytes, so storage must be object storage, not a database or local disks.",
          "Bandwidth dominates the cost. If 500,000 users watch concurrently at an average of 3 Mbps, the platform delivers 1.5 Tbps. No origin data centre should serve that directly, which is why a CDN is essential.",
        ],
      },
      {
        heading: "3. Upload path",
        content: [
          "Video files are large, so they should not pass through the application servers. The client asks the upload service for permission, receives a pre-signed URL, and uploads the file directly to object storage. The upload is split into parts so that a failed part can be retried without restarting, and an interrupted upload can be resumed.",
          "Information about the video (title, description, owner, duration, status, and the locations of its files) is stored separately in a metadata database. The two stores have opposite characteristics: object storage holds huge, immutable blobs cheaply; the metadata database holds small records that are queried and updated.",
        ],
        snippets: [
          {
            title: "API",
            filename: "api.http",
            code: `POST /api/v1/videos
Body:     { "title": "...", "sizeBytes": 524288000 }
Response: 201 { "videoId": "v_301", "uploadUrl": "<pre-signed object storage URL>" }

# Client uploads the file in parts directly to object storage,
# then storage emits an "upload completed" event.

GET /api/v1/videos/v_301
Response: 200 { "title": "...", "status": "READY",
                "manifestUrl": "https://cdn.example.com/v_301/master.m3u8" }`,
          },
        ],
      },
      {
        heading: "4. Transcoding",
        content: [
          "The uploaded file is in whatever format and resolution the creator's device produced. It cannot be served as is: a 4K file is useless to a phone on a slow connection, and different devices support different codecs.",
          "Transcoding converts the source into a set of standard outputs: several resolutions and bitrates, for example 240p, 360p, 480p, 720p, 1080p and 4K, in one or more codecs. This set is called the bitrate ladder.",
          "Transcoding is CPU-intensive and can take longer than the video's duration. It must not block the upload request. When the upload completes, a job is placed on a queue. A pool of workers consumes the jobs. To go faster, the source is first split into segments, and many workers transcode different segments and different qualities in parallel; the results are then assembled. If a worker fails, only its segment is retried. Once all outputs exist, the video's status changes to READY.",
        ],
      },
      {
        heading: "5. Chunks and the manifest",
        content: [
          "Each quality level is cut into small chunks, typically 2 to 10 seconds long, each of which can be decoded independently. Alongside the chunks the pipeline produces a manifest file: a small text file that lists the available qualities and the URL of every chunk in each quality. The common formats are HLS and MPEG-DASH.",
          "Chunking brings several benefits. Playback can begin after downloading the first chunk. Seeking to the middle of a video downloads only the chunks from that point. And, most importantly, the player can change quality at every chunk boundary.",
        ],
        snippets: [
          {
            title: "A master manifest (HLS)",
            filename: "master.m3u8",
            code: `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240
240p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

# Each playlist lists that quality's chunks:
#   segment_0001.ts, segment_0002.ts, segment_0003.ts ...`,
          },
        ],
      },
      {
        heading: "6. Adaptive bitrate streaming",
        content: [
          "The player, not the server, decides the quality. It downloads the manifest and then requests chunks one after another. While doing so it measures how fast chunks are arriving and how much video is buffered. If the measured throughput is high, it requests the next chunk from a higher quality. If the network slows or the buffer is draining, it requests the next chunk from a lower quality.",
          "This is adaptive bitrate streaming. Because chunks of every quality are aligned to the same time boundaries, switching is seamless: the viewer sees a change in sharpness but no pause. It is why a video on a train drops from 1080p to 360p in a tunnel and keeps playing.",
        ],
      },
      {
        heading: "7. CDN delivery",
        content: [
          "Serving every viewer from a central origin would overload the origin and give distant users high latency. Chunks are static files that never change once created, which makes them ideal for a content delivery network. The CDN caches chunks on edge servers in many locations. A viewer's request goes to a nearby edge. If the chunk is cached there, it is returned at once. If not, the edge fetches it from the origin, stores it and returns it.",
          "Popular videos are served almost entirely from the edge. Rarely watched videos, the long tail, may not be cached everywhere and are fetched from the origin on demand, which is a deliberate cost trade-off.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `UPLOAD AND PROCESSING
 Creator --> Upload service --> pre-signed URL
     |                               |
     +------ direct upload -----> Object storage (source files)
                                     | "upload completed" event
                                     v
                             Transcoding queue --> Transcoding workers (parallel)
                                                        |
                                                        v
                             Object storage (chunks + manifests, per quality)
                                                        |
                             Metadata DB: status = READY, manifest URL

PLAYBACK
 Viewer --> Video API --> Metadata DB / cache  (title, manifest URL)
 Player --> CDN edge --> (cache miss) --> Origin: object storage
        <-- manifest, then chunks at the quality chosen by the player`,
          },
        ],
      },
      {
        heading: "8. Additional considerations",
        content: [],
        bullets: [
          "Metadata reads are also read-heavy, so video details are cached and the database uses read replicas.",
          "Storage cost: move rarely watched videos to cheaper storage tiers, and transcode the highest resolutions only for videos that become popular.",
          "Access control: signed URLs or tokens with a short lifetime prevent hotlinking; encryption and DRM protect paid content.",
          "View counts: recorded as events through a queue and aggregated asynchronously, never as a database write in the playback path.",
          "Live streaming uses the same chunk and manifest model, but chunks are produced continuously and cached for only a few seconds, so end-to-end latency is the main concern.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: low buffering on any device and network, durable uploads, read-heavy.",
          "Storage: video files in object storage, details in a metadata database.",
          "Transcoding: asynchronous, through a queue with parallel workers, into a ladder of qualities.",
          "Chunks plus a manifest enable adaptive bitrate streaming driven by the player.",
          "Delivery: chunks are served from CDN edge servers, not from the origin.",
        ],
      },
    ],
    conclusion:
      "A streaming platform separates processing from playback. Uploads go directly to object storage and are transcoded asynchronously into several qualities, each cut into short chunks described by a manifest. The player picks the quality of each chunk according to the network, and a CDN serves those chunks from locations close to the viewer.",
  }),
];
