import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_1: BlogPost[] = [
  // ───────────────────────────── DAY 1 ─────────────────────────────
  sd({
    day: 1,
    kind: "Design",
    slug: "system-design-url-shortener",
    title: "Design a URL Shortener: Base62 IDs, Caching and Redirects",
    description:
      "Complete notes on designing a URL shortener: why truncated hashes collide, and how a counter with Base62 encoding, range-based ID allocation and a cache make it scale.",
    tags: ["URL Shortener", "Base62", "Caching", "Interview"],
    intro: [
      "A URL shortener takes a long URL and returns a short one, usually a domain followed by a code of about seven characters. When someone opens the short link, the service looks up the code and redirects the browser to the original address. The short links you see in delivery messages and social posts all work this way.",
      "The product is small, but it touches most of the building blocks of system design: unique ID generation, a read-heavy workload, caching, database choice and HTTP semantics. These notes go through the design in the same order you would present it in an interview: requirements, estimation, API, the core design, scaling and trade-offs.",
    ],
    sections: [
      {
        heading: "1. Clarify the requirements",
        content: [
          "The first step is to agree on what is being built. The requirements below are a reasonable starting set.",
        ],
        bullets: [
          "Functional: given a long URL, return a short URL. Opening the short URL redirects the user to the original one.",
          "Functional (optional, ask first): custom aliases, link expiry, and click analytics.",
          "Non-functional: redirects must be fast (under roughly 100 ms at the server), the service must be highly available, and a short code must never map to two different URLs.",
          "Workload: a link is created once and opened many times, so the system is read-heavy. Assume a read-to-write ratio of about 100 to 1.",
          "Out of scope for now: user accounts, billing, and spam detection.",
        ],
      },
      {
        heading: "2. Estimate the scale",
        content: [
          "The numbers below are assumptions, stated to size the system. Assume 100 million new links per month. That is roughly 40 writes per second on average. With a 100 to 1 ratio, redirects are about 4,000 per second on average and perhaps 10,000 per second at peak.",
          "Each record holds a short code, the long URL, and a few metadata fields, around 500 bytes. One hundred million records a month is about 50 GB per month, or roughly 3 TB over five years. That is comfortably within the range of a sharded key-value store, and it shows that the hard part of this system is not storage but serving reads quickly.",
          "How long should the code be? With 62 possible characters (a to z, A to Z, 0 to 9), seven characters give 62 to the power of 7, which is about 3.5 trillion combinations. At 100 million links a month that lasts for thousands of years, so seven characters is enough.",
        ],
      },
      {
        heading: "3. Define the API",
        content: [
          "Two endpoints carry the whole product.",
        ],
        snippets: [
          {
            title: "Public API",
            filename: "api.http",
            code: `POST /api/v1/urls
Body:     { "longUrl": "https://example.com/some/very/long/path", "expiresAt": null }
Response: 201 Created
          { "shortUrl": "https://sho.rt/aZ3kP9x", "code": "aZ3kP9x" }

GET /{code}
Response: 302 Found
          Location: https://example.com/some/very/long/path

          404 Not Found   (unknown or expired code)`,
          },
        ],
      },
      {
        heading: "4. Why hashing the URL fails",
        content: [
          "A hash function such as MD5 produces 128 bits. To get a seven-character code you must throw most of those bits away. Once you truncate, two different URLs can produce the same seven characters. This is called a collision, and with billions of links it is not a rare event, it is a certainty.",
          "You can patch it: check the database, and if the code is taken, add a salt and hash again. But now every write needs a read first, the retry loop gets slower as the table fills, and two servers can still race to claim the same code. You have built a slower, more fragile version of a problem that has a clean solution.",
        ],
      },
      {
        heading: "5. The right approach: a counter plus Base62",
        content: [
          "Give every new URL a unique number from a counter, and then write that number in base 62. Because every number is unique, every code is unique. There is no collision to check for, so a write is a single insert.",
          "Base62 is simply a number system with 62 digits. The number 125 in base 62 is '21', because 2 times 62 plus 1 is 125. The encoding is a short loop.",
        ],
        snippets: [
          {
            title: "Base62 encoding of a numeric ID",
            filename: "base62.js",
            code: `const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encode(id) {
  if (id === 0) return ALPHABET[0];
  let code = "";
  while (id > 0) {
    code = ALPHABET[id % 62] + code;
    id = Math.floor(id / 62);
  }
  return code;
}

encode(125);          // "21"
encode(3521614606207) // "ZZZZZZZ" -> the largest 7-character code`,
          },
        ],
      },
      {
        heading: "6. High-level design",
        content: [
          "The write path generates an ID, encodes it, and stores the mapping. The read path looks up the code, first in the cache and then in the database, and returns a redirect.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `                      +------------------+
 Client ---> LB ----> |   App servers    | ----> ID range service
                      |   (stateless)    |       (hands out blocks of IDs)
                      +---------+--------+
                                |
              read path         |        write path
        +-----------------------+----------------------+
        v                                              v
 +--------------+   miss   +-----------------------------------+
 | Redis cache  | -------> |  Key-value DB (code -> long URL)  |
 | code -> URL  | <------- |  partitioned by code              |
 +--------------+  fill    +-----------------------------------+`,
          },
          {
            title: "Data model",
            filename: "schema.txt",
            code: `urls
----------------------------------------------
code        VARCHAR(7)   PRIMARY KEY
long_url    TEXT         NOT NULL
created_at  TIMESTAMP
expires_at  TIMESTAMP    NULL
owner_id    BIGINT       NULL`,
          },
        ],
      },
      {
        heading: "7. Scaling the ID generator: range-based allocation",
        content: [
          "If every write has to call one central counter, that counter is both a bottleneck and a single point of failure.",
          "The fix is range-based ID allocation. A small coordination service (it can be backed by ZooKeeper, etcd, or a single database row updated in a transaction) hands each app server a block of IDs, for example one million at a time. Server A owns 1 to 1,000,000, server B owns 1,000,001 to 2,000,000. Each server then increments a local in-memory counter with no network call at all. It only talks to the range service again when its block is exhausted.",
          "If a server crashes, the unused IDs in its block are lost. That is acceptable: we have trillions of codes, and wasting a few hundred thousand costs nothing. It is worth stating this explicitly as an accepted trade-off.",
        ],
      },
      {
        heading: "8. Serving read-heavy traffic with a cache",
        content: [
          "A link is written once and may be read millions of times. This is the definition of a read-heavy system, and the standard tool is a cache. Popular codes are kept in Redis using the cache-aside pattern: check the cache, on a miss read the database and populate the cache with a TTL. With a realistic traffic distribution, a small fraction of links receive most of the clicks, so a cache holding the hottest 20 percent absorbs the vast majority of reads and the database sees very little traffic.",
          "For the database itself, the access pattern is a pure key lookup with no joins, so a key-value or wide-column store partitioned by code is a natural fit. A relational database with the code as primary key also works at this scale; what matters is that you justify the choice by the access pattern.",
        ],
      },
      {
        heading: "9. Trade-off: 301 or 302 redirect",
        content: [
          "A 301 (Moved Permanently) response is cached by the browser. The next time the same user opens the link, the browser redirects without contacting our servers, which reduces load. The cost is that we never see that click, so analytics are incomplete, and we cannot change or expire the destination for that user.",
          "A 302 (Found) response is not cached by default, so every click reaches our servers. Load is higher, but we can count every click and we stay in control of the link. If analytics is a requirement, choose 302. If the only goal is minimum load, choose 301. Stating the choice with its reason is worth more than the choice itself.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Sequential codes are guessable. If that matters, shuffle the ID before encoding (for example with a bijective function such as a Feistel permutation or multiplication by a large odd number modulo 62^7) so that consecutive IDs produce unrelated codes while staying unique.",
          "Custom aliases: store them in the same table and enforce uniqueness with a conditional insert. Reserve a separate namespace (or a minimum length) so they never collide with generated codes.",
          "Expiry: store expires_at, check it on read, and delete lazily with a background job. Cache TTL must never exceed the remaining lifetime.",
          "Same long URL submitted twice: it is fine to return two different codes. De-duplication needs an extra index on the long URL and is rarely worth it.",
          "Analytics: do not update a counter in the redirect path. Publish a click event to a queue and aggregate asynchronously.",
        ],
      },
      {
        heading: "Interview summary",
        content: [
          "The whole design in five points:",
        ],
        bullets: [
          "Requirements: create a short link, redirect, read-heavy traffic, no collisions.",
          "APIs: POST to shorten, GET on the short code to redirect.",
          "Unique IDs: counter plus Base62 encoding, with range-based allocation so servers do not share one counter.",
          "Storage: key-value database for the mapping, Redis cache for hot links.",
          "Trade-off: 301 reduces load, 302 preserves analytics and control.",
        ],
      },
    ],
    conclusion:
      "A URL shortener cannot be built on a truncated hash, because truncation creates collisions. Generate a unique number instead, encode it in Base62, distribute ID ranges so no server waits on a shared counter, put a cache in front of a key-value store because reads dominate, and close with the 301 versus 302 trade-off. This is a standard interview design, not a description of any particular company's internal architecture.",
  }),

  // ───────────────────────────── DAY 2 ─────────────────────────────
  sd({
    day: 2,
    kind: "Design",
    slug: "system-design-rate-limiter",
    title: "Design a Rate Limiter: Algorithms, Redis and Failure Modes",
    description:
      "Fixed window, sliding window and token bucket explained with their real weaknesses, plus how to make the limiter correct across many servers and what to do when Redis goes down.",
    tags: ["Rate Limiter", "Token Bucket", "Redis", "API Gateway"],
    intro: [
      "A rate limiter controls how many requests a client is allowed to make in a given period of time. When an app tells you 'Too many attempts, try again after thirty minutes', a rate limiter has counted your requests and decided to block further ones. It protects services from abuse, brute-force attacks and accidental overload, and it keeps one heavy client from degrading the experience of everyone else.",
      "These notes cover where a rate limiter sits, the three algorithms you are expected to know with their strengths and weaknesses, how to keep the limiter correct when it runs on many servers, and how it should behave when its own storage fails.",
    ],
    sections: [
      {
        heading: "1. Clarify the requirements",
        content: [],
        bullets: [
          "Functional: limit the number of requests a client can make in a time window, for example 100 requests per minute per user. Different endpoints can have different limits.",
          "Functional: when the limit is exceeded, reject the request with a clear response so the client knows when to retry.",
          "Non-functional: the check sits in front of every request, so it must add very little latency (a millisecond or two).",
          "Non-functional: it must be accurate in a distributed setup where requests from one user reach many servers.",
          "Non-functional: the limiter itself must not become a single point of failure.",
          "Questions to ask: what identifies a client (user ID, API key, IP address)? Is the limit hard or is a small overshoot acceptable?",
        ],
      },
      {
        heading: "2. Where does the limiter live?",
        content: [
          "The limiter should run before the request reaches your application servers, so that rejected traffic costs you almost nothing. The natural place is the API gateway, as middleware. Every request passes through it, it identifies the client, checks the counter, and either forwards the request or returns HTTP 429 (Too Many Requests).",
          "A good 429 response tells the client what to do next.",
        ],
        snippets: [
          {
            title: "Response when the limit is exceeded",
            filename: "response.http",
            code: `HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1767225630

{ "error": "rate_limit_exceeded", "message": "Try again in 30 seconds." }`,
          },
        ],
      },
      {
        heading: "3. Algorithm one: fixed window counter",
        content: [
          "Divide time into fixed windows, for example each calendar minute, and keep one counter per client per window. Each request increments the counter. If the counter exceeds the limit, reject.",
          "It is simple and uses very little memory, but it has a well-known flaw called the boundary burst problem. With a limit of 100 per minute, a client can send 100 requests in the last second of one window and 100 more in the first second of the next. Each window is within its limit, yet the system received 200 requests in two seconds, double what you intended to allow.",
        ],
      },
      {
        heading: "4. Algorithm two: sliding window",
        content: [
          "Instead of calendar windows, look at the last 60 seconds from the moment of each request. The sliding window log stores the timestamp of every request (for example in a Redis sorted set), removes timestamps older than the window, and counts what remains. It is exact, but it stores one entry per request, which is expensive for high limits.",
          "The sliding window counter is the practical compromise. Keep the counters for the current and the previous fixed window, and estimate the rolling count as: current count plus previous count multiplied by the fraction of the previous window that still overlaps. It uses two numbers per client and removes most of the boundary burst.",
        ],
      },
      {
        heading: "5. Algorithm three: token bucket",
        content: [
          "The token bucket is the most widely used algorithm. Each client has a bucket with a maximum capacity. Tokens are added at a fixed rate. Every request removes one token. If the bucket is empty, the request is rejected.",
          "Two parameters give you precise control: the refill rate sets the long-term average, and the capacity sets how large a burst you tolerate. A real user who opens the app and fires ten requests at once is served, while the sustained rate stays bounded. You do not need a background job to add tokens; you compute the refill lazily from the time elapsed since the last request.",
          "A related algorithm, the leaky bucket, puts requests in a queue and processes them at a constant rate. Token bucket allows bursts; leaky bucket smooths them out.",
        ],
        snippets: [
          {
            title: "Token bucket with lazy refill",
            filename: "tokenBucket.js",
            code: `function allow(bucket, now, capacity, refillPerSec) {
  // Add the tokens earned since the last request
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSec);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return false; // reject with 429

  bucket.tokens -= 1;
  return true;
}`,
          },
        ],
      },
      {
        heading: "6. Distributed rate limiting with a shared store",
        content: [
          "If each gateway node keeps its own in-memory counter, a client whose requests are spread over ten nodes effectively gets ten times the limit. The state must be shared.",
          "The standard answer is a centralized store, usually Redis, keyed by client and window. But 'read the counter, check it, then write it' is three steps, and two requests arriving together can both read 99 and both pass. This is a race condition. The fix is to make the operation atomic: either use the INCR command, which increments and returns the new value in one step, or run the whole token bucket calculation inside a Lua script, which Redis executes atomically. Set a TTL on every key so that counters for inactive clients disappear on their own.",
        ],
        snippets: [
          {
            title: "Atomic fixed-window check in Redis",
            filename: "limiter.redis",
            code: `# key = rate:{userId}:{currentMinute}
INCR   rate:42:29453760        -> returns the new count
EXPIRE rate:42:29453760 60 NX  -> set the TTL only on first use

# if the returned count > limit  ->  reject with 429`,
          },
          {
            title: "Request flow",
            filename: "architecture.txt",
            code: `Client --> Load balancer --> API gateway (rate limit middleware) --> Services
                                   |
                                   v
                          Redis cluster (counters / buckets)
                                   ^
                          Rules config (limits per endpoint, cached locally)`,
          },
        ],
      },
      {
        heading: "7. Failure handling: fail-open and fail-closed",
        content: [
          "The limiter depends on Redis, so you must decide its behaviour when Redis is unreachable. There are two policies and the right one depends on the endpoint.",
          "Fail-open means that if the limiter cannot decide, it allows the request. Use this for ordinary APIs: a short period without rate limiting is better than taking the whole product down. Fail-closed means that if the limiter cannot decide, it rejects the request. Use this for login, OTP verification and other security-sensitive endpoints, where allowing unlimited attempts is the worse outcome.",
          "To reduce the chance of ever reaching that decision, run Redis with replicas and automatic failover, keep a short timeout on the limiter call, and optionally fall back to a coarse local in-memory limit per node.",
        ],
      },
      {
        heading: "8. Additional considerations",
        content: [],
        bullets: [
          "Latency: one Redis round trip per request is usually acceptable. For very high throughput, nodes can take a batch of tokens locally and synchronise periodically, trading a little accuracy for speed.",
          "Multiple dimensions: apply limits per user, per IP and per endpoint together; the request passes only if all of them pass.",
          "Rules: store limits in configuration that the gateway caches and reloads, so limits can change without a deployment.",
          "Multi-region: either accept slightly loose limits with per-region counters, or replicate counters asynchronously. Strict global limits are expensive and rarely needed.",
          "Client behaviour: well-behaved clients read Retry-After and back off exponentially with jitter.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: per-client limits, very low latency, correct in a distributed setup.",
          "Placement: middleware at the API gateway, before application servers.",
          "Algorithm: token bucket for burst tolerance, or sliding window counter for accuracy; mention the boundary burst of fixed windows.",
          "Storage: Redis with atomic operations (INCR or a Lua script) and a TTL on each key.",
          "Response and failure: HTTP 429 with Retry-After; fail-open for normal APIs, fail-closed for login and OTP.",
        ],
      },
    ],
    conclusion:
      "A rate limiter counts requests per client and rejects the excess with a 429. Fixed windows are simple but allow bursts at the boundary, sliding windows fix that, and token buckets give you controlled bursts with a bounded average. In a distributed system the counter must live in a shared store and be updated atomically, and you must decide in advance whether each endpoint fails open or fails closed.",
  }),

  // ───────────────────────────── DAY 3 ─────────────────────────────
  sd({
    day: 3,
    kind: "Design",
    slug: "system-design-otp-notification-system",
    title: "Design an OTP and Notification System",
    description:
      "Why sending the SMS inside the API request fails, and how queues, priority lanes, retries with backoff and provider failover make notifications fast and reliable.",
    tags: ["Notifications", "OTP", "Message Queue", "Reliability"],
    intro: [
      "A notification system delivers messages such as one-time passwords (OTPs), order alerts and promotional campaigns to users over SMS, email and push notifications. The happy path is a single call to an external provider, which makes the system look simple.",
      "The real design work is in everything around that call: slow providers, traffic spikes, retries, duplicates and security. These notes build the system step by step, with OTP delivery as the main example because it has the strictest latency requirement.",
    ],
    sections: [
      {
        heading: "1. Clarify the requirements",
        content: [],
        bullets: [
          "Functional: send three kinds of messages, namely OTPs, transactional alerts (order confirmed, payment received) and promotional campaigns.",
          "Functional: support several channels: SMS, email and push notifications.",
          "Functional: generate and verify OTPs, including resend.",
          "Non-functional: an OTP should reach the user within a few seconds; a promotion can take minutes.",
          "Non-functional: no message may be lost, and duplicates should be avoided as far as possible.",
          "Non-functional: the system must absorb large spikes, for example a campaign to millions of users on a sale day.",
        ],
      },
      {
        heading: "2. Estimate the scale",
        content: [
          "Assume 10 million notifications per day in normal operation, which is a little over 100 per second on average. A campaign may push 5 million messages in a few minutes, which is tens of thousands per second for a short time. OTP volume is small in comparison but has the strictest latency requirement. The key insight from these numbers: the workload is spiky, and the smallest category is the most urgent.",
        ],
      },
      {
        heading: "3. OTP generation and storage",
        content: [
          "When a user requests an OTP, the service generates a random six-digit code using a cryptographically secure random generator. It stores a hash of the code, not the code itself, in Redis under a key for that user and purpose, with a TTL of about five minutes. When the TTL expires, Redis deletes the key and the OTP stops working without any cleanup job.",
          "Verification compares the hash of the submitted code with the stored hash, counts failed attempts, and deletes the key after success so the code cannot be reused.",
        ],
        snippets: [
          {
            title: "OTP record in Redis",
            filename: "otp.redis",
            code: `SET otp:login:+9198xxxxxx10 '{"hash":"9f2c...","attempts":0}' EX 300

# Resend  -> overwrite the same key (old code becomes invalid), reset the TTL
# Verify  -> compare hashes; on success DEL the key
# 3 wrong attempts -> DEL the key and block further tries for a cool-down period`,
          },
        ],
      },
      {
        heading: "4. Synchronous versus asynchronous sending",
        content: [
          "If the API handler calls the SMS provider and waits for the reply, your latency becomes the provider's latency. When the provider slows down, request threads pile up waiting, and soon your own API stops responding. A failure in an external company has become an outage in your system.",
          "The solution is asynchronous processing. The API validates the request, writes a message to a queue, and immediately returns 202 Accepted. A separate pool of workers reads from the queue and talks to the providers. The queue decouples the two sides: the API stays fast regardless of the provider, and messages wait safely in the queue if workers or providers are slow.",
        ],
        snippets: [
          {
            title: "API",
            filename: "api.http",
            code: `POST /api/v1/notifications
Headers:  Idempotency-Key: 7c1e9a52-...
Body:     { "userId": 42, "type": "OTP", "channel": "SMS",
            "templateId": "login_otp", "params": { "code": "******" } }
Response: 202 Accepted   { "notificationId": "ntf_81723" }

POST /api/v1/otp/verify
Body:     { "phone": "+9198xxxxxx10", "purpose": "login", "code": "482913" }
Response: 200 OK | 401 Invalid or expired | 429 Too many attempts`,
          },
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Services --> Notification API --+--> [ HIGH   queue: OTP          ] --> Workers --+
 (auth, orders,     |           +--> [ MEDIUM queue: transactional ] --> Workers --+--> SMS provider A / B
  marketing)        |           +--> [ LOW    queue: promotional   ] --> Workers --+--> Email provider
                    v                                                               --> Push (APNs / FCM)
            Preferences, templates,                    failed after retries
            dedup keys, delivery log                          |
                                                              v
                                                      Dead letter queue`,
          },
        ],
      },
      {
        heading: "5. Priority queues",
        content: [
          "Suppose marketing sends five million promotional messages and they all go into the same queue. An OTP requested a moment later sits behind all of them and arrives after it has expired.",
          "The fix is to separate traffic by priority. OTPs get their own high-priority queue with dedicated workers; transactional messages get a second queue; promotions get a third. A backlog in the promotional queue then has no effect on OTP delivery. This is usually called a priority queue design, and it is the most important idea in this system.",
          "Rate limit each lane as well. Providers impose throughput limits, and you do not want promotions consuming the quota that OTPs need.",
        ],
      },
      {
        heading: "6. Retries, backoff and provider failover",
        content: [
          "External providers fail. When a send attempt fails, the worker retries, but not immediately and not forever. Retrying instantly hammers a provider that is already struggling. Instead, use exponential backoff: wait one second, then two, then four, with a little random jitter so that thousands of workers do not retry at the same moment.",
          "If the provider keeps failing, switch to a second provider. This is failover. A circuit breaker tracks the error rate for each provider and stops sending to one that is clearly unhealthy, then probes it periodically to see if it has recovered. Messages that still fail after all retries go to a dead letter queue for inspection, so nothing is silently dropped.",
        ],
      },
      {
        heading: "7. Resend: only the latest OTP is valid",
        content: [
          "The user pressed Resend and now has two codes. Only the latest one should work. Because the OTP is stored under a single key per user and purpose, generating a new code overwrites the old one. The earlier code no longer matches the stored hash and is rejected. This closes a security gap as well: an attacker gains nothing from intercepting an older message.",
          "Resend should also be rate limited (for example one resend every 30 seconds, five per hour) to protect both your SMS bill and your users.",
        ],
      },
      {
        heading: "8. Delivery guarantees and duplicates",
        content: [
          "Queues typically provide at-least-once delivery: if a worker crashes after calling the provider but before acknowledging the message, the message is delivered again. To avoid sending the same notification twice, each message carries a unique ID, and the worker records that ID in a deduplication store before sending. If the ID is already present, the worker skips it. The same idempotency key on the API protects against clients retrying a request.",
          "Finally, store the status of each notification (queued, sent, delivered, failed) using the provider's delivery callbacks. This gives you an audit trail and lets you measure delivery time per provider.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: fast OTP delivery, no message loss, multiple channels, spiky load.",
          "Asynchronous design: API publishes to a message queue, workers send in the background.",
          "Priority queues: OTP first, transactional next, promotions last, each with its own workers.",
          "Reliability: retry with exponential backoff, failover to a second provider, dead letter queue.",
          "Security: store hashed OTPs with a TTL, only the latest OTP is valid, limit attempts and resends.",
        ],
      },
    ],
    conclusion:
      "Do not send notifications inside the request. Accept the request, queue it, and let workers deliver it. Keep OTPs in their own high-priority lane, retry with backoff and fail over between providers, make workers idempotent, and store OTPs hashed with a short TTL so that only the most recent code is ever valid.",
  }),

  // ───────────────────────────── DAY 4 ─────────────────────────────
  sd({
    day: 4,
    kind: "Fundamentals",
    slug: "system-design-requirements-functional-vs-non-functional",
    title: "Requirements First: Functional vs Non-Functional Requirements",
    description:
      "What to clarify before designing anything: how functional and non-functional requirements differ, and how one number can change the entire architecture.",
    tags: ["Requirements", "Fundamentals", "Interview", "Trade-offs"],
    intro: [
      "Every system design answer starts with requirements. A design question such as 'Design Instagram' is deliberately vague, and the architecture you draw only makes sense once you know which features matter, how many users there are, and what qualities the system must have.",
      "System design has no perfect answer. Every design is a set of trade-offs, and you can only choose the right trade-off when the requirements are clear. These notes explain the two kinds of requirements, the questions that have the most influence on a design, and how to set the scope in the first five minutes.",
    ],
    sections: [
      {
        heading: "Why requirements come first",
        content: [
          "A design question is deliberately vague. 'Design Instagram' could mean a photo upload service, a feed, stories, messaging, search or recommendations. The expected first step is to narrow it down before investing effort, exactly as you would with a real product manager.",
          "Asking questions is not a sign of weakness. It shows that you know the answer depends on the problem. A diagram drawn without any questions solves an invented problem, which may or may not be the one that was asked.",
        ],
      },
      {
        heading: "Functional requirements: what the system does",
        content: [
          "Functional requirements describe behaviour. They are the features, written from the user's point of view. For a photo-sharing app, the core functional requirements might be the following.",
        ],
        bullets: [
          "A user can upload a photo with a caption.",
          "A user can follow other users.",
          "A user can see a feed of photos from the accounts they follow.",
        ],
      },
      {
        heading: "Non-functional requirements: how well it does it",
        content: [
          "Non-functional requirements describe qualities. They do not add features; they constrain how the features must behave. The ones that matter most in interviews are listed below.",
        ],
        bullets: [
          "Scalability: how many users and how much data must the system handle, and how fast is that growing?",
          "Availability: what fraction of the time must it be working? 99.9 percent allows about 8.7 hours of downtime a year; 99.99 percent allows about 52 minutes.",
          "Latency: how quickly must a request complete, usually stated as a percentile such as p99 under 200 ms.",
          "Consistency: must every user see the latest data immediately, or is a short delay acceptable?",
          "Durability: can any data ever be lost? For photos and payments the answer is no.",
          "Also consider security, cost and maintainability when they are relevant.",
        ],
      },
      {
        heading: "One sentence can change the whole design",
        content: [
          "'Show the feed' is a functional requirement. You could implement it with one database query. 'The feed must load in 200 milliseconds for 100 million users' is a non-functional requirement, and it changes everything: now you need a cache, read replicas, precomputed feeds and a CDN for images.",
          "The functional requirement told you what to build. The non-functional requirement told you how hard it will be. This is why the architecture is determined mostly by non-functional requirements, and why you cannot design without them.",
        ],
      },
      {
        heading: "The question with the biggest impact: read-heavy or write-heavy?",
        content: [
          "Always ask about the ratio of reads to writes. A photo is uploaded once and viewed thousands of times, so a photo-sharing system is read-heavy, and caching and a CDN become the most important parts of the design. A logging system receives a constant stream of writes that are rarely read, so it is write-heavy, and the design centres on queues, batching and write-optimised storage. The same building blocks are available in both cases; the ratio tells you which ones to reach for.",
        ],
      },
      {
        heading: "Consistency or availability?",
        content: [
          "Ask which matters more when the two conflict. For a bank balance, showing a wrong value is unacceptable, so you favour consistency even if some requests fail during a network problem. For a like counter or a feed, showing a value that is a few seconds old is fine, so you favour availability and accept eventual consistency. This single answer decides your database choice and your replication strategy later in the interview.",
        ],
      },
      {
        heading: "Set the scope",
        content: [
          "An interview lasts about 45 minutes. You cannot design every feature, and trying to do so is a mistake. Propose a scope and get agreement: 'I will focus on upload, follow and feed. Shall we keep stories, reels and direct messages out of scope for now?' This shows that you can prioritise and manage time, and it lets you cover three features in depth instead of ten at the surface.",
        ],
      },
      {
        heading: "A worked example",
        content: [
          "Here is how the opening of 'Design Instagram' might sound after requirement gathering.",
        ],
        snippets: [
          {
            title: "Requirements summary written on the board",
            filename: "requirements.txt",
            code: `FUNCTIONAL
  1. Upload a photo with a caption
  2. Follow / unfollow a user
  3. View a feed of photos from followed users
  Out of scope: stories, reels, DMs, search

NON-FUNCTIONAL
  Scale        : 100M daily active users, 10M uploads per day
  Latency      : feed loads in < 200 ms (p99)
  Availability : 99.99%  (favour availability over consistency)
  Consistency  : eventual is acceptable for the feed
  Durability   : an uploaded photo must never be lost
  Workload     : read-heavy, roughly 100 reads per write

IMPLICATIONS
  -> CDN + object storage for photos
  -> cache and precomputed feeds for the read path
  -> replication across zones for availability`,
          },
        ],
      },
      {
        heading: "The five opening questions",
        content: [
          "You can start almost any system design interview with these five questions.",
        ],
        bullets: [
          "What are the core features we must support?",
          "How many users are there, and what latency do we need?",
          "Which matters more here: consistency or availability?",
          "Is the system read-heavy or write-heavy?",
          "What can we keep out of scope?",
        ],
      },
      {
        heading: "Common mistakes",
        content: [],
        bullets: [
          "Starting the diagram before asking a single question.",
          "Asking twenty questions and never starting. Five minutes is enough; then state your assumptions and move on.",
          "Collecting requirements and then ignoring them. Refer back to them when you justify each decision: 'because we said the feed can be eventually consistent, I will…'.",
          "Listing 'scalable, reliable, fast' without numbers. A requirement without a number cannot guide a decision.",
        ],
      },
    ],
    conclusion:
      "Functional requirements say what the system does; non-functional requirements say how well it must do it, and they are what actually shape the architecture. Before drawing anything, agree on features, scale, latency, consistency versus availability, the read-write ratio and the scope. Then use those answers as the reason behind every decision you make for the rest of the interview.",
  }),

  // ───────────────────────────── DAY 5 ─────────────────────────────
  sd({
    day: 5,
    kind: "Design",
    slug: "system-design-chat-app",
    title: "Design a Chat Application: WebSockets, Receipts and Ordering",
    description:
      "From polling to WebSockets, how single, double and blue ticks really work, what happens when the receiver is offline, and how messages cross between chat servers.",
    tags: ["Chat", "WebSocket", "Pub/Sub", "Real-Time"],
    intro: [
      "A chat application lets users exchange messages in real time, one-to-one or in groups, and shows the status of each message: sent, delivered and read. Messaging apps display these as a single tick, a double tick and blue ticks.",
      "The design combines real-time delivery, strict ordering, durability and a very large number of open connections. These notes cover the connection model, the path of a message, delivery receipts, offline users, routing between servers and ordering.",
    ],
    sections: [
      {
        heading: "1. Clarify the requirements",
        content: [],
        bullets: [
          "Functional: one-to-one chat and group chat with text messages.",
          "Functional: delivery status: sent, delivered and read.",
          "Functional: messages sent while the receiver is offline are delivered when they come back.",
          "Non-functional: real-time delivery, typically well under a second.",
          "Non-functional: no message is ever lost, and messages in a conversation appear in the correct order.",
          "Workload: every message is a write, so this system is write-heavy.",
          "Out of scope unless asked: media, voice and video calls, end-to-end encryption.",
        ],
      },
      {
        heading: "2. Estimate the scale",
        content: [
          "Assume 50 million daily active users sending 40 messages each. That is 2 billion messages per day, or roughly 20,000 per second on average and perhaps 60,000 at peak. At around 100 bytes per message, storage grows by about 200 GB per day. If 10 million users are online at once, the system holds 10 million open connections. If one chat server handles around 100,000 connections, that is at least 100 chat servers. These numbers tell us two things: we need a write-optimised message store, and connection management is a first-class problem.",
        ],
      },
      {
        heading: "3. Polling, long polling and WebSockets",
        content: [
          "With polling, each client asks the server for new messages on a timer. With millions of users asking every second, the server handles millions of requests per second, and almost all of them receive the answer 'nothing new.' It wastes server capacity, drains the phone's battery, and still delivers messages up to a second late.",
          "Long polling improves this: the server holds the request open until a message arrives. It reduces empty responses but still requires a new request for every message, and it is awkward for sending data in both directions.",
          "The right tool is a WebSocket. The client opens one connection to a chat server and keeps it open. It is persistent and bidirectional: the client can send at any time, and the server can push a message to the client the moment it arrives, with no request needed.",
        ],
      },
      {
        heading: "4. High-level design",
        content: [
          "Clients connect to stateful chat servers over WebSockets. Everything else, such as login, profiles and group management, goes through ordinary stateless HTTP services.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Alice --WebSocket--> Chat server 1 ---+                +--- Chat server 2 --WebSocket--> Bob
                         |           |                |          ^
                         |           v                v          |
                         |      +--------------------------+     |
                         |      |  Pub/Sub (Redis / Kafka) | ----+
                         |      +--------------------------+
                         v
              +---------------------+     +-----------------------------+
              |  Message store      |     |  Session registry (Redis)   |
              |  (Cassandra-style)  |     |  userId -> chat server id   |
              +---------------------+     +-----------------------------+
                         |
                         v  receiver offline
              Push notification service (APNs / FCM)`,
          },
          {
            title: "Message table (wide-column store)",
            filename: "schema.txt",
            code: `messages
-----------------------------------------------------------
conversation_id   BIGINT     -- partition key
sequence_no       BIGINT     -- clustering key, ascending
message_id        UUID       -- generated by the client, used for de-duplication
sender_id         BIGINT
body              TEXT
created_at        TIMESTAMP
PRIMARY KEY (conversation_id, sequence_no)

Query: "latest 50 messages of a conversation" = one partition, one range scan`,
          },
        ],
      },
      {
        heading: "5. The life of a message, and the three ticks",
        content: [
          "Alice sends a message to Bob. Her app sends it over the WebSocket with a client-generated message ID. The chat server writes it to the message store and only then sends an acknowledgement back to Alice. Her app shows a single tick: the server has the message and it will not be lost.",
          "The server then delivers the message to Bob's device. Bob's app sends an acknowledgement that it received the message. The server forwards that event to Alice, and her app shows a double tick: delivered.",
          "When Bob opens the conversation, his app sends a read event. The server forwards it to Alice, and the ticks turn blue. These acknowledgements are called delivery receipts, and they are just small messages flowing in the opposite direction.",
          "The important ordering is store first, then acknowledge. If the server acknowledged before writing and then crashed, Alice would see a tick for a message that no longer exists.",
        ],
      },
      {
        heading: "6. Offline receivers",
        content: [
          "If Bob has no active connection, the message is already safe in the message store, marked as undelivered for him. The system sends a push notification through the platform's push service so that his phone shows an alert. When Bob's app comes online and reconnects, it tells the server the last sequence number it has for each conversation, and the server sends everything after that. The same mechanism handles a brief network drop and a week-long absence.",
        ],
      },
      {
        heading: "7. Routing between chat servers",
        content: [
          "With a hundred chat servers, Alice and Bob are almost certainly connected to different ones. Chat server 1 needs to know where Bob is. A session registry, typically in Redis, maps each online user to the chat server holding their connection. It is updated on connect and disconnect, with a heartbeat and TTL so that entries for crashed servers expire.",
          "To hand the message over, servers use publish and subscribe. Each chat server subscribes to its own channel. Chat server 1 looks up Bob in the registry, finds chat server 2, and publishes the message to that server's channel. Chat server 2 receives it and pushes it down Bob's WebSocket.",
        ],
      },
      {
        heading: "8. Ordering and duplicates",
        content: [
          "Networks do not guarantee that messages arrive in the order they were sent, and clocks on phones cannot be trusted. So the server assigns each message a sequence number that increases within its conversation. Clients sort by sequence number, and a gap in the numbers tells a client that it is missing a message and should fetch it.",
          "Clients retry when they do not receive an acknowledgement, so the server may see the same message twice. The client-generated message ID lets the server recognise the duplicate and return the original acknowledgement instead of storing it again. This makes sending idempotent.",
        ],
      },
      {
        heading: "9. Group chat",
        content: [
          "For a group, the server stores the message once in the group's conversation and then fans it out to each member: for every member, look up their chat server and deliver, or mark for push if offline. This works well for groups of a few hundred members. For very large groups or channels with hundreds of thousands of members, fan-out on every message is too expensive, and clients instead pull new messages when they open the group.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Presence (online and last seen): driven by heartbeats on the WebSocket and stored with a TTL; publish changes only to users who are currently viewing that contact.",
          "Load balancing: WebSocket connections are long-lived, so balance by least connections and drain servers gracefully before deployments.",
          "Storage: a write-optimised wide-column store fits the workload, partitioned by conversation so that a conversation's history is a single range read.",
          "Media: upload files to object storage and send only the URL in the message.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: real-time, ordered, no message loss, write-heavy.",
          "Connection: WebSocket, not polling.",
          "Message store and receipts: persist first, then sent, delivered and read acknowledgements.",
          "Offline users: messages stay pending, a push notification is sent, the client syncs on reconnect.",
          "Scale: session registry, pub/sub between chat servers, per-conversation sequence numbers.",
        ],
      },
    ],
    conclusion:
      "A chat system keeps one persistent WebSocket per client so the server can push messages instantly. Each message is stored before it is acknowledged, receipts travel back as small events, offline users are covered by pending messages and push notifications, a session registry with pub/sub routes messages between servers, and per-conversation sequence numbers keep everything in order.",
  }),
];
