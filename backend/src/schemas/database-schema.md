# Database Schema Documentation

## Overview

This document describes the MongoDB database schema for the SaaS Blueprint Generator Platform. The schema is designed to support the complete workflow from idea input to blueprint generation, following the system design and class diagram specifications.

## Collections Overview

### Core Entities
- **users** - User authentication and profile management
- **projects** - Project metadata and ownership
- **saas_ideas** - SaaS idea descriptions and requirements
- **idea_validations** - AI-generated market validation results
- **features** - Feature definitions and prioritization
- **tech_stack_recommendations** - Technology recommendations
- **tasks** - Task management and tracking
- **diagrams** - Visual diagrams and blueprints

## Detailed Schema Definitions

### 1. Users Collection

```typescript
interface IUser {
  _id: ObjectId;
  email: string;           // Unique, validated email
  password: string;        // Bcrypt hashed, not selected by default
  name: string;           // User's display name
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

**Indexes:**
- `email: 1` (unique)
- `createdAt: -1`

**Validation Rules:**
- Email: Valid email format, lowercase, trimmed
- Password: Minimum 8 characters, hashed with bcrypt
- Name: 2-50 characters, trimmed

### 2. Projects Collection

```typescript
interface IProject {
  _id: ObjectId;
  name: string;           // Project name (3-100 chars)
  description: string;    // Project description (10-1000 chars)
  ownerId: ObjectId;      // Reference to User
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `ownerId: 1`
- `status: 1`
- `ownerId: 1, status: 1`
- `ownerId: 1, createdAt: -1`

**Relationships:**
- `ownerId` → `users._id` (Many-to-One)

### 3. SaaS Ideas Collection

```typescript
interface ISaasIdea {
  _id: ObjectId;
  projectId: ObjectId;           // Reference to Project (unique)
  description: string;           // Detailed idea description (50-2000 chars)
  targetAudience: string;        // Target audience description (10-500 chars)
  problemStatement: string;      // Problem being solved (20-1000 chars)
  desiredFeatures: string[];     // Array of desired features (max 20)
  technicalPreferences: string[]; // Array of tech preferences (max 15)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `projectId: 1` (unique)
- `createdAt: -1`

**Relationships:**
- `projectId` → `projects._id` (One-to-One)

**Validation Rules:**
- One idea per project (unique constraint)
- Feature descriptions: 5-200 characters each
- Technical preferences: 2-50 characters each

### 4. Idea Validations Collection

```typescript
interface IIdeaValidation {
  _id: ObjectId;
  ideaId: ObjectId;                     // Reference to SaasIdea (unique)
  marketPotential: number;              // 0-100 score
  similarProducts: ISimilarProduct[];   // Array of similar products (max 10)
  differentiationOpportunities: string[]; // Array of opportunities (max 10)
  risks: IRisk[];                       // Array of risks (max 15)
  confidenceScore: number;              // 0-100 AI confidence score
  improvementSuggestions: string[];     // Array of suggestions (max 15)
  createdAt: Date;
  updatedAt: Date;
}

interface ISimilarProduct {
  name: string;           // Product name (max 100 chars)
  description: string;    // Product description (max 500 chars)
  url?: string;          // Optional URL (validated format)
  similarityScore: number; // 0-100 similarity score
}

interface IRisk {
  type: 'market' | 'technical' | 'financial' | 'competitive';
  description: string;    // Risk description (10-500 chars)
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;    // Optional mitigation strategy (max 300 chars)
}
```

**Indexes:**
- `ideaId: 1` (unique)
- `marketPotential: -1`
- `confidenceScore: -1`
- `createdAt: -1`

**Relationships:**
- `ideaId` → `saas_ideas._id` (One-to-One)

### 5. Features Collection

```typescript
interface IFeature {
  _id: ObjectId;
  projectId: ObjectId;    // Reference to Project
  name: string;          // Feature name (3-100 chars)
  description: string;   // Feature description (10-1000 chars)
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;    // 1-10 integer scale
  category: 'mvp' | 'growth' | 'future' | 'nice-to-have';
  userPersona: string;   // Target user persona (5-100 chars)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `projectId: 1`
- `priority: 1`
- `category: 1`
- `complexity: 1`
- `projectId: 1, category: 1, priority: 1`

**Relationships:**
- `projectId` → `projects._id` (Many-to-One)

### 6. Tech Stack Recommendations Collection

```typescript
interface ITechStackRecommendation {
  _id: ObjectId;
  projectId: ObjectId;           // Reference to Project (unique)
  frontend: ITechOption[];       // Frontend technologies (max 5)
  backend: ITechOption[];        // Backend technologies (max 5)
  database: ITechOption[];       // Database options (max 3)
  infrastructure: ITechOption[]; // Infrastructure options (max 5)
  thirdPartyServices: ITechOption[]; // Third-party services (max 10)
  rationale: IRationale;         // Recommendation reasoning
  alternativeOptions: ITechOption[]; // Alternative options (max 5)
  createdAt: Date;
  updatedAt: Date;
}

interface ITechOption {
  name: string;          // Technology name (max 50 chars)
  description: string;   // Technology description (max 300 chars)
  pros: string[];        // Advantages (max 100 chars each)
  cons: string[];        // Disadvantages (max 100 chars each)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'low' | 'medium' | 'high';
  popularity: number;    // 1-100 popularity score
}

interface IRationale {
  reasoning: string;     // Main reasoning (50-1000 chars)
  factors: string[];     // Decision factors (max 100 chars each)
  alternatives: string[]; // Alternative approaches (max 100 chars each)
}
```

**Indexes:**
- `projectId: 1` (unique)
- `createdAt: -1`

**Relationships:**
- `projectId` → `projects._id` (One-to-One)

### 7. Tasks Collection

```typescript
interface ITask {
  _id: ObjectId;
  projectId: ObjectId;    // Reference to Project
  title: string;         // Task title (5-150 chars)
  description: string;   // Task description (10-1000 chars)
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effortEstimate: number; // Hours in 0.5 increments (0.5-200)
  assigneeId?: ObjectId;  // Optional reference to User
  featureId?: ObjectId;   // Optional reference to Feature
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `projectId: 1`
- `status: 1`
- `priority: 1`
- `assigneeId: 1`
- `featureId: 1`
- `projectId: 1, status: 1, priority: 1`

**Relationships:**
- `projectId` → `projects._id` (Many-to-One)
- `assigneeId` → `users._id` (Many-to-One, optional)
- `featureId` → `features._id` (Many-to-One, optional)

### 8. Diagrams Collection

```typescript
interface IDiagram {
  _id: ObjectId;
  projectId: ObjectId;    // Reference to Project
  type: 'user-flow' | 'system-architecture' | 'database-schema' | 
        'api-endpoints' | 'sequence' | 'class' | 'custom';
  content: string;        // Mermaid diagram content (10-50000 chars)
  metadata: IDiagramMetadata; // Diagram metadata
  format: 'mermaid' | 'svg' | 'png' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

interface IDiagramMetadata {
  version: string;        // Semantic version (x.y.z format)
  theme?: string;        // Mermaid theme
  direction?: string;    // Diagram direction (TB, LR, etc.)
  nodeCount?: number;    // Number of nodes (0-500)
  edgeCount?: number;    // Number of edges (0-1000)
  complexity?: 'simple' | 'medium' | 'complex'; // Auto-calculated
}
```

**Indexes:**
- `projectId: 1`
- `type: 1`
- `format: 1`
- `projectId: 1, type: 1, metadata.version: -1`

**Relationships:**
- `projectId` → `projects._id` (Many-to-One)

## Database Design Principles

### 1. Scalability Considerations
- **Indexing Strategy**: Compound indexes for common query patterns
- **Document Size**: Limited embedded arrays to prevent document growth issues
- **Sharding Ready**: ObjectId primary keys and project-based partitioning support

### 2. Data Integrity
- **Referential Integrity**: Foreign key relationships using ObjectId references
- **Validation**: Comprehensive schema validation with custom validators
- **Unique Constraints**: Enforced at both schema and database level

### 3. Performance Optimization
- **Query Patterns**: Indexes designed for common access patterns
- **Pagination Support**: CreatedAt indexes for time-based pagination
- **Aggregation Friendly**: Schema structure supports complex aggregations

### 4. Security Considerations
- **Password Hashing**: Bcrypt with salt rounds of 12
- **Sensitive Data**: Password field excluded from queries by default
- **Data Validation**: Input sanitization and validation at multiple levels

## Migration Strategy

### Initial Setup
1. Create collections with proper indexes
2. Set up validation rules
3. Insert seed data for development/testing

### Future Migrations
- Schema changes will be versioned
- Migration scripts in `/src/migrations/`
- Backward compatibility considerations

## Monitoring and Maintenance

### Performance Monitoring
- Index usage tracking
- Query performance analysis
- Document size monitoring

### Data Maintenance
- Regular index optimization
- Cleanup of orphaned references
- Data archival strategies for completed projects

## Usage Examples

### Common Query Patterns

```javascript
// Get user's projects with latest first
db.projects.find({ ownerId: userId }).sort({ createdAt: -1 });

// Get project with all related data
db.projects.aggregate([
  { $match: { _id: projectId } },
  { $lookup: { from: "saas_ideas", localField: "_id", foreignField: "projectId", as: "idea" } },
  { $lookup: { from: "features", localField: "_id", foreignField: "projectId", as: "features" } }
]);

// Get high-priority tasks for a project
db.tasks.find({ 
  projectId: projectId, 
  priority: { $in: ["high", "critical"] },
  status: { $ne: "done" }
}).sort({ priority: 1, createdAt: 1 });
```

This schema design provides a robust foundation for the SaaS Blueprint Generator Platform, supporting all required features while maintaining flexibility for future enhancements. 