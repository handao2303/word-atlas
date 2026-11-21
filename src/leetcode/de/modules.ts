/**
 * Data Engineering path. Lessons, concept cards and exercises are original to this app.
 * The module order follows the free DataExpert.io boot camp; "Go deeper" links point to the
 * DataExpert-io/data-engineer-handbook repository and its free lessons (no content is copied).
 */
import type { SqlExercise } from "../sql/lessons";

export interface ConceptCard {
  id: string;
  q: string;
  a: string;
}
export interface DeLink {
  label: string;
  href: string;
  kind: "handbook" | "lab" | "homework" | "video" | "reading";
}
export interface DeModule {
  id: string;
  title: string;
  blurb: string;
  track: "Foundations" | "Modeling" | "Processing" | "Analytics" | "Operations" | "Career";
  body: string;
  cards: ConceptCard[];
  exercises: SqlExercise[];
  links: DeLink[];
}

export const HANDBOOK = "https://github.com/DataExpert-io/data-engineer-handbook";
const H = `${HANDBOOK}/blob/main`;
const T = `${HANDBOOK}/tree/main`;
const M = `${T}/intermediate-bootcamp/materials`;
const MB = `${H}/intermediate-bootcamp/materials`;

export const DE_MODULES: DeModule[] = [
  {
    id: "foundations",
    title: "What data engineers build",
    blurb: "Pipelines, warehouses, batch vs streaming, ETL vs ELT.",
    track: "Foundations",
    body: `A data engineer moves data from where it is **produced** (apps, payments, sensors) to where it is **used** (dashboards, ML models, finance reports), and makes sure it arrives correct, on time and cheap enough.

**Two kinds of databases**

| | OLTP | OLAP |
| --- | --- | --- |
| serves | the app (one user, one row at a time) | analysts (millions of rows at once) |
| examples | Postgres, MySQL | BigQuery, Snowflake, Databricks, Redshift |
| design goal | fast writes, no duplication | fast scans and aggregates |

**Where data lands**
- *Data lake*: cheap files (Parquet) in object storage; anything goes.
- *Warehouse*: tables with schemas, SQL first.
- *Lakehouse*: warehouse features (ACID tables, time travel) on lake files, e.g. Delta Lake and Apache Iceberg.

**ETL vs ELT.** Classic ETL transforms data *before* loading it. Modern stacks load raw data first and transform inside the warehouse with SQL (ELT, often with dbt), because warehouse compute is elastic and raw data stays replayable.

**Batch vs streaming.** Batch runs on a schedule (hourly, daily) over a bounded chunk. Streaming processes events continuously with seconds of latency. Most companies are 90% batch; choose streaming only when someone acts on the data within minutes.

**The pipeline vocabulary** you will hear daily: source, ingestion, staging, transformation, serving layer, orchestration (Airflow, Dagster), backfill, SLA, lineage.

**Idempotency** is the one property to remember from day one: running the same pipeline for the same day twice must give the same result. Overwrite a partition instead of appending to it.`,
    cards: [
      { id: "f1", q: "OLTP vs OLAP in one line each?", a: "OLTP serves the application with many small reads and writes; OLAP serves analytics with large scans and aggregations over many rows." },
      { id: "f2", q: "Why have most teams moved from ETL to ELT?", a: "Warehouse compute is elastic and cheap enough to transform inside it, and keeping raw data loaded first makes pipelines replayable and easier to debug." },
      { id: "f3", q: "What does it mean for a pipeline to be idempotent?", a: "Running it again for the same input period produces exactly the same output, so retries and backfills are safe (e.g. overwrite a date partition instead of appending)." },
      { id: "f4", q: "When is streaming worth its extra complexity?", a: "When someone or something acts on the data within minutes (fraud checks, alerts, live pricing). Otherwise a batch job is simpler and cheaper." },
      { id: "f5", q: "Lake, warehouse, lakehouse: the difference?", a: "Lake = cheap files with no enforced schema; warehouse = managed SQL tables; lakehouse = open table formats (Delta, Iceberg) that add warehouse features on top of lake files." },
    ],
    exercises: [],
    links: [
      { label: "Handbook: getting started and roadmap", href: `${HANDBOOK}#getting-started`, kind: "handbook" },
      { label: "Beginner boot camp: introduction", href: `${H}/beginner-bootcamp/introduction.md`, kind: "handbook" },
      { label: "Software you need for the boot camps", href: `${H}/intermediate-bootcamp/software.md`, kind: "handbook" },
      { label: "Glossaries and design patterns (handbook resources)", href: `${HANDBOOK}#glossaries`, kind: "reading" },
    ],
  },
  {
    id: "dimensional",
    title: "Dimensional data modeling",
    blurb: "Dimensions, SCD type 2 and cumulative tables.",
    track: "Modeling",
    body: `**Dimensions** describe *who / what / where* (customer, product, store). **Facts** record *what happened* (an order, a click). Dimensional modeling arranges a warehouse around them, usually as a **star schema**: one fact table in the middle, dimension tables around it.

**Know your consumer.** Analysts want flat, easy tables; ML wants one row per entity with many features; other engineers want compact, nested data. Model for whoever queries it most.

**Slowly changing dimensions (SCD).** Attributes change: a customer moves city, a product changes price.

| type | what it keeps | trade-off |
| --- | --- | --- |
| 0 | never changes (birth date) | simplest |
| 1 | overwrite with the latest value | loses history, so old reports change |
| 2 | one row per version with \`start_date\`, \`end_date\`, \`is_current\` | full history, the standard choice |
| 3 | current + previous value in two columns | only one step of history |

SCD2 is idempotent and lets you ask "what was true on date X". You build it by detecting when a value changes between consecutive snapshots (\`LAG\`), then grouping each unchanged run into one row with its first and last date.

**Cumulative table design.** Instead of re-scanning all history every day, keep a table with one row per entity and fold *yesterday's cumulative table* with *today's new data* (\`FULL OUTER JOIN\`, \`COALESCE\`). You get first-seen date, last-seen date, lifetime totals and history arrays cheaply. The catch: you must backfill day by day, in order.

**Complex types.** \`ARRAY\` and \`STRUCT\` columns (Postgres, Spark, BigQuery) store one row per entity with nested history, which compresses well. \`UNNEST\` / \`explode\` flattens them again for analysts.`,
    cards: [
      { id: "d1", q: "Dimension vs fact?", a: "A dimension describes an entity (who/what/where) and changes slowly; a fact records an event or measurement at a point in time." },
      { id: "d2", q: "What columns make a table SCD type 2?", a: "One row per version of the entity with start_date, end_date (or NULL/far future) and usually an is_current flag." },
      { id: "d3", q: "Why is SCD type 1 dangerous for reporting?", a: "It overwrites history, so last year's report recomputed today gives a different answer." },
      { id: "d4", q: "How does a cumulative table update each day?", a: "FULL OUTER JOIN yesterday's cumulative rows with today's activity, COALESCE the fields, and append today's values to the history columns." },
      { id: "d5", q: "Main drawback of cumulative tables?", a: "Backfills must run sequentially, day by day, because each day depends on the previous day's output." },
      { id: "d6", q: "Key step to generate an SCD2 table from daily snapshots?", a: "Use LAG to flag rows where the tracked attribute changed, then group consecutive unchanged rows into streaks and take MIN/MAX date per streak." },
    ],
    exercises: [
      {
        id: "de-dim-1",
        prompt: "Cumulative customer table: for every customer with completed orders, return customer_id, first_order (date), last_order (date) and orders (count).",
        solution: "SELECT customer_id, MIN(order_date) AS first_order, MAX(order_date) AS last_order, COUNT(*) AS orders FROM orders WHERE status = 'completed' GROUP BY customer_id;",
      },
      {
        id: "de-dim-2",
        prompt: "Change detection (the core of SCD2): list orders where the customer used a different channel than on their previous order. Return customer_id, order_date, previous_channel, channel.",
        solution: "WITH x AS (SELECT customer_id, order_date, channel, LAG(channel) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS previous_channel FROM orders) SELECT customer_id, order_date, previous_channel, channel FROM x WHERE previous_channel IS NOT NULL AND previous_channel <> channel;",
      },
      {
        id: "de-dim-3",
        prompt: "SCD2-style streaks: for each customer, collapse consecutive orders on the same channel into one row with channel, start_date and end_date.",
        solution: "WITH x AS (SELECT customer_id, order_id, order_date, channel, CASE WHEN channel = LAG(channel) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) THEN 0 ELSE 1 END AS changed FROM orders), s AS (SELECT *, SUM(changed) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS streak FROM x) SELECT customer_id, channel, MIN(order_date) AS start_date, MAX(order_date) AS end_date FROM s GROUP BY customer_id, streak, channel;",
      },
    ],
    links: [
      { label: "Module materials (setup, SQL, visual notes)", href: `${M}/1-dimensional-data-modeling`, kind: "handbook" },
      { label: "Lab SQL: SCD generation and incremental SCD", href: `${M}/1-dimensional-data-modeling/lecture-lab`, kind: "lab" },
      { label: "Homework", href: `${MB}/1-dimensional-data-modeling/homework/homework.md`, kind: "homework" },
      { label: "Free lecture, day 1 (DataExpert.io)", href: "https://www.dataexpert.io/lesson/dimensional-data-modeling-lecture-day-1-yt", kind: "video" },
    ],
  },
  {
    id: "facts",
    title: "Fact data modeling",
    blurb: "Grain, additive measures and compact activity history.",
    track: "Modeling",
    body: `Fact tables are the biggest tables you own, often billions of rows, so small design choices cost real money.

**Start with the grain.** Write one sentence: "one row per *order line*" or "one row per *user per day*". Every column must be true at that grain. Mixing grains is the classic source of double counting.

**A good fact row answers** who (keys to dimensions), what (the action), when (timestamp, in UTC), where / how (channel, device) and how much (measures).

**Measures**
- *Additive*: can be summed across every dimension (revenue, quantity).
- *Semi-additive*: sums across some dimensions only (account balance sums across accounts, not across days).
- *Non-additive*: never sum (ratios, averages, distinct counts). Store the numerator and denominator and divide at query time.

**Three classic fact table types**

| type | one row per | example |
| --- | --- | --- |
| transaction | event | order line, click |
| periodic snapshot | entity per period | daily inventory, monthly balance |
| accumulating snapshot | process instance, updated as it moves | order: placed → paid → shipped → delivered |

**Shrinking facts.** Logs are huge. Common tricks:
- aggregate to the grain people actually query (daily per user);
- *datelist / bit-encoded activity*: one row per user with a 30-bit integer, bit *n* = active *n* days ago. "Active in the last 7 days" becomes a bit mask, and monthly actives come from one row per user instead of 30;
- *array metrics*: one row per user per month with an array of daily values.

**Facts vs dimensions blur.** "Is this user active today?" is a dimension computed from facts. Decide by how it is used, not by where it came from.`,
    cards: [
      { id: "fa1", q: "What is the grain of a fact table?", a: "The exact meaning of one row (e.g. one row per order line, or per user per day). Every column must be valid at that grain." },
      { id: "fa2", q: "Additive vs semi-additive vs non-additive measure?", a: "Additive sums over all dimensions (revenue); semi-additive over some but not time (balance); non-additive never sums (ratios, averages, distinct counts)." },
      { id: "fa3", q: "How should you store a ratio such as conversion rate?", a: "Store numerator and denominator as additive columns and divide at query time, so it can be re-aggregated correctly." },
      { id: "fa4", q: "Periodic vs accumulating snapshot?", a: "Periodic: one row per entity per period (daily balance). Accumulating: one row per process instance, updated as milestones happen (order lifecycle)." },
      { id: "fa5", q: "What is a datelist / bit-encoded activity table?", a: "One row per user holding an integer whose bits mark activity on each of the last N days; activity windows become bitwise checks." },
    ],
    exercises: [
      {
        id: "de-fact-1",
        prompt: "Daily fact table at the grain 'one row per day': order_date, completed orders and revenue (2 decimals), by date.",
        solution: "SELECT order_date, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS revenue FROM orders WHERE status = 'completed' GROUP BY order_date ORDER BY order_date;",
        ordered: true,
      },
      {
        id: "de-fact-2",
        prompt: "Non-additive measure done right: monthly average order value = SUM(amount) / COUNT(*) of completed orders, rounded to 2 decimals. Columns: month, aov, in month order.",
        solution: "SELECT strftime('%Y-%m', order_date) AS month, ROUND(SUM(amount) / COUNT(*), 2) AS aov FROM orders WHERE status = 'completed' GROUP BY month ORDER BY month;",
        ordered: true,
      },
      {
        id: "de-fact-3",
        prompt: "Array-style activity: one row per customer with their active months (completed orders) as a sorted comma-separated list. Columns: customer_id, active_months.",
        solution: "SELECT customer_id, GROUP_CONCAT(month, ',') AS active_months FROM (SELECT DISTINCT customer_id, strftime('%Y-%m', order_date) AS month FROM orders WHERE status = 'completed' ORDER BY customer_id, month) GROUP BY customer_id;",
      },
    ],
    links: [
      { label: "Module materials", href: `${M}/2-fact-data-modeling`, kind: "handbook" },
      { label: "Lab SQL: datelists and array metrics", href: `${M}/2-fact-data-modeling/lecture-lab`, kind: "lab" },
      { label: "Homework", href: `${MB}/2-fact-data-modeling/homework/homework.md`, kind: "homework" },
      { label: "Free lecture, day 1 (DataExpert.io)", href: "https://www.dataexpert.io/lesson/fact-data-modeling-day-1-lecture-yt", kind: "video" },
    ],
  },
  {
    id: "spark",
    title: "Spark fundamentals",
    blurb: "Partitions, shuffles, joins and skew.",
    track: "Processing",
    body: `Apache Spark splits a dataset into **partitions** and processes them in parallel on many machines. You describe *what* to compute (DataFrame API or Spark SQL); Spark builds a plan and runs it lazily when an *action* (\`write\`, \`count\`, \`collect\`) is called.

**The cluster.** A *driver* plans the job; *executors* run tasks, one task per partition. Common knobs: executor memory, executor cores, and \`spark.sql.shuffle.partitions\` (default 200).

**Narrow vs wide transformations**
- Narrow (\`filter\`, \`select\`, \`map\`): each output partition needs one input partition. Cheap.
- Wide (\`groupBy\`, \`join\`, \`distinct\`, \`orderBy\`): rows with the same key must meet, so data is **shuffled** across the network. Shuffles are where jobs get slow.

**Join strategies**

| strategy | when | cost |
| --- | --- | --- |
| broadcast hash join | one side is small (default threshold 10 MB) | no shuffle of the big side |
| sort-merge join | both sides big | shuffle + sort both |
| bucket join | both tables pre-bucketed on the join key with the same bucket count | no shuffle at query time |

**Skew.** If one key holds a huge share of the rows (a celebrity user, a NULL key), one task runs forever while the rest idle. Fixes: enable Adaptive Query Execution (\`spark.sql.adaptive.enabled\`, skew join handling), salt the hot key, or process it separately.

**Writing output.** \`sortWithinPartitions\` on low-cardinality columns before writing Parquet makes run-length encoding compress much better. Partition output folders by date so jobs can overwrite one day idempotently.

**Caching** (\`cache\` / \`persist\`) helps only when the same DataFrame is reused several times; otherwise it just consumes memory.`,
    cards: [
      { id: "s1", q: "What triggers a shuffle in Spark?", a: "Wide transformations that need rows with the same key together: groupBy, join (non-broadcast), distinct, orderBy, repartition." },
      { id: "s2", q: "When does Spark use a broadcast join?", a: "When one side is small enough (default under 10 MB, or hinted) to be copied to every executor, avoiding a shuffle of the large side." },
      { id: "s3", q: "What is data skew and one fix?", a: "A few keys hold most rows, so one task is much slower. Fix with AQE skew-join handling, salting the hot key, or handling it separately." },
      { id: "s4", q: "Why can bucketing make joins faster?", a: "Tables pre-partitioned on the join key into the same number of buckets can be joined bucket-to-bucket without a shuffle at query time." },
      { id: "s5", q: "Why sort within partitions before writing Parquet?", a: "Grouping equal values together improves run-length and dictionary encoding, so files get much smaller and faster to scan." },
      { id: "s6", q: "Transformation vs action?", a: "Transformations (select, filter, join) only build the plan lazily; actions (write, count, collect) actually execute it." },
    ],
    exercises: [],
    links: [
      { label: "Module materials (Docker setup, notebooks)", href: `${M}/3-spark-fundamentals`, kind: "handbook" },
      { label: "Homework", href: `${MB}/3-spark-fundamentals/homework/homework.md`, kind: "homework" },
      { label: "Homework: testing Spark jobs", href: `${MB}/3-spark-fundamentals/homework/homework_testing.md`, kind: "homework" },
    ],
  },
  {
    id: "streaming",
    title: "Real-time pipelines: Kafka and Flink",
    blurb: "Event time, watermarks, windows, exactly-once.",
    track: "Processing",
    body: `**Kafka** is a durable, ordered log. Producers append events to a **topic**; the topic is split into **partitions** (order is guaranteed only inside one partition, so choose the key carefully, e.g. \`user_id\`). Consumers in the same **consumer group** share the partitions and track their position with **offsets**, so they can replay from any point.

**Flink** reads those streams and computes continuously.

**Time is the hard part**
- *Processing time*: when the machine sees the event. Simple, but results change if the job lags.
- *Event time*: when the event happened (a timestamp in the event). Correct, but events arrive late and out of order.
- A **watermark** says "I believe all events up to time T have arrived". Windows close when the watermark passes their end. Late events after that are dropped, sent to a side output, or handled with allowed lateness.

**Windows**

| window | shape | example |
| --- | --- | --- |
| tumbling | fixed, non-overlapping | clicks per minute |
| sliding | fixed size, overlapping | 5-minute average every minute |
| session | closes after a gap of inactivity | one browsing session per user |

**State and guarantees.** Flink keeps state (counts, sessions) and snapshots it in **checkpoints**. With replayable sources (Kafka offsets) and transactional or idempotent sinks you get **exactly-once** results even after failures.

**Streaming is not free.** It needs on-call people, monitoring of lag, and careful schema evolution. A good middle ground is *micro-batch* (every 5 to 15 minutes) or a hybrid where streaming feeds a fast table and a daily batch job corrects it.`,
    cards: [
      { id: "st1", q: "What guarantees ordering in Kafka?", a: "Only within a single partition. Events with the same key go to the same partition, so pick the key that needs ordering (e.g. user_id)." },
      { id: "st2", q: "Event time vs processing time?", a: "Event time is when the event happened (timestamp in the data); processing time is when the system handles it. Event time gives correct results despite lag." },
      { id: "st3", q: "What is a watermark?", a: "A marker that says all events up to time T are expected to have arrived, letting windows close; events later than that are late data." },
      { id: "st4", q: "Tumbling vs sliding vs session window?", a: "Tumbling: fixed, non-overlapping. Sliding: fixed size, overlapping by a slide interval. Session: ends after a period of inactivity." },
      { id: "st5", q: "What makes exactly-once possible in Flink + Kafka?", a: "Checkpointed state plus replayable sources (Kafka offsets) and transactional or idempotent sinks." },
    ],
    exercises: [],
    links: [
      { label: "Module materials (Flink + Kafka lab)", href: `${M}/4-apache-flink-training`, kind: "handbook" },
      { label: "Homework", href: `${MB}/4-apache-flink-training/homework/homework.md`, kind: "homework" },
      { label: "Flink lab setup video (DataExpert.io)", href: "https://www.dataexpert.io/lesson/flink-lab-setup-yt", kind: "video" },
    ],
  },
  {
    id: "patterns",
    title: "Applying analytical patterns",
    blurb: "Growth accounting, retention, grouping sets.",
    track: "Analytics",
    body: `A handful of SQL patterns cover most product analytics. Learn them once and recognise them everywhere.

**Growth accounting** labels every user every period:

| state | meaning |
| --- | --- |
| new | first period ever active |
| retained | active now and in the previous period |
| resurrected | active now, inactive last period, active some time before |
| churned | active last period, not now |
| stale | inactive now and last period |

Build it from a cumulative table (first active date, last active date) or with \`LAG\` over each user's active periods. Plotting the counts per state explains *why* active users moved, not just *that* they moved.

**Retention / survival.** Group users by the period they started (the cohort), then for each later period compute the share still active. A J-curve that flattens means the product keeps a core of users.

**Funnels.** Count distinct users who reached each step, optionally requiring the steps in order and within a time limit.

**Grouping sets.** One query, several aggregation levels:

\`\`\`sql
GROUP BY GROUPING SETS ((segment, channel), (segment), ())
-- also: ROLLUP(segment, channel), CUBE(segment, channel)
\`\`\`

SQLite has none of these, so in the sandbox you combine levels with \`UNION ALL\`. Fill the missing dimension with a label like \`'(all)'\` instead of NULL so dashboards do not confuse "total" with "unknown".

**Window patterns:** rolling 7-day sums, rank within group, period-over-period with \`LAG\`, and "consecutive days" streaks with the row-number difference trick.`,
    cards: [
      { id: "p1", q: "Name the five growth accounting states.", a: "New, retained, resurrected, churned, stale." },
      { id: "p2", q: "Resurrected vs retained?", a: "Retained was active in the previous period too; resurrected was inactive in the previous period but active at some earlier time." },
      { id: "p3", q: "What does GROUPING SETS ((a, b), (a), ()) return?", a: "Aggregates at three levels in one query: per (a, b), per a, and the grand total." },
      { id: "p4", q: "How do you read a retention curve?", a: "Share of a cohort still active N periods after starting; a curve that flattens (instead of reaching zero) shows lasting product value." },
      { id: "p5", q: "Why replace NULL with a label like '(all)' in rollups?", a: "So aggregated total rows are not confused with rows where the dimension is genuinely unknown." },
    ],
    exercises: [
      {
        id: "de-pat-1",
        prompt: "Growth accounting (active = has a completed order that month): for each month, count customers who are new, retained (also active the previous calendar month) or resurrected. Columns: month, state, customers.",
        solution: "WITH m AS (SELECT DISTINCT customer_id, strftime('%Y-%m', order_date) AS month FROM orders WHERE status = 'completed'), l AS (SELECT customer_id, month, LAG(month) OVER (PARTITION BY customer_id ORDER BY month) AS prev FROM m) SELECT month, CASE WHEN prev IS NULL THEN 'new' WHEN prev = strftime('%Y-%m', date(month || '-01', '-1 month')) THEN 'retained' ELSE 'resurrected' END AS state, COUNT(*) AS customers FROM l GROUP BY month, state;",
      },
      {
        id: "de-pat-2",
        prompt: "Grouping sets with UNION ALL: completed revenue per segment, plus one total row where segment is '(all)'. Columns: segment, revenue (2 decimals).",
        solution: "SELECT c.segment, ROUND(SUM(o.amount), 2) AS revenue FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE o.status = 'completed' GROUP BY c.segment UNION ALL SELECT '(all)', ROUND(SUM(amount), 2) FROM orders WHERE status = 'completed';",
      },
      {
        id: "de-pat-3",
        prompt: "Month-1 retention: of customers whose first completed order was in month M, what % also had a completed order in month M+1? Columns: cohort, customers, retained_pct (1 decimal), in month order.",
        solution: "WITH m AS (SELECT DISTINCT customer_id, strftime('%Y-%m', order_date) AS month FROM orders WHERE status = 'completed'), f AS (SELECT customer_id, MIN(month) AS cohort FROM m GROUP BY customer_id) SELECT f.cohort, COUNT(*) AS customers, ROUND(100.0 * SUM(CASE WHEN EXISTS (SELECT 1 FROM m WHERE m.customer_id = f.customer_id AND m.month = strftime('%Y-%m', date(f.cohort || '-01', '+1 month'))) THEN 1 ELSE 0 END) / COUNT(*), 1) AS retained_pct FROM f GROUP BY f.cohort ORDER BY f.cohort;",
        ordered: true,
      },
    ],
    links: [
      { label: "Module materials", href: `${M}/4-applying-analytical-patterns`, kind: "handbook" },
      { label: "Lab SQL: growth accounting, retention, funnels, grouping sets", href: `${M}/4-applying-analytical-patterns/lecture-lab`, kind: "lab" },
      { label: "Homework", href: `${MB}/4-applying-analytical-patterns/homework/homework.md`, kind: "homework" },
    ],
  },
  {
    id: "kpis",
    title: "KPIs and experimentation",
    blurb: "Good metrics, metric trees and A/B tests.",
    track: "Analytics",
    body: `Data engineers increasingly own the *definition* of metrics, not just the tables behind them.

**What makes a good KPI**
- tied to a decision someone will make;
- moves when the product really changes (sensitive), but not from noise;
- hard to game (time spent can be inflated by a confusing UI);
- defined once, in code, with an owner.

**Metric trees.** Break a north-star metric into inputs you can act on: revenue = active buyers × orders per buyer × average order value. Each branch has a team and a lever.

**Guardrail metrics** must not get worse while you optimise the main one (latency, refunds, unsubscribes).

**A/B testing in five steps**
1. Hypothesis and one primary metric, written *before* the test.
2. Randomisation unit (usually the user, so one person never sees both versions).
3. Sample size from the minimum detectable effect, baseline rate, significance level (α, usually 0.05) and power (usually 0.8).
4. Run for full weeks to cover weekday effects; do not stop the moment it looks significant ("peeking" inflates false positives).
5. Read the result: effect size *and* confidence interval, check guardrails, check sample ratio mismatch (50/50 split that came out 52/48 means a bug).

**p-value, plainly:** if the change truly did nothing, how surprising would a difference this large be? It is not "the probability the change works".

**Data engineering's part:** reliable exposure logging (who saw which variant, when), consistent metric definitions, and pipelines that join exposures to outcomes at the right grain.`,
    cards: [
      { id: "k1", q: "What is a guardrail metric?", a: "A metric that must not get worse while optimising the primary metric (e.g. latency, refunds, unsubscribes)." },
      { id: "k2", q: "Why randomise by user rather than by page view?", a: "So each person consistently sees one variant; otherwise exposures leak between groups and observations are not independent." },
      { id: "k3", q: "Why is peeking at an A/B test dangerous?", a: "Stopping as soon as a result looks significant inflates the false-positive rate well above the chosen α." },
      { id: "k4", q: "What is sample ratio mismatch?", a: "When the observed split differs significantly from the planned split (e.g. 52/48 instead of 50/50), signalling a bug in assignment or logging." },
      { id: "k5", q: "Give an example of a metric tree for revenue.", a: "Revenue = active buyers × orders per buyer × average order value; each factor can be broken down further and owned by a team." },
    ],
    exercises: [],
    links: [
      { label: "Module materials", href: `${M}/5-kpis-and-experimentation`, kind: "handbook" },
      { label: "Homework", href: `${MB}/5-kpis-and-experimentation/homework/homework.md`, kind: "homework" },
    ],
  },
  {
    id: "quality",
    title: "Data quality and pipeline maintenance",
    blurb: "Checks, write-audit-publish, on-call and backfills.",
    track: "Operations",
    body: `Bad data is worse than no data: people make decisions with it. Quality has a few measurable dimensions:

| dimension | example check |
| --- | --- |
| completeness | share of customers with an email ≥ 95% |
| uniqueness | no duplicate \`order_id\`; emails unique ignoring case |
| validity | \`status\` in an allowed list; amounts ≥ 0 |
| consistency | order amount = sum of its lines |
| freshness | latest partition is from today |
| volume | row count within ±30% of the same weekday last week |

**Write, audit, publish (WAP).** Write new data to a staging table or branch, run the checks, and only then swap it into production. A failed check blocks the publish instead of breaking every dashboard downstream.

**Data contracts.** Producers (app teams) and consumers agree on schema, meaning and SLAs. Schema changes go through review, like an API.

**Pipeline maintenance**
- Every pipeline has an *owner*, a *runbook* (what it does, who depends on it, what to do when it fails) and an *SLA*.
- On-call rotations should be fair and documented; most incidents come from upstream changes, missing data or infrastructure, not from your SQL.
- **Backfills**: make jobs idempotent and partitioned by date so you can rerun any range safely. Backfill into a separate table, validate, then swap.
- Communicate early: a short "data for X is delayed, ETA Y" message saves hours of confused analysts.

**Data impact.** Pipelines matter because of what they change. Keep a short list of who uses each table and what decision it informed; it is the best argument for headcount and the first thing to check before deprecating something.`,
    cards: [
      { id: "q1", q: "What is the write-audit-publish pattern?", a: "Write new data to staging, run quality checks on it, and publish (swap into production) only if the checks pass." },
      { id: "q2", q: "Name four data quality dimensions.", a: "Any four of: completeness, uniqueness, validity, consistency, freshness, volume." },
      { id: "q3", q: "What belongs in a pipeline runbook?", a: "Purpose, owner, upstream and downstream dependencies, SLA, common failures and how to fix or escalate them." },
      { id: "q4", q: "How do you make backfills safe?", a: "Idempotent jobs partitioned by date, backfill into a separate table, validate, then swap; never append blindly." },
      { id: "q5", q: "What is a data contract?", a: "An agreement between data producers and consumers on schema, semantics and SLAs, with changes reviewed like an API change." },
    ],
    exercises: [
      {
        id: "de-q-1",
        prompt: "Completeness check: percentage of customers that have an email (1 decimal), as email_complete_pct.",
        solution: "SELECT ROUND(100.0 * COUNT(email) / COUNT(*), 1) AS email_complete_pct FROM customers;",
      },
      {
        id: "de-q-2",
        prompt: "Uniqueness check: emails shared by more than one customer when compared case-insensitively. Return the lower-cased email and how many customers use it (n).",
        solution: "SELECT LOWER(email) AS email, COUNT(*) AS n FROM customers WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) > 1;",
      },
      {
        id: "de-q-3",
        prompt: "Freshness check: for each channel, the latest order_date and how many days before 2025-12-31 it is. Columns: channel, latest, days_behind (integer).",
        solution: "SELECT channel, MAX(order_date) AS latest, CAST(julianday('2025-12-31') - julianday(MAX(order_date)) AS INTEGER) AS days_behind FROM orders GROUP BY channel;",
      },
    ],
    links: [
      { label: "Pipeline maintenance materials", href: `${M}/6-data-pipeline-maintenance`, kind: "handbook" },
      { label: "Pipeline maintenance homework", href: `${MB}/6-data-pipeline-maintenance/homework/homework.md`, kind: "homework" },
      { label: "Data impact materials", href: `${M}/6-data-impact-training`, kind: "handbook" },
      { label: "Data cleaning resources (handbook)", href: `${H}/data_cleaning.md`, kind: "reading" },
    ],
  },
  {
    id: "career",
    title: "Projects, interviews and community",
    blurb: "Build a portfolio and keep learning.",
    track: "Career",
    body: `Courses teach concepts; a portfolio proves you can ship.

**A good portfolio project**
- uses a real, changing data source (a public API, open government data), not a static CSV;
- has an orchestrated pipeline (Airflow, Dagster or even cron) that runs on a schedule;
- models data deliberately (a fact table at a stated grain, SCD2 dimension, tests);
- includes data quality checks and a short README with an architecture diagram;
- ends in something people can see: a dashboard, an API or a small app.

**Interview loops** usually contain:
1. **SQL**, often the LeetCode SQL style (use the SQL for BA path);
2. **Python / coding**, easy to medium algorithm problems (use the Algorithms path);
3. **Data modeling**: design tables for a product (ride sharing, e-commerce). State the grain, facts, dimensions, SCD choices and how analysts will query it;
4. **System design**: batch vs streaming, storage format, partitioning, backfills, monitoring;
5. **Behavioural**: a story with a measurable impact, told as situation, action, result.

**Keep learning**: pick one newsletter and one community and stay with them, rather than collecting twenty bookmarks. The handbook keeps curated lists of books, communities, newsletters, podcasts and company engineering blogs; the links below go straight to them.`,
    cards: [
      { id: "c1", q: "What should a data modeling interview answer always state first?", a: "The grain of each fact table, then facts, dimensions, keys and how analysts will query it." },
      { id: "c2", q: "Three things that make a portfolio pipeline convincing?", a: "A live data source, scheduled orchestration with quality checks, and a visible output (dashboard/API) documented in a README." },
      { id: "c3", q: "Structure for a behavioural answer?", a: "Situation, action, result (with a measurable impact)." },
    ],
    exercises: [],
    links: [
      { label: "Project ideas", href: `${H}/projects.md`, kind: "reading" },
      { label: "Interview advice", href: `${H}/interviews.md`, kind: "reading" },
      { label: "Books list", href: `${H}/books.md`, kind: "reading" },
      { label: "Communities", href: `${H}/communities.md`, kind: "reading" },
      { label: "Newsletters", href: `${H}/newsletters.md`, kind: "reading" },
      { label: "Podcasts, YouTube, blogs and whitepapers", href: `${HANDBOOK}#resources`, kind: "reading" },
    ],
  },
];

export const deCardId = (module: string, card: string) => `de:${module}:${card}`;
export const ALL_DE_CARDS = DE_MODULES.flatMap((m) => m.cards.map((c) => ({ ...c, module: m.id, key: deCardId(m.id, c.id) })));
export const ALL_DE_EXERCISES = DE_MODULES.flatMap((m) => m.exercises);
