#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Setting up SaaS Blueprint Generator Platform environment...\n');

// Environment files to create
const envFiles = [
  {
    source: 'env.example',
    target: '.env',
    description: 'Root environment configuration'
  },
  {
    source: 'env.example',
    target: 'backend/.env',
    description: 'Backend environment configuration',
    filter: (content) => {
      // Filter backend-specific variables
      const backendVars = [
        'NODE_ENV', 'PORT', 'MONGODB_URI', 'REDIS_URL', 'JWT_SECRET', 
        'JWT_EXPIRE', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'CORS_ORIGIN',
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'LOG_LEVEL'
      ];
      
      return content
        .split('\n')
        .filter(line => {
          if (line.startsWith('#') || line.trim() === '') return true;
          const varName = line.split('=')[0];
          return backendVars.includes(varName);
        })
        .join('\n');
    }
  },
  {
    source: 'env.example',
    target: 'frontend/.env',
    description: 'Frontend environment configuration',
    filter: (content) => {
      // Filter frontend-specific variables
      const frontendVars = ['VITE_API_URL', 'VITE_APP_NAME', 'VITE_NODE_ENV', 'VITE_ENABLE_MOCK_DATA'];
      
      return content
        .split('\n')
        .filter(line => {
          if (line.startsWith('#') || line.trim() === '') return false;
          const varName = line.split('=')[0];
          return frontendVars.includes(varName);
        })
        .join('\n');
    }
  }
];

// Create environment files
envFiles.forEach(({ source, target, description, filter }) => {
  const sourcePath = path.join(rootDir, source);
  const targetPath = path.join(rootDir, target);
  
  if (fs.existsSync(targetPath)) {
    console.log(`⏭️  Skipping ${target} (already exists)`);
    return;
  }
  
  try {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    if (filter) {
      content = filter(content);
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetPath, content);
    console.log(`✅ Created ${target} - ${description}`);
  } catch (error) {
    console.error(`❌ Failed to create ${target}: ${error.message}`);
  }
});

console.log('\n📝 Next Steps:');
console.log('1. Update the .env files with your actual configuration values');
console.log('2. Get your OpenAI API key from https://platform.openai.com/api-keys');
console.log('3. Run "npm run docker:up" to start the development environment');
console.log('4. Visit http://localhost:3000 for the frontend');
console.log('5. Visit http://localhost:8081 for MongoDB admin (admin/admin123)');

console.log('\n🔐 Important Security Notes:');
console.log('- Change all default secrets and passwords');
console.log('- Never commit .env files to version control');
console.log('- Use strong, unique passwords for production');

console.log('\n🎉 Environment setup complete!'); 