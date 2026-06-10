export interface MockDsaQuestion {
  id: string;
  title: string;
  text: string;
  codeSnippet: string;
  pythonSnippet: string;
  cppSnippet: string;
  javaSnippet: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'dsa';
  explanation: string;
  testCases: {
    args: any[];
    expected: any;
    inputLabel: string;
    hidden: boolean;
  }[];
}

export interface MockInterviewQuestion {
  id: string;
  text: string;
  category: 'technical' | 'behavioral' | 'hr';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTopics: string[];
  explanation: string;
}

export const MOCK_DSA_QUESTIONS: Record<string, MockDsaQuestion[]> = {
  google: [
    {
      id: 'goog-dsa-1',
      title: 'Two Sum',
      text: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

**Example:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\``,
      codeSnippet: `function solve(nums, target) {
  // Write your JavaScript solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      pythonSnippet: `def solve(nums, target):
    # Write your Python solution here
    map_dict = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in map_dict:
            return [map_dict[diff], i]
        map_dict[num] = i
    return []`,
      cppSnippet: `class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (map.find(diff) != map.end()) {
                return {map[diff], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      javaSnippet: `class Solution {
    public int[] solve(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[] { map.get(diff), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
      difficulty: 'easy',
      category: 'dsa',
      explanation: 'Use a hash map to store the value and its index. For each number, calculate its difference from the target and check if it exists in the hash map. Time Complexity: O(N), Space Complexity: O(N).',
      testCases: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1], inputLabel: 'nums = [2,7,11,15], target = 9', hidden: false },
        { args: [[3, 2, 4], 6], expected: [1, 2], inputLabel: 'nums = [3,2,4], target = 6', hidden: false },
        { args: [[3, 3], 6], expected: [0, 1], inputLabel: 'nums = [3,3], target = 6', hidden: true },
        { args: [[5, 25, 75, 15], 100], expected: [1, 2], inputLabel: 'nums = [5,25,75,15], target = 100', hidden: true }
      ]
    },
    {
      id: 'goog-dsa-2',
      title: 'Valid Parentheses',
      text: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.
An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example:**
Input: s = "()[]{}"
Output: true`,
      codeSnippet: `function solve(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
      pythonSnippet: `def solve(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack`,
      cppSnippet: `class Solution {
public:
    bool solve(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') {
                st.push(c);
            } else {
                if (st.empty()) return false;
                if (c == ')' && st.top() != '(') return false;
                if (c == '}' && st.top() != '{') return false;
                if (c == ']' && st.top() != '[') return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
      javaSnippet: `class Solution {
    public boolean solve(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}`,
      difficulty: 'easy',
      category: 'dsa',
      explanation: 'Use a Stack data structure. Push open parentheses onto the stack, and pop them when you encounter closing parentheses, matching types. Time: O(N), Space: O(N).',
      testCases: [
        { args: ["()"], expected: true, inputLabel: 's = "()"', hidden: false },
        { args: ["([)]"], expected: false, inputLabel: 's = "([)]"', hidden: false },
        { args: ["{[]}"], expected: true, inputLabel: 's = "{[]}"', hidden: true },
        { args: ["("], expected: false, inputLabel: 's = "("', hidden: true }
      ]
    },
    {
      id: 'goog-dsa-3',
      title: 'Unique Paths',
      text: `There is a robot on an \`m x n\` grid. The robot is initially located at the top-left corner (i.e., \`grid[0][0]\`). The robot tries to move to the bottom-right corner (i.e., \`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.
Given the two integers \`m\` and \`n\`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.

**Example:**
Input: m = 3, n = 7
Output: 28`,
      codeSnippet: `function solve(m, n) {
  const dp = Array(m).fill().map(() => Array(n).fill(1));
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[r][c] = dp[r-1][c] + dp[r][c-1];
    }
  }
  return dp[m-1][n-1];
}`,
      pythonSnippet: `def solve(m, n):
    dp = [[1] * n for _ in range(m)]
    for r in range(1, m):
        for c in range(1, n):
            dp[r][c] = dp[r-1][c] + dp[r][c-1]
    return dp[m-1][n-1]`,
      cppSnippet: `class Solution {
public:
    int solve(int m, int n) {
        vector<vector<int>> dp(m, vector<int>(n, 1));
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                dp[r][c] = dp[r-1][c] + dp[r][c-1];
            }
        }
        return dp[m-1][n-1];
    }
};`,
      javaSnippet: `class Solution {
    public int solve(int m, int n) {
        int[][] dp = new int[m][n];
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (r == 0 || c == 0) dp[r][c] = 1;
                else dp[r][c] = dp[r-1][c] + dp[r][c-1];
            }
        }
        return dp[m-1][n-1];
    }
}`,
      difficulty: 'medium',
      category: 'dsa',
      explanation: 'Use dynamic programming. A cell dp[r][c] can only be reached from dp[r-1][c] (up) or dp[r][c-1] (left). Thus, paths to reach cell is the sum of both. Time: O(M*N), Space: O(M*N).',
      testCases: [
        { args: [3, 7], expected: 28, inputLabel: 'm = 3, n = 7', hidden: false },
        { args: [3, 2], expected: 3, inputLabel: 'm = 3, n = 2', hidden: false },
        { args: [7, 3], expected: 28, inputLabel: 'm = 7, n = 3', hidden: true },
        { args: [1, 10], expected: 1, inputLabel: 'm = 1, n = 10', hidden: true }
      ]
    },
    {
      id: 'goog-dsa-4',
      title: 'Container With Most Water',
      text: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.
Find two lines that together with the x-axis form a container, such that the container contains the most water.
Return the maximum amount of water a container can store.

**Example:**
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49`,
      codeSnippet: `function solve(height) {
  let maxArea = 0;
  let left = 0;
  let right = height.length - 1;
  while (left < right) {
    const minHeight = Math.min(height[left], height[right]);
    const area = minHeight * (right - left);
    maxArea = Math.max(maxArea, area);
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  return maxArea;
}`,
      pythonSnippet: `def solve(height):
    max_area = 0
    left = 0
    right = len(height) - 1
    while left < right:
        width = right - left
        area = min(height[left], height[right]) * width
        max_area = max(max_area, area)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return max_area`,
      cppSnippet: `class Solution {
public:
    int solve(vector<int>& height) {
        int maxArea = 0;
        int left = 0, right = height.size() - 1;
        while (left < right) {
            int area = min(height[left], height[right]) * (right - left);
            maxArea = max(maxArea, area);
            if (height[left] < height[right]) left++;
            else right--;
        }
        return maxArea;
    }
};`,
      javaSnippet: `class Solution {
    public int solve(int[] height) {
        int maxArea = 0;
        int left = 0, right = height.length - 1;
        while (left < right) {
            int area = Math.min(height[left], height[right]) * (right - left);
            maxArea = Math.max(maxArea, area);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return maxArea;
    }
}`,
      difficulty: 'medium',
      category: 'dsa',
      explanation: 'Use the two-pointer approach starting from the outer boundary. Always move the pointer pointing to the shorter vertical line inward. Time Complexity: O(N), Space Complexity: O(1).',
      testCases: [
        { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49, inputLabel: 'height = [1,8,6,2,5,4,8,3,7]', hidden: false },
        { args: [[1, 1]], expected: 1, inputLabel: 'height = [1,1]', hidden: false },
        { args: [[4, 3, 2, 1, 4]], expected: 16, inputLabel: 'height = [4,3,2,1,4]', hidden: true },
        { args: [[1, 2, 4, 3]], expected: 4, inputLabel: 'height = [1,2,4,3]', hidden: true }
      ]
    },
    {
      id: 'goog-dsa-5',
      title: 'Median of Two Sorted Arrays',
      text: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.
The overall run time complexity should be \`O(log (m+n))\`.

**Example:**
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000`,
      codeSnippet: `function solve(nums1, nums2) {
  // Simpler O(m+n) implementation for sandbox compatibility, but optimized
  const merged = [];
  let i = 0, j = 0;
  while (i < nums1.length && j < nums2.length) {
    if (nums1[i] < nums2[j]) {
      merged.push(nums1[i++]);
    } else {
      merged.push(nums2[j++]);
    }
  }
  while (i < nums1.length) merged.push(nums1[i++]);
  while (j < nums2.length) merged.push(nums2[j++]);
  
  const mid = Math.floor(merged.length / 2);
  if (merged.length % 2 === 0) {
    return (merged[mid - 1] + merged[mid]) / 2;
  } else {
    return merged[mid];
  }
}`,
      pythonSnippet: `def solve(nums1, nums2):
    merged = []
    i = j = 0
    while i < len(nums1) and j < len(nums2):
        if nums1[i] < nums2[j]:
            merged.append(nums1[i])
            i += 1
        else:
            merged.append(nums2[j])
            j += 1
    while i < len(nums1):
        merged.append(nums1[i])
        i += 1
    while j < len(nums2):
        merged.append(nums2[j])
        j += 1
    
    mid = len(merged) // 2
    if len(merged) % 2 == 0:
        return (merged[mid - 1] + merged[mid]) / 2.0
    else:
        return float(merged[mid])`,
      cppSnippet: `class Solution {
public:
    double solve(vector<int>& nums1, vector<int>& nums2) {
        vector<int> merged;
        int i = 0, j = 0;
        while (i < nums1.size() && j < nums2.size()) {
            if (nums1[i] < nums2[j]) merged.push_back(nums1[i++]);
            else merged.push_back(nums2[j++]);
        }
        while (i < nums1.size()) merged.push_back(nums1[i++]);
        while (j < nums2.size()) merged.push_back(nums2[j++]);
        int mid = merged.size() / 2;
        if (merged.size() % 2 == 0) {
            return (merged[mid - 1] + merged[mid]) / 2.0;
        } else {
            return merged[mid];
        }
    }
};`,
      javaSnippet: `class Solution {
    public double solve(int[] nums1, int[] nums2) {
        int[] merged = new int[nums1.length + nums2.length];
        int i = 0, j = 0, k = 0;
        while (i < nums1.length && j < nums2.length) {
            if (nums1[i] < nums2[j]) merged[k++] = nums1[i++];
            else merged[k++] = nums2[j++];
        }
        while (i < nums1.length) merged[k++] = nums1[i++];
        while (j < nums2.length) merged[k++] = nums2[j++];
        int mid = merged.length / 2;
        if (merged.length % 2 == 0) {
            return (merged[mid - 1] + merged[mid]) / 2.0;
        } else {
            return merged[mid];
        }
    }
}`,
      difficulty: 'hard',
      category: 'dsa',
      explanation: 'Binary search partitions. Or, a two-pointer merge approach. To solve in O(log(m+n)), binary search partition on the smaller array so that left sides of both partitions contain half elements. Time: O(log(min(M, N))), Space: O(1).',
      testCases: [
        { args: [[1, 3], [2]], expected: 2, inputLabel: 'nums1 = [1,3], nums2 = [2]', hidden: false },
        { args: [[1, 2], [3, 4]], expected: 2.5, inputLabel: 'nums1 = [1,2], nums2 = [3,4]', hidden: false },
        { args: [[0, 0], [0, 0]], expected: 0, inputLabel: 'nums1 = [0,0], nums2 = [0,0]', hidden: true },
        { args: [[], [1]], expected: 1, inputLabel: 'nums1 = [], nums2 = [1]', hidden: true }
      ]
    },
    {
      id: 'goog-dsa-6',
      title: 'Trapping Rain Water',
      text: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Example:**
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6`,
      codeSnippet: `function solve(height) {
  if (height.length === 0) return 0;
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let ans = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        ans += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        ans += rightMax - height[right];
      }
      right--;
    }
  }
  return ans;
}`,
      pythonSnippet: `def solve(height):
    if not height: return 0
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    ans = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                ans += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                ans += right_max - height[right]
            right -= 1
    return ans`,
      cppSnippet: `class Solution {
public:
    int solve(vector<int>& height) {
        if (height.empty()) return 0;
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0;
        int ans = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else ans += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else ans += rightMax - height[right];
                right--;
            }
        }
        return ans;
    }
};`,
      javaSnippet: `class Solution {
    public int solve(int[] height) {
        if (height.length == 0) return 0;
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int ans = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else ans += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else ans += rightMax - height[right];
                right--;
            }
        }
        return ans;
    }
}`,
      difficulty: 'hard',
      category: 'dsa',
      explanation: 'Use the two-pointer approach to move inwards from left and right. Keep track of maximum heights seen so far. Time: O(N), Space: O(1).',
      testCases: [
        { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6, inputLabel: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', hidden: false },
        { args: [[4, 2, 0, 3, 2, 5]], expected: 9, inputLabel: 'height = [4,2,0,3,2,5]', hidden: false },
        { args: [[0, 0, 0, 0]], expected: 0, inputLabel: 'height = [0,0,0,0]', hidden: true },
        { args: [[3, 0, 2, 0, 4]], expected: 7, inputLabel: 'height = [3,0,2,0,4]', hidden: true }
      ]
    }
  ]
};

// Map other companies to google's fallback for simplicity if they match, or add general keys
MOCK_DSA_QUESTIONS.amazon = MOCK_DSA_QUESTIONS.google;
MOCK_DSA_QUESTIONS.microsoft = MOCK_DSA_QUESTIONS.google;
MOCK_DSA_QUESTIONS.meta = MOCK_DSA_QUESTIONS.google;
MOCK_DSA_QUESTIONS.netflix = MOCK_DSA_QUESTIONS.google;
MOCK_DSA_QUESTIONS.apple = MOCK_DSA_QUESTIONS.google;
MOCK_DSA_QUESTIONS.general = MOCK_DSA_QUESTIONS.google;

export const MOCK_INTERVIEW_QUESTIONS: Record<string, MockInterviewQuestion[]> = {
  google: [
    {
      id: 'goog-int-1',
      text: 'How would you design a rate limiter for a public API that supports billions of queries per day? What strategies would you use to balance load?',
      category: 'technical',
      difficulty: 'medium',
      expectedTopics: ['Token Bucket / Leaky Bucket algorithms', 'Redis caching layer', 'Distributed rate limiting challenges', 'Consistent hashing'],
      explanation: 'Focus on scaling algorithms like Token Bucket or Sliding Window Log. Emphasize Redis for low-latency count storage and handle split-brain in distributed systems.'
    },
    {
      id: 'goog-int-2',
      text: 'Describe a time when you had to make a high-stakes technical decision under absolute ambiguity. What was your process, and what did you learn?',
      category: 'behavioral',
      difficulty: 'medium',
      expectedTopics: ['STAR method structure', 'Gathering constraints / assumptions', 'Stakeholder alignment', 'Mitigation of tech debt'],
      explanation: 'Use the STAR format. Recite the ambiguity details, clarify how you audited options (e.g. prototypes, risk matrices), aligned stakeholders, and measured outcomes.'
    },
    {
      id: 'goog-int-3',
      text: 'Why do you want to join our company? In what ways do our core cultural tenets align with your career values?',
      category: 'hr',
      difficulty: 'easy',
      expectedTopics: ['Company core values', 'Specific technology or industry alignment', 'Growth mindset', 'Collaboration & ownership'],
      explanation: 'A strong HR response links the company\'s mission and work culture to the candidate\'s internal drivers (e.g., Google\'s focus on helpfulness and user focus).'
    },
    {
      id: 'goog-int-4',
      text: 'Explain how Javascript prototype inheritance works under the hood. Contrast it with classical class inheritance.',
      category: 'technical',
      difficulty: 'easy',
      expectedTopics: ['Prototype chain', '__proto__ vs prototype', 'Constructor functions', 'Object.create()'],
      explanation: 'Recruiters want details on prototype linkage, searching up the chain until null, performance benefits of sharing methods, and ES6 class sugar.'
    },
    {
      id: 'goog-int-5',
      text: 'Describe a situation where you had a significant disagreement with your team leader or product manager. How did you resolve it constructively?',
      category: 'behavioral',
      difficulty: 'easy',
      expectedTopics: ['STAR structure', 'Active listening', 'Data-driven decision making', 'Professional consensus'],
      explanation: 'Focus on empathy, avoiding blame, presenting data or prototypes objectively, and ultimately committing to the project regardless of the final decision.'
    },
    {
      id: 'goog-int-6',
      text: 'How would you scale a real-time collaborative code editor (like Google Docs for code) to support 100,000 concurrent active developers?',
      category: 'technical',
      difficulty: 'hard',
      expectedTopics: ['Operational Transformation (OT) vs CRDTs', 'WebSockets / Server-Sent Events', 'Pub-Sub message broker (Kafka/Redis)', 'State conflict resolution'],
      explanation: 'Discuss trade-offs between OT and CRDTs. Detail WebSockets scaling using stateless servers, horizontal scaling via Pub/Sub, and caching intermediate document states.'
    }
  ]
};

MOCK_INTERVIEW_QUESTIONS.amazon = MOCK_INTERVIEW_QUESTIONS.google;
MOCK_INTERVIEW_QUESTIONS.microsoft = MOCK_INTERVIEW_QUESTIONS.google;
MOCK_INTERVIEW_QUESTIONS.meta = MOCK_INTERVIEW_QUESTIONS.google;
MOCK_INTERVIEW_QUESTIONS.netflix = MOCK_INTERVIEW_QUESTIONS.google;
MOCK_INTERVIEW_QUESTIONS.apple = MOCK_INTERVIEW_QUESTIONS.google;
MOCK_INTERVIEW_QUESTIONS.general = MOCK_INTERVIEW_QUESTIONS.google;
