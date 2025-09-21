export interface AzureConfig {
  documentIntelligence: {
    endpoint: string;
    apiKey: string;
    region: string;
  };
  storage: {
    connectionString: string;
    accountName: string;
    containerName: string;
  };
}