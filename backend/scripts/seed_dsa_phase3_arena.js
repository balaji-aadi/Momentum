import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const USER_ID_STR = '6993047f16e85ff3e4efd9a3'; // Balaji Aadi
const BRANCH_ID_STR = '6a081b6e111c99b633b00d76'; // Software Development Branch

/**
 * DSA PHASE 3 FINAL CURRICULUM:
 * - 12 Core Missing Patterns
 * - 3 Weak Patterns Expanded (~10 problems each: Backtracking, Interval/State DP, LCS/LIS DP)
 * - Trie Applications (Replace Words, Map Sum Pairs)
 * - Bit Manipulation Extensions (Bitwise AND Range, Number of 1 Bits)
 * - Math Extensions (Happy Number, Factorial Trailing Zeroes, Palindrome Number)
 */
export const DSA_PHASE3_CURRICULUM = [
    {
        topic: 'Trees & BST',
        patternKey: 'tree_bfs_traversal',
        patternName: 'Tree BFS / Level Order Traversal',
        problems: [
            { name: 'Binary Tree Level Order Traversal', leetcodeId: 102, difficulty: 'Medium' },
            { name: 'Binary Tree Zigzag Level Order Traversal', leetcodeId: 103, difficulty: 'Medium' },
            { name: 'Binary Tree Right Side View', leetcodeId: 199, difficulty: 'Medium' },
            { name: 'Minimum Depth of Binary Tree', leetcodeId: 111, difficulty: 'Easy' },
            { name: 'Populating Next Right Pointers in Each Node', leetcodeId: 116, difficulty: 'Medium' },
            { name: 'Average of Levels in Binary Tree', leetcodeId: 637, difficulty: 'Easy' }
        ]
    },
    {
        topic: 'Trees & BST',
        patternKey: 'tree_dfs_path_sum',
        patternName: 'Tree DFS, Construction, LCA & BST Operations',
        problems: [
            { name: 'Binary Tree Inorder Traversal', leetcodeId: 94, difficulty: 'Easy' },
            { name: 'Maximum Depth of Binary Tree', leetcodeId: 104, difficulty: 'Easy' },
            { name: 'Balanced Binary Tree', leetcodeId: 110, difficulty: 'Easy' },
            { name: 'Symmetric Tree', leetcodeId: 101, difficulty: 'Easy' },
            { name: 'Diameter of Binary Tree', leetcodeId: 543, difficulty: 'Easy' },
            { name: 'Path Sum', leetcodeId: 112, difficulty: 'Easy' },
            { name: 'Binary Tree Maximum Path Sum', leetcodeId: 124, difficulty: 'Hard' },
            { name: 'Lowest Common Ancestor of a Binary Tree', leetcodeId: 236, difficulty: 'Medium' },
            { name: 'Lowest Common Ancestor of a Binary Search Tree', leetcodeId: 235, difficulty: 'Medium' },
            { name: 'Validate Binary Search Tree', leetcodeId: 98, difficulty: 'Medium' },
            { name: 'Search in a Binary Search Tree', leetcodeId: 700, difficulty: 'Easy' },
            { name: 'Kth Smallest Element in a BST', leetcodeId: 230, difficulty: 'Medium' },
            { name: 'Construct Binary Tree from Preorder and Inorder Traversal', leetcodeId: 105, difficulty: 'Medium' },
            { name: 'Serialize and Deserialize Binary Tree', leetcodeId: 297, difficulty: 'Hard' },
            { name: 'House Robber III', leetcodeId: 337, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Graphs',
        patternKey: 'graph_bfs_dfs',
        patternName: 'Graph BFS/DFS & Connected Components',
        problems: [
            { name: 'Number of Islands', leetcodeId: 200, difficulty: 'Medium' },
            { name: 'Rotting Oranges', leetcodeId: 994, difficulty: 'Medium' },
            { name: 'Clone Graph', leetcodeId: 133, difficulty: 'Medium' },
            { name: 'Pacific Atlantic Water Flow', leetcodeId: 417, difficulty: 'Medium' },
            { name: 'Word Ladder', leetcodeId: 127, difficulty: 'Hard' },
            { name: 'Surrounded Regions', leetcodeId: 130, difficulty: 'Medium' },
            { name: 'Graph Valid Tree', leetcodeId: 261, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Graphs',
        patternKey: 'topological_sort',
        patternName: "Topological Sort (Kahn's Algorithm)",
        problems: [
            { name: 'Course Schedule', leetcodeId: 207, difficulty: 'Medium' },
            { name: 'Course Schedule II', leetcodeId: 210, difficulty: 'Medium' },
            { name: 'Alien Dictionary', leetcodeId: 269, difficulty: 'Hard' },
            { name: 'Minimum Height Trees', leetcodeId: 310, difficulty: 'Medium' },
            { name: 'Sequence Reconstruction', leetcodeId: 444, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Graphs',
        patternKey: 'shortest_path_mst',
        patternName: 'Shortest Path & Minimum Spanning Tree',
        problems: [
            { name: 'Network Delay Time', leetcodeId: 743, difficulty: 'Medium' },
            { name: 'Path with Maximum Probability', leetcodeId: 1514, difficulty: 'Medium' },
            { name: 'Min Cost to Connect All Points', leetcodeId: 1584, difficulty: 'Medium' },
            { name: 'Cheapest Flights Within K Stops', leetcodeId: 787, difficulty: 'Medium' },
            { name: 'Swim in Rising Water', leetcodeId: 778, difficulty: 'Hard' }
        ]
    },
    {
        topic: 'Graphs',
        patternKey: 'union_find_disjoint',
        patternName: 'Union-Find (Disjoint Set Unit - DSU)',
        problems: [
            { name: 'Redundant Connection', leetcodeId: 684, difficulty: 'Medium' },
            { name: 'Number of Provinces', leetcodeId: 547, difficulty: 'Medium' },
            { name: 'Accounts Merge', leetcodeId: 721, difficulty: 'Medium' },
            { name: 'Most Stones Removed with Same Row or Column', leetcodeId: 947, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'knapsack_dp',
        patternName: '0/1 & Unbounded Knapsack DP',
        problems: [
            { name: 'Coin Change', leetcodeId: 322, difficulty: 'Medium' },
            { name: 'Partition Equal Subset Sum', leetcodeId: 416, difficulty: 'Medium' },
            { name: 'Target Sum', leetcodeId: 494, difficulty: 'Medium' },
            { name: 'Combination Sum IV', leetcodeId: 377, difficulty: 'Medium' },
            { name: 'Ones and Zeroes', leetcodeId: 474, difficulty: 'Medium' },
            { name: 'Last Stone Weight II', leetcodeId: 1049, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'grid_matrix_dp',
        patternName: 'Grid Path & Matrix DP',
        problems: [
            { name: 'Unique Paths', leetcodeId: 62, difficulty: 'Medium' },
            { name: 'Minimum Path Sum', leetcodeId: 64, difficulty: 'Medium' },
            { name: 'Maximal Square', leetcodeId: 221, difficulty: 'Medium' },
            { name: 'Dungeon Game', leetcodeId: 174, difficulty: 'Hard' },
            { name: 'Cherry Pickup', leetcodeId: 741, difficulty: 'Hard' }
        ]
    },
    {
        topic: 'Greedy & Backtracking',
        patternKey: 'greedy_scheduling',
        patternName: 'Greedy Scheduling & Jump Game',
        problems: [
            { name: 'Jump Game', leetcodeId: 55, difficulty: 'Medium' },
            { name: 'Jump Game II', leetcodeId: 45, difficulty: 'Medium' },
            { name: 'Gas Station', leetcodeId: 134, difficulty: 'Medium' },
            { name: 'Minimum Number of Arrows to Burst Balloons', leetcodeId: 452, difficulty: 'Medium' },
            { name: 'Task Scheduler', leetcodeId: 621, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Greedy & Backtracking',
        patternKey: 'backtracking_subsets',
        patternName: 'Backtracking (Subsets/Combinations)',
        problems: [
            { name: 'Subsets', leetcodeId: 78, difficulty: 'Medium' },
            { name: 'Subsets II', leetcodeId: 90, difficulty: 'Medium' },
            { name: 'Permutations', leetcodeId: 46, difficulty: 'Medium' },
            { name: 'Permutations II', leetcodeId: 47, difficulty: 'Medium' },
            { name: 'Combination Sum', leetcodeId: 39, difficulty: 'Medium' },
            { name: 'Combination Sum II', leetcodeId: 40, difficulty: 'Medium' },
            { name: 'Combination Sum III', leetcodeId: 216, difficulty: 'Medium' },
            { name: 'N-Queens', leetcodeId: 51, difficulty: 'Hard' },
            { name: 'Sudoku Solver', leetcodeId: 37, difficulty: 'Hard' },
            { name: 'Word Search', leetcodeId: 79, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'interval_state_dp',
        patternName: 'Interval DP & State Machine DP',
        problems: [
            { name: 'Burst Balloons', leetcodeId: 312, difficulty: 'Hard' },
            { name: 'Guess Number Higher or Lower II', leetcodeId: 375, difficulty: 'Medium' },
            { name: 'Palindrome Partitioning II', leetcodeId: 132, difficulty: 'Hard' },
            { name: 'House Robber', leetcodeId: 198, difficulty: 'Medium' },
            { name: 'House Robber II', leetcodeId: 213, difficulty: 'Medium' },
            { name: 'Best Time to Buy and Sell Stock with Cooldown', leetcodeId: 309, difficulty: 'Medium' },
            { name: 'Best Time to Buy and Sell Stock with Transaction Fee', leetcodeId: 714, difficulty: 'Medium' },
            { name: 'Best Time to Buy and Sell Stock III', leetcodeId: 123, difficulty: 'Hard' },
            { name: 'Best Time to Buy and Sell Stock IV', leetcodeId: 188, difficulty: 'Hard' },
            { name: 'Paint Fence', leetcodeId: 276, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'lcs_lis_dp',
        patternName: 'LCS & LIS Pattern (Strings/Sequences)',
        problems: [
            { name: 'Longest Common Subsequence', leetcodeId: 1143, difficulty: 'Medium' },
            { name: 'Longest Palindromic Subsequence', leetcodeId: 516, difficulty: 'Medium' },
            { name: 'Edit Distance', leetcodeId: 72, difficulty: 'Hard' },
            { name: 'Longest Increasing Subsequence', leetcodeId: 300, difficulty: 'Medium' },
            { name: 'Russian Doll Envelopes', leetcodeId: 354, difficulty: 'Hard' },
            { name: 'Number of Longest Increasing Subsequences', leetcodeId: 673, difficulty: 'Medium' },
            { name: 'Distinct Subsequences', leetcodeId: 115, difficulty: 'Hard' },
            { name: 'Delete Operation for Two Strings', leetcodeId: 583, difficulty: 'Medium' },
            { name: 'Shortest Common Supersequence', leetcodeId: 1092, difficulty: 'Hard' },
            { name: 'Interleaving String', leetcodeId: 97, difficulty: 'Medium' },
            { name: 'Minimum ASCII Delete Sum for Two Strings', leetcodeId: 712, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Trie & Bit Manipulation',
        patternKey: 'trie_prefix_tree',
        patternName: 'Trie (Prefix Tree) Design & Applications',
        problems: [
            { name: 'Implement Trie (Prefix Tree)', leetcodeId: 208, difficulty: 'Medium' },
            { name: 'Design Add and Search Words Data Structure', leetcodeId: 211, difficulty: 'Medium' },
            { name: 'Word Search II', leetcodeId: 212, difficulty: 'Hard' },
            { name: 'Replace Words', leetcodeId: 648, difficulty: 'Medium' },
            { name: 'Map Sum Pairs', leetcodeId: 677, difficulty: 'Medium' },
            { name: 'Prefix and Suffix Search', leetcodeId: 745, difficulty: 'Hard' }
        ]
    },
    {
        topic: 'Trie & Bit Manipulation',
        patternKey: 'bit_manipulation_basics',
        patternName: 'Bit Manipulation & Bitmasking',
        problems: [
            { name: 'Single Number', leetcodeId: 136, difficulty: 'Easy' },
            { name: 'Single Number II', leetcodeId: 137, difficulty: 'Medium' },
            { name: 'Single Number III', leetcodeId: 260, difficulty: 'Medium' },
            { name: 'Counting Bits', leetcodeId: 338, difficulty: 'Easy' },
            { name: 'Reverse Bits', leetcodeId: 190, difficulty: 'Easy' },
            { name: 'Number of 1 Bits', leetcodeId: 191, difficulty: 'Easy' },
            { name: 'Bitwise AND of Numbers Range', leetcodeId: 201, difficulty: 'Medium' },
            { name: 'Sum of Two Integers', leetcodeId: 371, difficulty: 'Medium' }
        ]
    },
    {
        topic: 'Math & Fundamentals',
        patternKey: 'math_number_theory',
        patternName: 'Math & Number Theory (Optional Fundamentals)',
        problems: [
            { name: 'Count Primes', leetcodeId: 204, difficulty: 'Medium' },
            { name: 'Greatest Common Divisor of Strings', leetcodeId: 1071, difficulty: 'Easy' },
            { name: 'Pow(x, n)', leetcodeId: 50, difficulty: 'Medium' },
            { name: 'Happy Number', leetcodeId: 202, difficulty: 'Easy' },
            { name: 'Factorial Trailing Zeroes', leetcodeId: 172, difficulty: 'Medium' },
            { name: 'Palindrome Number', leetcodeId: 9, difficulty: 'Easy' },
            { name: 'Roman to Integer', leetcodeId: 13, difficulty: 'Easy' }
        ]
    }
];

export async function seedDsaPhase3() {
    try {
        console.log('[Seeder] Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('[Seeder] Connected successfully.');

        const Project = mongoose.connection.collection('projects');
        const Task = mongoose.connection.collection('tasks');

        let dsaPhase3Proj = await Project.findOne({ key: 'DSAP3' });

        if (!dsaPhase3Proj) {
            console.log('[Seeder] Creating new Project Arena: DSA Phase 3 (DSAP3)...');
            const insertResult = await Project.insertOne({
                name: 'DSA Phase 3',
                key: 'DSAP3',
                description: 'Final Phase FAANG Pattern Mastery Arena covering missing tree, graph, DP, trie, bitmasking, math patterns and weak pattern reinforcements.',
                branchId: new mongoose.Types.ObjectId(BRANCH_ID_STR),
                createdBy: new mongoose.Types.ObjectId(USER_ID_STR),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            dsaPhase3Proj = { _id: insertResult.insertedId, key: 'DSAP3', name: 'DSA Phase 3' };
            console.log(`[Seeder] Project DSA Phase 3 created with ID: ${dsaPhase3Proj._id}`);
        } else {
            console.log(`[Seeder] Found existing Project DSA Phase 3 with ID: ${dsaPhase3Proj._id}`);
        }

        // Delete any incomplete tasks previously seeded for DSAP3 to ensure clean re-seed
        await Task.deleteMany({ projectName: dsaPhase3Proj._id });
        console.log('[Seeder] Cleaned existing DSAP3 tasks for fresh seeding.');

        let totalProblemsInserted = 0;
        let taskIdCounter = 1;

        for (const patternItem of DSA_PHASE3_CURRICULUM) {
            const numChildren = patternItem.problems.length;
            const parentTaskIdStr = `DSAP3-${taskIdCounter++}`;

            const childDocsToInsert = [];

            for (const prob of patternItem.problems) {
                const childTaskIdStr = `DSAP3-${taskIdCounter++}`;

                childDocsToInsert.push({
                    taskName: prob.name,
                    description: `LeetCode ${prob.leetcodeId || ''} - ${prob.difficulty} | Pattern: ${patternItem.patternName}`,
                    projectName: dsaPhase3Proj._id,
                    taskId: childTaskIdStr,
                    taskPriority: 'medium',
                    taskType: 'preparation',
                    estimatedHours: 1, // 1 hour per child problem task
                    taskStartDate: null,
                    taskDueDate: null,
                    status: 'todo',
                    branchId: new mongoose.Types.ObjectId(BRANCH_ID_STR),
                    assignee: new mongoose.Types.ObjectId(USER_ID_STR),
                    createdBy: new mongoose.Types.ObjectId(USER_ID_STR),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // Parent task doc:
            // - Canonical task with null dates so user can dynamically schedule via Schedule Arena
            // - estimatedHours: total sum of child hours
            const parentTaskDoc = {
                taskName: patternItem.patternName,
                description: `Parent Pattern Task for ${patternItem.patternName}`,
                projectName: dsaPhase3Proj._id,
                taskId: parentTaskIdStr,
                taskPriority: 'medium',
                taskType: 'preparation',
                estimatedHours: numChildren,
                taskStartDate: null,
                taskDueDate: null,
                parentTask: null,
                status: 'todo',
                subtaskStats: { total: numChildren, completed: 0 },
                branchId: new mongoose.Types.ObjectId(BRANCH_ID_STR),
                assignee: new mongoose.Types.ObjectId(USER_ID_STR),
                createdBy: new mongoose.Types.ObjectId(USER_ID_STR),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const parentInsert = await Task.insertOne(parentTaskDoc);
            const parentId = parentInsert.insertedId;

            // Link parentId and insert child tasks
            for (const childDoc of childDocsToInsert) {
                childDoc.parentTask = parentId;
                await Task.insertOne(childDoc);
                totalProblemsInserted++;
            }
        }

        console.log(`\n[Seeder] SUCCESS! Canonical seeding complete for DSA Phase 3 (DSAP3) in Schedule Arena stage.`);
        console.log(`[Seeder] Total Problems Inserted: ${totalProblemsInserted} across ${DSA_PHASE3_CURRICULUM.length} patterns.`);

        process.exit(0);
    } catch (error) {
        console.error('[Seeder] Error during seeding:', error);
        process.exit(1);
    }
}
