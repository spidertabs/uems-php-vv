 // src/lib/generateSearchJson.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';

/**
 * Generate search index JSON for the application
 * This creates a searchable index of courses, papers, and questions
 */

interface SearchItem {
  id: string;
  type: 'course' | 'paper' | 'question' | 'user';
  title: string;
  description?: string;
  content?: string;
  tags?: string[];
  url: string;
  metadata?: Record<string, any>;
}

async function generateSearchJson() {
  try {
    console.log('🔍 Generating search index...');

    // This will be populated from your database in production
    // For now, we create a basic structure
    const searchData: SearchItem[] = [
      {
        id: 'getting-started',
        type: 'course',
        title: 'Getting Started with UEMS',
        description: 'Learn how to use the University Exam Management System',
        content: 'Complete guide to creating exam papers, managing questions, and workflows',
        tags: ['guide', 'tutorial', 'getting-started'],
        url: '/docs/getting-started',
        metadata: {
          section: 'Documentation',
        },
      },
      {
        id: 'question-bank',
        type: 'question',
        title: 'Question Bank Management',
        description: 'How to create and manage questions',
        content: 'Create, edit, and organize questions in the question bank',
        tags: ['questions', 'management'],
        url: '/question-bank',
        metadata: {
          section: 'Features',
        },
      },
      {
        id: 'exam-papers',
        type: 'paper',
        title: 'Exam Paper Creation',
        description: 'Create and manage exam papers',
        content: 'Step-by-step guide to creating exam papers from question bank',
        tags: ['papers', 'exams', 'creation'],
        url: '/exam-papers',
        metadata: {
          section: 'Features',
        },
      },
      {
        id: 'approvals',
        type: 'paper',
        title: 'Approval Workflow',
        description: 'Understanding the approval process',
        content: 'Learn about HOD and Dean approval workflows for exam papers',
        tags: ['workflow', 'approvals', 'hod', 'dean'],
        url: '/approvals',
        metadata: {
          section: 'Workflows',
        },
      },
    ];

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write search data to public/search.json
    const outputPath = path.join(publicDir, 'search.json');
    fs.writeFileSync(outputPath, JSON.stringify(searchData, null, 2), 'utf-8');

    console.log('✅ Search index generated successfully!');
    console.log(`📝 Created: ${outputPath}`);
    console.log(`📊 Indexed ${searchData.length} items`);
  } catch (error) {
    console.error('❌ Error generating search index:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateSearchJson();
}

export default generateSearchJson;
