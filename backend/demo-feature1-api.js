#!/usr/bin/env node

/**
 * Demo script for Feature 1: SaaS Idea Input & Processing API
 * This script demonstrates the complete workflow for managing SaaS ideas
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5001/api';

// Demo data
const demoUser = {
  email: 'demo2@example.com',
  password: 'DemoPassword123!',
  name: 'Demo User'
};

const demoProject = {
  name: 'My SaaS Project',
  description: 'A revolutionary project that will change the world'
};

const demoIdea = {
  description: 'A comprehensive SaaS platform that helps small businesses manage their inventory, track sales, analyze customer behavior, and optimize their operations through an intuitive dashboard with real-time analytics.',
  targetAudience: 'Small to medium-sized retail businesses, e-commerce stores, and service-based companies looking for affordable and comprehensive business management solutions.',
  problemStatement: 'Small businesses struggle with disconnected systems for inventory, sales, and customer management, leading to inefficiencies, stockouts, poor customer insights, and missed revenue opportunities.',
  desiredFeatures: [
    'Real-time inventory tracking and management',
    'Comprehensive sales analytics dashboard',
    'Customer behavior insights and segmentation',
    'Mobile app for on-the-go management',
    'Integration with popular e-commerce platforms',
    'Automated reporting and alerts'
  ],
  technicalPreferences: [
    'React',
    'Node.js',
    'MongoDB',
    'Mobile-responsive design',
    'RESTful API',
    'Real-time updates'
  ]
};

class FeatureOneDemoClient {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.projectId = null;
    this.ideaId = null;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        ...options.headers
      },
      ...options
    };

    console.log(`🌐 ${config.method || 'GET'} ${endpoint}`);
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status}`, data);
        return null;
      }
      
      console.log(`✅ Success: ${response.status}`);
      return data;
    } catch (error) {
      console.error(`❌ Network error:`, error.message);
      return null;
    }
  }

  async register() {
    console.log('\n📝 Step 1: User Registration');
    const result = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(demoUser)
    });
    
    if (result?.success) {
      this.authToken = result.data.tokens.accessToken;
      this.userId = result.data.user.userId;
      console.log(`👤 User registered: ${result.data.user.email}`);
      return true;
    }
    return false;
  }

  async login() {
    console.log('\n🔐 Step 1: User Login');
    const result = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: demoUser.email,
        password: demoUser.password
      })
    });
    
    if (result?.success) {
      this.authToken = result.data.tokens.accessToken;
      this.userId = result.data.user.userId;
      console.log(`👤 User logged in: ${result.data.user.email}`);
      return true;
    }
    return false;
  }

  async createProject() {
    console.log('\n📁 Step 2: Create Project');
    const result = await this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(demoProject)
    });
    
    if (result?.success) {
      this.projectId = result.data.project.projectId;
      console.log(`📋 Project created: ${result.data.project.name} (ID: ${this.projectId})`);
      return true;
    }
    console.log('Create project failed:', result);
    return false;
  }

  async submitIdea() {
    console.log('\n💡 Step 3: Submit SaaS Idea');
    const result = await this.makeRequest(`/projects/${this.projectId}/ideas`, {
      method: 'POST',
      body: JSON.stringify(demoIdea)
    });
    
    if (result?.success) {
      this.ideaId = result.data.ideaId;
      console.log(`💭 Idea submitted successfully (ID: ${this.ideaId})`);
      console.log(`📝 Description: ${result.data.description.substring(0, 100)}...`);
      console.log(`🎯 Target Audience: ${result.data.targetAudience.substring(0, 80)}...`);
      console.log(`🔧 Features: ${result.data.desiredFeatures.length} features specified`);
      return true;
    }
    return false;
  }

  async runDemo() {
    console.log('🚀 Feature 1 API Demo: SaaS Idea Input & Processing');
    console.log('================================================\n');
    
    try {
      // Try to login first, if that fails, register
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        const registerSuccess = await this.register();
        if (!registerSuccess) {
          console.error('❌ Failed to authenticate user');
          return;
        }
      }

      // Create project
      const projectSuccess = await this.createProject();
      if (!projectSuccess) {
        console.error('❌ Failed to create project');
        return;
      }

      // Submit idea
      const ideaSuccess = await this.submitIdea();
      if (!ideaSuccess) {
        console.error('❌ Failed to submit idea');
        return;
      }

      console.log('\n🎉 Basic demo completed successfully!');
      console.log('\n📋 Summary of Feature 1 Implementation:');
      console.log('✅ POST /api/projects/:id/ideas - Submit SaaS idea');
      console.log('✅ User authentication working');
      console.log('✅ Project creation working');
      console.log('✅ Idea submission working');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }
}

// Run the demo
const demo = new FeatureOneDemoClient();
demo.runDemo(); 