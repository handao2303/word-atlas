/**
 * SQL for business analysts: original lessons and sandbox exercises written for this app,
 * plus links to related LeetCode Database problems (statements stay on leetcode.com).
 */
import type { Level } from "../data";

export interface SqlExercise {
  id: string;
  prompt: string;
  /** Reference query; the learner's result must match its rows. */
  solution: string;
  /** Row order is part of the answer (the prompt asks for a sort). */
  ordered?: boolean;
}

export interface SqlProblem {
  num: number;
  title: string;
  slug: string;
  level: Level;
}

export interface SqlLesson {
  id: string;
  title: string;
  blurb: string;
  concepts: string[];
  body: string;
  exercises: SqlExercise[];
  leetcode: SqlProblem[];
}

const lc = (num: number, title: string, slug: string, level: Level): SqlProblem => ({ num, title, slug, level });

export const SQL_LESSONS: SqlLesson[] = [
  {
    id: "select",
    title: "Filtering rows",
    blurb: "SELECT, WHERE, IN, LIKE and the NULL trap.",
    concepts: ["SELECT", "WHERE", "IN", "LIKE", "IS NULL"],
    body: `Every query answers one question about a table. \`SELECT\` picks the columns, \`FROM\` names the table and \`WHERE\` keeps only the rows you care about.

\`\`\`sql
SELECT name, city
FROM customers
WHERE segment = 'SMB' AND city IN ('Hanoi', 'Da Nang');
\`\`\`

**How the database reads it.** You write \`SELECT → FROM → WHERE\`, but it runs \`FROM → WHERE → SELECT\`. That is why a column alias defined in \`SELECT\` cannot be used in \`WHERE\`.

**Useful filters**

| Need | Write |
| --- | --- |
| one of several values | \`city IN ('Hanoi', 'Can Tho')\` |
| a range (inclusive) | \`price BETWEEN 10 AND 50\` |
| text pattern | \`email LIKE '%@gmail.com'\` (\`%\` = any text, \`_\` = one character) |
| missing value | \`email IS NULL\` |

**The NULL trap.** NULL means *unknown*, so \`email = NULL\` and \`email <> 'x'\` are never true for a NULL row. Always use \`IS NULL\` / \`IS NOT NULL\`, and remember that \`WHERE referred_by <> 2\` silently drops customers with no referrer (LeetCode 584 is exactly this).

**BA habit:** before filtering, look at the raw rows (\`SELECT * FROM customers LIMIT 10\`) so you know what values really exist.`,
    exercises: [
      { id: "select-1", prompt: "List the name and city of every Enterprise customer in Hanoi or Da Nang.", solution: "SELECT name, city FROM customers WHERE segment = 'Enterprise' AND city IN ('Hanoi', 'Da Nang');" },
      { id: "select-2", prompt: "Which customers have no email on file? Return customer_id and name.", solution: "SELECT customer_id, name FROM customers WHERE email IS NULL;" },
      { id: "select-3", prompt: "Find products in Books or Beauty that cost less than 20. Return name, category and price.", solution: "SELECT name, category, price FROM products WHERE category IN ('Books', 'Beauty') AND price < 20;" },
      { id: "select-4", prompt: "Customers who were NOT referred by customer 2 (customers with no referrer count as not referred by 2). Return customer_id.", solution: "SELECT customer_id FROM customers WHERE referred_by IS NULL OR referred_by <> 2;" },
    ],
    leetcode: [
      lc(595, "Big Countries", "big-countries", "Easy"),
      lc(1757, "Recyclable and Low Fat Products", "recyclable-and-low-fat-products", "Easy"),
      lc(584, "Find Customer Referee", "find-customer-referee", "Easy"),
      lc(1148, "Article Views I", "article-views-i", "Easy"),
      lc(1683, "Invalid Tweets", "invalid-tweets", "Easy"),
    ],
  },
  {
    id: "sort",
    title: "Sorting, DISTINCT and top-N",
    blurb: "ORDER BY, LIMIT / OFFSET and de-duplicating.",
    concepts: ["ORDER BY", "LIMIT", "OFFSET", "DISTINCT"],
    body: `\`ORDER BY\` sorts the final result; add \`DESC\` for largest first. You can sort by several columns: \`ORDER BY category, price DESC\` sorts by category, then by price inside each category.

\`LIMIT n\` keeps the first *n* rows and \`OFFSET k\` skips *k* rows first, so \`LIMIT 1 OFFSET 1\` is "the second row".

\`DISTINCT\` removes duplicate rows from the result. It applies to the whole row, not just the first column.

\`\`\`sql
SELECT DISTINCT price
FROM products
ORDER BY price DESC
LIMIT 1 OFFSET 1;   -- second highest distinct price
\`\`\`

**Top-N gotcha.** "Second highest salary" must return \`NULL\` when there is no second value. Wrapping the query in \`SELECT (...) AS SecondHighestSalary\` turns "no rows" into one row with NULL (LeetCode 176).

**Ties.** \`LIMIT 3\` cuts ties arbitrarily. When ties matter ("top 3 salaries including ties") use window functions from lesson 8.`,
    exercises: [
      { id: "sort-1", prompt: "The 5 most expensive products, highest price first. Return name and price.", solution: "SELECT name, price FROM products ORDER BY price DESC LIMIT 5;", ordered: true },
      { id: "sort-2", prompt: "Which cities do we have customers in? One row per city, sorted A to Z.", solution: "SELECT DISTINCT city FROM customers ORDER BY city;", ordered: true },
      { id: "sort-3", prompt: "Return the second highest distinct product price as a single column named second_price.", solution: "SELECT (SELECT DISTINCT price FROM products ORDER BY price DESC LIMIT 1 OFFSET 1) AS second_price;" },
    ],
    leetcode: [
      lc(620, "Not Boring Movies", "not-boring-movies", "Easy"),
      lc(176, "Second Highest Salary", "second-highest-salary", "Medium"),
      lc(1965, "Employees With Missing Information", "employees-with-missing-information", "Easy"),
    ],
  },
  {
    id: "aggregate",
    title: "Aggregates, GROUP BY, HAVING",
    blurb: "Turn rows into KPIs: counts, sums, averages per group.",
    concepts: ["COUNT", "SUM", "AVG", "GROUP BY", "HAVING", "ROUND"],
    body: `Aggregate functions collapse many rows into one number: \`COUNT(*)\`, \`SUM(x)\`, \`AVG(x)\`, \`MIN(x)\`, \`MAX(x)\`. \`GROUP BY\` gives you one result row per group.

\`\`\`sql
SELECT channel,
       COUNT(*)              AS orders,
       ROUND(AVG(amount), 2) AS avg_order_value
FROM orders
WHERE status = 'completed'
GROUP BY channel;
\`\`\`

**WHERE vs HAVING.** \`WHERE\` filters rows *before* grouping, \`HAVING\` filters groups *after*. "Segments with more than 10 customers" needs \`HAVING COUNT(*) > 10\`.

**COUNT flavours**
- \`COUNT(*)\` counts rows.
- \`COUNT(email)\` counts non-NULL emails.
- \`COUNT(DISTINCT customer_id)\` counts unique customers: the one you usually want for "how many customers ordered".

**Rule of thumb:** every column in \`SELECT\` is either inside an aggregate or listed in \`GROUP BY\`. MySQL on LeetCode enforces this (ONLY_FULL_GROUP_BY); SQLite is lenient, so be strict yourself.

**Percentages:** multiply by \`100.0\` (not \`100\`) so integer division does not round everything to 0.`,
    exercises: [
      { id: "aggregate-1", prompt: "Count orders by status. Return status and the number of orders as orders.", solution: "SELECT status, COUNT(*) AS orders FROM orders GROUP BY status;" },
      { id: "aggregate-2", prompt: "Segments with more than 10 customers: return segment and customer count.", solution: "SELECT segment, COUNT(*) AS customers FROM customers GROUP BY segment HAVING COUNT(*) > 10;" },
      { id: "aggregate-3", prompt: "For each channel, completed orders only: number of orders and average order amount rounded to 2 decimals.", solution: "SELECT channel, COUNT(*) AS orders, ROUND(AVG(amount), 2) AS avg_amount FROM orders WHERE status = 'completed' GROUP BY channel;" },
      { id: "aggregate-4", prompt: "How many distinct customers have at least one completed order? One number.", solution: "SELECT COUNT(DISTINCT customer_id) AS buyers FROM orders WHERE status = 'completed';" },
    ],
    leetcode: [
      lc(596, "Classes More Than 5 Students", "classes-more-than-5-students", "Easy"),
      lc(1729, "Find Followers Count", "find-followers-count", "Easy"),
      lc(619, "Biggest Single Number", "biggest-single-number", "Easy"),
      lc(1693, "Daily Leads and Partners", "daily-leads-and-partners", "Easy"),
      lc(1211, "Queries Quality and Percentage", "queries-quality-and-percentage", "Easy"),
      lc(2356, "Number of Unique Subjects Taught by Each Teacher", "number-of-unique-subjects-taught-by-each-teacher", "Easy"),
    ],
  },
  {
    id: "joins",
    title: "Joins",
    blurb: "Combine tables: inner, left, anti-join and self join.",
    concepts: ["INNER JOIN", "LEFT JOIN", "anti-join", "self join", "CROSS JOIN"],
    body: `A join lines up rows from two tables on a key.

- \`JOIN\` (inner) keeps only rows that match on both sides.
- \`LEFT JOIN\` keeps every row of the left table; unmatched right columns become NULL.

\`\`\`sql
SELECT p.category, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
FROM order_items oi
JOIN orders   o ON o.order_id   = oi.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status = 'completed'
GROUP BY p.category;
\`\`\`

**Anti-join: "who never did X".** \`LEFT JOIN\` then keep rows where the right side is NULL:

\`\`\`sql
SELECT c.customer_id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;
\`\`\`

**Self join.** Join a table to itself with two aliases, e.g. employees to their managers (\`e.manager_id = m.employee_id\`).

**CROSS JOIN** makes every combination. LeetCode 1280 uses it to build "every student × every subject" before counting.

**Watch the grain.** Joining orders to order_items repeats each order once per line. Summing \`orders.amount\` after that join double counts. Decide what one row means before you aggregate.`,
    exercises: [
      { id: "joins-1", prompt: "Revenue (quantity × unit_price) per product category from completed orders, highest first. Round to 2 decimals.", solution: "SELECT p.category, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue FROM order_items oi JOIN orders o ON o.order_id = oi.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' GROUP BY p.category ORDER BY revenue DESC;", ordered: true },
      { id: "joins-2", prompt: "Customers who have never placed any order. Return customer_id and name.", solution: "SELECT c.customer_id, c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;" },
      { id: "joins-3", prompt: "Every employee with their manager's name (employee, manager). The CEO has no manager and must still appear.", solution: "SELECT e.name AS employee, m.name AS manager FROM employees e LEFT JOIN employees m ON m.employee_id = e.manager_id;" },
      { id: "joins-4", prompt: "Managers with at least 5 direct reports. Return the manager's name.", solution: "SELECT m.name FROM employees e JOIN employees m ON m.employee_id = e.manager_id GROUP BY m.employee_id, m.name HAVING COUNT(*) >= 5;" },
    ],
    leetcode: [
      lc(1378, "Replace Employee ID With The Unique Identifier", "replace-employee-id-with-the-unique-identifier", "Easy"),
      lc(1068, "Product Sales Analysis I", "product-sales-analysis-i", "Easy"),
      lc(1581, "Customer Who Visited but Did Not Make Any Transactions", "customer-who-visited-but-did-not-make-any-transactions", "Easy"),
      lc(183, "Customers Who Never Order", "customers-who-never-order", "Easy"),
      lc(197, "Rising Temperature", "rising-temperature", "Easy"),
      lc(577, "Employee Bonus", "employee-bonus", "Easy"),
      lc(1280, "Students and Examinations", "students-and-examinations", "Easy"),
      lc(570, "Managers with at Least 5 Direct Reports", "managers-with-at-least-5-direct-reports", "Medium"),
      lc(1075, "Project Employees I", "project-employees-i", "Easy"),
      lc(1731, "The Number of Employees Which Report to Each Employee", "the-number-of-employees-which-report-to-each-employee", "Easy"),
    ],
  },
  {
    id: "case",
    title: "CASE and conditional aggregation",
    blurb: "Bucket values, compute rates and pivot rows into columns.",
    concepts: ["CASE WHEN", "rates", "pivot", "COALESCE"],
    body: `\`CASE\` is SQL's if/else. It returns a value, so it can sit in \`SELECT\`, \`GROUP BY\`, \`ORDER BY\` or inside an aggregate.

\`\`\`sql
SELECT CASE WHEN price < 20   THEN 'budget'
            WHEN price <= 100 THEN 'mid'
            ELSE 'premium' END AS tier,
       COUNT(*) AS products
FROM products
GROUP BY tier;
\`\`\`

**Conditional aggregation** is the BA workhorse. Put \`CASE\` inside \`SUM\` or \`AVG\` to count only some rows:

\`\`\`sql
SELECT channel,
       ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancel_rate_pct
FROM orders
GROUP BY channel;
\`\`\`

\`AVG(CASE WHEN ... THEN 1 ELSE 0 END)\` is the same rate in one step. In MySQL you can even write \`AVG(status = 'cancelled')\`.

**Pivot:** one \`SUM(CASE ...)\` per output column turns rows into columns (revenue by channel as three columns). LeetCode 1179 is a 12-column version.

**COALESCE(x, 0)** replaces NULL with 0, handy after a LEFT JOIN so "no orders" shows as 0 instead of blank (\`IFNULL\` in MySQL does the same).`,
    exercises: [
      { id: "case-1", prompt: "Label products budget (< 20), mid (20 to 100) or premium (> 100) and count products per tier. Columns: tier, products.", solution: "SELECT CASE WHEN price < 20 THEN 'budget' WHEN price <= 100 THEN 'mid' ELSE 'premium' END AS tier, COUNT(*) AS products FROM products GROUP BY tier;" },
      { id: "case-2", prompt: "Per channel: total orders and cancellation rate as a percentage with 1 decimal (cancel_rate_pct).", solution: "SELECT channel, COUNT(*) AS orders, ROUND(100.0 * SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancel_rate_pct FROM orders GROUP BY channel;" },
      { id: "case-3", prompt: "Pivot: one row per customer segment with completed revenue in three columns web, app and store (rounded to 2 decimals).", solution: "SELECT c.segment, ROUND(SUM(CASE WHEN o.channel = 'web' THEN o.amount ELSE 0 END), 2) AS web, ROUND(SUM(CASE WHEN o.channel = 'app' THEN o.amount ELSE 0 END), 2) AS app, ROUND(SUM(CASE WHEN o.channel = 'store' THEN o.amount ELSE 0 END), 2) AS store FROM orders o JOIN customers c ON c.customer_id = o.customer_id WHERE o.status = 'completed' GROUP BY c.segment;" },
      { id: "case-4", prompt: "Every customer with their number of completed orders (0 if none). Columns: customer_id, completed_orders.", solution: "SELECT c.customer_id, COALESCE(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id;" },
    ],
    leetcode: [
      lc(610, "Triangle Judgement", "triangle-judgement", "Easy"),
      lc(1934, "Confirmation Rate", "confirmation-rate", "Medium"),
      lc(1193, "Monthly Transactions I", "monthly-transactions-i", "Medium"),
      lc(1907, "Count Salary Categories", "count-salary-categories", "Medium"),
      lc(1179, "Reformat Department Table", "reformat-department-table", "Easy"),
      lc(626, "Exchange Seats", "exchange-seats", "Medium"),
    ],
  },
  {
    id: "dates",
    title: "Dates and time series",
    blurb: "Group by month, measure gaps between events.",
    concepts: ["strftime", "DATE_FORMAT", "date math", "julianday", "DATEDIFF"],
    body: `Dates in this sandbox are \`'YYYY-MM-DD'\` text, which sorts and compares correctly as text (\`order_date >= '2025-06-01'\`).

| Task | SQLite (sandbox) | MySQL (LeetCode) |
| --- | --- | --- |
| month key | \`strftime('%Y-%m', d)\` | \`DATE_FORMAT(d, '%Y-%m')\` |
| year | \`strftime('%Y', d)\` | \`YEAR(d)\` |
| add 30 days | \`date(d, '+30 day')\` | \`DATE_ADD(d, INTERVAL 30 DAY)\` |
| days between | \`julianday(b) - julianday(a)\` | \`DATEDIFF(b, a)\` |
| weekday (0 = Sunday) | \`strftime('%w', d)\` | \`DAYOFWEEK(d) - 1\` |

\`\`\`sql
SELECT strftime('%Y-%m', order_date) AS month,
       ROUND(SUM(amount), 2)          AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month;
\`\`\`

**"Within N days of the first event"** (LeetCode 550, 1174) is a two-step pattern: find each user's first date with \`MIN(...) GROUP BY user\`, then join back and compare.

**Date ranges:** for "the 30 days ending 2019-07-27" write both ends explicitly, \`BETWEEN '2019-06-28' AND '2019-07-27'\`, and check whether the end day is included.`,
    exercises: [
      { id: "dates-1", prompt: "Monthly completed revenue: month (YYYY-MM) and revenue rounded to 2 decimals, in month order.", solution: "SELECT strftime('%Y-%m', order_date) AS month, ROUND(SUM(amount), 2) AS revenue FROM orders WHERE status = 'completed' GROUP BY month ORDER BY month;", ordered: true },
      { id: "dates-2", prompt: "Customers whose first order (any status) came within 7 days of signing up. Return customer_id.", solution: "SELECT c.customer_id FROM customers c JOIN orders o ON o.customer_id = c.customer_id GROUP BY c.customer_id HAVING julianday(MIN(o.order_date)) - julianday(MIN(c.signup_date)) <= 7;" },
      { id: "dates-3", prompt: "Number of orders per weekday (0 = Sunday … 6 = Saturday). Columns: weekday, orders.", solution: "SELECT strftime('%w', order_date) AS weekday, COUNT(*) AS orders FROM orders GROUP BY weekday;" },
      { id: "dates-4", prompt: "Orders placed in Q4 2025 (October to December): count them as q4_orders.", solution: "SELECT COUNT(*) AS q4_orders FROM orders WHERE order_date BETWEEN '2025-10-01' AND '2025-12-31';" },
    ],
    leetcode: [
      lc(1141, "User Activity for the Past 30 Days I", "user-activity-for-the-past-30-days-i", "Easy"),
      lc(1327, "List the Products Ordered in a Period", "list-the-products-ordered-in-a-period", "Easy"),
      lc(1661, "Average Time of Process per Machine", "average-time-of-process-per-machine", "Easy"),
      lc(550, "Game Play Analysis IV", "game-play-analysis-iv", "Medium"),
      lc(1174, "Immediate Food Delivery II", "immediate-food-delivery-ii", "Medium"),
    ],
  },
  {
    id: "subqueries",
    title: "Subqueries and CTEs",
    blurb: "Break a question into steps with WITH.",
    concepts: ["scalar subquery", "IN (subquery)", "WITH / CTE", "relational division"],
    body: `A subquery is a query inside another one.

- **Scalar**: returns one value, usable like a number: \`WHERE price > (SELECT AVG(price) FROM products)\`.
- **List**: \`WHERE customer_id IN (SELECT customer_id FROM orders WHERE channel = 'store')\`.
- **Table**: used in \`FROM\` / \`JOIN\` like any table.

A **CTE** (\`WITH name AS (...)\`) names a step so the final query reads top to bottom. This is how analysts keep long queries readable:

\`\`\`sql
WITH spend AS (
  SELECT customer_id, SUM(amount) AS total
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT c.name, ROUND(s.total, 2) AS total
FROM spend s
JOIN customers c ON c.customer_id = s.customer_id
WHERE s.total > 600
ORDER BY s.total DESC;
\`\`\`

**"Bought every X" (relational division).** Count distinct X per person and compare with the total number of X: \`HAVING COUNT(DISTINCT category) = (SELECT COUNT(DISTINCT category) FROM products)\` (LeetCode 1045).

**"Value as of a date"** (LeetCode 1164): find the latest change on or before the date with \`MAX(change_date)\` per item, join back to get the value, and fall back to a default for items with no change yet.`,
    exercises: [
      { id: "subqueries-1", prompt: "Products priced above the average product price. Return name and price.", solution: "SELECT name, price FROM products WHERE price > (SELECT AVG(price) FROM products);" },
      { id: "subqueries-2", prompt: "Using a CTE: customers whose total completed spend is above 600. Return name and total (2 decimals), biggest spender first.", solution: "WITH spend AS (SELECT customer_id, SUM(amount) AS total FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT c.name, ROUND(s.total, 2) AS total FROM spend s JOIN customers c ON c.customer_id = s.customer_id WHERE s.total > 600 ORDER BY s.total DESC;", ordered: true },
      { id: "subqueries-3", prompt: "Customers who bought from every product category (completed orders). Return customer_id.", solution: "SELECT o.customer_id FROM orders o JOIN order_items oi ON oi.order_id = o.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' GROUP BY o.customer_id HAVING COUNT(DISTINCT p.category) = (SELECT COUNT(DISTINCT category) FROM products);" },
      { id: "subqueries-4", prompt: "Employees who earn more than their department's average salary. Return name, department, salary.", solution: "SELECT e.name, e.department, e.salary FROM employees e WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.department = e.department);" },
    ],
    leetcode: [
      lc(1978, "Employees Whose Manager Left the Company", "employees-whose-manager-left-the-company", "Easy"),
      lc(1070, "Product Sales Analysis III", "product-sales-analysis-iii", "Medium"),
      lc(1045, "Customers Who Bought All Products", "customers-who-bought-all-products", "Medium"),
      lc(1164, "Product Price at a Given Date", "product-price-at-a-given-date", "Medium"),
      lc(585, "Investments in 2016", "investments-in-2016", "Medium"),
      lc(1341, "Movie Rating", "movie-rating", "Medium"),
    ],
  },
  {
    id: "windows",
    title: "Window functions",
    blurb: "Rankings, running totals and period-over-period.",
    concepts: ["ROW_NUMBER", "RANK", "DENSE_RANK", "LAG / LEAD", "running SUM", "moving average"],
    body: `A window function computes a value *per row* from a set of related rows, without collapsing them like \`GROUP BY\` does.

\`\`\`sql
func(...) OVER (PARTITION BY group_cols ORDER BY sort_cols [frame])
\`\`\`

**Ranking** (\`salary\` 90, 80, 80, 70):

| function | result | use when |
| --- | --- | --- |
| \`ROW_NUMBER()\` | 1, 2, 3, 4 | pick exactly one row per group |
| \`RANK()\` | 1, 2, 2, 4 | competition ranking |
| \`DENSE_RANK()\` | 1, 2, 2, 3 | "top 3 salaries" including ties (LeetCode 185) |

**Top-N per group:** rank inside a CTE, then filter \`WHERE rk <= N\`. You cannot filter on a window function in the same \`WHERE\`.

**Running total and moving average**

\`\`\`sql
SUM(revenue) OVER (ORDER BY month)                                   -- running total
AVG(amount)  OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) -- 7-row moving average
\`\`\`

**Period over period:** \`LAG(revenue) OVER (ORDER BY month)\` gives last month's value on this month's row, so growth is \`(revenue - prev) / prev\`.

**Consecutive streaks** (LeetCode 180): compare a row with \`LAG(x, 1)\` and \`LAG(x, 2)\`, or use the "row_number difference" trick to label runs.`,
    exercises: [
      { id: "windows-1", prompt: "Rank products by price inside each category (most expensive = 1) using DENSE_RANK. Columns: category, name, price, price_rank.", solution: "SELECT category, name, price, DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank FROM products;" },
      { id: "windows-2", prompt: "Top 2 distinct salaries per department (keep ties). Return department, name, salary.", solution: "WITH r AS (SELECT department, name, salary, DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rk FROM employees) SELECT department, name, salary FROM r WHERE rk <= 2;" },
      { id: "windows-3", prompt: "Monthly completed revenue with a running total. Columns: month, revenue, running_total (both rounded to 2 decimals), in month order.", solution: "WITH m AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, ROUND(revenue, 2) AS revenue, ROUND(SUM(revenue) OVER (ORDER BY month), 2) AS running_total FROM m ORDER BY month;", ordered: true },
      { id: "windows-4", prompt: "Month-over-month growth of completed revenue in percent (1 decimal, NULL for the first month). Columns: month, growth_pct, in month order.", solution: "WITH m AS (SELECT strftime('%Y-%m', order_date) AS month, SUM(amount) AS revenue FROM orders WHERE status = 'completed' GROUP BY month) SELECT month, ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 1) AS growth_pct FROM m ORDER BY month;", ordered: true },
    ],
    leetcode: [
      lc(178, "Rank Scores", "rank-scores", "Medium"),
      lc(180, "Consecutive Numbers", "consecutive-numbers", "Medium"),
      lc(1204, "Last Person to Fit in the Bus", "last-person-to-fit-in-the-bus", "Medium"),
      lc(1321, "Restaurant Growth", "restaurant-growth", "Medium"),
      lc(602, "Friend Requests II: Who Has the Most Friends", "friend-requests-ii-who-has-the-most-friends", "Medium"),
      lc(185, "Department Top Three Salaries", "department-top-three-salaries", "Hard"),
    ],
  },
  {
    id: "metrics",
    title: "Business metrics",
    blurb: "Funnels, repeat rate, share of total and cohorts.",
    concepts: ["funnel", "conversion", "repeat rate", "share of total", "cohort"],
    body: `This is where SQL meets the BA job. Most KPI questions are a combination of the earlier lessons; the hard part is defining the metric precisely.

**Funnel and conversion.** Count *distinct users* at each step, then divide by the first step:

\`\`\`sql
SELECT event,
       COUNT(DISTINCT user_id) AS users,
       ROUND(100.0 * COUNT(DISTINCT user_id) /
             (SELECT COUNT(DISTINCT user_id) FROM web_events WHERE event = 'visit'), 1) AS pct_of_visitors
FROM web_events
GROUP BY event;
\`\`\`

**Repeat purchase rate** = customers with 2 or more orders ÷ customers with at least 1 order. Build per-customer counts in a CTE, then aggregate again.

**Share of total:** \`SUM(x) * 100.0 / SUM(SUM(x)) OVER ()\` puts each group's share next to it. The empty \`OVER ()\` means "all rows of the grouped result".

**Cohorts:** group customers by signup month, then measure what each cohort did later (ordered at all, ordered again, revenue in month N).

**Before you present a number, write down:**
1. the unit (users, orders, customers),
2. what counts (completed only? refunds?),
3. the time window,
4. the denominator.

Most "wrong" dashboards disagree on one of these, not on the SQL.`,
    exercises: [
      { id: "metrics-1", prompt: "Funnel: for each web event, distinct users and % of visitors (1 decimal). Columns: event, users, pct_of_visitors.", solution: "SELECT event, COUNT(DISTINCT user_id) AS users, ROUND(100.0 * COUNT(DISTINCT user_id) / (SELECT COUNT(DISTINCT user_id) FROM web_events WHERE event = 'visit'), 1) AS pct_of_visitors FROM web_events GROUP BY event;" },
      { id: "metrics-2", prompt: "Repeat purchase rate: % of customers with completed orders who have 2 or more completed orders (1 decimal), as repeat_rate_pct.", solution: "WITH c AS (SELECT customer_id, COUNT(*) AS n FROM orders WHERE status = 'completed' GROUP BY customer_id) SELECT ROUND(100.0 * SUM(CASE WHEN n >= 2 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_rate_pct FROM c;" },
      { id: "metrics-3", prompt: "Each category's share of completed item revenue in percent (1 decimal). Columns: category, share_pct.", solution: "SELECT p.category, ROUND(SUM(oi.quantity * oi.unit_price) * 100.0 / SUM(SUM(oi.quantity * oi.unit_price)) OVER (), 1) AS share_pct FROM order_items oi JOIN orders o ON o.order_id = oi.order_id JOIN products p ON p.product_id = oi.product_id WHERE o.status = 'completed' GROUP BY p.category;" },
      { id: "metrics-4", prompt: "Signup cohorts: for each signup month (YYYY-MM), customers who signed up and how many of them have at least one completed order. Columns: cohort, customers, buyers, in month order.", solution: "SELECT strftime('%Y-%m', c.signup_date) AS cohort, COUNT(*) AS customers, SUM(CASE WHEN EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'completed') THEN 1 ELSE 0 END) AS buyers FROM customers c GROUP BY cohort ORDER BY cohort;", ordered: true },
    ],
    leetcode: [
      lc(1251, "Average Selling Price", "average-selling-price", "Easy"),
      lc(1633, "Percentage of Users Attended a Contest", "percentage-of-users-attended-a-contest", "Easy"),
      lc(1158, "Market Analysis I", "market-analysis-i", "Medium"),
      lc(1789, "Primary Department for Each Employee", "primary-department-for-each-employee", "Easy"),
    ],
  },
  {
    id: "strings",
    title: "Text and data cleaning",
    blurb: "Fix casing, find duplicates, match patterns.",
    concepts: ["UPPER / LOWER", "SUBSTR", "||  / CONCAT", "LIKE", "duplicates", "GROUP_CONCAT"],
    body: `Real data is messy: inconsistent casing, duplicate accounts, stray spaces. Clean it in the query before you count.

| Task | SQLite (sandbox) | MySQL (LeetCode) |
| --- | --- | --- |
| upper / lower | \`UPPER(x)\`, \`LOWER(x)\` | same |
| part of text | \`SUBSTR(x, start, len)\` | \`SUBSTRING(x, start, len)\` |
| join text | \`a \\|\\| b\` | \`CONCAT(a, b)\` |
| trim spaces | \`TRIM(x)\` | same |
| list per group | \`GROUP_CONCAT(x, ',')\` | \`GROUP_CONCAT(DISTINCT x ORDER BY x SEPARATOR ',')\` |
| regex | not built in | \`x REGEXP '^[a-z]'\` |

**Capitalise a name** (LeetCode 1667):

\`\`\`sql
SELECT UPPER(SUBSTR(name, 1, 1)) || LOWER(SUBSTR(name, 2)) AS name
FROM customers;
\`\`\`

**Find duplicates:** normalise first, then group: \`GROUP BY LOWER(email) HAVING COUNT(*) > 1\`. Two emails that differ only in case are the same inbox.

**Deleting duplicates** (LeetCode 196) keeps the smallest id per email: \`DELETE FROM t WHERE id NOT IN (SELECT MIN(id) FROM t GROUP BY email)\`. MySQL needs the subquery wrapped once more because it cannot read the table it is deleting from.

**Pattern match:** \`LIKE\` is case-insensitive for ASCII in SQLite and in MySQL's default collation. Use \`LOWER(email) LIKE ...\` to be explicit.`,
    exercises: [
      { id: "strings-1", prompt: "Show every customer's name with only the first letter capitalised (e.g. 'hoa le' → 'Hoa le'). Columns: customer_id, name.", solution: "SELECT customer_id, UPPER(SUBSTR(name, 1, 1)) || LOWER(SUBSTR(name, 2)) AS name FROM customers;" },
      { id: "strings-2", prompt: "Emails used by more than one customer, ignoring letter case. Return the email in lower case as email.", solution: "SELECT LOWER(email) AS email FROM customers WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) > 1;" },
      { id: "strings-3", prompt: "How many customers use a gmail.com address (any case)? One number, gmail_users.", solution: "SELECT COUNT(*) AS gmail_users FROM customers WHERE LOWER(email) LIKE '%@gmail.com';" },
      { id: "strings-4", prompt: "For each category, the product names sorted A to Z and joined into one string separated by ', '. Columns: category, products.", solution: "SELECT category, GROUP_CONCAT(name, ', ') AS products FROM (SELECT category, name FROM products ORDER BY category, name) GROUP BY category;" },
    ],
    leetcode: [
      lc(1667, "Fix Names in a Table", "fix-names-in-a-table", "Easy"),
      lc(1527, "Patients With a Condition", "patients-with-a-condition", "Easy"),
      lc(196, "Delete Duplicate Emails", "delete-duplicate-emails", "Easy"),
      lc(1484, "Group Sold Products By The Date", "group-sold-products-by-the-date", "Easy"),
      lc(1517, "Find Users With Valid E-Mails", "find-users-with-valid-e-mails", "Easy"),
    ],
  },
];

export const sqlCardId = (num: number) => `sql:${num}`;
export const ALL_SQL_PROBLEMS = SQL_LESSONS.flatMap((l) => l.leetcode);
export const ALL_SQL_EXERCISES = SQL_LESSONS.flatMap((l) => l.exercises);
