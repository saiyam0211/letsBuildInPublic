import { ideaProcessingService } from './src/services/ideaProcessing.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test the idea processing service with sample data
 */
async function testIdeaProcessing() {
  console.log('🧪 Testing Idea Processing Service');
  console.log('==================================\n');

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-blueprint-generator';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Sample SaaS idea request
    const sampleRequest = {
      projectId: new mongoose.Types.ObjectId().toString(),
      description: 'An AI-powered project management tool that helps teams collaborate more effectively by automatically organizing tasks, predicting bottlenecks, and suggesting optimal resource allocation. The platform uses machine learning to analyze team patterns and provide intelligent insights for better project outcomes.',
      targetAudience: 'Small to medium-sized software development teams, project managers, and startup founders who struggle with manual project tracking and want data-driven insights to improve team productivity and project success rates.',
      problemStatement: 'Current project management tools require too much manual input, lack intelligent automation, and don\'t provide predictive insights. Teams waste time on administrative tasks instead of focusing on actual work, leading to missed deadlines, inefficient resource allocation, and decreased productivity.',
      desiredFeatures: [
        'AI-powered task prioritization',
        'Automated workflow optimization',
        'Predictive bottleneck detection',
        'Resource allocation suggestions',
        'Team collaboration tools',
        'Real-time progress tracking',
        'Intelligent reporting dashboards',
        'Integration with development tools'
      ],
      technicalPreferences: [
        'React',
        'Node.js',
        'PostgreSQL',
        'AWS',
        'TypeScript',
        'GraphQL'
      ]
    };

    console.log('📝 Processing SaaS Idea:');
    console.log(`   Description: ${sampleRequest.description.substring(0, 100)}...`);
    console.log(`   Target Audience: ${sampleRequest.targetAudience.substring(0, 80)}...`);
    console.log(`   Features: ${sampleRequest.desiredFeatures.length} desired features`);
    console.log(`   Tech Preferences: ${sampleRequest.technicalPreferences.join(', ')}\n`);

    const startTime = Date.now();

    // Process the idea
    const result = await ideaProcessingService.processIdea(sampleRequest);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log('🎉 IDEA PROCESSING COMPLETE!');
    console.log('============================\n');

    // Display results
    console.log('📊 BUSINESS ANALYSIS:');
    console.log(`   Business Model: ${result.businessAnalysis.businessModelType}`);
    console.log(`   Revenue Model: ${result.businessAnalysis.revenueModel}`);
    console.log(`   Viability Score: ${result.businessAnalysis.viabilityScore}/100`);
    console.log(`   Scalability Score: ${result.businessAnalysis.scalabilityScore}/100`);
    console.log(`   Competition Level: ${result.businessAnalysis.competitiveLandscape.competitionLevel}`);
    console.log(`   Market Saturation: ${result.businessAnalysis.competitiveLandscape.marketSaturation}%`);
    console.log(`   Key Differentiators: ${result.businessAnalysis.competitiveLandscape.differentiation.join(', ')}\n`);

    console.log('🎯 MARKET VALIDATION:');
    console.log(`   Validation Score: ${result.marketValidation.validationScore}/100`);
    console.log(`   TAM: ${result.marketValidation.marketSize.tam}`);
    console.log(`   SAM: ${result.marketValidation.marketSize.sam}`);
    console.log(`   SOM: ${result.marketValidation.marketSize.som}`);
    console.log(`   Primary Segment: ${result.marketValidation.targetAudienceAnalysis.primarySegment}`);
    console.log(`   Pain Points: ${result.marketValidation.targetAudienceAnalysis.painPoints.join(', ')}`);
    console.log(`   Willingness to Pay: ${result.marketValidation.targetAudienceAnalysis.willingnessToPay}\n`);

    console.log('⚡ FEATURE ROADMAP:');
    console.log(`   MVP Features (${result.features.mvpFeatures.length}):`);
    result.features.mvpFeatures.forEach((feature, index) => {
      console.log(`     ${index + 1}. ${feature.name} (Priority: ${feature.priority}, Effort: ${feature.effort})`);
    });
    console.log(`   Growth Features (${result.features.growthFeatures.length}):`);
    result.features.growthFeatures.forEach((feature, index) => {
      console.log(`     ${index + 1}. ${feature.name} (Priority: ${feature.priority}, Effort: ${feature.effort})`);
    });
    console.log(`   Advanced Features (${result.features.advancedFeatures.length}):`);
    result.features.advancedFeatures.forEach((feature, index) => {
      console.log(`     ${index + 1}. ${feature.name} (Priority: ${feature.priority}, Effort: ${feature.effort})`);
    });
    console.log();

    console.log('🛠️ TECH STACK RECOMMENDATIONS:');
    console.log(`   Frontend: ${result.techStack.frontend.primary}`);
    console.log(`     Alternatives: ${result.techStack.frontend.alternatives.join(', ')}`);
    console.log(`     Reasoning: ${result.techStack.frontend.reasoning}`);
    console.log(`   Backend: ${result.techStack.backend.primary}`);
    console.log(`     Alternatives: ${result.techStack.backend.alternatives.join(', ')}`);
    console.log(`   Database: ${result.techStack.database.primary}`);
    console.log(`     Alternatives: ${result.techStack.database.alternatives.join(', ')}`);
    console.log(`   Infrastructure: ${result.techStack.infrastructure.primary}`);
    console.log(`     Alternatives: ${result.techStack.infrastructure.alternatives.join(', ')}`);
    console.log();

    console.log('💰 COST ESTIMATES:');
    console.log(`   Development: ${result.techStack.estimatedCosts.development}`);
    console.log(`   Monthly Operations: ${result.techStack.estimatedCosts.monthly}`);
    console.log(`   At Scale: ${result.techStack.estimatedCosts.scaling}\n`);

    console.log('📈 PROCESSING METRICS:');
    console.log(`   Total Processing Time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`   AI Cost: $${result.processingMetrics.aiCost.toFixed(4)}`);
    console.log(`   Tokens Used: ${result.processingMetrics.tokensUsed.toLocaleString()}`);
    console.log(`   Steps Completed: ${result.processingMetrics.stepsCompleted.length}/7`);
    console.log(`   Overall Confidence: ${result.processingMetrics.confidenceScore}/100`);
    console.log(`   Steps: ${result.processingMetrics.stepsCompleted.join(' → ')}\n`);

    console.log('🔍 RISK ASSESSMENT:');
    if (result.marketValidation.riskAssessment.marketRisks.length > 0) {
      console.log(`   Market Risks: ${result.marketValidation.riskAssessment.marketRisks.join(', ')}`);
    }
    if (result.marketValidation.riskAssessment.technicalRisks.length > 0) {
      console.log(`   Technical Risks: ${result.marketValidation.riskAssessment.technicalRisks.join(', ')}`);
    }
    if (result.marketValidation.riskAssessment.financialRisks.length > 0) {
      console.log(`   Financial Risks: ${result.marketValidation.riskAssessment.financialRisks.join(', ')}`);
    }
    if (result.marketValidation.riskAssessment.competitiveRisks.length > 0) {
      console.log(`   Competitive Risks: ${result.marketValidation.riskAssessment.competitiveRisks.join(', ')}`);
    }
    console.log();

    console.log('📋 IMPLEMENTATION PHASES:');
    console.log(`   Phase 1 (0-3 months): ${result.features.featureRoadmap.phase1.join(', ')}`);
    console.log(`   Phase 2 (3-12 months): ${result.features.featureRoadmap.phase2.join(', ')}`);
    console.log(`   Phase 3 (12+ months): ${result.features.featureRoadmap.phase3.join(', ')}\n`);

    // Summary assessment
    const overallScore = Math.round(
      (result.businessAnalysis.viabilityScore + 
       result.businessAnalysis.scalabilityScore + 
       result.marketValidation.validationScore) / 3
    );

    console.log('🏆 OVERALL ASSESSMENT:');
    console.log(`   Idea Score: ${overallScore}/100`);
    
    if (overallScore >= 80) {
      console.log('   🟢 EXCELLENT - Strong potential for success with high market viability');
    } else if (overallScore >= 70) {
      console.log('   🟡 GOOD - Solid foundation with some areas for improvement');
    } else if (overallScore >= 60) {
      console.log('   🟠 MODERATE - Viable but requires significant optimization');
    } else {
      console.log('   🔴 CHALLENGING - Consider pivoting or major improvements');
    }
    
    console.log(`   Recommendation: ${overallScore >= 70 ? 'Proceed with development' : 'Refine the concept before proceeding'}\n`);

    console.log('✅ Test completed successfully!');
    console.log(`   Idea ID: ${result.ideaId}`);
    console.log(`   All data saved to database for future reference\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack trace:', error.stack);
    }
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testIdeaProcessing(); 