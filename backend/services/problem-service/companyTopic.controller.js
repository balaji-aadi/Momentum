import Company from "../../models/company.model.js";
import Topic from "../../models/topic.model.js";
import Pattern from "../../models/pattern.model.js";
import Language from "../../models/language.model.js";

// Helper to generate clean slug
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Default Comprehensive Seed Data
const DEFAULT_TOPICS = [
  { name: "Array", category: "Data Structures" },
  { name: "String", category: "Data Structures" },
  { name: "Hash Table", category: "Data Structures" },
  { name: "Two Pointers", category: "Algorithms" },
  { name: "Sliding Window", category: "Algorithms" },
  { name: "Stack", category: "Data Structures" },
  { name: "Queue", category: "Data Structures" },
  { name: "Heap (Priority Queue)", category: "Data Structures" },
  { name: "Binary Search", category: "Algorithms" },
  { name: "Linked List", category: "Data Structures" },
  { name: "Binary Tree", category: "Data Structures" },
  { name: "Binary Search Tree (BST)", category: "Data Structures" },
  { name: "Graph", category: "Data Structures" },
  { name: "Depth-First Search (DFS)", category: "Algorithms" },
  { name: "Breadth-First Search (BFS)", category: "Algorithms" },
  { name: "Backtracking", category: "Algorithms" },
  { name: "Dynamic Programming", category: "Algorithms" },
  { name: "Greedy", category: "Algorithms" },
  { name: "Bit Manipulation", category: "Algorithms" },
  { name: "Union Find (Disjoint Set)", category: "Data Structures" },
  { name: "Topological Sort", category: "Algorithms" },
  { name: "Trie", category: "Data Structures" },
  { name: "Matrix", category: "Data Structures" },
  { name: "Prefix Sum", category: "Algorithms" },
  { name: "Segment Tree", category: "Advanced Topics" },
  { name: "Monotonic Stack", category: "Data Structures" },
  { name: "Divide and Conquer", category: "Algorithms" },
  { name: "Recursion", category: "Algorithms font-semibold" },
  { name: "Math", category: "Advanced Topics" },
  { name: "Game Theory", category: "Advanced Topics" },
  { name: "Geometry", category: "Advanced Topics" }
];

const DEFAULT_COMPANIES = [
  { name: "Google", logoUrl: "https://logo.clearbit.com/google.com" },
  { name: "Meta", logoUrl: "https://logo.clearbit.com/meta.com" },
  { name: "Amazon", logoUrl: "https://logo.clearbit.com/amazon.com" },
  { name: "Microsoft", logoUrl: "https://logo.clearbit.com/microsoft.com" },
  { name: "Apple", logoUrl: "https://logo.clearbit.com/apple.com" },
  { name: "Netflix", logoUrl: "https://logo.clearbit.com/netflix.com" },
  { name: "Uber", logoUrl: "https://logo.clearbit.com/uber.com" },
  { name: "Airbnb", logoUrl: "https://logo.clearbit.com/airbnb.com" },
  { name: "Adobe", logoUrl: "https://logo.clearbit.com/adobe.com" },
  { name: "Salesforce", logoUrl: "https://logo.clearbit.com/salesforce.com" },
  { name: "LinkedIn", logoUrl: "https://logo.clearbit.com/linkedin.com" },
  { name: "Atlassian", logoUrl: "https://logo.clearbit.com/atlassian.com font-semibold" },
  { name: "Bloomberg", logoUrl: "https://logo.clearbit.com/bloomberg.com" },
  { name: "Goldman Sachs", logoUrl: "https://logo.clearbit.com/goldmansachs.com" },
  { name: "Oracle", logoUrl: "https://logo.clearbit.com/oracle.com" },
  { name: "Stripe", logoUrl: "https://logo.clearbit.com/stripe.com" },
  { name: "ByteDance", logoUrl: "https://logo.clearbit.com/bytedance.com" },
  { name: "PayPal", logoUrl: "https://logo.clearbit.com/paypal.com" },
  { name: "Walmart", logoUrl: "https://logo.clearbit.com/walmart.com" },
  { name: "Swiggy", logoUrl: "https://logo.clearbit.com/swiggy.com" },
  { name: "Zomato", logoUrl: "https://logo.clearbit.com/zomato.com" },
  { name: "Flipkart", logoUrl: "https://logo.clearbit.com/flipkart.com" }
];

const DEFAULT_PATTERNS = [
  { name: "Sliding Window", description: "Maintain a running window range over arrays or strings to calculate sub-array metrics." },
  { name: "Two Pointers", description: "Use two pointers moving in opposite or same direction to optimize search space." },
  { name: "Fast & Slow Pointers", description: "Hare & Tortoise algorithm for detecting cycles in linked lists or arrays." },
  { name: "Merge Intervals", description: "Overlapping intervals manipulation and interval merging techniques." },
  { name: "Cyclic Sort", description: "Sort array elements in O(N) time when elements are in range [1..N]." },
  { name: "In-place Reversal of LinkedList", description: "Reverse links between nodes without allocating extra memory." },
  { name: "Tree BFS", description: "Level-order traversal using queue data structure." },
  { name: "Tree DFS", description: "Depth-first traversal using recursion or stack (Pre-order, In-order, Post-order)." },
  { name: "Two Heaps", description: "Use Min-Heap and Max-Heap simultaneously (e.g. Find Median of Data Stream)." },
  { name: "Subsets & Permutations", description: "Backtracking pattern for generating subsets, combinations, and permutations." },
  { name: "Modified Binary Search", description: "Binary search variations on rotated, sorted, or peak element arrays." },
  { name: "Top 'K' Elements", description: "Use Min/Max Heap to maintain K largest or smallest elements." },
  { name: "K-way Merge", description: "Merge K sorted lists, arrays, or matrices using Priority Queue." },
  { name: "0/1 Knapsack", description: "Dynamic programming choice selection (include or exclude)." },
  { name: "Unbounded Knapsack", description: "Dynamic programming pattern allowing unlimited reuse of items." },
  { name: "Longest Common Subsequence (LCS)", description: "String matching dynamic programming pattern." },
  { name: "Monotonic Stack", description: "Maintain next greater or next smaller element indices." },
  { name: "Prefix Sum", description: "Pre-calculate cumulative sums for O(1) range queries." }
];

// ==================== COMPANY CONTROLLERS ====================
export const getCompanies = async (req, res) => {
  try {
    let companies = await Company.find().sort({ name: 1 });
    if (companies.length === 0) {
      const docs = DEFAULT_COMPANIES.map(c => ({ ...c, slug: generateSlug(c.name) }));
      companies = await Company.insertMany(docs);
    }
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, logoUrl } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Company name is required" });
    
    const slug = generateSlug(name);
    const existing = await Company.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: "Company already exists" });

    const company = await Company.create({ name, slug, logoUrl });
    return res.status(201).json({ success: true, data: company });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TOPIC CONTROLLERS ====================
export const getTopics = async (req, res) => {
  try {
    let topics = await Topic.find().sort({ name: 1 });
    if (topics.length === 0) {
      const docs = DEFAULT_TOPICS.map(t => ({ ...t, slug: generateSlug(t.name) }));
      topics = await Topic.insertMany(docs);
    }
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createTopic = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Topic name is required" });

    const slug = generateSlug(name);
    const existing = await Topic.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: "Topic already exists" });

    const topic = await Topic.create({ name, slug, category: category || "Algorithms" });
    return res.status(201).json({ success: true, data: topic });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await Topic.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Topic deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PATTERN CONTROLLERS ====================
export const getPatterns = async (req, res) => {
  try {
    let patterns = await Pattern.find().sort({ name: 1 });
    if (patterns.length === 0) {
      const docs = DEFAULT_PATTERNS.map(p => ({ ...p, slug: generateSlug(p.name) }));
      patterns = await Pattern.insertMany(docs);
    }
    return res.status(200).json({ success: true, data: patterns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPattern = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Pattern name is required" });

    const slug = generateSlug(name);
    const existing = await Pattern.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: "Pattern already exists" });

    const pattern = await Pattern.create({ name, slug, description });
    return res.status(201).json({ success: true, data: pattern });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePattern = async (req, res) => {
  try {
    const { id } = req.params;
    await Pattern.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Pattern deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Seed Defaults Trigger
export const seedDefaults = async (req, res) => {
  try {
    const topicDocs = DEFAULT_TOPICS.map(t => ({ ...t, slug: generateSlug(t.name) }));
    for (const t of topicDocs) {
      await Topic.updateOne({ slug: t.slug }, { $setOnInsert: t }, { upsert: true });
    }

    const companyDocs = DEFAULT_COMPANIES.map(c => ({ ...c, slug: generateSlug(c.name) }));
    for (const c of companyDocs) {
      await Company.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
    }

    const patternDocs = DEFAULT_PATTERNS.map(p => ({ ...p, slug: generateSlug(p.name) }));
    for (const p of patternDocs) {
      await Pattern.updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });
    }

    return res.status(200).json({ success: true, message: "Default Topics, Companies, and Patterns successfully seeded into database!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LANGUAGE CONTROLLERS ====================
export const getLanguages = async (req, res) => {
  try {
    let languages = await Language.find().sort({ name: 1 });
    if (languages.length === 0) {
      const defaultLangs = [
        { name: "JavaScript", code: "javascript", monacoId: "javascript", defaultTemplate: "// Write solution here\nfunction solution() {\n  return true;\n}" },
        { name: "Python 3", code: "python", monacoId: "python", defaultTemplate: "# Write solution here\nclass Solution:\n    def solve(self):\n        pass" },
        { name: "C++", code: "cpp", monacoId: "cpp", defaultTemplate: "#include <iostream>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {}\n};" },
        { name: "Java", code: "java", monacoId: "java", defaultTemplate: "class Solution {\n    public void solve() {}\n}" },
        { name: "Go", code: "go", monacoId: "go", defaultTemplate: "package main\n\nfunc solve() {}\n" }
      ];
      languages = await Language.insertMany(defaultLangs);
    }
    return res.status(200).json({ success: true, data: languages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createLanguage = async (req, res) => {
  try {
    const { name, code, monacoId, defaultTemplate } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "Name and code are required" });

    const existing = await Language.findOne({ code: code.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: "Language already exists" });

    const lang = await Language.create({
      name,
      code: code.toLowerCase(),
      monacoId: monacoId || code.toLowerCase(),
      defaultTemplate
    });
    return res.status(201).json({ success: true, data: lang });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
