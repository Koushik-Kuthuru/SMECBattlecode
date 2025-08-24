

import type { Timestamp } from "firebase/firestore";

export type Challenge = {
  id?: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  description: string;
  tags: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  testCases: {
    input: string;
    output: string;
    isHidden?: boolean;
  }[];
  isEnabled?: boolean;
  likes?: number;
  createdAt?: Timestamp;
  // Multi-language support
  languages: string[]; // e.g., ['Python', 'JavaScript']
  starterCode: { [language: string]: string };
  solution: { [language: string]: string };
};

// This initialChallenges is now a template. It will be migrated on first run.
export const challenges: (Omit<Challenge, 'languages' | 'starterCode' | 'solution'> & { language: string, starterCode: string, solution: string })[] = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    language: 'Python',
    points: 10,
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    tags: ['Array', 'Hash Table'],
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]'
      }
    ],
    testCases: [
        { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]' },
        { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
        { input: 'nums = [3, 3], target = 6', output: '[0, 1]', isHidden: true },
        { input: 'nums = [-1, -3, 5, 9], target = 4', output: '[0, 2]', isHidden: true },
        { input: 'nums = [0, 4, 3, 0], target = 0', output: '[0, 3]', isHidden: true },
    ],
    starterCode: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your code here
        pass
`,
    solution: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        num_map = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in num_map:
                return [num_map[complement], i]
            num_map[num] = i
`,
    isEnabled: true,
  },
  {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    language: 'Java',
    points: 10,
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    tags: ['Linked List', 'Recursion'],
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]'
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]'
      }
    ],
    testCases: [
        { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]' },
        { input: '[1,2]', output: '[2,1]' },
        { input: '[]', output: '[]', isHidden: true },
        { input: '[1]', output: '[1]', isHidden: true },
    ],
    starterCode: `// Helper class, do not edit
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public class Main {
    public static void main(String[] args) {
        // This is the entry point. Your solution will be called from here.
        // You do not need to read from stdin or print to stdout.
    }

    // Your solution
    public ListNode reverseList(ListNode head) {
        // Write your code here
    }
}`,
    solution: `// Helper class, do not edit
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public class Main {
    public static void main(String[] args) {
        // This is the entry point. Your solution will be called from here.
    }

    // Your solution
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode current = head;
        while (current != null) {
            ListNode nextTemp = current.next;
            current.next = prev;
            prev = current;
            current = nextTemp;
        }
        return prev;
    }
}`,
    isEnabled: true,
  },
  {
    title: 'FizzBuzz',
    difficulty: 'Easy',
    language: 'C++',
    points: 10,
    description: 'Write a program that outputs the string representation of numbers from 1 to n. But for multiples of three it should output “Fizz” instead of the number and for the multiples of five output “Buzz”. For numbers which are multiples of both three and five output “FizzBuzz”.',
    tags: ['Math', 'String'],
    examples: [
      {
        input: 'n = 3',
        output: '["1","2","Fizz"]'
      },
      {
        input: 'n = 5',
        output: '["1","2","Fizz","4","Buzz"]'
      }
    ],
    testCases: [
        { input: '1', output: '["1"]' },
        { input: '3', output: '["1","2","Fizz"]' },
        { input: '5', output: '["1","2","Fizz","4","Buzz"]' },
        { input: '15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: true },
    ],
    starterCode: `#include <vector>
#include <string>

class Solution {
public:
    std::vector<std::string> fizzBuzz(int n) {
        // Write your code here
    }
};`,
    solution: `class Solution {
public:
    vector<string> fizzBuzz(int n) {
        vector<string> answer;
        for (int i = 1; i <= n; ++i) {
            if (i % 3 == 0 && i % 5 == 0) {
                answer.push_back("FizzBuzz");
            } else if (i % 3 == 0) {
                answer.push_back("Fizz");
            } else if (i % 5 == 0) {
                answer.push_back("Buzz");
            } else {
                answer.push_back(to_string(i));
            }
        }
        return answer;
    }
};`,
    isEnabled: true,
  },
  {
    title: 'Container With Most Water',
    difficulty: 'Medium',
    language: 'JavaScript',
    points: 25,
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such as the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.',
    tags: ['Array', 'Two Pointers'],
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49'
      },
      {
        input: 'height = [1,1]',
        output: '1'
      }
    ],
    testCases: [
        { input: '[1,8,6,2,5,4,8,3,7]', output: '49' },
        { input: '[1,1]', output: '1' },
        { input: '[4,3,2,1,4]', output: '16', isHidden: true },
        { input: '[1,2,1]', output: '2', isHidden: true },
    ],
    starterCode: `/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    // Write your code here
};`,
    solution: `/**
 * @param {number[]} height
 * @return {number}
 */
var maxArea = function(height) {
    let max = 0;
    let left = 0;
    let right = height.length - 1;
    while (left < right) {
        const area = Math.min(height[left], height[right]) * (right - left);
        max = Math.max(max, area);
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return max;
};`,
    isEnabled: true,
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    language: 'Python',
    points: 25,
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3'
      },
      {
        input: 's = "bbbbb"',
        output: '1'
      },
      {
        input: 's = "pwwkew"',
        output: '3'
      }
    ],
    testCases: [
        { input: '"abcabcbb"', output: '3' },
        { input: '"bbbbb"', output: '1' },
        { input: '"pwwkew"', output: '3' },
        { input: '""', output: '0', isHidden: true },
        { input: '" "', output: '1', isHidden: true },
        { input: '"dvdf"', output: '3', isHidden: true },
    ],
    starterCode: `from typing import List

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your code here
        pass
`,
    solution: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_set = set()
        left = 0
        max_length = 0
        for right in range(len(s)):
            while s[right] in char_set:
                char_set.remove(s[left])
                left += 1
            char_set.add(s[right])
            max_length = max(max_length, right - left + 1)
        return max_length`,
    isEnabled: true,
  },
  {
    title: 'Validate Binary Search Tree',
    difficulty: 'Medium',
    language: 'Java',
    points: 25,
    description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).',
    tags: ['Tree', 'DFS', 'BST'],
    examples: [
      {
        input: 'root = [2,1,3]',
        output: 'true'
      },
      {
        input: 'root = [5,1,4,null,null,3,6]',
        output: 'false'
      }
    ],
    testCases: [
        { input: '[2,1,3]', output: 'true' },
        { input: '[5,1,4,null,null,3,6]', output: 'false' },
        { input: '[1,1]', output: 'false', isHidden: true },
        { input: '[5,4,6,null,null,3,7]', output: 'false', isHidden: true },
    ],
    starterCode: `// Helper class, do not edit
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

public class Main {
    public static void main(String[] args) {
        // This is the entry point. Your solution will be called from here.
    }

    public boolean isValidBST(TreeNode root) {
        // Write your code here
    }
}`,
    solution: `// Helper class, do not edit
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

public class Main {
    public static void main(String[] args) {
        // This is the entry point.
    }

    public boolean isValidBST(TreeNode root) {
        return isValid(root, null, null);
    }

    private boolean isValid(TreeNode node, Integer lower, Integer upper) {
        if (node == null) {
            return true;
        }
        int val = node.val;
        if (lower != null && val <= lower) {
            return false;
        }
        if (upper != null && val >= upper) {
            return false;
        }
        if (!isValid(node.right, val, upper)) {
            return false;
        }
        if (!isValid(node.left, lower, val)) {
            return false;
        }
        return true;
    }
}`,
    isEnabled: true,
  },
  {
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    language: 'C',
    points: 50,
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.0'
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.5'
      }
    ],
    testCases: [
        { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0' },
        { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5' },
        { input: 'nums1 = [0,0], nums2 = [0,0]', output: '0.0', isHidden: true },
        { input: 'nums1 = [], nums2 = [1]', output: '1.0', isHidden: true },
    ],
    starterCode: `#include <math.h>

double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    // Write your code here
}`,
    solution: `double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {
    if (nums1Size > nums2Size) {
        return findMedianSortedArrays(nums2, nums2Size, nums1, nums1Size);
    }
    int x = nums1Size;
    int y = nums2Size;
    int low = 0;
    int high = x;
    while (low <= high) {
        int partitionX = (low + high) / 2;
        int partitionY = (x + y + 1) / 2 - partitionX;
        
        int maxX = (partitionX == 0) ? -2147483648 : nums1[partitionX - 1];
        int minX = (partitionX == x) ? 2147483647 : nums1[partitionX];
        
        int maxY = (partitionY == 0) ? -2147483648 : nums2[partitionY - 1];
        int minY = (partitionY == y) ? 2147483647 : nums2[partitionY];
        
        if (maxX <= minY && maxY <= minX) {
            if ((x + y) % 2 == 0) {
                return (double)(fmax(maxX, maxY) + fmin(minX, minY)) / 2;
            } else {
                return (double)fmax(maxX, maxY);
            }
        } else if (maxX > minY) {
            high = partitionX - 1;
        } else {
            low = partitionX + 1;
        }
    }
    return 0.0;
}`,
    isEnabled: true,
  },
  {
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    language: 'Python',
    points: 50,
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    tags: ['Array', 'Two Pointers', 'Stack'],
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6'
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9'
      }
    ],
    testCases: [
        { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
        { input: '[4,2,0,3,2,5]', output: '9' },
        { input: '[4,2,3]', output: '1', isHidden: true },
        { input: '[5,4,1,2]', output: '1', isHidden: true },
    ],
    starterCode: `from typing import list

class Solution:
    def trap(self, height: list[int]) -> int:
        # Write your code here
        pass
`,
    solution: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height:
            return 0
        
        left, right = 0, len(height) - 1
        left_max, right_max = height[left], height[right]
        water = 0
        
        while left < right:
            if left_max < right_max:
                left += 1
                left_max = max(left_max, height[left])
                water += left_max - height[left]
            else:
                right -= 1
                right_max = max(right_max, height[right])
                water += right_max - height[right]
        return water`,
    isEnabled: true,
  },
  {
    title: 'Regular Expression Matching',
    difficulty: 'Hard',
    language: 'C++',
    points: 50,
    description: 'Given an input string (s) and a pattern (p), implement regular expression matching with support for \'.\' and \'*\' where \'.\' matches any single character and \'*\' matches zero or more of the preceding element.',
    tags: ['String', 'Dynamic Programming', 'Recursion'],
    examples: [
      {
        input: 's = "aa", p = "a"',
        output: 'false'
      },
      {
        input: 's = "aa", p = "a*"',
        output: 'true'
      },
      {
        input: 's = "ab", p = ".*"',
        output: 'true'
      }
    ],
    testCases: [
        { input: 's = "aa", p = "a"', output: 'false' },
        { input: 's = "aa", p = "a*"', output: 'true' },
        { input: 's = "ab", p = ".*"', output: 'true' },
        { input: 's = "mississippi", p = "mis*is*p*."', output: 'false', isHidden: true },
    ],
    starterCode: `#include <string>
#include <vector>

class Solution {
public:
    bool isMatch(std::string s, std::string p) {
        // Write your code here
    }
};`,
    solution: `class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.length(), n = p.length();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        for (int j = 1; j <= n; j++) {
            if (p[j - 1] == '*') {
                dp[0][j] = dp[0][j - 2];
            }
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j - 1] == '.' || p[j - 1] == s[i - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else if (p[j - 1] == '*') {
                    dp[i][j] = dp[i][j - 2];
                    if (p[j - 2] == '.' || p[j - 2] == s[i - 1]) {
                        dp[i][j] = dp[i][j] || dp[i - 1][j];
                    }
                }
            }
        }
        return dp[m][n];
    }
};`,
    isEnabled: true,
  },
  {
    title: 'Merge k Sorted Lists',
    difficulty: 'Hard',
    language: 'Java',
    points: 50,
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    tags: ['Linked List', 'Divide and Conquer', 'Heap'],
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]'
      },
      {
        input: 'lists = []',
        output: '[]'
      }
    ],
    testCases: [
        { input: '[[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
        { input: '[]', output: '[]' },
        { input: '[[]]', output: '[]', isHidden: true },
    ],
    starterCode: `// Helper class, do not edit
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

import java.util.PriorityQueue;

public class Main {
    public static void main(String[] args) {
        // This is the entry point.
    }
    
    public ListNode mergeKLists(ListNode[] lists) {
        // Write your code here
    }
}`,
    solution: `// Helper class, do not edit
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

import java.util.PriorityQueue;

public class Main {
     public static void main(String[] args) {
        // This is the entry point.
    }
    
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) {
            return null;
        }
        PriorityQueue<ListNode> queue = new PriorityQueue<>(lists.length, (a, b) -> a.val - b.val);
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (ListNode node : lists) {
            if (node != null) {
                queue.add(node);
            }
        }
        while (!queue.isEmpty()) {
            tail.next = queue.poll();
            tail = tail.next;
            if (tail.next != null) {
                queue.add(tail.next);
            }
        }
        return dummy.next;
    }
}`,
    isEnabled: true,
  },
];

export type LeaderboardUser = {
  rank: number;
  name: string;
  points: number;
};
