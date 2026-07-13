import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'AlbaniyCEO';
const REPO = 'Nakudin';
const BRANCH = 'main';
const BASE = '/home/runner/workspace';

const EXCLUDE = new Set(['.git', 'node_modules', '.cache', 'attached_assets', '.pnpm-store', '.local']);
const EXCLUDE_EXTS = new Set(['.tsbuildinfo', '.lock']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      const ext = entry.includes('.') ? '.' + entry.split('.').pop() : '';
      if (EXCLUDE_EXTS.has(ext)) continue;
      // Skip binary files and large files > 1MB
      if (stat.size > 1_000_000) { console.log('Skipping large file:', full); continue; }
      files.push(full);
    }
  }
  return files;
}

async function ghFetch(path, method = 'GET', body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function createBlob(content, encoding) {
  const data = await ghFetch(`/repos/${OWNER}/${REPO}/git/blobs`, 'POST', { content, encoding });
  return data.sha;
}

async function main() {
  // Get current HEAD
  const refData = await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`);
  const baseSha = refData.object.sha;
  console.log('Base commit SHA:', baseSha);

  const files = walk(BASE);
  console.log(`Found ${files.length} files to push`);

  const tree = [];
  let i = 0;
  for (const file of files) {
    i++;
    const relPath = relative(BASE, file);
    let content, encoding;
    try {
      // Try reading as utf-8 first
      content = readFileSync(file, 'utf-8');
      encoding = 'utf-8';
    } catch {
      // Binary file — encode as base64
      content = readFileSync(file).toString('base64');
      encoding = 'base64';
    }

    // Check if it's valid utf-8 by trying to encode/decode
    let isBinary = false;
    if (encoding === 'utf-8') {
      for (let ci = 0; ci < Math.min(content.length, 8000); ci++) {
        if (content.charCodeAt(ci) === 0) { isBinary = true; break; }
      }
    }
    if (isBinary) {
      content = readFileSync(file).toString('base64');
      encoding = 'base64';
    }

    if (i % 10 === 0) console.log(`Processing ${i}/${files.length}: ${relPath}`);

    const sha = await createBlob(content, encoding);
    tree.push({ path: relPath, mode: '100644', type: 'blob', sha });
  }

  console.log('Creating tree...');
  const treeData = await ghFetch(`/repos/${OWNER}/${REPO}/git/trees`, 'POST', {
    base_tree: baseSha,
    tree,
  });
  console.log('Tree SHA:', treeData.sha);

  console.log('Creating commit...');
  const commitData = await ghFetch(`/repos/${OWNER}/${REPO}/git/commits`, 'POST', {
    message: 'Sync workspace from Replit',
    tree: treeData.sha,
    parents: [baseSha],
    author: { name: 'Replit Agent', email: 'agent@replit.com', date: new Date().toISOString() },
  });
  console.log('Commit SHA:', commitData.sha);

  console.log('Updating branch ref...');
  const updateData = await ghFetch(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: commitData.sha,
    force: true,
  });
  console.log('Done! Branch now at:', updateData.object?.sha);
}

main().catch(err => { console.error(err); process.exit(1); });
