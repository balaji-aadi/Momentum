import "dotenv/config";
import connectDB from "../config/db.config.js";
import Problem from "../models/problem.model.js";
import { RunCodeService } from "../services/judge-service/runCode.service.js";
import { SubmitCodeService } from "../services/judge-service/submitCode.service.js";

const PYTHON_SOLUTIONS = {
  "two-sum": `
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        lookup = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in lookup:
                return [lookup[diff], i]
            lookup[n] = i
        return []
`,
  "reverse-linked-list": `
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev
`,
  "invert-binary-tree": `
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`,
  "rotate-image": `
class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()
`,
  "number-of-islands": `
class Solution:
    def numIslands(self, grid: List[List[int]]) -> int:
        if not grid:
            return 0
        m, n = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != 1:
                return
            grid[r][c] = 0
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)
        for r in range(m):
            for c in range(n):
                if grid[r][c] == 1:
                    count += 1
                    dfs(r, c)
        return count
`,
  "add-two-numbers": `
class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        carry = 0
        while l1 or l2 or carry:
            v1 = l1.val if l1 else 0
            v2 = l2.val if l2 else 0
            total = v1 + v2 + carry
            carry = total // 10
            curr.next = ListNode(total % 10)
            curr = curr.next
            if l1: l1 = l1.next
            if l2: l2 = l2.next
        return dummy.next
`,
  "sort-colors": `
class Solution:
    def sortColors(self, nums: List[int]) -> None:
        low, mid, high = 0, 0, len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1
`,
  "copy-list-with-random-pointer": `
class Solution:
    def copyRandomList(self, head: 'Optional[Node]') -> 'Optional[Node]':
        if not head:
            return None
        old_to_new = {}
        curr = head
        while curr:
            old_to_new[curr] = Node(curr.val)
            curr = curr.next
        curr = head
        while curr:
            if curr.next:
                old_to_new[curr].next = old_to_new[curr.next]
            if curr.random:
                old_to_new[curr].random = old_to_new[curr.random]
            curr = curr.next
        return old_to_new[head]
`,
  "clone-graph": `
class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        if not node:
            return None
        clones = {}
        def dfs(curr):
            if curr in clones:
                return clones[curr]
            copy = Node(curr.val)
            clones[curr] = copy
            for nei in curr.neighbors:
                copy.neighbors.append(dfs(nei))
            return copy
        return dfs(node)
`,
  "find-all-anagrams-in-a-string": `
class Solution:
    def findAnagrams(self, s: str, words: List[str], k: int) -> List[int]:
        if not s or not words:
            return []
        p = words[0]
        p_len = len(p)
        if len(s) < p_len:
            return []
        from collections import Counter
        p_count = Counter(p)
        s_count = Counter(s[:p_len])
        res = []
        if s_count == p_count:
            res.append(0)
        for i in range(p_len, len(s)):
            s_count[s[i]] += 1
            s_count[s[i - p_len]] -= 1
            if s_count[s[i - p_len]] == 0:
                del s_count[s[i - p_len]]
            if s_count == p_count:
                res.append(i - p_len + 1)
        return res
`
};

async function verifyAllProblemsPython() {
  await connectDB();
  console.log("===============================================================================");
  console.log("  TESTING ALL 10 DSA PROBLEMS IN PYTHON (LIVE END-TO-END VERIFICATION)");
  console.log("===============================================================================\n");

  const problems = await Problem.find({ status: "Published" });
  let totalTests = 0;
  let passedTests = 0;

  for (const prob of problems) {
    const pyCode = PYTHON_SOLUTIONS[prob.slug];
    if (!pyCode) {
      console.log(`[SKIPPED] No test Python code configured for: ${prob.slug}`);
      continue;
    }

    console.log(`-------------------------------------------------------------------------------`);
    console.log(`TESTING [${prob.problemCode}] ${prob.title} (${prob.slug}) in Python`);
    console.log(`-------------------------------------------------------------------------------`);

    // 1. Test RUN API
    const runRes = await RunCodeService.run({
      problem: prob,
      language: "python",
      code: pyCode
    });

    totalTests++;
    if (runRes.status === "PASSED" && runRes.passedTestCases === runRes.totalTestCases) {
      passedTests++;
      console.log(`  ✓ [PASS] RUN API: Status PASSED (${runRes.passedTestCases}/${runRes.totalTestCases} visible test cases passed)`);
    } else {
      console.error(`  ✗ [FAIL] RUN API: Status ${runRes.status}, Error:`, runRes.error || runRes.testCases);
    }

    // 2. Test SUBMIT API
    const submitRes = await SubmitCodeService.submit({
      problem: prob,
      language: "python",
      code: pyCode
    });

    totalTests++;
    if (submitRes.verdict === "ACCEPTED" && submitRes.passedTestCases === submitRes.totalTestCases) {
      passedTests++;
      console.log(`  ✓ [PASS] SUBMIT API: Verdict ACCEPTED (${submitRes.passedTestCases}/${submitRes.totalTestCases} hidden test cases passed)`);
    } else {
      console.error(`  ✗ [FAIL] SUBMIT API: Verdict ${submitRes.verdict}, Error:`, submitRes.error);
    }
  }

  console.log("\n===============================================================================");
  console.log(`  RESULTS: ${passedTests}/${totalTests} Checks Passed across ALL 10 Problems in Python!`);
  console.log("===============================================================================\n");

  process.exit(passedTests === totalTests ? 0 : 1);
}

verifyAllProblemsPython();
