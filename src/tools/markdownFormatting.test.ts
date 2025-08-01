import { describe, it, expect, beforeEach } from "vitest";
import { StorageManager } from "../storage/StorageManager.js";
import { getFullMemoryTool } from "./getFullMemory.js";
import { Memory } from "../types/memory.js";

describe("Markdown Formatting Support", () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
  });

  describe("Multiple heading levels", () => {
    it("should preserve all heading levels from h1 to h6", async () => {
      const complexMarkdown = `# Main Title (H1)

## Section Heading (H2)

### Subsection (H3)

#### Sub-subsection (H4)

##### Detail Level (H5)

###### Fine Detail (H6)

Normal paragraph text here.`;

      const testMemory: Memory = {
        metadata: {
          id: "heading-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: complexMarkdown,
        filePath: "/test/path/heading-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "heading-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "heading-test",
      });

      const outputText = result.content[0].text;
      expect(outputText).toContain("# Main Title (H1)");
      expect(outputText).toContain("## Section Heading (H2)");
      expect(outputText).toContain("### Subsection (H3)");
      expect(outputText).toContain("#### Sub-subsection (H4)");
      expect(outputText).toContain("##### Detail Level (H5)");
      expect(outputText).toContain("###### Fine Detail (H6)");
    });
  });

  describe("Text formatting", () => {
    it("should preserve bold, italic, and combined formatting", async () => {
      const formattedText = `# Text Formatting Examples

## Bold Text
**This is bold text**
__This is also bold text__

## Italic Text
*This is italic text*
_This is also italic text_

## Combined Formatting
***This is bold and italic***
**Bold with *italic* inside**
*Italic with **bold** inside*

## Strikethrough
~~This text is struck through~~

## Inline Code
Here is some \`inline code\` in a sentence.

## Mixed Content
**Bold** and *italic* and \`code\` and ~~strikethrough~~ all together.`;

      const testMemory: Memory = {
        metadata: {
          id: "formatting-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: formattedText,
        filePath: "/test/path/formatting-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "formatting-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "formatting-test",
      });

      const outputText = result.content[0].text;
      
      // Bold formatting
      expect(outputText).toContain("**This is bold text**");
      expect(outputText).toContain("__This is also bold text__");
      
      // Italic formatting
      expect(outputText).toContain("*This is italic text*");
      expect(outputText).toContain("_This is also italic text_");
      
      // Combined formatting
      expect(outputText).toContain("***This is bold and italic***");
      expect(outputText).toContain("**Bold with *italic* inside**");
      expect(outputText).toContain("*Italic with **bold** inside*");
      
      // Strikethrough
      expect(outputText).toContain("~~This text is struck through~~");
      
      // Inline code
      expect(outputText).toContain("`inline code`");
      
      // Mixed content
      expect(outputText).toContain("**Bold** and *italic* and `code` and ~~strikethrough~~");
    });
  });

  describe("Code blocks", () => {
    it("should preserve fenced code blocks with and without language specification", async () => {
      const codeContent = `# Code Examples

## JavaScript Code
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return "greeting sent";
}

const result = greet("World");
\`\`\`

## Python Code
\`\`\`python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

# Usage
for i in range(10):
    print(f"F({i}) = {calculate_fibonacci(i)}")
\`\`\`

## Plain Code Block
\`\`\`
This is a code block without language specification
It should preserve all formatting including:
  - indentation
  - special characters: !@#$%^&*()
  - and blank lines

\`\`\`

## SQL Code
\`\`\`sql
SELECT users.name, COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.active = true
GROUP BY users.id, users.name
ORDER BY order_count DESC;
\`\`\``;

      const testMemory: Memory = {
        metadata: {
          id: "code-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: codeContent,
        filePath: "/test/path/code-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "code-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "code-test",
      });

      const outputText = result.content[0].text;
      
      // JavaScript code block
      expect(outputText).toContain("```javascript");
      expect(outputText).toContain("function greet(name) {");
      expect(outputText).toContain("console.log(`Hello, ${name}!`);");
      
      // Python code block
      expect(outputText).toContain("```python");
      expect(outputText).toContain("def calculate_fibonacci(n):");
      expect(outputText).toContain("print(f\"F({i}) = {calculate_fibonacci(i)}\")");
      
      // Plain code block
      expect(outputText).toContain("This is a code block without language specification");
      expect(outputText).toContain("special characters: !@#$%^&*()");
      
      // SQL code block
      expect(outputText).toContain("```sql");
      expect(outputText).toContain("SELECT users.name, COUNT(orders.id)");
      expect(outputText).toContain("LEFT JOIN orders ON users.id = orders.user_id");
    });
  });

  describe("Links", () => {
    it("should preserve various types of links", async () => {
      const linkContent = `# Link Examples

## Standard Links
[Google](https://www.google.com)
[Local File](./relative/path/file.md)
[Absolute Path](/absolute/path/file.md)

## Links with Titles
[Google with Title](https://www.google.com "Search Engine")
[GitHub](https://github.com "Code Repository Platform")

## Reference-style Links
[Reference Link][ref1]
[Another Reference][ref2]

[ref1]: https://example.com "Example Website"
[ref2]: https://docs.example.com "Documentation"

## Automatic Links
<https://www.autolink.com>
<mailto:test@example.com>

## Complex Links
[Link with **bold** and *italic* text](https://example.com)
[Link with \`code\`](https://code.example.com)

## Image Links
![Alt text](https://example.com/image.jpg)
![Alt with title](https://example.com/image.jpg "Image title")
[![Image as Link](https://example.com/thumb.jpg)](https://example.com/full.jpg)`;

      const testMemory: Memory = {
        metadata: {
          id: "link-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: linkContent,
        filePath: "/test/path/link-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "link-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "link-test",
      });

      const outputText = result.content[0].text;
      
      // Standard links
      expect(outputText).toContain("[Google](https://www.google.com)");
      expect(outputText).toContain("[Local File](./relative/path/file.md)");
      expect(outputText).toContain("[Absolute Path](/absolute/path/file.md)");
      
      // Links with titles
      expect(outputText).toContain("[Google with Title](https://www.google.com \"Search Engine\")");
      expect(outputText).toContain("[GitHub](https://github.com \"Code Repository Platform\")");
      
      // Reference-style links
      expect(outputText).toContain("[Reference Link][ref1]");
      expect(outputText).toContain("[ref1]: https://example.com \"Example Website\"");
      expect(outputText).toContain("[ref2]: https://docs.example.com \"Documentation\"");
      
      // Automatic links
      expect(outputText).toContain("<https://www.autolink.com>");
      expect(outputText).toContain("<mailto:test@example.com>");
      
      // Complex links
      expect(outputText).toContain("[Link with **bold** and *italic* text](https://example.com)");
      expect(outputText).toContain("[Link with `code`](https://code.example.com)");
      
      // Image links
      expect(outputText).toContain("![Alt text](https://example.com/image.jpg)");
      expect(outputText).toContain("![Alt with title](https://example.com/image.jpg \"Image title\")");
      expect(outputText).toContain("[![Image as Link](https://example.com/thumb.jpg)](https://example.com/full.jpg)");
    });
  });

  describe("Lists and complex structures", () => {
    it("should preserve nested lists, task lists, and complex structures", async () => {
      const complexContent = `# Complex Structures

## Nested Unordered Lists
- Level 1 item 1
  - Level 2 item 1
    - Level 3 item 1
    - Level 3 item 2
  - Level 2 item 2
- Level 1 item 2
  - Level 2 item 3

## Nested Ordered Lists
1. First main item
   1. First sub-item
   2. Second sub-item
      1. Deeply nested item
      2. Another deep item
2. Second main item
   - Mixed with unordered
   - Another mixed item

## Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
  - [ ] Nested incomplete subtask
  - [x] Nested completed subtask

## Mixed Content Lists
1. **Bold first item** with *italic text*
2. Item with \`inline code\`
3. Item with [a link](https://example.com)
4. Item with multiple lines
   that continues here
   and here too

## Tables
| Name | Role | Status |
|------|------|--------|
| Alice | Developer | **Active** |
| Bob | Designer | *Away* |
| Charlie | Manager | \`On Leave\` |

## Blockquotes
> This is a blockquote
> that spans multiple lines
> 
> > This is a nested blockquote
> > with **bold** and *italic* text
> 
> Back to the main blockquote

## Horizontal Rules
---

Content after first rule

***

Content after second rule

___

Content after third rule`;

      const testMemory: Memory = {
        metadata: {
          id: "complex-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: complexContent,
        filePath: "/test/path/complex-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "complex-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "complex-test",
      });

      const outputText = result.content[0].text;
      
      // Nested lists
      expect(outputText).toContain("- Level 1 item 1");
      expect(outputText).toContain("  - Level 2 item 1");
      expect(outputText).toContain("    - Level 3 item 1");
      
      // Ordered lists
      expect(outputText).toContain("1. First main item");
      expect(outputText).toContain("   1. First sub-item");
      expect(outputText).toContain("      1. Deeply nested item");
      
      // Task lists
      expect(outputText).toContain("- [x] Completed task");
      expect(outputText).toContain("- [ ] Incomplete task");
      expect(outputText).toContain("  - [ ] Nested incomplete subtask");
      
      // Mixed content in lists
      expect(outputText).toContain("**Bold first item** with *italic text*");
      expect(outputText).toContain("Item with `inline code`");
      expect(outputText).toContain("Item with [a link](https://example.com)");
      
      // Tables
      expect(outputText).toContain("| Name | Role | Status |");
      expect(outputText).toContain("|------|------|--------|");
      expect(outputText).toContain("| Alice | Developer | **Active** |");
      
      // Blockquotes
      expect(outputText).toContain("> This is a blockquote");
      expect(outputText).toContain("> > This is a nested blockquote");
      expect(outputText).toContain("> > with **bold** and *italic* text");
      
      // Horizontal rules
      expect(outputText).toContain("---");
      expect(outputText).toContain("***");
      expect(outputText).toContain("___");
    });
  });

  describe("Edge cases and special characters", () => {
    it("should handle escape characters and special markdown characters", async () => {
      const edgeCaseContent = `# Edge Cases and Special Characters

## Escaped Characters
\\*Not italic\\* and \\**not bold\\**
\\[Not a link\\](not-a-url)
\\# Not a heading
\\\`Not code\\\`

## Literal Backticks
To show a backtick, use: \\\`
To show \`code with backticks\`, use: \\\`code with backticks\\\`

## Special Characters in Content
Characters: !@#$%^&*()_+-={}[]|\\:";'<>?,./~\`

## HTML in Markdown
<strong>HTML bold</strong>
<em>HTML italic</em>
<code>HTML code</code>
<a href="https://example.com">HTML link</a>

## Mixed Formatting Edge Cases
**Bold *with italic* inside**
*Italic **with bold** inside*
\`Code with **bold attempt** inside\`
[Link with **bold** text](https://example.com)

## Unicode and Emojis
🚀 Rocket emoji in text
© Copyright symbol
™ Trademark
← ↑ → ↓ Arrows
Mathematical symbols: ∑ ∆ π ∞
Currency: $ € £ ¥ ₹`;

      const testMemory: Memory = {
        metadata: {
          id: "edge-case-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-01T10:00:00.000Z",
          tags: [],
          status: "active",
        },
        content: edgeCaseContent,
        filePath: "/test/path/edge-case-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "edge-case-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "edge-case-test",
      });

      const outputText = result.content[0].text;
      
      // Escaped characters
      expect(outputText).toContain("\\*Not italic\\*");
      expect(outputText).toContain("\\[Not a link\\]");
      expect(outputText).toContain("\\# Not a heading");
      
      // Literal backticks
      expect(outputText).toContain("To show a backtick, use: \\`");
      
      // Special characters
      expect(outputText).toContain("!@#$%^&*()_+-={}[]|\\:\";'<>?,./~`");
      
      // HTML in markdown
      expect(outputText).toContain("<strong>HTML bold</strong>");
      expect(outputText).toContain("<em>HTML italic</em>");
      expect(outputText).toContain("<code>HTML code</code>");
      
      // Mixed formatting
      expect(outputText).toContain("**Bold *with italic* inside**");
      expect(outputText).toContain("*Italic **with bold** inside*");
      expect(outputText).toContain("`Code with **bold attempt** inside`");
      
      // Unicode and emojis
      expect(outputText).toContain("🚀 Rocket emoji");
      expect(outputText).toContain("© Copyright symbol");
      expect(outputText).toContain("Mathematical symbols: ∑ ∆ π ∞");
      expect(outputText).toContain("Currency: $ € £ ¥ ₹");
    });
  });

  describe("Real-world markdown content", () => {
    it("should handle a realistic complex memory document", async () => {
      const realWorldContent = `# Project Alpha - Development Notes

## Overview
**Project Alpha** is a *next-generation* web application for managing ~~legacy systems~~ modern workflows.

### Key Features
- **Authentication**: OAuth 2.0 with JWT tokens
- **Database**: PostgreSQL with \`asyncpg\` driver
- **Frontend**: React with TypeScript
- **Backend**: FastAPI with Python 3.11+

## Development Setup

### Prerequisites
1. **Python 3.11+** - [Download here](https://python.org/downloads)
2. **Node.js 18+** - [Download here](https://nodejs.org)
3. **PostgreSQL 14+** - [Installation guide](https://postgresql.org/docs)

### Installation Steps
\`\`\`bash
# Clone the repository
git clone git@github.com:company/project-alpha.git
cd project-alpha

# Setup Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt
npm install

# Setup database
createdb project_alpha_dev
python manage.py migrate
\`\`\`

## API Documentation

### Authentication Endpoint
\`\`\`python
@app.post("/auth/login")
async def login(credentials: LoginRequest) -> TokenResponse:
    """
    Authenticate user and return JWT token.
    
    Args:
        credentials: User login credentials
        
    Returns:
        JWT token and user information
    """
    user = await authenticate_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user.id)
    return TokenResponse(token=token, user=user.dict())
\`\`\`

## Task Management

### Current Sprint Tasks
- [x] **Setup CI/CD pipeline** - Completed on 2024-01-15
  - [x] Configure GitHub Actions
  - [x] Setup staging environment
  - [x] Add automated tests
- [ ] **Implement user management**
  - [x] Create user model
  - [x] Add registration endpoint
  - [ ] Add password reset functionality
  - [ ] Implement role-based permissions
- [ ] **Frontend development**
  - [ ] Design system components
  - [ ] User dashboard
  - [ ] Mobile responsiveness

### Backlog
1. **Performance optimization**
   - Database query optimization
   - Implement caching with Redis
   - Frontend bundle optimization
2. **Security enhancements**
   - Add rate limiting
   - Implement CSRF protection
   - Security headers middleware

## Team Notes

### Meeting Minutes - 2024-01-20
> **Attendees**: Alice (PM), Bob (Dev), Charlie (Design)
> 
> **Key Decisions**:
> - Switch from REST to GraphQL for better frontend flexibility
> - Use Tailwind CSS instead of custom CSS
> - Weekly demo every Friday at 2 PM
> 
> **Action Items**:
> - Bob: Research GraphQL implementation *(Due: Jan 25)*
> - Charlie: Create design system mockups *(Due: Jan 27)*
> - Alice: Update project timeline *(Due: Jan 22)*

### Code Review Guidelines
| Aspect | Requirement | Tools |
|--------|-------------|-------|
| **Code Style** | Black + isort | pre-commit hooks |
| **Type Checking** | mypy coverage > 90% | GitHub Actions |
| **Testing** | pytest coverage > 85% | codecov |
| **Documentation** | All public APIs | Sphinx |

## Resources

### External Links
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

### Internal Resources
- [Company Style Guide](./docs/style-guide.md)
- [Architecture Decision Records](./docs/adr/)
- [Deployment Guide](./docs/deployment.md)

---

*Last updated: 2024-01-20 by Alice*
*Next review: 2024-02-01*`;

      const testMemory: Memory = {
        metadata: {
          id: "real-world-test",
          created: "2024-01-01T10:00:00.000Z",
          updated: "2024-01-20T15:30:00.000Z",
          tags: ["project", "development", "alpha"],
          status: "active",
        },
        content: realWorldContent,
        filePath: "/test/path/real-world-test.md",
      };

      storageManager.readMemory = async (id: string) => {
        if (id === "real-world-test") return testMemory;
        return null;
      };

      const result = await getFullMemoryTool(storageManager, {
        memory_id: "real-world-test",
      });

      const outputText = result.content[0].text;
      
      // Verify the document structure is preserved
      expect(outputText).toContain("# Project Alpha - Development Notes");
      expect(outputText).toContain("## Overview");
      expect(outputText).toContain("### Key Features");
      
      // Verify text formatting
      expect(outputText).toContain("**Project Alpha** is a *next-generation*");
      expect(outputText).toContain("~~legacy systems~~ modern workflows");
      
      // Verify code blocks
      expect(outputText).toContain("```bash");
      expect(outputText).toContain("```python");
      expect(outputText).toContain("git clone git@github.com:company/project-alpha.git");
      expect(outputText).toContain("@app.post(\"/auth/login\")");
      
      // Verify links
      expect(outputText).toContain("[Download here](https://python.org/downloads)");
      expect(outputText).toContain("[FastAPI Documentation](https://fastapi.tiangolo.com/)");
      
      // Verify task lists
      expect(outputText).toContain("- [x] **Setup CI/CD pipeline**");
      expect(outputText).toContain("- [ ] **Implement user management**");
      expect(outputText).toContain("  - [x] Create user model");
      
      // Verify tables
      expect(outputText).toContain("| Aspect | Requirement | Tools |");
      expect(outputText).toContain("| **Code Style** | Black + isort | pre-commit hooks |");
      
      // Verify blockquotes
      expect(outputText).toContain("> **Attendees**: Alice (PM), Bob (Dev), Charlie (Design)");
      expect(outputText).toContain("> - Bob: Research GraphQL implementation *(Due: Jan 25)*");
      
      // Verify the content is substantial
      expect(outputText.length).toBeGreaterThan(3000);
    });
  });
});