import DsaPamphlet from '../../models/dsaPamphlet.model.js';
import { Task } from '../../models/task.model.js';
import { User } from '../../models/user.model.js';
import mongoose from 'mongoose';

const DEFAULT_FAANG_CURRICULUM = [
    // 1. ARRAYS & STRINGS
    {
        topic: 'Arrays & Strings',
        patternKey: 'sliding_window',
        patternName: 'Sliding Window Pattern',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Track subarrays or substrings within a fixed or dynamic window to optimize from O(N²) to O(N). Extremely frequent at Meta, Amazon, and Google.',
        aliases: ['sliding window', 'window slider', 'fixed window', 'variable window', 'max subarray sum'],
        order: 1
    },
    {
        topic: 'Arrays & Strings',
        patternKey: 'two_pointers',
        patternName: 'Two Pointers Pattern',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Iterate from start and end or at different speeds on sorted arrays/strings to find pairs, triples, or container volumes.',
        aliases: ['two pointer', 'two pointers', 'opposite direction pointers', '2 pointer'],
        order: 2
    },
    {
        topic: 'Arrays & Strings',
        patternKey: 'prefix_sum',
        patternName: 'Prefix Sum Pattern',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Precompute cumulative sums to perform O(1) range sum queries and subarray sum equals K challenges.',
        aliases: ['prefix sum', 'cumulative sum', 'subarray sum'],
        order: 3
    },
    {
        topic: 'Arrays & Strings',
        patternKey: 'kadane_algorithm',
        patternName: "Kadane's Algorithm (Max Subarray)",
        faangWeightage: '30% Weightage · High FAANG Frequency',
        weightageNum: 30,
        importanceTier: 'High',
        summary: 'Dynamic O(N) strategy for maximum contiguous subarray sum and maximum product subarray.',
        aliases: ['kadane', 'maximum subarray', 'contiguous subarray'],
        order: 4
    },
    {
        topic: 'Arrays & Strings',
        patternKey: 'merge_intervals',
        patternName: 'Merge Intervals Pattern',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Sort intervals by start time and resolve overlapping time slots or meeting scheduling bounds.',
        aliases: ['interval', 'intervals', 'merge interval', 'meeting room'],
        order: 5
    },

    // 2. LINKED LIST
    {
        topic: 'Linked List',
        patternKey: 'fast_slow_pointers_ll',
        patternName: 'Fast & Slow Pointer (Floyd Cycle)',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Detect cycles in single/double linked lists, find middle node, or palindrome linked list verification.',
        aliases: ['fast & slow pointer', 'fast and slow', 'floyd cycle', 'cycle detection', 'middle of linked list'],
        order: 6
    },
    {
        topic: 'Linked List',
        patternKey: 'inplace_reversal_ll',
        patternName: 'In-place Reversal Pattern',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Reverse linked lists fully, in sub-ranges (II), or in groups of size K without extra space allocation.',
        aliases: ['reverse pattern', 'reverse linked list', 'reverse nodes in k group', 'swap nodes in pairs'],
        order: 7
    },
    {
        topic: 'Linked List',
        patternKey: 'dummy_node_ll',
        patternName: 'Dummy Node Pattern',
        faangWeightage: '30% Weightage · High FAANG Frequency',
        weightageNum: 30,
        importanceTier: 'High',
        summary: 'Eliminate edge cases when deleting/inserting at the head of a linked list (Add Two Numbers, Partition).',
        aliases: ['dummy node', 'dummy node pattern', 'add two numbers', 'partition list'],
        order: 8
    },

    // 3. STACK & QUEUE
    {
        topic: 'Stack & Queue',
        patternKey: 'monotonic_stack',
        patternName: 'Monotonic Stack Pattern',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Maintain monotonically increasing or decreasing elements to find Next Greater Element or Trapping Rain Water.',
        aliases: ['monotonic stack', 'next greater element', 'daily temperatures', 'trapping rain water'],
        order: 9
    },
    {
        topic: 'Stack & Queue',
        patternKey: 'parentheses_matching',
        patternName: 'Parentheses & Expression Stack',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Validate brackets, evaluate reverse polish notation, or compute nested calculator expressions.',
        aliases: ['parentheses pattern', 'valid parentheses', 'basic calculator', 'expression evaluation'],
        order: 10
    },
    {
        topic: 'Stack & Queue',
        patternKey: 'deque_sliding_window',
        patternName: 'Monotonic Deque Pattern',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Use double-ended queues for Sliding Window Maximum in O(N) overall time complexity.',
        aliases: ['deque pattern', 'sliding window maximum', 'circular queue'],
        order: 11
    },
    // 4. BINARY SEARCH
    {
        topic: 'Binary Search',
        patternKey: 'binary_search_classic',
        patternName: 'Classic & Boundary Binary Search',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Find targets, lower/upper bounds, first/last occurrence, search insert position, Search in 2D Matrix, and rotated sorted array pivots in O(log N).',
        aliases: ['binary search', 'search in rotated sorted array', 'first and last occurrence', 'lower bound', 'upper bound', 'search insert position', 'search a 2d matrix'],
        order: 12
    },
    {
        topic: 'Binary Search',
        patternKey: 'binary_search_on_answer',
        patternName: 'Binary Search on Answer Space',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Search over discrete integer ranges for minimum or maximum feasible thresholds (Koko Eating Bananas, Capacity To Ship Packages).',
        aliases: ['binary search on answer', 'koko eating bananas', 'capacity to ship packages', 'divide and conquer'],
        order: 13
    },

    // 5. TREES & BINARY SEARCH TREES
    {
        topic: 'Trees & BST',
        patternKey: 'tree_bfs_traversal',
        patternName: 'Tree BFS / Level Order Traversal',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Traverse tree levels using queues to solve Level Order, Zigzag, or Right Side View problems.',
        aliases: ['level order', 'tree bfs', 'right side view', 'zigzag traversal'],
        order: 14
    },
    {
        topic: 'Trees & BST',
        patternKey: 'tree_dfs_path_sum',
        patternName: 'Tree DFS, Construction, LCA & BST Operations',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Pre/In/Post-order DFS for Tree Construction (Construct from Pre+In/Post), Lowest Common Ancestor (LCA), Tree DP (House Robber III, Binary Tree Cameras, Max Path Sum, Diameter), Tree Serialization, and BST Operations (Validate BST, Kth Smallest, Construct BST).',
        aliases: ['tree dfs', 'path sum', 'lowest common ancestor', 'lca', 'diameter of binary tree', 'validate bst', 'serialize and deserialize binary tree', 'construct binary tree', 'house robber iii', 'binary tree cameras', 'tree dp'],
        order: 15
    },

    // 6. HEAP & PRIORITY QUEUE
    {
        topic: 'Heap & Priority Queue',
        patternKey: 'top_k_elements',
        patternName: 'Top K & Merge K Sorted Pattern',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Uses Min/Max-Heaps to maintain Top K items, merge K sorted lists/arrays, and schedule CPU tasks (Task Scheduler, Reorganize String).',
        aliases: ['top k pattern', 'top k frequent', 'kth largest', 'k closest points', 'merge k sorted lists', 'task scheduler', 'meeting rooms ii'],
        order: 16
    },
    {
        topic: 'Heap & Priority Queue',
        patternKey: 'two_heaps',
        patternName: 'Two Heaps Pattern (Median Finder)',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Balances a Max-Heap (lower half) and Min-Heap (upper half) to compute continuous streaming median.',
        aliases: ['two heap pattern', 'find median from data stream', 'sliding window median'],
        order: 17
    },

    // 7. GRAPHS
    {
        topic: 'Graphs',
        patternKey: 'graph_bfs_dfs',
        patternName: 'Graph BFS/DFS & Connected Components',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Explore 2D grids or adjacency lists to find Number of Islands, Rotting Oranges, or Clone Graph.',
        aliases: ['graph bfs', 'graph dfs', 'number of islands', 'connected components', 'rotting oranges'],
        order: 18
    },
    {
        topic: 'Graphs',
        patternKey: 'topological_sort',
        patternName: "Topological Sort (Kahn's Algorithm)",
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Order DAG dependencies for Course Schedule (I & II) or Alien Dictionary using in-degrees.',
        aliases: ['topological sort', 'course schedule', 'kahn algorithm', 'dag ordering'],
        order: 19
    },
    {
        topic: 'Graphs',
        patternKey: 'shortest_path_mst',
        patternName: 'Shortest Path & Minimum Spanning Tree',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Find shortest paths and minimum spanning trees in weighted graphs using Min-Heap & DSU (Dijkstra, Prim, Kruskal, Bellman-Ford optional).',
        aliases: ['dijkstra', 'shortest path', 'prim', 'kruskal', 'minimum spanning tree', 'mst', 'bellman-ford', 'network delay time', 'cheapest flights within k stops'],
        order: 20
    },
    {
        topic: 'Graphs',
        patternKey: 'union_find_disjoint',
        patternName: 'Union-Find (Disjoint Set Unit - DSU)',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Detect cycles in undirected graphs or merge components with path compression.',
        aliases: ['union find', 'disjoint set', 'dsu', 'redundant connection'],
        order: 21
    },

    // 8. DYNAMIC PROGRAMMING
    {
        topic: 'Dynamic Programming',
        patternKey: 'knapsack_dp',
        patternName: '0/1 & Unbounded Knapsack DP',
        faangWeightage: '45% Weightage · Crucial FAANG Pattern',
        weightageNum: 45,
        importanceTier: 'Crucial',
        summary: 'Decision-making with subset sums, target sums, coin change, or item combination weights.',
        aliases: ['knapsack', '0/1 knapsack', 'coin change', 'target sum', 'partition equal subset sum'],
        order: 22
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'lcs_lis_dp',
        patternName: 'LCS & LIS Pattern (Strings/Sequences)',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'State transitions for Longest Common Subsequence, Longest Increasing Subsequence, Edit Distance.',
        aliases: ['lcs', 'lis', 'longest common subsequence', 'longest increasing subsequence', 'edit distance'],
        order: 23
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'interval_state_dp',
        patternName: 'Interval DP & State Machine DP',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Subarray range DP (Burst Balloons, Matrix Chain Multiplication) and Finite State Machine DP (Best Time to Buy/Sell Stock with Cooldown).',
        aliases: ['interval dp', 'state machine dp', 'burst balloons', 'best time to buy and sell stock', 'house robber'],
        order: 24
    },
    {
        topic: 'Dynamic Programming',
        patternKey: 'grid_matrix_dp',
        patternName: 'Grid Path & Matrix DP',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Calculate minimum path sum or unique paths from top-left to bottom-right of a 2D matrix.',
        aliases: ['matrix dp', 'unique paths', 'minimum path sum', 'grid dp'],
        order: 25
    },

    // 9. GREEDY & BACKTRACKING
    {
        topic: 'Greedy & Backtracking',
        patternKey: 'backtracking_subsets',
        patternName: 'Backtracking (Subsets/Permutations)',
        faangWeightage: '40% Weightage · Crucial FAANG Pattern',
        weightageNum: 40,
        importanceTier: 'Crucial',
        summary: 'Explore recursive search space trees for Subsets, Permutations, Combination Sum, N-Queens.',
        aliases: ['backtracking', 'subsets', 'permutations', 'combination sum', 'n-queens'],
        order: 26
    },
    {
        topic: 'Greedy & Backtracking',
        patternKey: 'greedy_scheduling',
        patternName: 'Greedy Scheduling & Jump Game',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Make locally optimal choices at each step to reach global optimality (Jump Game, Gas Station, Minimum Platforms).',
        aliases: ['greedy', 'jump game', 'gas station', 'minimum platforms'],
        order: 27
    },

    // 10. TRIE & BIT MANIPULATION
    {
        topic: 'Trie & Bit Manipulation',
        patternKey: 'trie_prefix_tree',
        patternName: 'Trie (Prefix Tree) & String Matching',
        faangWeightage: '35% Weightage · High FAANG Frequency',
        weightageNum: 35,
        importanceTier: 'High',
        summary: 'Efficient O(L) prefix lookup, autocomplete, dictionary validation, and string pattern matching (KMP/Z-Algo optional advanced tier).',
        aliases: ['trie', 'prefix tree', 'word search ii', 'design add and search words', 'kmp', 'z algorithm'],
        order: 28
    },
    {
        topic: 'Trie & Bit Manipulation',
        patternKey: 'bit_manipulation_basics',
        patternName: 'Bit Manipulation & Bitmasking',
        faangWeightage: '30% Weightage · Medium FAANG Frequency',
        weightageNum: 30,
        importanceTier: 'Medium',
        summary: 'XOR properties, Bitmasking, Counting Bits, Single Number, and bitwise AND/OR manipulation.',
        aliases: ['bit manipulation', 'bitmasking', 'xor', 'single number', 'counting bits', 'bitwise'],
        order: 29
    },

    // 11. MATH & NUMBER THEORY (OPTIONAL FUNDAMENTALS)
    {
        topic: 'Math & Fundamentals',
        patternKey: 'math_number_theory',
        patternName: 'Math & Number Theory (Optional Fundamentals)',
        faangWeightage: '25% Weightage · Optional Fundamentals',
        weightageNum: 25,
        importanceTier: 'Medium',
        summary: 'Useful mathematical utilities for GCD/LCM (Euclidean Algorithm), Prime Numbers, Sieve of Eratosthenes, and Modular Arithmetic.',
        aliases: ['math', 'gcd', 'lcm', 'sieve of eratosthenes', 'prime numbers', 'modular arithmetic'],
        order: 30
    }
];

export class PamphletSyncService {
    /**
     * Ensures initial FAANG curriculum data is seeded in DB.
     */
    static async ensureSeeded() {
        try {
            const count = await DsaPamphlet.countDocuments();
            if (count === 0) {
                console.log('[PamphletSync] Seeding default FAANG DSA Curriculum...');
                await DsaPamphlet.insertMany(DEFAULT_FAANG_CURRICULUM);
                console.log('[PamphletSync] Curriculum seeded successfully.');
            } else {
                // Upsert any new default patterns if curriculum expanded
                for (const item of DEFAULT_FAANG_CURRICULUM) {
                    await DsaPamphlet.updateOne(
                        { patternKey: item.patternKey },
                        { $setOnInsert: item },
                        { upsert: true }
                    );
                }
            }
        } catch (error) {
            console.error('[PamphletSync] Error seeding pamphlet:', error);
        }
    }

    /**
     * Scans ALL project arenas in MongoDB and calculates pattern completion for a user.
     */
    static async syncUserPamphlet(userIdStr) {
        try {
            await this.ensureSeeded();

            const ProjectCollection = mongoose.connection.collection('projects');
            const TaskCollection = mongoose.connection.collection('tasks');

            // 1. Get ONLY DSA projects/arenas in DB (e.g. key/name matching 'dsa', 'data structure', 'algorithm')
            const allProjects = await ProjectCollection.find({}).toArray();
            const dsaProjects = allProjects.filter(p => {
                const pName = (p.name || '').toLowerCase();
                const pKey = (p.key || '').toLowerCase();
                return pKey.includes('dsa') || pName.includes('dsa') || pName.includes('data structure') || pName.includes('algorithm');
            });

            // 2. Fetch all user tasks across all projects
            const userIdObj = new mongoose.Types.ObjectId(userIdStr);
            const userTasks = await TaskCollection.find({
                $or: [
                    { assignee: userIdObj },
                    { createdBy: userIdObj },
                    { assignee: null } // Include unassigned template tasks
                ]
            }).toArray();

            // Helper function to match pattern keywords with word boundary precision for short terms like 'lis' or 'lcs'
            const matchesKeyword = (text, kw) => {
                const cleanText = text.toLowerCase();
                const cleanKw = kw.toLowerCase();
                if (cleanKw.length <= 4) {
                    const escaped = cleanKw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                    return regex.test(cleanText);
                }
                return cleanText.includes(cleanKw);
            };

            // 3. Get all pamphlet patterns
            const patterns = await DsaPamphlet.find({}).sort({ order: 1 });

            let totalPatternsCount = patterns.length;
            let completedPatternsCount = 0;
            let activeAssignedPatternsCount = 0;
            let totalActiveAssignedProblems = 0;
            let totalActiveCompletedProblems = 0;

            let totalWeightedScore = 0;
            let maxPossibleWeightedScore = 0;

            const updatedPatterns = [];

            for (const pattern of patterns) {
                const searchKeywords = [
                    pattern.patternName.toLowerCase(),
                    pattern.patternKey.toLowerCase().replace(/_/g, ' '),
                    ...(pattern.aliases || []).map(a => a.toLowerCase())
                ];

                const matchedArenasMap = {};
                let totalAssigned = 0;
                let totalCompleted = 0;

                // Find matching parent tasks or direct tasks ONLY across DSA projects
                for (const proj of dsaProjects) {
                    const projIdStr = proj._id.toString();
                    const projTasks = userTasks.filter(t => t.projectName?.toString() === projIdStr);

                    // Find parent pattern tasks
                    const matchingParentTasks = projTasks.filter(t => {
                        if (t.parentTask !== null) return false;
                        const tName = t.taskName.toLowerCase();
                        return searchKeywords.some(kw => matchesKeyword(tName, kw));
                    });

                    let patternChildTasks = [];

                    if (matchingParentTasks.length > 0) {
                        // Gather child tasks of these parents
                        const parentIds = matchingParentTasks.map(p => p._id.toString());
                        patternChildTasks = projTasks.filter(t => t.parentTask && parentIds.includes(t.parentTask.toString()));
                    } else {
                        // Direct task title match if no parent task structure exists
                        patternChildTasks = projTasks.filter(t => {
                            const tName = t.taskName.toLowerCase();
                            return searchKeywords.some(kw => matchesKeyword(tName, kw));
                        });
                    }

                    if (patternChildTasks.length > 0) {
                        const projTotal = patternChildTasks.length;
                        const projCompleted = patternChildTasks.filter(t => {
                            const st = (t.status || '').toLowerCase();
                            return st === 'done' || st === 'completed';
                        }).length;

                        totalAssigned += projTotal;
                        totalCompleted += projCompleted;

                        matchedArenasMap[projIdStr] = {
                            arenaId: proj._id,
                            arenaName: proj.name || 'Unnamed Arena',
                            arenaKey: proj.key || '',
                            total: projTotal,
                            completed: projCompleted,
                            problems: patternChildTasks.map(t => ({
                                taskId: t.taskId || t._id.toString(),
                                taskName: t.taskName,
                                status: t.status,
                                isCompleted: ['done', 'completed'].includes((t.status || '').toLowerCase())
                            }))
                        };
                    }
                }

                // Checkmark logic:
                // If totalAssigned > 0 and totalCompleted === totalAssigned, checkmarked = true!
                const isCompleted = totalAssigned > 0 && totalCompleted === totalAssigned;
                if (isCompleted) {
                    completedPatternsCount++;
                }

                // Calculate weighted score contribution against the ENTIRE syllabus roadmap
                maxPossibleWeightedScore += pattern.weightageNum;
                if (totalAssigned > 0) {
                    activeAssignedPatternsCount++;
                    totalActiveAssignedProblems += totalAssigned;
                    totalActiveCompletedProblems += totalCompleted;
                    totalWeightedScore += (pattern.weightageNum * (totalCompleted / totalAssigned));
                }

                const matchedArenasArray = Object.values(matchedArenasMap);

                // Update or push user progress on model
                const userProgressIndex = pattern.userProgress.findIndex(up => up.userId?.toString() === userIdStr);
                const progressObj = {
                    userId: userIdObj,
                    totalAssigned,
                    totalCompleted,
                    isCompleted,
                    matchedArenas: matchedArenasArray,
                    lastSyncedAt: new Date()
                };

                if (userProgressIndex !== -1) {
                    pattern.userProgress[userProgressIndex] = progressObj;
                } else {
                    pattern.userProgress.push(progressObj);
                }

                await pattern.save();

                updatedPatterns.push({
                    _id: pattern._id,
                    topic: pattern.topic,
                    patternKey: pattern.patternKey,
                    patternName: pattern.patternName,
                    faangWeightage: pattern.faangWeightage,
                    weightageNum: pattern.weightageNum,
                    importanceTier: pattern.importanceTier,
                    summary: pattern.summary,
                    order: pattern.order,
                    userProgress: progressObj
                });
            }

            // Compute overall FAANG Interview Readiness Percentage Meter (0 to 100%)
            const overallReadinessPercent = maxPossibleWeightedScore > 0
                ? Math.min(100, Math.round((totalWeightedScore / maxPossibleWeightedScore) * 100))
                : 0;

            // Group by topic for topic progress meters
            const topicMap = {};
            for (const p of updatedPatterns) {
                if (!topicMap[p.topic]) {
                    topicMap[p.topic] = {
                        topicName: p.topic,
                        totalPatterns: 0,
                        completedPatterns: 0,
                        totalAssignedProblems: 0,
                        totalCompletedProblems: 0,
                        patterns: []
                    };
                }

                topicMap[p.topic].totalPatterns += 1;
                if (p.userProgress.isCompleted) {
                    topicMap[p.topic].completedPatterns += 1;
                }
                topicMap[p.topic].totalAssignedProblems += p.userProgress.totalAssigned;
                topicMap[p.topic].totalCompletedProblems += p.userProgress.totalCompleted;
                topicMap[p.topic].patterns.push(p);
            }

            const topicsArray = Object.values(topicMap).map(t => {
                const progressPercent = t.totalPatterns > 0
                    ? Math.round((t.completedPatterns / t.totalPatterns) * 100)
                    : 0;
                return {
                    ...t,
                    progressPercent
                };
            });

            return {
                overallReadinessPercent,
                totalPatternsCount,
                completedPatternsCount,
                topics: topicsArray,
                patterns: updatedPatterns,
                lastSyncedAt: new Date()
            };
        } catch (error) {
            console.error('[PamphletSyncService] Failed to sync user pamphlet:', error);
            throw error;
        }
    }

    /**
     * Background job executor across all users.
     */
    static async syncAllUsers() {
        try {
            const users = await User.find({}).select('_id').lean();
            console.log(`[PamphletSync] Running 2-day Pamphlet Sync for ${users.length} users...`);
            for (const u of users) {
                await this.syncUserPamphlet(u._id.toString());
            }
            console.log('[PamphletSync] Multi-Arena Pamphlet Sync completed successfully.');
        } catch (error) {
            console.error('[PamphletSync] Error in syncAllUsers:', error);
        }
    }
}
