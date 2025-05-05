
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function initGitRepo() {
  try {
    // Check if .git exists
    await fs.access('.git');
    console.log('Git repository already initialized');
  } catch {
    // Initialize new repo if .git doesn't exist
    await execAsync('git init');
    console.log('Initialized new Git repository');
  }
}

async function createGitignore() {
  const gitignoreContent = `
# Dependencies
node_modules/
.npm
.pnp
.pnp.js

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/
out/

# Logs
logs
*.log
npm-debug.log*

# Runtime data
.replit
.replit.nix
.cache/
.upm/
.config/
.node-gyp

# Editor directories
.idea/
.vscode/
*.swp
*.swo

# System Files
.DS_Store
Thumbs.db
`;

  await fs.writeFile('.gitignore', gitignoreContent.trim());
  console.log('Created .gitignore file');
}

async function setupRemote(repoUrl: string) {
  try {
    await execAsync('git remote remove origin');
  } catch {
    // Ignore if origin doesn't exist
  }
  
  await execAsync(`git remote add origin ${repoUrl}`);
  console.log('Added GitHub remote repository');
}

async function commitAndPush(message: string = 'Initial commit') {
  // Add all files
  await execAsync('git add .');
  console.log('Added files to Git');

  // Commit changes
  await execAsync(`git commit -m "${message}"`);
  console.log('Committed changes');

  // Push to GitHub
  await execAsync('git push -u origin main');
  console.log('Pushed to GitHub');
}

export async function exportToGithub(repoUrl: string, commitMessage?: string) {
  try {
    console.log('Starting GitHub export...');
    
    await initGitRepo();
    await createGitignore();
    await setupRemote(repoUrl);
    await commitAndPush(commitMessage);
    
    console.log('Successfully exported to GitHub!');
  } catch (error) {
    console.error('Error during GitHub export:', error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  const repoUrl = process.argv[2];
  const commitMessage = process.argv[3];
  
  if (!repoUrl) {
    console.error('Please provide a GitHub repository URL');
    process.exit(1);
  }
  
  exportToGithub(repoUrl, commitMessage)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
