import dotenv from 'dotenv';
import { openAIService } from './src/services/openai.ts';

// Load environment variables
dotenv.config();

async function testRealOpenAIIntegration() {
  console.log('🚀 Testing Real OpenAI Integration for SaaS Blueprint Generator\n');
  console.log('============================================================');
  
  try {
    // Test 1: Basic Service Status
    console.log('\n📊 1. Testing Service Status...');
    const status = openAIService.getStatus();
    console.log('✅ Service Status:', {
      configured: status.isConfigured,
      model: status.model,
      dailyCost: `$${status.dailyCost.toFixed(4)}`,
      remainingBudget: `$${status.remainingBudget.toFixed(2)}`,
      canMakeRequest: status.rateLimitStatus.canMakeRequest
    });

    // Test 2: Basic Completion
    console.log('\n🤖 2. Testing Basic AI Completion...');
    const basicTest = await openAIService.completion(
      'Say "OpenAI integration is working perfectly for SaaS Blueprint Generator!"',
      { maxTokens: 30 }
    );
    console.log('✅ Basic Response:', basicTest.content);
    console.log(`   Tokens: ${basicTest.tokensUsed}, Cost: $${basicTest.cost.toFixed(6)}, Time: ${basicTest.processingTime}ms`);

    // Test 3: SaaS Idea Analysis
    console.log('\n💡 3. Testing SaaS Idea Analysis...');
    const ideaAnalysis = await openAIService.analyzeSaaSIdea(
      'An AI-powered task management platform that automatically prioritizes tasks based on deadlines, team workload, and project importance. It includes smart scheduling, resource allocation, and progress tracking.',
      'Small to medium software development teams (5-50 people) who struggle with project coordination and deadline management',
      'Current project management tools are either too simple (lacking AI insights) or too complex (requiring extensive setup). Teams waste time on manual prioritization and struggle with resource allocation.'
    );
    console.log('✅ SaaS Analysis Response:');
    console.log(`   Length: ${ideaAnalysis.content.length} characters`);
    console.log(`   Tokens: ${ideaAnalysis.tokensUsed}, Cost: $${ideaAnalysis.cost.toFixed(6)}`);
    console.log(`   Preview: ${ideaAnalysis.content.substring(0, 200)}...`);

    // Test 4: Feature Generation
    console.log('\n⚙️ 4. Testing Feature Generation...');
    const features = await openAIService.generateFeatures(
      'AI-powered task management platform with smart prioritization',
      'Software development teams',
      ideaAnalysis.content.substring(0, 500) // Use part of analysis as context
    );
    console.log('✅ Feature Generation Response:');
    console.log(`   Length: ${features.content.length} characters`);
    console.log(`   Tokens: ${features.tokensUsed}, Cost: $${features.cost.toFixed(6)}`);
    console.log(`   Preview: ${features.content.substring(0, 200)}...`);

    // Test 5: Tech Stack Recommendations
    console.log('\n🔧 5. Testing Tech Stack Recommendations...');
    const techStack = await openAIService.recommendTechStack(
      'AI-powered task management platform',
      'Task prioritization, team collaboration, real-time updates, AI scheduling, progress tracking',
      'Budget: $500/month, Team size: 3 developers, Timeline: 6 months MVP'
    );
    console.log('✅ Tech Stack Response:');
    console.log(`   Length: ${techStack.content.length} characters`);
    console.log(`   Tokens: ${techStack.tokensUsed}, Cost: $${techStack.cost.toFixed(6)}`);
    console.log(`   Preview: ${techStack.content.substring(0, 200)}...`);

    // Final Status Check
    console.log('\n📈 6. Final Cost Summary...');
    const finalStatus = openAIService.getStatus();
    const totalCost = finalStatus.dailyCost;
    const totalTokensEstimate = basicTest.tokensUsed + ideaAnalysis.tokensUsed + features.tokensUsed + techStack.tokensUsed;
    
    console.log('✅ Testing Complete! Summary:');
    console.log(`   Total Estimated Tokens: ${totalTokensEstimate}`);
    console.log(`   Total Cost Today: $${totalCost.toFixed(6)}`);
    console.log(`   Remaining Budget: $${finalStatus.remainingBudget.toFixed(2)}`);
    console.log(`   Average Response Time: ~${Math.round((basicTest.processingTime + ideaAnalysis.processingTime + features.processingTime + techStack.processingTime) / 4)}ms`);

    console.log('\n🎉 SUCCESS! Your OpenAI integration is working perfectly!');
    console.log('🚀 Ready to validate SaaS ideas with professional-grade AI analysis!');

  } catch (error) {
    console.log('\n❌ ERROR during testing:');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });
    
    if (error.message.includes('quota')) {
      console.log('\n💡 Quota issue detected. Please check OpenAI billing.');
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 Rate limit hit. This is normal - the system will retry automatically.');
    } else if (error.message.includes('API key')) {
      console.log('\n💡 API key issue. Please verify your OPENAI_API_KEY.');
    }
    
    process.exit(1);
  }
}

// Add some visual flair
console.log('============================================================');
console.log('   🤖 SaaS Blueprint Generator - OpenAI Test Suite');
console.log('============================================================');

testRealOpenAIIntegration();