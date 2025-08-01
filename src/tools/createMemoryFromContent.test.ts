import { describe, it, expect, beforeEach } from "vitest";
import { StorageManager } from "../storage/StorageManager.js";
import { createMemoryFromContentTool } from "./createMemoryFromContent.js";
import { Memory } from "../types/memory.js";

describe("createMemoryFromContentTool", () => {
  let storageManager: StorageManager;
  let writeMemoryCalls: Memory[] = [];

  beforeEach(() => {
    storageManager = new StorageManager();
    writeMemoryCalls = [];
    
    // Mock storage manager methods
    storageManager.readMemory = async (_id: string) => null; // No existing memories
    storageManager.writeMemory = async (memory: Memory) => {
      writeMemoryCalls.push(memory);
    };
  });

  describe("parameter validation", () => {
    it("should throw error when name is missing", async () => {
      await expect(
        createMemoryFromContentTool(storageManager, { content: "# Test" })
      ).rejects.toThrow("Memory document name is required");
    });

    it("should throw error when name is empty", async () => {
      await expect(
        createMemoryFromContentTool(storageManager, { name: "", content: "# Test" })
      ).rejects.toThrow("Memory document name is required");
    });

    it("should throw error when content is missing", async () => {
      await expect(
        createMemoryFromContentTool(storageManager, { name: "test" })
      ).rejects.toThrow("Memory content is required");
    });

    it("should throw error when content is empty", async () => {
      await expect(
        createMemoryFromContentTool(storageManager, { name: "test", content: "" })
      ).rejects.toThrow("Memory content is required");
    });

    it("should throw error when memory ID already exists", async () => {
      const existingMemory: Memory = {
        metadata: {
          id: "test-memory",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
        },
        content: "# Existing",
        filePath: "/test/path/test-memory.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "test-memory") return existingMemory;
        return null;
      };

      await expect(
        createMemoryFromContentTool(storageManager, {
          name: "Test Memory",
          content: "# New Content",
        })
      ).rejects.toThrow("Memory document with ID 'test-memory' already exists");
    });

    it("should throw error for names with no alphanumeric characters", async () => {
      await expect(
        createMemoryFromContentTool(storageManager, {
          name: "!@#$%^&*()",
          content: "# Test",
        })
      ).rejects.toThrow("Name must contain at least some alphanumeric characters");
    });
  });

  describe("memory creation", () => {
    it("should create memory with basic content", async () => {
      const content = `# My Project Notes

## Overview
This is a test project with **important** details.

## Tasks
- [ ] Complete first task
- [x] Done with second task`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "My Project Notes",
        content: content,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      const savedMemory = writeMemoryCalls[0];

      expect(savedMemory.metadata.id).toBe("my-project-notes");
      expect(savedMemory.content).toBe(content);
      expect(savedMemory.metadata.tags).toEqual([]);
      expect(savedMemory.metadata.status).toBe("active");
      expect(savedMemory.metadata.created).toBeDefined();
      expect(savedMemory.metadata.updated).toBeDefined();

      expect(result.content[0].text).toContain('Successfully created memory document: "My Project Notes"');
      expect(result.content[0].text).toContain("Memory ID: my-project-notes");
      expect(result.content[0].text).toContain("**Sections**: 3");
      expect(result.content[0].text).toContain("ACTION REQUIRED");
    });

    it("should create memory with tags and custom status", async () => {
      const content = `# Research Project

## Literature Review
Important papers and findings.

## Methodology
How we approach the research.`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Research Project",
        content: content,
        tags: ["research", "academic", "project"],
        status: "in-progress",
      });

      expect(writeMemoryCalls).toHaveLength(1);
      const savedMemory = writeMemoryCalls[0];

      expect(savedMemory.metadata.tags).toEqual(["research", "academic", "project"]);
      expect(savedMemory.metadata.status).toBe("in-progress");

      expect(result.content[0].text).toContain("**Tags**: research, academic, project");
      expect(result.content[0].text).toContain("**Status**: in-progress");
    });

    it("should handle complex markdown content", async () => {
      const complexContent = `# Complex Document

## Code Examples

### JavaScript
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Python
\`\`\`python
def calculate(x, y):
    return x + y
\`\`\`

## Links and References
- [Google](https://google.com)
- [GitHub](https://github.com)

## Tables
| Name | Role | Status |
|------|------|--------|
| Alice | Dev | **Active** |
| Bob | PM | *Away* |

## Task List
- [x] Setup project
- [ ] Write documentation
  - [x] API docs
  - [ ] User guide

## Formatting Examples
**Bold text** and *italic text* and \`inline code\`.

> This is a blockquote
> with multiple lines.

---

## Special Characters
Characters: !@#$%^&*()_+-={}[]|\\:";'<>?,./~
Unicode: 🚀 © ™ ← ↑ → ↓ ∑ ∆ π ∞`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Complex Markdown Test",
        content: complexContent,
        tags: ["markdown", "test", "complex"],
      });

      expect(writeMemoryCalls).toHaveLength(1);
      const savedMemory = writeMemoryCalls[0];

      expect(savedMemory.content).toBe(complexContent);
      expect(savedMemory.metadata.id).toBe("complex-markdown-test");

      // Check that stats are calculated
      expect(result.content[0].text).toContain("**Sections**:");
      expect(result.content[0].text).toContain("**Words**:");
      expect(result.content[0].text).toContain("**Lines**:");
      expect(result.content[0].text).toContain("**Tags**: markdown, test, complex");
    });

    it("should sanitize memory ID correctly", async () => {
      const testCases = [
        { name: "Simple Name", expected: "simple-name" },
        { name: "Name With Spaces", expected: "name-with-spaces" },
        { name: "Name_With_Underscores", expected: "namewithunderscores" },
        { name: "Name-With-Dashes", expected: "name-with-dashes" },
        { name: "Name With 123 Numbers", expected: "name-with-123-numbers" },
        { name: "Name!@#$%^&*()Special", expected: "namespecial" },
        { name: "   Trimmed   Spaces   ", expected: "trimmed-spaces" },
        { name: "Multiple---Dashes", expected: "multiple-dashes" },
      ];

      for (const testCase of testCases) {
        writeMemoryCalls = [];
        
        await createMemoryFromContentTool(storageManager, {
          name: testCase.name,
          content: "# Test Content",
        });

        expect(writeMemoryCalls[0].metadata.id).toBe(testCase.expected);
      }
    });

    it("should count sections, words, and lines correctly", async () => {
      const content = `# Main Title

## Section One
This section has some content with multiple words.

### Subsection
More content here.

## Section Two
Final section content.`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Counting Test",
        content: content,
      });

      const resultText = result.content[0].text;
      
      // Should count 4 sections (Main Title, Section One, Subsection, Section Two)
      expect(resultText).toContain("**Sections**: 4");
      
      // Should count all words
      const wordCount = content.split(/\s+/).length;
      expect(resultText).toContain(`**Words**: ${wordCount}`);
      
      // Should count all lines
      const lineCount = content.split('\n').length;
      expect(resultText).toContain(`**Lines**: ${lineCount}`);
    });

    it("should handle minimal content", async () => {
      const content = "Just a simple note without headers.";

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Minimal Note",
        content: content,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      const savedMemory = writeMemoryCalls[0];

      expect(savedMemory.content).toBe(content);
      expect(savedMemory.metadata.id).toBe("minimal-note");

      expect(result.content[0].text).toContain("**Sections**: 0");
      expect(result.content[0].text).toContain("**Words**: 6");
      expect(result.content[0].text).toContain("**Lines**: 1");
    });

    it("should handle empty optional parameters", async () => {
      const result = await createMemoryFromContentTool(storageManager, {
        name: "Test Memory",
        content: "# Test",
        tags: [],
        status: undefined,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      const savedMemory = writeMemoryCalls[0];

      expect(savedMemory.metadata.tags).toEqual([]);
      expect(savedMemory.metadata.status).toBe("active"); // default

      const resultText = result.content[0].text;
      expect(resultText).not.toContain("**Tags**:");
      expect(resultText).not.toContain("**Status**:");
    });
  });

  describe("response format", () => {
    it("should include install instructions with memory name", async () => {
      const result = await createMemoryFromContentTool(storageManager, {
        name: "Project Alpha",
        content: "# Project Alpha\n\nSome content.",
      });

      const responseText = result.content[0].text;
      
      expect(responseText).toContain("⚠️ **CRITICAL - ACTION REQUIRED**");
      expect(responseText).toContain('check the project memory "Project Alpha"');
      expect(responseText).toContain("get_memory_summary");
      expect(responseText).toContain("add_to_list or update_section");
    });

    it("should provide usage guidance", async () => {
      const result = await createMemoryFromContentTool(storageManager, {
        name: "Test Memory",
        content: "# Test",
      });

      const responseText = result.content[0].text;
      
      expect(responseText).toContain("The memory document has been created with your existing content");
      expect(responseText).toContain("Add new items to any section using natural language");
      expect(responseText).toContain("Update existing sections with new content");
      expect(responseText).toContain("Edit the file directly in any text editor");
      expect(responseText).toContain('Start by saying something like "Add [item] to my [section name]"');
    });

    it("should include file location information", async () => {
      const result = await createMemoryFromContentTool(storageManager, {
        name: "Location Test",
        content: "# Test",
      });

      const responseText = result.content[0].text;
      
      expect(responseText).toContain("File location:");
      expect(responseText).toContain("location-test.md");
    });
  });

  describe("edge cases", () => {
    it("should handle very large content", async () => {
      const largeContent = `# Large Document\n\n${Array(1000).fill("This is a line of content with multiple words.").join("\n")}`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Large Document",
        content: largeContent,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      expect(writeMemoryCalls[0].content).toBe(largeContent);

      const resultText = result.content[0].text;
      expect(resultText).toContain("**Words**:");
      expect(resultText).toContain("**Lines**: 1002"); // 1 header + 1 blank + 1000 content lines
    });

    it("should handle content with special characters", async () => {
      const specialContent = `# Special Characters Test

Unicode: 🚀 © ™ ← ↑ → ↓ ∑ ∆ π ∞
Math: x² + y² = z²
Currency: $100, €85, £75, ¥1000
Quotes: "smart quotes" and 'apostrophes'
Symbols: !@#$%^&*()_+-={}[]|\\:";'<>?,./~`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Special Characters",
        content: specialContent,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      expect(writeMemoryCalls[0].content).toBe(specialContent);
      expect(writeMemoryCalls[0].metadata.id).toBe("special-characters");
    });

    it("should handle content with only whitespace sections", async () => {
      const whitespaceContent = `# Title

## Section One


## Section Two
   
   
## Section Three

Content here.`;

      const result = await createMemoryFromContentTool(storageManager, {
        name: "Whitespace Test",
        content: whitespaceContent,
      });

      expect(writeMemoryCalls).toHaveLength(1);
      expect(writeMemoryCalls[0].content).toBe(whitespaceContent);
    });
  });
});