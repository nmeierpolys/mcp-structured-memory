import { describe, it, expect, beforeEach } from "vitest";
import { StorageManager } from "../storage/StorageManager.js";
import { getFullMemoryTool } from "./getFullMemory.js";
import { Memory } from "../types/memory.js";

describe("getFullMemoryTool", () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
  });

  describe("parameter validation", () => {
    it("should throw error when memory_id is missing", async () => {
      await expect(getFullMemoryTool(storageManager, {})).rejects.toThrow(
        "Memory ID is required"
      );
    });

    it("should throw error when memory_id is empty", async () => {
      await expect(getFullMemoryTool(storageManager, { memory_id: "" })).rejects.toThrow(
        "Memory ID is required"
      );
    });
  });

  describe("memory retrieval", () => {
    it("should throw error when memory does not exist", async () => {
      await expect(
        getFullMemoryTool(storageManager, { memory_id: "nonexistent" })
      ).rejects.toThrow("Memory document with ID 'nonexistent' not found");
    });

    it("should return full memory content with metadata", async () => {
      // Create a test memory
      const testMemory: Memory = {
        metadata: {
          id: "test-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-02T15:30:00.000Z",
          tags: ["project", "test"],
          status: "active",
        },
        content: `# Test Memory

## Context
This is a test memory for validation.

## Notes
- First note item
- Second note item

## Tasks
- [ ] Complete task 1
- [x] Completed task 2`,
        filePath: "/test/path/test-memory.md",
      };

      // Mock the readMemory method
      storageManager.readMemory = async (id: string) => {
        if (id === "test-memory") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "test-memory",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `# Full Memory: test-memory

**Created:** 2024-01-01T10:00:00.000Z
**Updated:** 2024-01-02T15:30:00.000Z
**Status:** active
**Tags:** project, test

---

# Test Memory

## Context
This is a test memory for validation.

## Notes
- First note item
- Second note item

## Tasks
- [ ] Complete task 1
- [x] Completed task 2`,
          },
        ],
      });
    });

    it("should handle memory with no tags", async () => {
      const testMemory: Memory = {
        metadata: {
          id: "minimal-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: "# Minimal Memory\n\nJust basic content.",
        filePath: "/test/path/minimal-memory.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "minimal-memory") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "minimal-memory",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `# Full Memory: minimal-memory

**Created:** 2024-01-01T10:00:00.000Z
**Updated:** 2024-01-01T10:00:00.000Z
**Status:** active
**Tags:** None

---

# Minimal Memory

Just basic content.`,
          },
        ],
      });
    });

    it("should handle memory without status", async () => {
      const testMemory: Memory = {
        metadata: {
          id: "no-status-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: ["test"],
        },
        content: "# No Status Memory\n\nContent without status.",
        filePath: "/test/path/no-status-memory.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "no-status-memory") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "no-status-memory",
      });

      expect(result.content[0].text).toContain("**Status:** undefined");
    });

    it("should handle large memory content", async () => {
      const largeContent = `# Large Memory

## Section 1
${Array(100).fill("Line of content").join("\n")}

## Section 2
${Array(100).fill("Another line of content").join("\n")}`;

      const testMemory: Memory = {
        metadata: {
          id: "large-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: ["large", "test"],
          status: "active",
        },
        content: largeContent,
        filePath: "/test/path/large-memory.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "large-memory") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "large-memory",
      });

      expect(result.content[0].text).toContain("# Full Memory: large-memory");
      expect(result.content[0].text).toContain(largeContent);
      expect(result.content[0].text.length).toBeGreaterThan(1000);
    });
  });

  describe("edge cases", () => {
    it("should handle memory with special characters in content", async () => {
      const testMemory: Memory = {
        metadata: {
          id: "special-chars",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: ["special"],
          status: "active",
        },
        content: `# Special Characters Memory

## Code Section
\`\`\`javascript
const test = "Hello, World!";
console.log(\`Template: \${test}\`);
\`\`\`

## Unicode Section
🚀 Rocket emoji
© Copyright symbol
™ Trademark symbol`,
        filePath: "/test/path/special-chars.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "special-chars") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "special-chars",
      });

      expect(result.content[0].text).toContain("🚀 Rocket emoji");
      expect(result.content[0].text).toContain("```javascript");
      expect(result.content[0].text).toContain("Template: ${test}");
    });

    it("should handle empty memory content", async () => {
      const testMemory: Memory = {
        metadata: {
          id: "empty-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: "",
        filePath: "/test/path/empty-memory.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "empty-memory") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "empty-memory",
      });

      expect(result.content[0].text).toContain("# Full Memory: empty-memory");
      expect(result.content[0].text).toContain("---\n\n");
    });
  });
});