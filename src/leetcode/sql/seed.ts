/**
 * Sample business database for the SQL sandbox: a small Vietnamese online shop in 2025.
 * Generated deterministically so every learner sees the same rows and answers can be checked.
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TableInfo {
  name: string;
  blurb: string;
  columns: [string, string][];
}

export const SCHEMA: TableInfo[] = [
  {
    name: "customers",
    blurb: "One row per customer account.",
    columns: [
      ["customer_id", "INTEGER, primary key"],
      ["name", "TEXT (some names are badly cased)"],
      ["email", "TEXT, may be NULL or duplicated"],
      ["city", "TEXT"],
      ["segment", "TEXT: Consumer, SMB, Enterprise"],
      ["signup_date", "TEXT, YYYY-MM-DD"],
      ["referred_by", "INTEGER, customer_id of the referrer, may be NULL"],
    ],
  },
  {
    name: "products",
    blurb: "Catalogue. Prices in USD.",
    columns: [
      ["product_id", "INTEGER, primary key"],
      ["name", "TEXT"],
      ["category", "TEXT: Books, Electronics, Home, Beauty"],
      ["price", "REAL"],
    ],
  },
  {
    name: "orders",
    blurb: "One row per order. amount is the order total.",
    columns: [
      ["order_id", "INTEGER, primary key"],
      ["customer_id", "INTEGER → customers"],
      ["order_date", "TEXT, YYYY-MM-DD"],
      ["status", "TEXT: completed, cancelled, refunded"],
      ["channel", "TEXT: web, app, store"],
      ["amount", "REAL, sum of the order's items"],
    ],
  },
  {
    name: "order_items",
    blurb: "Lines of each order.",
    columns: [
      ["order_id", "INTEGER → orders"],
      ["product_id", "INTEGER → products"],
      ["quantity", "INTEGER"],
      ["unit_price", "REAL"],
    ],
  },
  {
    name: "web_events",
    blurb: "Website funnel events.",
    columns: [
      ["user_id", "INTEGER"],
      ["event_date", "TEXT, YYYY-MM-DD"],
      ["event", "TEXT: visit, signup, add_to_cart, purchase"],
    ],
  },
  {
    name: "employees",
    blurb: "Company staff and reporting lines.",
    columns: [
      ["employee_id", "INTEGER, primary key"],
      ["name", "TEXT"],
      ["department", "TEXT"],
      ["manager_id", "INTEGER → employees, NULL for the CEO"],
      ["salary", "INTEGER, USD per year"],
      ["hire_date", "TEXT, YYYY-MM-DD"],
    ],
  },
];

const FIRST = ["An", "Binh", "Chi", "Dung", "Giang", "Ha", "Hai", "Hanh", "Hieu", "Hoa", "Hung", "Huong", "Khanh", "Lan", "Linh", "Long", "Mai", "Minh", "Nam", "Ngoc", "Nhung", "Phong", "Phuong", "Quan", "Quang", "Son", "Tam", "Thanh", "Thao", "Trang", "Trung", "Tuan", "Tuyet", "Van", "Viet", "Vy", "Yen"];
const LAST = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui", "Do", "Ngo"];
const CITIES = ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong", "Can Tho"];
const PRODUCTS: [string, string, number][] = [
  ["Atomic Habits", "Books", 16.5],
  ["Sapiens", "Books", 18.9],
  ["IELTS Cambridge 19", "Books", 24],
  ["Clean Code", "Books", 37.5],
  ["Wireless Earbuds", "Electronics", 59],
  ["Mechanical Keyboard", "Electronics", 89],
  ["27-inch Monitor", "Electronics", 239],
  ["Noise-cancelling Headphones", "Electronics", 299],
  ["Ceramic Mug Set", "Home", 14.5],
  ["Desk Lamp", "Home", 32],
  ["Air Purifier", "Home", 149],
  ["Sunscreen SPF50", "Beauty", 12.9],
  ["Vitamin C Serum", "Beauty", 22],
  ["Hair Dryer", "Beauty", 45],
];

const q = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);
const pad = (n: number) => String(n).padStart(2, "0");
const day = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return day(d);
};

export function seedSql(): string {
  const r = rng(2026);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const out: string[] = [
    "CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT, email TEXT, city TEXT, segment TEXT, signup_date TEXT, referred_by INTEGER);",
    "CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);",
    "CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, status TEXT, channel TEXT, amount REAL);",
    "CREATE TABLE order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);",
    "CREATE TABLE web_events (user_id INTEGER, event_date TEXT, event TEXT);",
    "CREATE TABLE employees (employee_id INTEGER PRIMARY KEY, name TEXT, department TEXT, manager_id INTEGER, salary INTEGER, hire_date TEXT);",
  ];

  // Customers
  const N = 60;
  const customers: { id: number; signup: string }[] = [];
  const used = new Set<string>();
  for (let id = 1; id <= N; id++) {
    let first: string, last: string;
    do {
      first = pick(FIRST);
      last = pick(LAST);
    } while (used.has(first + last));
    used.add(first + last);
    let name = `${first} ${last}`;
    if (id % 11 === 3) name = name.toLowerCase();
    else if (id % 13 === 5) name = name.toUpperCase();
    const domain = id % 3 === 0 ? "gmail.com" : id % 3 === 1 ? "yahoo.com" : "company.vn";
    let email: string | null = `${first}.${last}${id}@${domain}`.toLowerCase();
    if (id % 17 === 4) email = null;
    if (id === 42) email = "lan.nguyen7@gmail.com";
    if (id === 7) email = "Lan.Nguyen7@Gmail.com";
    const segment = id % 7 === 0 ? "Enterprise" : id % 3 === 0 ? "SMB" : "Consumer";
    const signup = day(new Date(Date.UTC(2025, 0, 1 + Math.floor(r() * 330))));
    const ref = id > 5 && r() < 0.3 ? 1 + Math.floor(r() * (id - 1)) : null;
    customers.push({ id, signup });
    out.push(`INSERT INTO customers VALUES (${id}, ${q(name)}, ${q(email)}, ${q(CITIES[(id * 7) % 5])}, ${q(segment)}, ${q(signup)}, ${q(ref)});`);
  }

  PRODUCTS.forEach(([name, cat, price], i) => out.push(`INSERT INTO products VALUES (${i + 1}, ${q(name)}, ${q(cat)}, ${price});`));

  // Orders: ~1 in 8 customers never orders.
  let oid = 1;
  for (const c of customers) {
    if (c.id % 8 === 2) continue;
    const n = c.id % 7 === 0 ? 4 + Math.floor(r() * 5) : 1 + Math.floor(r() * 4);
    let date = addDays(c.signup, Math.floor(r() * 45));
    for (let k = 0; k < n && date <= "2025-12-31"; k++) {
      const roll = r();
      const status = roll < 0.8 ? "completed" : roll < 0.92 ? "cancelled" : "refunded";
      const channel = r() < 0.45 ? "web" : r() < 0.7 ? "app" : "store";
      const lines = 1 + Math.floor(r() * 3);
      const chosen = new Set<number>();
      let amount = 0;
      const items: string[] = [];
      for (let l = 0; l < lines; l++) {
        const pid = 1 + Math.floor(r() * PRODUCTS.length);
        if (chosen.has(pid)) continue;
        chosen.add(pid);
        const qty = 1 + Math.floor(r() * (PRODUCTS[pid - 1][2] < 30 ? 3 : 1));
        const unit = PRODUCTS[pid - 1][2];
        amount += qty * unit;
        items.push(`INSERT INTO order_items VALUES (${oid}, ${pid}, ${qty}, ${unit});`);
      }
      out.push(`INSERT INTO orders VALUES (${oid}, ${c.id}, ${q(date)}, ${q(status)}, ${q(channel)}, ${Math.round(amount * 100) / 100});`, ...items);
      oid++;
      date = addDays(date, 7 + Math.floor(r() * 70));
    }
  }

  // Funnel: 400 visitors, each later step keeps a share of the previous one.
  for (let u = 1; u <= 400; u++) {
    const d = day(new Date(Date.UTC(2025, 8, 1 + Math.floor(r() * 30))));
    out.push(`INSERT INTO web_events VALUES (${u}, ${q(d)}, 'visit');`);
    if (r() < 0.8) out.push(`INSERT INTO web_events VALUES (${u}, ${q(d)}, 'visit');`);
    if (r() > 0.35) continue;
    out.push(`INSERT INTO web_events VALUES (${u}, ${q(addDays(d, 1))}, 'signup');`);
    if (r() > 0.55) continue;
    out.push(`INSERT INTO web_events VALUES (${u}, ${q(addDays(d, 2))}, 'add_to_cart');`);
    if (r() > 0.5) continue;
    out.push(`INSERT INTO web_events VALUES (${u}, ${q(addDays(d, 3))}, 'purchase');`);
  }

  const staff: [string, string, number | null, number, string][] = [
    ["Mai Tran", "Executive", null, 180000, "2018-03-01"],
    ["Quang Le", "Sales", 1, 120000, "2019-05-12"],
    ["Linh Pham", "Sales", 2, 72000, "2021-02-01"],
    ["Hieu Vu", "Sales", 2, 68000, "2022-07-18"],
    ["Thao Do", "Sales", 2, 72000, "2020-11-03"],
    ["Son Bui", "Sales", 2, 55000, "2024-01-15"],
    ["Ngoc Hoang", "Finance", 1, 115000, "2019-09-09"],
    ["Tuan Ngo", "Finance", 7, 81000, "2021-06-21"],
    ["Yen Dang", "Finance", 7, 64000, "2023-03-27"],
    ["Khanh Nguyen", "Product", 1, 135000, "2020-01-06"],
    ["Vy Tran", "Product", 10, 98000, "2021-10-11"],
    ["Phong Le", "Product", 10, 104000, "2022-04-04"],
    ["Hanh Pham", "Product", 10, 91000, "2023-08-14"],
    ["Dung Vu", "Product", 10, 87000, "2024-05-20"],
    ["Binh Do", "Product", 10, 76000, "2025-02-10"],
    ["Giang Bui", "Ops", 1, 99000, "2020-06-30"],
    ["Hoa Ngo", "Ops", 16, 52000, "2023-12-01"],
  ];
  staff.forEach(([name, dept, mgr, sal, hired], i) => out.push(`INSERT INTO employees VALUES (${i + 1}, ${q(name)}, ${q(dept)}, ${q(mgr)}, ${sal}, ${q(hired)});`));
  return out.join("\n");
}
