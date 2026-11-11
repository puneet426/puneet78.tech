import type { BlogPost } from "../blogData";
import { sd } from "./helper";

export const PART_4: BlogPost[] = [
  // ───────────────────────────── DAY 16 ─────────────────────────────
  sd({
    day: 16,
    kind: "Fundamentals",
    slug: "system-design-sharding-and-replication",
    title: "Sharding and Replication: Scaling a Database Beyond One Machine",
    description:
      "Replication scales reads and provides failover; sharding scales writes and storage. Covers replication lag, read-your-writes, shard keys, hot shards and resharding.",
    tags: ["Databases", "Sharding", "Replication", "Scalability"],
    intro: [
      "When a database becomes slow as usage grows, there are two fundamental techniques for scaling it: replication and sharding. They are often mentioned together, but they solve different problems.",
      "Replication keeps copies of the same data on several machines. Sharding splits the data so that each machine holds a different part. Choosing between them starts with one question: is the bottleneck reads, writes or storage?",
    ],
    sections: [
      {
        heading: "Diagnose first",
        content: [
          "Before adding machines, identify what is actually limiting the database.",
        ],
        bullets: [
          "Too many read queries for one server: add replicas (and a cache).",
          "Too many writes for one server: replicas do not help, because every replica must apply every write. The data must be sharded.",
          "Too much data for one server's disk or memory: again sharding, since every replica stores the full dataset.",
          "Slow individual queries: often an indexing or query problem, not a scaling problem. Fix that first.",
        ],
      },
      {
        heading: "Replication: leader and followers",
        content: [
          "In the most common arrangement, one node is the leader (also called primary). All writes go to the leader. The leader records each change in a log and sends it to the followers (replicas), which apply the same changes in the same order. Read queries can be served by any follower.",
          "Replication provides three things. Read capacity grows with the number of followers. Availability improves, because if the leader fails a follower can be promoted to leader; this is called failover. And copies in other locations protect against the loss of a machine or a data centre.",
        ],
      },
      {
        heading: "Synchronous versus asynchronous replication",
        content: [
          "With synchronous replication, the leader waits for a follower to confirm that it has the change before telling the client the write succeeded. No acknowledged write is lost if the leader crashes, but each write is slower, and a slow or unreachable follower can stall writes.",
          "With asynchronous replication, the leader acknowledges the write immediately and ships the change afterwards. Writes are fast, but a follower may be slightly behind, and if the leader crashes before a change is shipped, that change can be lost. Many systems use a middle ground, where one follower is synchronous and the rest are asynchronous.",
        ],
      },
      {
        heading: "Replication lag and read-your-writes",
        content: [
          "With asynchronous replication there is a delay between a write on the leader and its appearance on a follower. This delay is replication lag. It is usually milliseconds, but it can grow to seconds under load.",
          "The visible symptom: a user updates their profile, the page reloads, the read is served by a follower that has not yet received the change, and the user sees the old data. To the user it looks as if the update was lost.",
          "The fix is read-your-writes consistency. After a user makes a change, that user's reads are sent to the leader for a short period, or the reads are routed to a follower only if it has caught up to the position of that write. Other users can continue reading from followers, where a small delay is harmless.",
        ],
      },
      {
        heading: "Failover and split brain",
        content: [
          "Failover has its own risks. The system must detect that the leader is truly dead and not merely slow, choose the most up-to-date follower, and redirect writes to it. If the old leader comes back and still believes it is the leader, two nodes accept writes and the data diverges. This situation is called split brain. It is prevented by requiring a majority of nodes (a quorum) to agree on who the leader is, and by fencing the old leader so that it cannot accept writes.",
          "Other replication topologies exist. Multi-leader replication accepts writes at several nodes and must resolve conflicts. Leaderless replication, used by Dynamo-style databases, lets any replica accept writes and uses quorums on read and write.",
        ],
      },
      {
        heading: "Sharding",
        content: [
          "Sharding, also called horizontal partitioning, divides the rows of a dataset across several databases called shards. Each shard holds a subset of the data and handles the reads and writes for that subset. Write throughput and storage now grow with the number of shards. In practice each shard is itself replicated, so a production topology is several shards, each with a leader and followers.",
        ],
        snippets: [
          {
            title: "Sharding and replication together",
            filename: "topology.txt",
            code: `                         Application
                              |
                     Shard router / proxy
                 shard = hash(user_id) -> shard map
          +-------------------+-------------------+
          v                   v                   v
      Shard 0             Shard 1             Shard 2
   Leader (writes)     Leader (writes)     Leader (writes)
    |         |         |         |         |         |
 Follower  Follower  Follower  Follower  Follower  Follower   (reads, failover)`,
          },
        ],
      },
      {
        heading: "Sharding strategies",
        content: [],
        bullets: [
          "Hash-based: shard = hash(key) mod N. Spreads data evenly, but range queries across keys must touch every shard, and changing N moves most keys.",
          "Range-based: each shard owns a range of keys, for example user IDs 1 to 1 million. Range scans are efficient, but ranges can become uneven and recent data often concentrates on one shard.",
          "Directory-based: a lookup table records which shard holds each key or tenant. Very flexible, at the cost of an extra lookup and a critical dependency on the directory.",
          "Geographic: data is placed by region, keeping it close to users and helping with data residency rules. Regions are rarely equal in size, so load can be uneven.",
        ],
      },
      {
        heading: "Choosing the shard key",
        content: [
          "The shard key decides everything about how well sharding works. A good key has high cardinality, distributes data and traffic evenly, and matches the most common query so that a typical request touches one shard only.",
          "For user-centric data, the user ID is usually a good shard key: all of a user's rows are on one shard, so the common query 'fetch this user's data' is a single-shard operation. A poor key is one with few distinct values or a skewed distribution, such as country, where one shard receives most of the load.",
        ],
      },
      {
        heading: "Hot shards",
        content: [
          "Even with a reasonable key, traffic may not be even. If all data for one very popular account lives on one shard, that shard receives far more traffic than the others. This is a hot shard, and it becomes the bottleneck for the whole system while other shards sit idle.",
        ],
        bullets: [
          "Choose a key that spreads the hot entity, for example sharding posts by post ID instead of author ID.",
          "Split the hot key further by adding a suffix (key salting), so that one logical key is spread over several partitions.",
          "Give exceptionally large tenants a dedicated shard.",
          "Put a cache in front of hot reads.",
        ],
      },
      {
        heading: "Resharding",
        content: [
          "Eventually more shards are needed. With hash mod N, changing N from 4 to 5 changes the result for most keys, so almost all the data has to move between shards. On a live system that is slow and risky.",
          "Consistent hashing solves this: adding a shard moves only about one N-th of the keys. A related technique is to create many more logical partitions than physical servers from the start (for example 1,024 partitions on 4 servers) and move whole partitions when servers are added. Consistent hashing is covered in detail later in this series.",
        ],
      },
      {
        heading: "The costs of sharding",
        content: [],
        bullets: [
          "Cross-shard joins are not available; data must be denormalised or joined in the application.",
          "Transactions across shards need distributed protocols such as two-phase commit or sagas.",
          "Queries that do not include the shard key must be sent to every shard and merged (scatter-gather).",
          "Unique constraints and auto-increment IDs no longer work globally; a distributed ID generator is needed.",
          "Operations become harder: backups, schema changes and rebalancing all happen per shard.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "First ask whether the problem is reads, writes or storage.",
          "Reads: replication with a leader and followers.",
          "Writes and storage: sharding by a well-chosen shard key.",
          "Replication lag is handled with read-your-writes consistency.",
          "Watch for hot shards, and use consistent hashing so that resharding moves little data.",
        ],
      },
    ],
    conclusion:
      "Replication copies the same data to several nodes to scale reads and survive failures, at the cost of replication lag. Sharding splits data across nodes to scale writes and storage, at the cost of cross-shard queries and operational complexity. The shard key determines whether load is even, and consistent hashing keeps resharding manageable. Because sharding is hard to undo, it is the last step after indexing, caching and replication.",
  }),

  // ───────────────────────────── DAY 17 ─────────────────────────────
  sd({
    day: 17,
    kind: "Design",
    slug: "system-design-payment-system",
    title: "Design a Payment System: Idempotency, State Machines and Reconciliation",
    description:
      "Why a timeout is not a failure, how idempotency keys prevent double charges, and how a state machine, a double-entry ledger and reconciliation keep money correct.",
    tags: ["Payments", "Idempotency", "Consistency", "Ledger"],
    intro: [
      "A payment system moves money from a customer to a merchant through external parties such as banks and card networks. Unlike most systems, its primary requirement is not speed or scale but correctness: money must never be duplicated and never be lost.",
      "The difficult cases are all partial failures. A request to the bank times out: did the payment happen or not? Simply sending the request again is how customers get charged twice. These notes explain how payment systems handle uncertainty safely.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: initiate a payment for an order, query its status, and issue refunds.",
          "Functional: receive asynchronous results from the payment service provider (PSP) or bank.",
          "Non-functional: strong consistency. A payment is processed exactly once in effect; no double charge and no lost money.",
          "Non-functional: durability and auditability. Every movement of money is recorded permanently and can be traced.",
          "Non-functional: high availability matters, but when availability and correctness conflict, correctness wins.",
          "Security: card data is handled by a compliant provider and represented by tokens in our system.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 10 million payments per day, about 100 per second on average and perhaps 1,000 per second at a peak such as a sale. These volumes are modest compared with a feed or a chat system. A relational database handles them comfortably, which is convenient because relational transactions are exactly what the problem needs. The difficulty of a payment system is in its guarantees, not its throughput.",
        ],
      },
      {
        heading: "3. API",
        content: [],
        snippets: [
          {
            title: "Payment API",
            filename: "api.http",
            code: `POST /api/v1/payments
Headers:  Idempotency-Key: 5b1f0c9e-6a2d-4c57-9a41-2f6e1d0c77aa
Body:     { "orderId": "o_8841", "amount": 149900, "currency": "INR",
            "paymentMethodToken": "tok_3fa9" }
Response: 201 { "paymentId": "pay_1207", "status": "PENDING" }

GET  /api/v1/payments/pay_1207
Response: 200 { "status": "SUCCESS" }

POST /api/v1/payments/pay_1207/refunds
Headers:  Idempotency-Key: ...
Body:     { "amount": 149900 }

POST /webhooks/psp            <- provider notifies us of the final result
Body:     { "reference": "pay_1207", "status": "SUCCESS", "signature": "..." }

Note: amounts are integers in the smallest currency unit (paise), never floats.`,
          },
        ],
      },
      {
        heading: "4. The payment state machine",
        content: [
          "A payment is modelled as a state machine with a small set of states and strictly defined transitions. It starts as INITIATED when the record is created, becomes PENDING when the request has been sent to the provider, and ends in SUCCESS or FAILED. Refunds add further states.",
          "The PENDING state is essential. It represents honest uncertainty: we have asked the bank and do not yet know the outcome. The familiar situation of 'amount debited but merchant has not received it' is a payment in the PENDING state: the bank has debited the customer, and the final confirmation has not yet reached the merchant's system. Terminal states never change; a SUCCESS payment cannot move back to PENDING or to FAILED.",
        ],
        snippets: [
          {
            title: "States and transitions",
            filename: "states.txt",
            code: `INITIATED --request sent--> PENDING --provider confirms--> SUCCESS --> REFUND_PENDING --> REFUNDED
                               |
                               +------provider rejects--> FAILED
                               |
                               +------no answer---------> stays PENDING
                                                          (status check / webhook / reconciliation
                                                           will resolve it; never guessed)`,
          },
        ],
      },
      {
        heading: "5. A timeout is not a failure",
        content: [
          "Suppose we send a charge request to the provider and receive no response within the time limit. There are three possibilities: the request never arrived; it arrived and failed; or it arrived, the customer was charged, and only the response was lost. From our side these are indistinguishable.",
          "Treating the timeout as a failure and telling the user to pay again risks a double charge. Treating it as a success risks shipping goods that were never paid for. The correct action is to leave the payment in PENDING and find out the truth: call the provider's status API using our payment reference, and wait for the provider's webhook. Only when the provider reports a definite result does the state change.",
          "If the final result is a failure but the customer's account was debited, the provider or bank reverses the debit automatically. If our system finds a successful charge for an order that was cancelled in the meantime, it issues a refund.",
        ],
      },
      {
        heading: "6. Idempotency",
        content: [
          "Retries are unavoidable: the user double-clicks, the mobile app retries on a poor network, a service retries after a timeout. An operation is idempotent if performing it several times has the same effect as performing it once. Payment creation is made idempotent with an idempotency key.",
          "The client generates a unique key for each payment attempt and sends it with the request. The server stores the key, under a unique constraint, together with the request and its result. When a request arrives with a key that already exists, the server does not create a new payment; it returns the stored result of the original request. The same key is passed on to the provider, which applies the same rule on its side, so that a retried call to the provider also cannot charge twice.",
          "The key is generated by the client, because only the client knows that two requests are the same attempt. The unique constraint in the database is what makes the check safe when two identical requests arrive at the same moment.",
        ],
        snippets: [
          {
            title: "Idempotent payment creation",
            filename: "idempotency.sql",
            code: `CREATE TABLE payments (
  id               BIGINT PRIMARY KEY,
  idempotency_key  VARCHAR(64) NOT NULL UNIQUE,
  order_id         BIGINT NOT NULL,
  amount           BIGINT NOT NULL,          -- smallest currency unit
  currency         CHAR(3) NOT NULL,
  status           VARCHAR(20) NOT NULL,     -- INITIATED | PENDING | SUCCESS | FAILED
  psp_reference    VARCHAR(64),
  created_at       TIMESTAMP NOT NULL,
  updated_at       TIMESTAMP NOT NULL
);

-- First request: the row is inserted, processing continues.
-- Retry with the same key: the insert violates the UNIQUE constraint,
-- so the service reads the existing row and returns its current status.
INSERT INTO payments (id, idempotency_key, order_id, amount, currency, status, ...)
VALUES (...);`,
          },
        ],
      },
      {
        heading: "7. High-level design",
        content: [
          "The payment service owns the payment records and the state machine. It talks to external providers through an adapter, records money movements in a ledger, and informs other services of results through events.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Client --> Order service --> Payment service ----------> PSP / bank
                                 |    ^                      |
                                 |    +------ webhook -------+   (signed, may arrive twice)
                                 v
                    +---------------------------+
                    | Payments DB (SQL, ACID)   |
                    |  payments, ledger_entries |
                    |  outbox                   |
                    +-------------+-------------+
                                  |
                 Outbox publisher v
                          Message queue --> Order service (mark paid)
                                        --> Notification service

 Status-check worker : polls the PSP for payments stuck in PENDING
 Reconciliation job  : daily, compares our records with the PSP settlement file`,
          },
        ],
      },
      {
        heading: "8. The double-entry ledger",
        content: [
          "Balances are not stored as a single number that is overwritten. Money movements are recorded in a double-entry ledger, the same principle used in accounting for centuries. Every transaction produces at least two entries: a debit from one account and a credit to another, of equal amounts. The sum of all entries is always zero.",
          "The ledger is append-only. Entries are never updated or deleted; a correction is a new pair of entries that reverses the earlier one. This gives a complete audit trail, and any account's balance can be recomputed from its entries. If the debits and credits ever fail to balance, something is wrong and it is detected immediately.",
        ],
        snippets: [
          {
            title: "Ledger entries for one payment of 1,499.00",
            filename: "ledger.txt",
            code: `entry_id  txn_id   account             debit     credit
---------------------------------------------------------
9001      t_551    customer:42        149900
9002      t_551    merchant:17                   146900
9003      t_551    platform:fees                   3000
---------------------------------------------------------
                    totals            149900     149900    <- always equal`,
          },
        ],
      },
      {
        heading: "9. Reconciliation",
        content: [
          "Even with all these safeguards, two independent systems can disagree: a webhook was never delivered, a bug skipped a state change, or the provider made an adjustment. Reconciliation is the periodic process of comparing our records with the provider's records. Each day the provider supplies a settlement file listing every transaction it processed. A job matches that file against our payments and ledger.",
          "Any mismatch is flagged: a payment we hold as PENDING that the provider settled, a payment we hold as SUCCESS that the provider does not know, or a difference in amounts. Most cases are corrected automatically, and the rest go to a manual review queue. Reconciliation is the final safety net that guarantees the books are eventually correct.",
        ],
      },
      {
        heading: "10. Additional considerations",
        content: [],
        bullets: [
          "Webhooks are delivered at least once, so the handler must be idempotent, verify the signature, and ignore transitions out of a terminal state.",
          "Updating the payment and publishing the event must not diverge. The transactional outbox pattern writes the event to an outbox table in the same database transaction and publishes it afterwards.",
          "Across services (order, payment, inventory), a saga with compensating actions such as a refund replaces a distributed transaction.",
          "Card data is tokenised by the provider; our systems store only tokens, which keeps most of the system out of compliance scope.",
          "Retries to the provider use exponential backoff and are limited; after that the status-check worker takes over.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: correctness over speed; no double charge, no lost money.",
          "Model each payment as a state machine with a PENDING state.",
          "On timeout, check the status first; then retry or reverse. Never assume.",
          "Idempotency keys make every create and retry safe.",
          "A double-entry ledger records money, and daily reconciliation catches whatever slipped through.",
        ],
      },
    ],
    conclusion:
      "Payment systems are designed around uncertainty. A state machine with an explicit pending state records what is known, status checks and webhooks resolve timeouts instead of guessing, idempotency keys make retries harmless, a double-entry ledger keeps an auditable record of every movement, and reconciliation with the provider guarantees that discrepancies are found and corrected.",
  }),

  // ───────────────────────────── DAY 18 ─────────────────────────────
  sd({
    day: 18,
    kind: "Fundamentals",
    slug: "system-design-cap-theorem",
    title: "The CAP Theorem Explained Correctly",
    description:
      "What consistency, availability and partition tolerance really mean, why partition tolerance is not optional, how CP and AP systems behave, and what PACELC adds.",
    tags: ["CAP Theorem", "Distributed Systems", "Consistency", "Fundamentals"],
    intro: [
      "The CAP theorem is one of the most quoted and most misquoted ideas in distributed systems. The popular summary is 'consistency, availability, partition tolerance: pick any two'. That summary is misleading, because it suggests three equal options and a free choice among them.",
      "The accurate statement is narrower and more useful: when a network partition occurs, a distributed system must choose between consistency and availability. These notes define the three terms precisely and show how the choice appears in real designs.",
    ],
    sections: [
      {
        heading: "The three properties",
        content: [],
        bullets: [
          "Consistency (C): every read returns the most recent successful write, or an error. All nodes appear to hold the same data at the same time. This is stronger than, and different from, the C in ACID.",
          "Availability (A): every request sent to a node that has not crashed receives a non-error response, although the response may not contain the latest data.",
          "Partition tolerance (P): the system continues to operate even when the network drops or delays messages between nodes, splitting them into groups that cannot communicate.",
        ],
      },
      {
        heading: "Why partition tolerance is not optional",
        content: [
          "A network partition is not a design choice; it is a fault that happens. Cables are cut, switches fail, a data centre loses its link, a node pauses long enough to be considered unreachable. Any system that stores data on more than one machine will eventually experience a partition.",
          "A system that 'chooses CA' would be one that stops working correctly whenever the network misbehaves, which is not a property anyone can rely on. The only true CA system is a single node, and that is not a distributed system. So for any distributed data store, P is a given, and the real question is what the system does about C and A when a partition happens.",
        ],
      },
      {
        heading: "The choice during a partition",
        content: [
          "Consider two replicas, N1 and N2, holding the same record, with a network failure between them. A client writes a new value to N1. N1 cannot send it to N2. Now another client reads the record from N2. There are only two possibilities.",
          "N2 can answer with the value it has. The system stays available, but the answer is stale, so consistency is lost. Or N2 can refuse to answer because it cannot confirm that it has the latest value. The system stays consistent, but that request fails, so availability is lost. There is no third option that gives both, and this is what the theorem states.",
        ],
        snippets: [
          {
            title: "A partition between two replicas",
            filename: "partition.txt",
            code: `   Client A                               Client B
      | write x = 2                           | read x
      v                                       v
   +------+        network partition       +------+
   |  N1  |  ----------  X  -------------  |  N2  |
   | x=2  |     (replication blocked)      | x=1  |
   +------+                                +------+

   CP behaviour: N2 rejects the read (or N1 rejects the write)  -> correct, but unavailable
   AP behaviour: N2 returns x = 1                               -> available, but stale`,
          },
        ],
      },
      {
        heading: "CP systems",
        content: [
          "A CP system chooses consistency. During a partition, the side that cannot reach a majority of nodes stops accepting writes, and often reads, and returns errors or times out. When the partition heals, there is nothing to reconcile, because no conflicting data was accepted.",
          "This is the right choice when a wrong answer is worse than no answer: account balances, payments, inventory and seat booking, distributed locks, leader election and configuration. Coordination services such as ZooKeeper and etcd, and databases that replicate through consensus protocols, behave this way.",
        ],
      },
      {
        heading: "AP systems",
        content: [
          "An AP system chooses availability. During a partition every node keeps accepting reads and writes using the data it has. Replicas diverge for a while. When the partition heals, they exchange updates and converge to the same state. This model is called eventual consistency: if no new writes arrive, all replicas eventually return the same value.",
          "This is the right choice when a slightly stale answer is acceptable and an error is not: social feeds, like and view counts, product catalogues, shopping carts, DNS. Dynamo-style databases such as Cassandra are typically run in this mode.",
          "Divergent writes must be reconciled. Common strategies are last-write-wins based on timestamps, which is simple but can silently discard an update; version vectors, which detect conflicts and let the application merge them; and CRDTs, data types designed so that concurrent updates always merge deterministically.",
        ],
      },
      {
        heading: "It is not a single switch",
        content: [
          "CAP is frequently applied too coarsely. Three refinements matter in practice.",
        ],
        bullets: [
          "The choice applies only during a partition. When the network is healthy, a system can provide both consistency and availability.",
          "The choice can differ per operation. In an e-commerce system, browsing the catalogue can be AP while placing the order and charging the card is CP.",
          "Many databases are tunable. With N replicas, a write acknowledged by W replicas and a read that consults R replicas are guaranteed to overlap when R + W > N, which gives strong consistency; smaller values give more availability and lower latency.",
        ],
        snippets: [
          {
            title: "Quorum settings with N = 3 replicas",
            filename: "quorum.txt",
            code: `W = 2, R = 2   R + W = 4 > 3   reads always see the latest write; tolerates 1 node down
W = 3, R = 1   R + W = 4 > 3   fast reads; a write fails if any replica is down
W = 1, R = 1   R + W = 2 <= 3  fastest and most available; reads may be stale`,
          },
        ],
      },
      {
        heading: "PACELC: the trade-off when nothing is broken",
        content: [
          "CAP says nothing about normal operation, which is most of the time. The PACELC formulation completes the picture: if there is a Partition, choose between Availability and Consistency; Else, choose between Latency and Consistency.",
          "Even with a healthy network, keeping replicas strictly consistent means waiting for them to acknowledge each write, which adds latency. Replicating asynchronously responds faster but allows stale reads. A system that favours availability and low latency is described as PA/EL; one that favours consistency in both situations is PC/EC. This latency-versus-consistency trade-off is the one engineers face every day, and mentioning it shows a deeper understanding than CAP alone.",
        ],
      },
      {
        heading: "Applying it in a design",
        content: [
          "In a design discussion, CAP is used by asking, for each kind of data: what should happen if replicas cannot talk to each other? If showing old data is harmless, prefer availability and accept eventual consistency. If acting on old data causes damage, prefer consistency and accept that some requests will fail during a partition. Then choose the database and its replication settings to match.",
        ],
        bullets: [
          "Bank transfer, payment, stock decrement at checkout: consistency.",
          "Feed, likes, comments, view counts, recommendations: availability.",
          "User session and cart: usually availability, with merge on conflict.",
          "Leader election, locks, unique username registration: consistency.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Partitions will happen, so P is mandatory for a distributed system.",
          "During a partition the choice is between C and A.",
          "CP: reject requests to stay correct. Use for money, inventory, locks.",
          "AP: keep serving, converge later (eventual consistency). Use for feeds and counters.",
          "PACELC: without a partition the trade-off is latency versus consistency.",
        ],
      },
    ],
    conclusion:
      "The CAP theorem does not offer a choice of any two properties. Network partitions are unavoidable, so a distributed system must decide whether to stay consistent or stay available while a partition lasts. The decision is made per use case, many databases let you tune it, and PACELC extends it to the everyday trade-off between latency and consistency.",
  }),

  // ───────────────────────────── DAY 19 ─────────────────────────────
  sd({
    day: 19,
    kind: "Design",
    slug: "system-design-live-order-tracking",
    title: "Design Live Order Tracking: Location Ingestion and Real-Time Push",
    description:
      "How a delivery partner's GPS pings reach the customer's map within a second: write-heavy ingestion, latest location in memory, pub/sub per order and WebSocket push.",
    tags: ["Real-Time", "Location", "WebSocket", "Kafka"],
    intro: [
      "Live order tracking shows a customer where their delivery partner is on a map, moving in near real time, together with an estimated arrival time. Food delivery, e-commerce and ride apps all have this feature.",
      "The system has two halves with very different characteristics. Ingestion receives a continuous stream of GPS updates from every active delivery partner. Distribution pushes each update to the one or two people who care about that particular order. These notes cover both.",
    ],
    sections: [
      {
        heading: "1. Requirements",
        content: [],
        bullets: [
          "Functional: the delivery partner's app reports its location every few seconds while an order is active.",
          "Functional: the customer sees the partner's position on a map with an ETA, updated live.",
          "Functional: status events such as 'picked up' and 'arriving' are shown and can trigger notifications.",
          "Non-functional: low latency. An update should reach the customer within one or two seconds.",
          "Non-functional: high availability; losing an occasional location point is acceptable because the next one replaces it.",
          "Workload: write-heavy on ingestion; many long-lived connections on the delivery side.",
        ],
      },
      {
        heading: "2. Scale estimation",
        content: [
          "Assume 500,000 delivery partners are active at peak and each sends a location every 5 seconds. That is 100,000 location writes per second. Assume 1 million orders are in progress and their customers have the tracking screen open: 1 million concurrent connections for pushing updates. Each update is small, about 100 bytes, so ingestion traffic is around 10 MB per second. Stored as history, 100,000 points per second is roughly 8.6 billion points per day, close to 1 TB per day, which calls for a write-optimised store and a retention policy.",
        ],
      },
      {
        heading: "3. Two kinds of location data",
        content: [
          "The same GPS ping serves two purposes with different storage needs, and separating them is the first design decision.",
        ],
        bullets: [
          "Latest location: needed immediately, read frequently, overwritten every few seconds. It belongs in an in-memory store such as Redis, keyed by partner or order, with a TTL so that a silent device is noticed.",
          "Location history: needed later for route replay, distance-based payouts, disputes and analytics. It is append-only and large. It is written through a queue into a time-series or wide-column store, off the real-time path.",
        ],
      },
      {
        heading: "4. Ingestion path",
        content: [
          "The partner app sends pings to a location service. The service validates the ping, updates the latest location in Redis, and publishes the event to a stream such as Kafka, partitioned by order or partner ID so that the events of one order stay in sequence. It then returns immediately.",
          "Consumers of the stream do the slower work independently: one writes history in batches, one recalculates ETA, one checks geofences for alerts. Because these are decoupled by the stream, a slow history database never delays the live update. The app can also reduce load at the source by batching a few points per request and by sending less often when the vehicle is stationary.",
        ],
        snippets: [
          {
            title: "Messages",
            filename: "api.txt",
            code: `# Partner app -> Location service (HTTPS or a persistent connection)
POST /api/v1/locations
{ "orderId": "o_771", "partnerId": "d_42",
  "points": [ { "lat": 12.9716, "lng": 77.5946, "speed": 7.2, "heading": 85, "ts": 1767225600 } ] }

# Customer app -> Tracking gateway
WebSocket  wss://track.example.com/orders/o_771?token=<signed token>

# Tracking gateway -> Customer app (server push)
{ "type": "LOCATION", "lat": 12.9718, "lng": 77.5951, "heading": 85,
  "etaSeconds": 420, "ts": 1767225605 }
{ "type": "STATUS", "value": "PICKED_UP" }`,
          },
        ],
      },
      {
        heading: "5. Delivery path: push, not polling",
        content: [
          "The simple way for the customer app to get updates is to request the location every second. With a million customers tracking, that is a million requests per second, most of which return a position that has not changed since the previous request, because the partner only reports every five seconds.",
          "Instead, the customer app opens one persistent connection to a tracking gateway and the server pushes an update only when there is one. A WebSocket is the usual choice. Since the data flows in one direction only, server to client, Server-Sent Events is a simpler alternative that works over plain HTTP. When the app is first opened or reconnects, it fetches the latest location from Redis so that the map is correct immediately, and then receives live updates.",
        ],
      },
      {
        heading: "6. Routing an update to the right customer",
        content: [
          "There are many gateway servers, and the customer tracking a given order is connected to just one of them. The location service does not know which. The link between the two halves is publish and subscribe, with one channel (topic) per order.",
          "When a customer opens the tracking screen for order o_771, their gateway server subscribes to the channel for o_771. When a location update for that order arrives, it is published to that channel, and the pub/sub system delivers it only to the gateway servers that subscribed. The gateway then writes it to the customer's connection. When the order completes, the channel is closed and the subscription removed.",
        ],
        snippets: [
          {
            title: "Architecture",
            filename: "architecture.txt",
            code: `Partner app --GPS ping every ~5 s--> Location service
                                         |
                    +--------------------+---------------------+
                    v                                          v
        Redis: latest location (TTL)                Kafka: location events
        loc:order:o_771                                        |
                    ^                    +---------------------+------------------+
                    | initial fetch      v                     v                  v
                    |              History writer        ETA service       Geofence / alerts
                    |              (time-series DB)            |           ("arriving soon")
                    |                                          v
                    |                         Pub/Sub channel per order: order:o_771
                    |                                          |
              Tracking gateway (WebSocket servers) <-----------+   (only subscribed gateways)
                    |
                    v
              Customer app: map marker + ETA`,
          },
        ],
      },
      {
        heading: "7. Making the map look right",
        content: [
          "Raw GPS readings are noisy. A phone in a street with tall buildings can report a position inside a building or on a parallel road, and updates arrive only every few seconds. Two techniques make the display smooth and believable.",
          "Snap-to-road, or map matching, takes the raw points and aligns them to the most likely road segment on the map, removing jitter. Interpolation is done on the client: instead of jumping the marker from one reported position to the next, the app animates it along the road between the two points over the interval, so the vehicle appears to move continuously even though only one update arrives every five seconds.",
        ],
      },
      {
        heading: "8. ETA and geofence alerts",
        content: [
          "ETA is recalculated from the partner's current position, the remaining route and current traffic. It does not need to be recomputed on every ping; every 30 seconds or on a significant deviation from the route is sufficient, and the result is pushed over the same channel.",
          "Alerts such as 'your order is arriving' use geofencing. A virtual boundary, for example 300 metres around the delivery address, is defined when the order is created. As pings arrive, a consumer checks whether the partner has entered the boundary. Comparing geohash cells makes this check cheap. When the boundary is crossed for the first time, a notification event is emitted once.",
        ],
      },
      {
        heading: "9. Failure handling",
        content: [],
        bullets: [
          "Partner loses network: the app buffers points and sends them when the connection returns; the server uses timestamps to order them and ignores points older than the latest one for the live view.",
          "No pings for a while: the TTL on the latest location expires, and the customer app shows 'last updated a minute ago' instead of a misleading live marker.",
          "Customer connection drops: the app reconnects with backoff, fetches the latest location, and resubscribes. No replay is needed, since only the newest position matters.",
          "Gateway server fails: its connections are lost; clients reconnect through the load balancer to another gateway.",
          "Security: the tracking token is tied to the order and the customer, and expires when the order is completed.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Requirements: updates within a second or two, write-heavy ingestion, many open connections.",
          "Latest location in Redis with a TTL; history through Kafka into a time-series store.",
          "Deliver by server push over WebSocket or SSE, not by polling.",
          "Route updates with a pub/sub channel per order to the subscribed gateway.",
          "Polish: snap-to-road, client-side interpolation, periodic ETA, geofence alerts.",
        ],
      },
    ],
    conclusion:
      "Live tracking separates ingestion from distribution. GPS pings update an in-memory latest position and flow through a stream to history, ETA and alerting consumers. Customers hold a persistent connection and receive pushed updates routed through a per-order pub/sub channel. Map matching and interpolation turn sparse, noisy points into a smooth moving marker.",
  }),

  // ───────────────────────────── DAY 20 ─────────────────────────────
  sd({
    day: 20,
    kind: "Fundamentals",
    slug: "system-design-message-queues",
    title: "Message Queues: Asynchronous Processing, Kafka and Delivery Guarantees",
    description:
      "Why work is moved out of the request path, queue versus pub/sub, how Kafka partitions and consumer groups work, at-least-once delivery, idempotent consumers and dead letter queues.",
    tags: ["Message Queue", "Kafka", "Asynchronous", "Fundamentals"],
    intro: [
      "A message queue is a component that accepts messages from one part of a system and holds them until another part is ready to process them. The sender and the receiver do not need to be available at the same time, or work at the same speed.",
      "Queues appear in almost every design in this series: notifications, feeds, video transcoding, payments, tracking. These notes explain what they solve, the two messaging models, how Kafka works internally, and the guarantees that determine how consumers must be written.",
    ],
    sections: [
      {
        heading: "The problem: doing everything in the request",
        content: [
          "Consider an order placement endpoint. After saving the order it also sends a confirmation email, generates an invoice PDF, updates inventory, notifies the warehouse and records analytics, all before responding to the user.",
          "This synchronous design has three weaknesses. The response time is the sum of all the steps, so the user waits several seconds. If any one step fails, for instance the email provider is down, the whole request fails even though the order itself was saved. And during a traffic spike every downstream system receives the full load at once.",
        ],
      },
      {
        heading: "The solution: asynchronous processing",
        content: [
          "Only the essential work is done in the request: validate, save the order, and publish an 'order placed' message. The API responds immediately. Separate consumer services receive the message and perform the email, the invoice, the inventory update and the rest in the background.",
        ],
        bullets: [
          "Lower latency: the user waits only for the essential step.",
          "Decoupling: the order service does not know or care which services react to an order. New consumers can be added without changing it.",
          "Fault isolation: if the email service is down, messages wait in the queue and are processed when it recovers. The order flow is unaffected.",
          "Buffering (load levelling): a spike fills the queue instead of overwhelming consumers, which continue at their own steady rate.",
          "Independent scaling: more consumer instances are added for whichever task is falling behind.",
        ],
        snippets: [
          {
            title: "Before and after",
            filename: "architecture.txt",
            code: `SYNCHRONOUS
 Client --> Order API --> save order --> send email --> create invoice --> update inventory --> response
            (slow; any failure fails the whole request)

ASYNCHRONOUS
 Client --> Order API --> save order --> publish "OrderPlaced" --> response (fast)
                                              |
                                        +-----+------ topic: orders ------+
                                        v             v                   v
                                  Email service  Invoice service   Inventory service
                                  (each consumes independently, retries on its own)`,
          },
        ],
      },
      {
        heading: "Two messaging models",
        content: [
          "In the point-to-point model, also called a work queue, each message is delivered to exactly one consumer. Several workers read from the same queue and compete for messages, so the work is shared among them. This fits task distribution: resize this image, send this email. RabbitMQ and SQS are typical examples.",
          "In the publish-subscribe model, a message published to a topic is delivered to every subscriber. Each subscribing service receives its own copy and processes it independently. This fits event notification: an order was placed, and several services need to react. Kafka and cloud pub/sub services follow this model.",
        ],
      },
      {
        heading: "How Kafka works",
        content: [
          "Kafka is a distributed log. A topic is divided into partitions. Each partition is an ordered, append-only sequence of messages, and each message has a position called an offset. Producers append messages; a message with a key always goes to the same partition, chosen by hashing the key. Order is guaranteed within a partition, not across partitions. So if all events for one order must be processed in sequence, the order ID is used as the key.",
          "Consumers are organised into consumer groups. Within a group, each partition is assigned to exactly one consumer, so the group as a whole shares the work, and adding consumers increases throughput up to the number of partitions. Different groups are independent: the email service's group and the analytics group each read every message. In this way Kafka provides both models: work sharing inside a group, publish-subscribe across groups.",
          "Unlike a traditional queue, Kafka does not delete a message when it is consumed. Messages are retained for a configured period, and each group simply tracks its own offset. A consumer can therefore rewind and reprocess old messages, which is valuable after a bug fix or when a new service needs historical events. Partitions are replicated across brokers for durability.",
        ],
        snippets: [
          {
            title: "Topic, partitions and consumer groups",
            filename: "kafka.txt",
            code: `Topic "orders"  (key = orderId -> partition = hash(key) mod 3)

 Partition 0:  [o1-created] [o4-created] [o1-paid]    [o4-shipped]  -> offsets 0,1,2,3
 Partition 1:  [o2-created] [o2-paid]    [o5-created]
 Partition 2:  [o3-created] [o6-created] [o3-paid]

 Consumer group "email"      : consumer A <- P0, P1     consumer B <- P2
 Consumer group "analytics"  : consumer X <- P0, P1, P2

 * Events of one order share a partition, so they are consumed in order.
 * Each group keeps its own committed offset per partition.
 * A group can have at most as many active consumers as partitions.`,
          },
        ],
      },
      {
        heading: "Delivery guarantees",
        content: [],
        bullets: [
          "At-most-once: the message is acknowledged before it is processed. If the consumer crashes during processing, the message is lost. No duplicates, possible loss.",
          "At-least-once: the message is acknowledged after it is processed. If the consumer crashes after processing but before acknowledging, the message is delivered again. No loss, possible duplicates. This is the default in most systems.",
          "Exactly-once: each message takes effect once. It is hard to achieve end to end, and in practice it is obtained by combining at-least-once delivery with idempotent processing.",
        ],
      },
      {
        heading: "Idempotent consumers",
        content: [
          "Because at-least-once delivery produces duplicates, consumers must be idempotent: processing the same message twice must have the same effect as processing it once. Otherwise a redelivered 'order placed' message sends two emails or deducts inventory twice.",
          "The common techniques are to record the IDs of processed messages and skip any that have been seen; to use operations that are naturally idempotent, such as 'set status to PAID' in place of 'increment the count'; and to rely on unique constraints so that a duplicate insert is rejected.",
        ],
        snippets: [
          {
            title: "An idempotent consumer",
            filename: "consumer.js",
            code: `async function handle(message) {
  const { eventId, orderId } = message.value;

  // 1. Have we already processed this event?  (SET ... NX is atomic)
  const firstTime = await redis.set("processed:" + eventId, "1", "NX", "EX", 86400);
  if (!firstTime) return;                 // duplicate delivery -> skip

  // 2. Do the work
  await emailService.sendOrderConfirmation(orderId);

  // 3. The framework commits the offset only after this function returns.
  //    A crash before the commit causes redelivery, which step 1 absorbs.
}`,
          },
        ],
      },
      {
        heading: "Retries and the dead letter queue",
        content: [
          "When processing fails, the message is retried, with exponential backoff so that a struggling dependency is not hammered. Some messages will never succeed: the payload is malformed, or it refers to a record that does not exist. Such a message is called a poison message. If it is retried forever at the head of a partition, it blocks everything behind it.",
          "After a limited number of attempts, the message is moved to a dead letter queue (DLQ). The main flow continues, and the failed messages are kept for inspection. An alert on the DLQ size tells engineers that something needs attention, and after a fix the messages can be replayed.",
        ],
      },
      {
        heading: "Ordering, backpressure and monitoring",
        content: [
          "Global ordering across a whole topic would require a single partition and a single consumer, which does not scale. The practical approach is to require ordering only per entity and to use that entity's ID as the message key.",
          "The most important metric for a queue is consumer lag: how far the consumers are behind the newest message. Growing lag means messages are produced faster than they are consumed, and the response is to add consumers, add partitions, or speed up processing. A queue absorbs bursts, but it cannot fix a consumer that is permanently too slow.",
        ],
      },
      {
        heading: "When not to use a queue",
        content: [
          "A queue adds latency, operational work and eventual consistency. It is the wrong tool when the caller needs the result in order to respond, such as checking a password or validating that stock exists before confirming an order. Use a synchronous call when the answer is needed now, and a queue when the work can happen a moment later.",
        ],
      },
      {
        heading: "Interview summary",
        content: [],
        bullets: [
          "Move non-essential work out of the request: asynchronous processing with a queue.",
          "Benefits: decoupling, buffering of spikes, fault isolation, independent scaling.",
          "Models: point-to-point for task distribution, publish-subscribe for events.",
          "Kafka: topics, partitions keyed for ordering, consumer groups for parallelism.",
          "At-least-once delivery, idempotent consumers, retries with backoff and a dead letter queue.",
        ],
      },
    ],
    conclusion:
      "A message queue lets the request path do only what is essential and hands the rest to consumers that work independently. Kafka organises messages into partitioned, ordered logs read by consumer groups. Delivery is normally at-least-once, so consumers must be idempotent, and messages that keep failing are moved to a dead letter queue so that they do not block the rest.",
  }),
];
