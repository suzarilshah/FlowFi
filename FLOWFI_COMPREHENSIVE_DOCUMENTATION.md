# FlowFi Comprehensive Documentation

## Table of Contents
1. [Proposal](#1-proposal)
2. [Product Problem Statements](#2-product-problem-statements)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Design](#4-architecture-design)
5. [Implementation Details](#5-implementation-details)
6. [Operational Documentation](#6-operational-documentation)

---

## 1. Proposal

### Overview and Objectives

FlowFi is a comprehensive cloud-based accounting platform designed specifically for Small and Medium Businesses (SMBs) in Malaysia. The platform leverages artificial intelligence and machine learning to automate financial processes, provide predictive analytics, and ensure IFRS compliance for businesses operating in the Malaysian market.

**Primary Objectives:**
- Automate expense categorization using AI-powered document processing
- Provide real-time cash flow predictions and budget recommendations
- Streamline customer payment tracking and collection processes
- Generate IFRS-compliant financial reports automatically
- Offer natural language financial insights through AI chat interface
- Integrate with existing business systems and banking APIs

### Business Value Proposition

**For Business Owners:**
- **Time Savings**: Reduce manual accounting work by 70% through AI automation
- **Better Decision Making**: Access real-time financial insights and predictive analytics
- **Compliance Assurance**: Automatic IFRS compliance and Malaysian tax regulation adherence
- **Cost Reduction**: Minimize accounting software licensing and manual processing costs
- **Scalability**: Platform grows with business needs without infrastructure investment

**For Accountants:**
- **Efficiency**: Streamlined workflow with AI-assisted categorization and approval processes
- **Accuracy**: Reduced human error through automated data extraction and validation
- **Client Management**: Better client communication through automated reporting and insights
- **Professional Development**: Access to cutting-edge AI tools and financial analytics

**For Financial Institutions:**
- **Risk Assessment**: Better credit risk evaluation through comprehensive financial data
- **Customer Retention**: Value-added services for business banking customers
- **Regulatory Compliance**: Standardized financial reporting for loan applications

### Key Stakeholders

| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| Business Owners | Primary Users | High functionality, ease of use | High |
| Accountants | Professional Users | Advanced features, compliance | High |
| Bank Partners | Integration Partners | Data accuracy, security | Medium |
| Regulatory Bodies | Compliance Authorities | IFRS adherence, data privacy | High |
| IT Administrators | Technical Users | System reliability, security | Medium |
| End Users (Employees) | Secondary Users | Simple interface, mobile access | Low |

### Success Metrics

**Business Metrics:**
- Monthly Active Users (MAU): Target 1,000+ SMBs within 12 months
- User Retention Rate: >85% monthly retention
- Average Time Savings: 15 hours per month per business
- Customer Acquisition Cost: <$200 per customer
- Monthly Recurring Revenue (MRR): $50,000 by month 12

**Technical Metrics:**
- System Uptime: 99.9% availability
- Response Time: <2 seconds for standard operations
- AI Accuracy: >95% for expense categorization
- Data Processing Speed: <5 seconds per document
- Security Incidents: Zero breaches

**Operational Metrics:**
- Support Ticket Resolution: <24 hours average
- Feature Request Implementation: <30 days for high priority
- Compliance Audit Pass Rate: 100%
- User Satisfaction Score: >4.5/5.0

---

## 2. Product Problem Statements

### Detailed Description of Problems Addressed

**Problem 1: Manual Expense Categorization Inefficiency**
SMBs spend an average of 8-12 hours per week manually categorizing expenses, leading to:
- Human error in categorization (15-20% error rate)
- Delayed financial reporting and decision-making
- Increased accounting costs and resource allocation
- Compliance risks due to miscategorization

**Problem 2: Poor Cash Flow Visibility**
Businesses lack real-time insights into cash flow patterns, resulting in:
- Unexpected cash shortages and liquidity crises
- Missed investment opportunities due to conservative cash management
- Poor payment timing decisions affecting vendor relationships
- Inability to plan for seasonal business fluctuations

**Problem 3: Inefficient Customer Payment Collection**
Manual payment tracking leads to:
- Delayed payment collections (average 45+ days overdue)
- Lost revenue due to poor follow-up processes
- Damaged customer relationships from inconsistent communication
- High administrative costs for collection management

**Problem 4: Compliance and Reporting Complexity**
Malaysian businesses struggle with:
- Complex IFRS compliance requirements
- Time-consuming manual report generation
- Risk of regulatory penalties for non-compliance
- Difficulty adapting to changing tax regulations

**Problem 5: Fragmented Financial Systems**
Businesses use multiple disconnected tools, causing:
- Data silos and inconsistent information across systems
- Manual data reconciliation and duplication
- Limited comprehensive financial analysis
- Increased IT complexity and maintenance costs

### User Pain Points

**Business Owner Pain Points:**
- "I spend too much time on bookkeeping instead of growing my business"
- "I never know if I have enough cash for next month's expenses"
- "My accountant takes weeks to prepare monthly reports"
- "I'm always surprised by tax bills and compliance requirements"
- "I can't get a clear picture of my business financial health"

**Accountant Pain Points:**
- "Manual data entry from receipts is time-consuming and error-prone"
- "Clients don't provide organized financial records"
- "Generating compliance reports is complex and repetitive"
- "I need better tools to provide strategic financial advice"
- "Keeping up with regulatory changes is challenging"

**Employee Pain Points:**
- "Expense reporting is complicated and slow"
- "I lose receipts before I can submit them"
- "I don't know if my expenses were approved"
- "The expense system is not mobile-friendly"

### Market Gap Analysis

**Current Market Solutions:**
1. **Traditional Accounting Software** (QuickBooks, Xero)
   - Limited AI automation capabilities
   - Generic categorization not specific to Malaysian businesses
   - Basic reporting without predictive analytics

2. **Manual Accounting Services**
   - High labor costs and human error
   - Slow turnaround times
   - Limited scalability

3. **Generic Expense Management Tools**
   - Lack of IFRS compliance features
   - No integration with Malaysian banking systems
   - Missing local tax regulation support

**FlowFi Competitive Advantages:**
- **AI-Powered Automation**: Advanced machine learning for expense categorization
- **Local Compliance**: Built-in Malaysian IFRS and tax compliance
- **Predictive Analytics**: Cash flow forecasting and business insights
- **Integrated Platform**: Single solution for all accounting needs
- **Mobile-First Design**: Optimized for mobile expense capture
- **Natural Language Interface**: AI chat for financial queries

**Market Opportunity:**
- Malaysian SMB market: 900,000+ businesses
- Total Addressable Market (TAM): $450M annually
- Serviceable Addressable Market (SAM): $150M annually
- Expected market growth: 15% CAGR through 2028

---

## 3. Technology Stack

### Complete List of Technologies Used

#### Frontend Technologies

**Core Framework:**
- React 18.3.1 - Modern UI library for building user interfaces
- TypeScript 5.6.2 - Type-safe JavaScript for better code quality
- Vite 5.4.10 - Fast build tool and development server

**UI Components & Styling:**
- ShadCN UI - Modern, accessible component library
- Radix UI Components - Headless UI primitives for accessibility
- Tailwind CSS 3.4.14 - Utility-first CSS framework
- Lucide React 0.511.0 - Icon library with consistent design

**State Management & Data Fetching:**
- Zustand 5.0.8 - Lightweight state management
- React Hook Form 7.63.0 - Performant form handling
- TanStack Query 5.28.6 - Data synchronization and caching
- TanStack Table 8.15.3 - Advanced data table functionality

**Routing & Navigation:**
- React Router DOM 7.3.0 - Client-side routing

#### Backend Technologies

**AWS Services:**
- AWS Lambda - Serverless compute functions
- AWS API Gateway - API management and routing
- Amazon RDS PostgreSQL - Relational database service
- Amazon S3 - Object storage for documents and files
- Amazon Textract - Document text extraction and OCR
- Amazon Bedrock - AI/ML model hosting (Claude/GPT)
- Amazon Cognito - User authentication and authorization
- Amazon SES - Email service for notifications
- Amazon EventBridge - Event-driven architecture
- Amazon CloudWatch - Monitoring and logging
- AWS CDK 2.215.0 - Infrastructure as Code

**Azure Services:**
- Azure Document Intelligence - Advanced document processing
- Azure Blob Storage - Alternative cloud storage
- Azure Functions - Serverless compute (backup processing)

#### Development & Build Tools

**Development Environment:**
- Node.js 18+ - JavaScript runtime
- ESLint 9.13.0 - Code linting and quality
- TypeScript ESLint - TypeScript-specific linting
- Playwright 1.55.0 - End-to-end testing framework

**Build & Deployment:**
- AWS CDK - Infrastructure deployment
- Docker - Containerization (for local development)
- GitHub Actions - CI/CD pipeline

#### Third-Party Integrations

**Document Processing:**
- jsPDF 3.0.3 - PDF generation for reports
- React Dropzone 14.3.8 - File upload handling

**Data Visualization:**
- Recharts 2.12.2 - Chart and graph components

**Utilities:**
- Axios 1.12.2 - HTTP client for API calls
- Date-fns 3.6.0 - Date manipulation and formatting
- UUID 13.0.0 - Unique identifier generation
- Zod 3.25.76 - Schema validation and type safety

### Version Numbers and Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "~5.6.2",
    "vite": "^5.4.10",
    "@aws-sdk/client-s3": "^3.893.0",
    "@aws-sdk/client-lambda": "^3.893.0",
    "@aws-sdk/client-bedrock-runtime": "^3.893.0",
    "@azure/ai-form-recognizer": "^5.1.0",
    "tailwindcss": "^3.4.14",
    "zustand": "^5.0.8",
    "react-hook-form": "^7.63.0",
    "@tanstack/react-query": "^5.28.6"
  }
}
```

### Justification for Technology Choices

**React + TypeScript:**
- Industry-standard frontend framework with excellent ecosystem
- Type safety reduces bugs and improves developer productivity
- Large talent pool and extensive community support
- Component-based architecture enables code reuse

**AWS Cloud Services:**
- Market leader in cloud services with proven reliability
- Comprehensive service portfolio for all platform needs
- Strong security and compliance certifications
- Pay-as-you-go pricing model aligns with business growth
- Regional presence in Southeast Asia for low latency

**PostgreSQL:**
- ACID compliance for financial data integrity
- Advanced querying capabilities for complex financial reports
- JSON support for flexible document storage
- Strong performance and scalability characteristics
- Excellent support for Malaysian localization

**ShadCN UI + Tailwind CSS:**
- Modern, accessible design system out of the box
- Rapid development with pre-built components
- Consistent design language across the platform
- Easy customization for brand requirements

**Zustand for State Management:**
- Lightweight and performant compared to Redux
- Simple API reduces learning curve
- TypeScript-first design
- Minimal boilerplate code

**Serverless Architecture:**
- Automatic scaling based on demand
- Reduced operational overhead
- Cost-effective for variable workloads
- Faster time-to-market for new features

### Third-Party Services/Integrations

**Document Processing:**
- **Amazon Textract**: Advanced OCR and document analysis
- **Azure Document Intelligence**: Backup document processing service
- **jsPDF**: Client-side PDF generation for reports

**AI/ML Services:**
- **Amazon Bedrock**: Access to Claude and GPT models for AI chat
- **AWS Comprehend**: Natural language processing for expense categorization

**Communication:**
- **Amazon SES**: Transactional email for notifications and reports
- **Amazon SNS**: Push notifications for mobile devices

**Financial Services:**
- **Malaysian Banking APIs**: Integration with local banks for transaction import
- **IRB Malaysia API**: Tax filing and compliance integration (planned)

**Development Tools:**
- **GitHub**: Code repository and CI/CD pipeline
- **Playwright**: Automated testing for quality assurance
- **ESLint**: Code quality and consistency enforcement

---

## 4. Architecture Design

### System Architecture Diagrams

#### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser] --> B[React SPA]
        C[Mobile App] --> B
    end
    
    subgraph "CDN Layer"
        D[CloudFront CDN]
    end
    
    subgraph "API Layer"
        E[API Gateway]
        F[WAF - Web Application Firewall]
    end
    
    subgraph "Compute Layer"
        G[Lambda Functions]
        H[Step Functions]
        I[EventBridge]
    end
    
    subgraph "Data Layer"
        J[RDS PostgreSQL]
        K[S3 Buckets]
        L[DynamoDB]
    end
    
    subgraph "AI/ML Services"
        M[Bedrock AI Models]
        N[Textract OCR]
        O[Comprehend NLP]
    end
    
    subgraph "Security Layer"
        P[Cognito Auth]
        Q[Secrets Manager]
        R[IAM Roles]
    end
    
    subgraph "Monitoring"
        S[CloudWatch]
        T[X-Ray Tracing]
        U[CloudTrail]
    end
    
    B --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
    G --> N
    G --> O
    G --> P
    G --> Q
    H --> G
    I --> G
    G --> S
    G --> T
    G --> U
```

#### Detailed Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        A1[Dashboard Component]
        A2[Expense Upload]
        A3[AI Chat Interface]
        A4[Report Generator]
        A5[Admin Panel]
    end
    
    subgraph "API Gateway Routes"
        B1[/api/auth/*]
        B2[/api/expenses/*]
        B3[/api/reports/*]
        B4[/api/chat/*]
        B5[/api/admin/*]
    end
    
    subgraph "Lambda Functions"
        C1[Auth Service]
        C2[Document Processor]
        C3[AI Categorizer]
        C4[Report Generator]
        C5[Chat Service]
        C6[Notification Service]
    end
    
    subgraph "Data Storage"
        D1[(PostgreSQL DB)]
        D2[(S3 Documents)]
        D3[(DynamoDB Cache)]
    end
    
    subgraph "External Services"
        E1[Bedrock AI]
        E2[Textract OCR]
        E3[SES Email]
        E4[Bank APIs]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
    A5 --> B5
    
    B1 --> C1
    B2 --> C2
    B2 --> C3
    B3 --> C4
    B4 --> C5
    B5 --> C6
    
    C1 --> D1
    C2 --> D2
    C2 --> E2
    C3 --> D1
    C3 --> E1
    C4 --> D1
    C5 --> E1
    C6 --> E3
    
    C4 --> D3
```

### Component Interactions

#### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant APIGateway
    participant Cognito
    participant Lambda
    participant Database
    
    User->>Frontend: Login Request
    Frontend->>APIGateway: POST /api/auth/login
    APIGateway->>Cognito: Validate Credentials
    Cognito->>APIGateway: JWT Token
    APIGateway->>Lambda: Process Login
    Lambda->>Database: Store Session
    Lambda->>APIGateway: User Data + Token
    APIGateway->>Frontend: Authentication Response
    Frontend->>User: Dashboard Access
```

#### Document Processing Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant S3
    participant Lambda
    participant Textract
    participant Bedrock
    participant Database
    
    User->>Frontend: Upload Document
    Frontend->>S3: Store Document
    S3->>Lambda: Trigger Processing
    Lambda->>Textract: Extract Text
    Textract->>Lambda: Extracted Data
    Lambda->>Bedrock: Categorize Expense
    Bedrock->>Lambda: Category + Confidence
    Lambda->>Database: Store Results
    Lambda->>Frontend: Processing Complete
    Frontend->>User: Show Categorization
```

### Data Flow Diagrams

#### Expense Data Flow
```mermaid
graph TD
    A[User Upload] --> B[Document Validation]
    B --> C[S3 Storage]
    C --> D[OCR Processing]
    D --> E[Text Extraction]
    E --> F[AI Categorization]
    F --> G[Confidence Scoring]
    G --> H{Confidence > 80%?}
    H -->|Yes| I[Auto-Approve]
    H -->|No| J[Human Review]
    I --> K[Database Storage]
    J --> L[Approval Workflow]
    L --> K
    K --> M[Financial Reports]
    M --> N[Compliance Export]
```

#### Cash Flow Prediction Data Flow
```mermaid
graph TD
    A[Historical Data] --> B[Data Cleaning]
    B --> C[Feature Engineering]
    C --> D[ML Model Training]
    D --> E[Model Validation]
    E --> F{Accuracy > 85%?}
    F -->|Yes| G[Deploy Model]
    F -->|No| H[Retrain Model]
    H --> C
    G --> I[Real-time Predictions]
    I --> J[Business Rules]
    J --> K[Recommendation Engine]
    K --> L[User Dashboard]
    L --> M[Actionable Insights]
```

### Scalability Considerations

#### Horizontal Scaling Strategy
- **Lambda Functions**: Automatic scaling based on request volume (up to 10,000 concurrent executions)
- **API Gateway**: Built-in throttling and rate limiting with burst capacity
- **RDS PostgreSQL**: Read replicas for read-heavy operations, Aurora Serverless for variable workloads
- **S3 Storage**: Unlimited scalability with multi-region replication
- **CloudFront CDN**: Global edge locations for reduced latency

#### Performance Optimization
- **Caching Strategy**: Multi-layer caching with CloudFront, ElastiCache, and DynamoDB
- **Database Optimization**: Indexed queries, connection pooling, query optimization
- **Asynchronous Processing**: Event-driven architecture with SQS and EventBridge
- **Content Compression**: Gzip compression for API responses and static assets

#### Load Balancing
- **Geographic Distribution**: Multi-AZ deployment across Southeast Asia regions
- **Auto-scaling Groups**: Dynamic resource allocation based on demand
- **Circuit Breakers**: Prevent cascade failures in microservices architecture
- **Health Checks**: Automated failover and service recovery

### Security Architecture

#### Defense in Depth Strategy
```mermaid
graph TD
    A[User Request] --> B[CloudFront WAF]
    B --> C[Rate Limiting]
    C --> D[API Gateway Auth]
    D --> E[JWT Validation]
    E --> F[Lambda Execution]
    F --> G[Database Access]
    G --> H[Encryption at Rest]
    
    I[Admin Request] --> J[VPN/VPC]
    J --> K[Bastion Host]
    K --> L[Private Subnet]
    L --> M[RDS Instance]
    M --> N[Backup Encryption]
    
    O[Data Flow] --> P[TLS 1.3]
    P --> Q[Certificate Pinning]
    Q --> R[Secrets Manager]
    R --> S[Key Rotation]
```

#### Security Controls

**Network Security:**
- VPC with private subnets for database tier
- Security groups with least-privilege access
- Network ACLs for additional layer of protection
- AWS WAF for application-layer protection

**Data Security:**
- AES-256 encryption at rest for all data stores
- TLS 1.3 for data in transit
- Field-level encryption for sensitive financial data
- Automated key rotation using AWS KMS

**Access Control:**
- Multi-factor authentication for all user accounts
- Role-based access control (RBAC) with fine-grained permissions
- Single Sign-On (SSO) integration with corporate identity providers
- Session management with secure token handling

**Compliance & Auditing:**
- PCI DSS compliance for payment card data
- GDPR compliance for data privacy
- SOC 2 Type II certification for security controls
- Comprehensive audit logging with CloudTrail

**Monitoring & Alerting:**
- Real-time security event monitoring
- Automated threat detection with GuardDuty
- Vulnerability scanning and patch management
- Incident response procedures and playbooks

---

## 5. Implementation Details

### Current Feature Set

#### Core Features (Implemented)

**1. User Authentication & Management**
- Multi-role authentication system (Business Owner, Accountant, Employee, Admin)
- JWT-based authentication with refresh tokens
- Password reset and email verification workflows
- Role-based access control with granular permissions
- Multi-factor authentication support

**2. Document Upload & Processing**
- Drag-and-drop file upload interface
- Support for PDF, JPG, PNG formats
- Automatic document preprocessing and optimization
- Integration with AWS Textract for OCR
- Azure Document Intelligence as backup processing

**3. AI-Powered Expense Categorization**
- Automatic expense categorization using machine learning
- Confidence scoring for categorization accuracy
- Support for Malaysian IFRS categories
- Human review workflow for low-confidence items
- Bulk approval and rejection capabilities

**4. Financial Dashboard**
- Real-time financial overview with key metrics
- Cash flow visualization and trend analysis
- Expense breakdown by category and time period
- Pending approvals and action items
- Customizable widget layout

**5. Inventory Management**
- Stock level tracking and management
- Obsolete inventory identification
- Reorder level configuration
- Automated reorder alerts
- Product lifecycle management

**6. Customer Payment Tracking**
- Payment collection monitoring
- Aging reports and overdue analysis
- Automated reminder system
- Customer payment behavior analysis
- Payment trend visualization

**7. AI Chat Interface**
- Natural language financial queries
- Integration with Claude/GPT models via AWS Bedrock
- Context-aware responses using business data
- Report generation through chat commands
- Multi-language support (English, Malay, Chinese)

**8. Financial Reporting**
- IFRS-compliant financial statements
- Custom report builder with drag-drop interface
- Export to PDF and Excel formats
- Automated report scheduling
- Comparative analysis across periods

#### Features in Development

**1. Bank Integration**
- Direct bank feed integration for Malaysian banks
- Automated transaction import and reconciliation
- Real-time account balance updates
- Multi-currency support

**2. Mobile Application**
- Native iOS and Android applications
- Offline expense capture and sync
- Push notifications for approvals
- Camera-based receipt scanning

**3. Advanced Analytics**
- Predictive cash flow modeling
- Customer churn prediction
- Inventory optimization recommendations
- Revenue forecasting

### API Documentation

#### Authentication APIs

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "business_owner",
      "businessId": "biz_789012"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Smith",
  "businessName": "ABC Sdn Bhd",
  "businessRegistration": "12345678-K",
  "phone": "+60123456789"
}
```

#### Expense Management APIs

**Upload Document**
```http
POST /api/expenses/upload
Content-Type: multipart/form-data
Authorization: Bearer {accessToken}

Form Data:
- file: [Binary file data]
- metadata: {
    "vendor": "Supplier Name",
    "amount": 1250.00,
    "date": "2024-01-15",
    "description": "Office supplies"
  }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload_abc123",
    "filename": "receipt_20240115.pdf",
    "status": "processing",
    "extractedText": "Office supplies purchase...",
    "suggestedCategory": {
      "id": "cat_office",
      "name": "Office Expenses",
      "confidence": 0.92
    }
  }
}
```

**Get Expenses**
```http
GET /api/expenses?status=pending&page=1&limit=20
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "exp_123",
        "uploadId": "upload_abc123",
        "amount": 1250.00,
        "category": "Office Expenses",
        "vendor": "Supplier Name",
        "date": "2024-01-15",
        "status": "pending_approval",
        "confidence": 0.92,
        "extractedData": {
          "text": "Office supplies purchase...",
          "items": [
            {"description": "Paper", "quantity": 10, "price": 50.00},
            {"description": "Ink", "quantity": 5, "price": 200.00}
          ]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

**Approve Expense**
```http
PUT /api/expenses/approve/{expenseId}
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "approved": true,
  "category": "cat_office",
  "notes": "Approved for office supplies"
}
```

#### Financial Reporting APIs

**Generate Report**
```http
POST /api/reports/generate
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "type": "profit_loss",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "format": "pdf",
  "includeComparatives": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "rpt_456",
    "status": "generating",
    "estimatedCompletion": "2024-01-20T10:30:00Z",
    "downloadUrl": "https://flowfi-reports.s3.amazonaws.com/..."
  }
}
```

#### AI Chat APIs

**Send Query**
```http
POST /api/chat/query
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "message": "What was my total office expenses last month?",
  "context": {
    "businessId": "biz_789012",
    "preferredLanguage": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Your total office expenses for December 2024 were RM 3,450. This is 15% higher than November 2024.",
    "data": {
      "total": 3450.00,
      "currency": "MYR",
      "period": "December 2024",
      "comparison": {
        "previousPeriod": "November 2024",
        "previousAmount": 3000.00,
        "change": 450.00,
        "changePercent": 15
      }
    },
    "visualizations": [
      {
        "type": "bar_chart",
        "title": "Office Expenses Trend",
        "data": [
          {"month": "Oct", "amount": 2800},
          {"month": "Nov", "amount": 3000},
          {"month": "Dec", "amount": 3450}
        ]
      }
    ]
  }
}
```

### Deployment Architecture

#### Infrastructure as Code (IaC)

**AWS CDK Stack Structure:**
```typescript
// infrastructure/flowfi-stack.ts
export class FlowFiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC and Networking
    const vpc = new ec2.Vpc(this, 'FlowFiVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Database
    const database = new rds.DatabaseInstance(this, 'FlowFiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromGeneratedSecret('flowfi_admin'),
      databaseName: 'flowfi',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      encryptionKey: new kms.Key(this, 'DatabaseKey'),
    });

    // S3 Buckets
    const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'Delete old versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'Move to Glacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Lambda Functions
    const documentProcessorLambda = new lambda.Function(this, 'DocumentProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/document-processor'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        DATABASE_SECRET_ARN: database.secret!.secretArn,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'FlowFiAPI', {
      restApiName: 'FlowFi API',
      description: 'FlowFi Accounting Platform API',
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://app.flowfi.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date'],
      },
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'FlowFiUserPool', {
      userPoolName: 'flowfi-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
```

#### Deployment Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run Playwright tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1
      - name: Deploy infrastructure
        run: |
          cd aws/infrastructure
          npm ci
          npm run deploy
      - name: Deploy frontend
        run: |
          npm run build
          aws s3 sync dist/ s3://flowfi-frontend-bucket --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### Environment Configurations

#### Development Environment
```bash
# Development Environment Variables
NODE_ENV=development
API_BASE_URL=http://localhost:3000
AWS_REGION=ap-southeast-1
AWS_PROFILE=flowfi-dev

# Database
DATABASE_URL=postgresql://flowfi:dev_password@localhost:5432/flowfi_dev

# AWS Services (LocalStack for development)
AWS_ENDPOINT_URL=http://localhost:4566
S3_BUCKET_NAME=flowfi-documents-dev
LAMBDA_ENDPOINT=http://localhost:3001

# Feature Flags
ENABLE_AI_CATEGORIZATION=true
ENABLE_BANK_INTEGRATION=false
ENABLE_MOBILE_SYNC=false
```

#### Staging Environment
```bash
# Staging Environment Variables
NODE_ENV=staging
API_BASE_URL=https://api-staging.flowfi.com
AWS_REGION=ap-southeast-1
AWS_PROFILE=flowfi-staging

# Database
DATABASE_URL=postgresql://flowfi:staging_password@staging-db.flowfi.com:5432/flowfi_staging

# AWS Services
S3_BUCKET_NAME=flowfi-documents-staging
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# Feature Flags
ENABLE_AI_CATEGORIZATION=true
ENABLE_BANK_INTEGRATION=true
ENABLE_MOBILE_SYNC=true
```

#### Production Environment
```bash
# Production Environment Variables
NODE_ENV=production
API_BASE_URL=https://api.flowfi.com
AWS_REGION=ap-southeast-1
AWS_PROFILE=flowfi-prod

# Database (RDS)
DATABASE_URL=postgresql://flowfi:prod_password@prod-db.flowfi.com:5432/flowfi_prod

# AWS Services
S3_BUCKET_NAME=flowfi-documents-prod
CLOUDFRONT_DISTRIBUTION_ID=E0987654321XYZ

# Security
JWT_SECRET=super-secret-jwt-key
ENCRYPTION_KEY=32-character-encryption-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_AI_CATEGORIZATION=true
ENABLE_BANK_INTEGRATION=true
ENABLE_MOBILE_SYNC=true
ENABLE_ADVANCED_ANALYTICS=true
```

---

## 6. Operational Documentation

### Setup and Installation Instructions

#### Prerequisites
- Node.js 18.x or higher
- npm 8.x or higher
- AWS CLI configured with appropriate credentials
- PostgreSQL 15.x (for local development)
- Git for version control

#### Local Development Setup

**1. Clone the Repository**
```bash
git clone https://github.com/flowfi/flowfi-platform.git
cd flowfi-platform
```

**2. Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install AWS CDK dependencies
cd aws/infrastructure
npm install
cd ../..
```

**3. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

**4. Database Setup**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create development database
createdb flowfi_dev

# Run database migrations
psql -d flowfi_dev -f src/database/init.sql
```

**5. AWS Services Setup (Optional - for full functionality)**
```bash
# Install LocalStack for local AWS services
pip install localstack
localstack start

# Configure AWS credentials
aws configure --profile flowfi-dev
```

**6. Start Development Servers**
```bash
# Start frontend development server
npm run dev

# Start backend API (in separate terminal)
npm run dev:api

# Start LocalStack (if using local AWS services)
localstack start
```

#### Production Deployment

**1. AWS Infrastructure Deployment**
```bash
# Configure AWS credentials
aws configure --profile flowfi-prod

# Deploy infrastructure using CDK
cd aws/infrastructure
npm run deploy

# Verify deployment
npm run deploy:status
```

**2. Application Deployment**
```bash
# Build production frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://flowfi-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

**3. Database Migration**
```bash
# Backup existing database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Run production migrations
npm run db:migrate:prod
```

### Maintenance Procedures

#### Daily Maintenance
- **Log Review**: Check CloudWatch logs for errors and warnings
- **Performance Monitoring**: Review API response times and error rates
- **Backup Verification**: Confirm automated backups completed successfully
- **Security Monitoring**: Check GuardDuty findings and security alerts

#### Weekly Maintenance
- **Database Maintenance**: Run VACUUM and ANALYZE on PostgreSQL
- **Cache Cleanup**: Clear expired cache entries in DynamoDB
- **Certificate Renewal**: Check SSL certificate expiration dates
- **Cost Review**: Analyze AWS billing and optimize resource usage

#### Monthly Maintenance
- **Security Updates**: Apply security patches to Lambda functions
- **Dependency Updates**: Update npm packages and check for vulnerabilities
- **Performance Optimization**: Review and optimize slow database queries
- **Disaster Recovery Test**: Test backup restoration procedures

#### Quarterly Maintenance
- **Compliance Audit**: Review compliance with IFRS and Malaysian regulations
- **Penetration Testing**: Conduct security penetration testing
- **Architecture Review**: Evaluate system architecture for improvements
- **Capacity Planning**: Forecast resource needs for next quarter

### Troubleshooting Guide

#### Common Issues and Solutions

**1. Document Upload Failures**
```
Problem: Users cannot upload documents
Symptoms: 413 Request Entity Too Large, upload timeouts
Solution:
- Check S3 bucket permissions
- Verify API Gateway payload size limits (increase to 10MB)
- Check Lambda function timeout (increase to 5 minutes)
- Verify file format support in frontend validation
```

**2. AI Categorization Errors**
```
Problem: Expenses not being categorized correctly
Symptoms: High error rate, low confidence scores
Solution:
- Check Bedrock model endpoint availability
- Verify Textract text extraction quality
- Review training data for categorization model
- Check for API rate limiting on AI services
```

**3. Database Connection Issues**
```
Problem: Application cannot connect to database
Symptoms: Connection timeout, authentication failures
Solution:
- Verify RDS instance is running
- Check security group rules for database access
- Verify database credentials in Secrets Manager
- Test connection from Lambda function subnet
```

**4. Authentication Problems**
```
Problem: Users cannot log in or access features
Symptoms: 401 Unauthorized, token validation errors
Solution:
- Check Cognito user pool configuration
- Verify JWT token expiration settings
- Check IAM roles and permissions
- Verify API Gateway authorizer configuration
```

**5. Performance Issues**
```
Problem: Slow API response times
Symptoms: Requests taking >5 seconds, timeouts
Solution:
- Check Lambda function cold start times
- Optimize database queries with proper indexing
- Implement caching with ElastiCache
- Use CloudFront for static asset delivery
```

#### Log Analysis Commands

**CloudWatch Logs:**
```bash
# Search for errors in Lambda functions
aws logs filter-log-events --log-group-name /aws/lambda/flowfi-document-processor --filter-pattern "ERROR"

# Check API Gateway access logs
aws logs filter-log-events --log-group-name /aws/apigateway/flowfi-api --filter-pattern "4XX"

# Monitor database slow queries
aws logs filter-log-events --log-group-name /aws/rds/instance/flowfi-db --filter-pattern "duration"
```

**Performance Monitoring:**
```bash
# Check Lambda performance metrics
aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration --dimensions Name=FunctionName,Value=flowfi-document-processor

# Monitor API Gateway latency
aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name Latency --dimensions Name=ApiName,Value=flowfi-api
```

### Known Issues and Limitations

#### Current Known Issues

**1. Mobile Upload Performance**
- **Issue**: Large file uploads from mobile devices may timeout
- **Workaround**: Implement chunked upload for files >5MB
- **Status**: In development, ETA Q2 2024

**2. Multi-Currency Support**
- **Issue**: Platform currently supports MYR only
- **Workaround**: Manual currency conversion required
- **Status**: Planned for Q3 2024

**3. Bank Integration Delays**
- **Issue**: Some Malaysian bank APIs have rate limiting
- **Workaround**: Implement exponential backoff and queuing
- **Status**: Partially resolved, monitoring ongoing

**4. AI Model Accuracy**
- **Issue**: Categorization accuracy drops for uncommon expense types
- **Workaround**: Manual review required for low-confidence items
- **Status**: Continuous model improvement in progress

#### System Limitations

**1. File Size Restrictions**
- Maximum document size: 10MB
- Maximum batch upload: 50 files
- Supported formats: PDF, JPG, PNG only

**2. Concurrent User Limits**
- Maximum concurrent API requests: 1000 per minute
- Maximum file processing: 100 concurrent jobs
- Database connection pool: 100 connections

**3. Data Retention Policies**
- Active data retained indefinitely
- Deleted data retained for 30 days
- Audit logs retained for 7 years
- Backup retention: 30 days

**4. Geographic Limitations**
- Currently optimized for Malaysian businesses
- IFRS categories specific to Malaysia
- Tax compliance for Malaysia only
- Support for Malaysian banks only

#### Performance Limitations

**1. Response Time Expectations**
- Simple queries: <500ms
- Complex reports: <5 seconds
- Document processing: <30 seconds
- AI categorization: <10 seconds

**2. Scalability Constraints**
- Maximum database size: 16TB (RDS limit)
- Maximum S3 objects: Unlimited
- Maximum Lambda execution: 15 minutes
- Maximum API Gateway timeout: 30 seconds

**3. Availability Targets**
- Target uptime: 99.9%
- Planned maintenance window: 4 hours/month
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 1 hour

---

## Conclusion

FlowFi represents a comprehensive solution for Malaysian SMBs seeking to modernize their accounting processes through AI-powered automation. The platform addresses critical pain points in expense management, cash flow prediction, and regulatory compliance while providing an intuitive user experience.

The architecture leverages modern cloud technologies to ensure scalability, security, and reliability, while the modular design allows for continuous improvement and feature expansion. With strong foundations in place, FlowFi is positioned to become the leading accounting platform for Malaysian businesses.

For technical support or additional documentation, please contact the FlowFi development team or refer to the online documentation portal.