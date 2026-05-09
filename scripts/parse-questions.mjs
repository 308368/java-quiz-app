import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const firecrawlDir = resolve(rootDir, '..', '.firecrawl');

const FILE_CATEGORY_MAP = {
  'javase-fundamental.md': 'Java SE',
  'spring-interview.md': 'Spring',
  'mysql-interview.md': 'MySQL',
  'redis-interview.md': 'Redis',
  'jvm-interview.md': 'JVM',
};

function extractQuestions(content, category) {
  const questions = [];
  const lines = content.split('\n');
  let currentQuestion = null;
  let currentAnswer = [];
  let inAnswer = false;
  let questionNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match question headings: ### [1.🌟什么是 Java？](url)
    // Pattern captures number + dot, then everything after the dot until closing ]
    const qMatch = line.match(/^### \[(\d+)[.．]([^\]]+)\]\([^)]+\)/);
    if (qMatch) {
      // Save previous question if exists
      if (currentQuestion !== null) {
        const answerText = currentAnswer.join('\n').trim();
        if (answerText) {
          questions.push({
            id: `${category.toLowerCase().replace(/\s+/g, '-')}-${String(questionNum).padStart(3, '0')}`,
            category,
            question: currentQuestion,
            answer: answerText,
          });
        }
      }

      questionNum = parseInt(qMatch[1], 10);
      currentQuestion = qMatch[2].trim();
      currentAnswer = [];
      inAnswer = true;
    } else if (inAnswer) {
      // Check if we hit a new question heading (another ###) or top-level section (##)
      if (line.startsWith('## ') || (line.startsWith('### [') && !line.startsWith('#### '))) {
        // End of this answer block
        inAnswer = false;
      } else if (line.startsWith('#### ')) {
        // Sub-heading within answer - include the text (remove #### prefix and link markup)
        currentAnswer.push(line.replace(/^#### /, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'));
      } else {
        // Clean the line and add to answer
        let cleaned = line
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
          .replace(/^>\s*/gm, '') // Remove blockquote markers
          .replace(/^#{1,3}\s+/, '') // Remove heading markers if any
          .trim();

        if (cleaned) {
          currentAnswer.push(cleaned);
        }
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion !== null) {
    const answerText = currentAnswer.join('\n').trim();
    if (answerText) {
      questions.push({
        id: `${category.toLowerCase().replace(/\s+/g, '-')}-${String(questionNum).padStart(3, '0')}`,
        category,
        question: currentQuestion,
        answer: answerText,
      });
    }
  }

  return questions;
}

const allQuestions = [];

for (const [filename, category] of Object.entries(FILE_CATEGORY_MAP)) {
  const filepath = resolve(firecrawlDir, filename);
  try {
    const content = readFileSync(filepath, 'utf-8');
    const questions = extractQuestions(content, category);
    console.log(`[${category}] Found ${questions.length} questions`);
    allQuestions.push(...questions);
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
}

console.log(`\nTotal: ${allQuestions.length} questions`);

// Sort by category then by id
allQuestions.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.id.localeCompare(b.id);
});

const outputPath = resolve(rootDir, 'data', 'questions.json');
writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf-8');
console.log(`Written to ${outputPath}`);