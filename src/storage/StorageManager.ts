import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import matter from "gray-matter";
import {
  Memory,
  MemoryMetadata,
  MemorySummary,
  MemorySection,
} from "../types/memory.js";

export class StorageManager {
  private storagePath: string;

  constructor() {
    this.storagePath = this.getStoragePath();
  }

  private getStoragePath(): string {
    const customPath = process.env.MEMORY_STORAGE_PATH;
    if (customPath) {
      return path.resolve(customPath.replace("~", os.homedir()));
    }

    const platform = process.platform;
    switch (platform) {
      case "darwin":
        return path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "mcp-structured-memory"
        );
      case "win32":
        return path.join(
          os.homedir(),
          "AppData",
          "Local",
          "mcp-structured-memory"
        );
      default: // Linux and others
        return path.join(
          os.homedir(),
          ".local",
          "share",
          "mcp-structured-memory"
        );
    }
  }

  async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(this.storagePath);
    } catch {
      await fs.mkdir(this.storagePath, { recursive: true });

      // Also create backups directory
      const backupsPath = path.join(this.storagePath, ".backups");
      await fs.mkdir(backupsPath, { recursive: true });
    }
  }

  private getMemoryFilePath(memoryId: string): string {
    return path.join(this.storagePath, `${memoryId}.md`);
  }

  private getBackupPath(memoryId: string, timestamp: string): string {
    const backupsDir = path.join(this.storagePath, ".backups");
    return path.join(backupsDir, `${memoryId}-${timestamp}.md`);
  }

  async createBackup(memoryId: string): Promise<void> {
    const filePath = this.getMemoryFilePath(memoryId);

    try {
      await fs.access(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = this.getBackupPath(memoryId, timestamp);

      const content = await fs.readFile(filePath, "utf-8");
      await fs.writeFile(backupPath, content, "utf-8");
    } catch (_error) {
      // File doesn't exist yet, no backup needed
    }
  }

  async writeMemory(memory: Memory): Promise<void> {
    await this.ensureStorageDirectory();
    await this.createBackup(memory.metadata.id);

    const frontmatter = {
      id: memory.metadata.id,
      created: memory.metadata.created,
      updated: new Date().toISOString(),
      tags: memory.metadata.tags,
      ...(memory.metadata.status && { status: memory.metadata.status }),
    };

    const fileContent = matter.stringify(memory.content, frontmatter);
    await fs.writeFile(
      this.getMemoryFilePath(memory.metadata.id),
      fileContent,
      "utf-8"
    );
  }

  async readMemory(memoryId: string): Promise<Memory | null> {
    const filePath = this.getMemoryFilePath(memoryId);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = matter(content);

      const metadata: MemoryMetadata = {
        id: parsed.data.id || memoryId,
        created: parsed.data.created || new Date().toISOString(),
        updated: parsed.data.updated || new Date().toISOString(),
        tags: parsed.data.tags || [],
        status: parsed.data.status,
      };

      return {
        metadata,
        content: parsed.content,
        filePath,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async listMemories(): Promise<MemorySummary[]> {
    await this.ensureStorageDirectory();

    try {
      const files = await fs.readdir(this.storagePath);
      const memoryFiles = files.filter(
        (file) => file.endsWith(".md") && !file.startsWith(".")
      );

      const summaries: MemorySummary[] = [];

      for (const file of memoryFiles) {
        const filePath = path.join(this.storagePath, file);
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = matter(content);
        const memoryId = path.basename(file, ".md");

        const sections = this.parseSections(parsed.content);

        summaries.push({
          id: parsed.data.id || memoryId,
          created: parsed.data.created || new Date().toISOString(),
          updated: parsed.data.updated || new Date().toISOString(),
          tags: parsed.data.tags || [],
          status: parsed.data.status,
          filePath,
          sectionCount: sections.length,
        });
      }

      return summaries.sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
    } catch (_error) {
      return [];
    }
  }

  parseSections(content: string): MemorySection[] {
    const lines = content.split("\n");
    const sections: MemorySection[] = [];
    let currentSection: MemorySection | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section if it exists
        if (currentSection) {
          currentSection.content = currentContent.join("\n").trim();
          sections.push(currentSection);
        }

        // Start new section
        const level = headingMatch[1].length;
        const name = headingMatch[2].trim();
        currentSection = { name, content: "", level };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection) {
      currentSection.content = currentContent.join("\n").trim();
      sections.push(currentSection);
    }

    return sections;
  }

  findSection(content: string, sectionName: string): MemorySection | null {
    const sections = this.parseSections(content);
    return (
      sections.find(
        (section) =>
          section.name.toLowerCase() === sectionName.toLowerCase() ||
          section.name.toLowerCase().replace(/[^a-z0-9]/g, "_") ===
            sectionName.toLowerCase()
      ) || null
    );
  }

  async updateSection(
    memoryId: string,
    sectionName: string,
    newContent: string,
    mode: "append" | "replace" = "append"
  ): Promise<void> {
    const memory = await this.readMemory(memoryId);
    if (!memory) {
      throw new Error(`Memory document '${memoryId}' not found`);
    }

    const sections = this.parseSections(memory.content);
    const sectionIndex = sections.findIndex(
      (section) =>
        section.name.toLowerCase() === sectionName.toLowerCase() ||
        section.name.toLowerCase().replace(/[^a-z0-9]/g, "_") ===
          sectionName.toLowerCase()
    );

    if (sectionIndex === -1) {
      // Section doesn't exist, add it
      const lines = memory.content.split("\n");
      lines.push("", `## ${sectionName}`, "", newContent);
      memory.content = lines.join("\n");
    } else {
      // Section exists, update it
      const section = sections[sectionIndex];
      if (mode === "append") {
        section.content = section.content
          ? `${section.content}\n\n${newContent}`
          : newContent;
      } else {
        section.content = newContent;
      }

      // Rebuild the content
      memory.content = this.rebuildContent(sections);
    }

    await this.writeMemory(memory);
  }

  private rebuildContent(sections: MemorySection[]): string {
    const lines: string[] = [];

    for (const section of sections) {
      const heading = "#".repeat(section.level) + " " + section.name;
      lines.push(heading);
      lines.push("");
      if (section.content) {
        lines.push(section.content);
        lines.push("");
      }
    }

    return lines.join("\n").trim();
  }
}
