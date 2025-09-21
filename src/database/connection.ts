import { Pool, PoolClient } from 'pg';
import { rdsConfig } from '../config/aws-config';

// Database connection pool
class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    this.pool = new Pool({
      host: rdsConfig.endpoint,
      port: rdsConfig.port,
      database: rdsConfig.database,
      user: rdsConfig.username,
      password: rdsConfig.password,
      ssl: {
        rejectUnauthorized: false, // For AWS RDS
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      // console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Database models and queries
export class UserModel {
  static async create(userData: {
    cognitoUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phoneNumber?: string;
  }) {
    const query = `
      INSERT INTO users (cognito_user_id, email, first_name, last_name, company_name, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      userData.cognitoUserId,
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.companyName,
      userData.phoneNumber,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByCognitoId(cognitoUserId: string) {
    const query = 'SELECT * FROM users WHERE cognito_user_id = $1';
    const result = await db.query(query, [cognitoUserId]);
    return result.rows[0];
  }

  static async findByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async update(userId: string, updateData: any) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [userId, ...values]);
    return result.rows[0];
  }
}

export class DocumentModel {
  static async create(documentData: {
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    s3Key: string;
    s3Bucket: string;
    documentType?: string;
  }) {
    const query = `
      INSERT INTO documents (user_id, file_name, file_size, file_type, s3_key, s3_bucket, document_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      documentData.userId,
      documentData.fileName,
      documentData.fileSize,
      documentData.fileType,
      documentData.s3Key,
      documentData.s3Bucket,
      documentData.documentType,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId: string, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM documents 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async updateProcessingStatus(documentId: string, status: string, extractedText?: string, confidenceScore?: number) {
    const query = `
      UPDATE documents 
      SET processing_status = $2, extracted_text = $3, confidence_score = $4
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [documentId, status, extractedText, confidenceScore]);
    return result.rows[0];
  }
}

export class CategoryModel {
  static async findByUserId(userId: string) {
    const query = `
      SELECT * FROM categories 
      WHERE user_id = $1 OR is_default = true
      ORDER BY is_default DESC, name ASC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async create(categoryData: {
    userId: string;
    name: string;
    description?: string;
    color?: string;
  }) {
    const query = `
      INSERT INTO categories (user_id, name, description, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      categoryData.userId,
      categoryData.name,
      categoryData.description,
      categoryData.color,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

// Initialize database connection on module load
if (import.meta.env.PROD) {
  db.testConnection().catch(console.error);
}