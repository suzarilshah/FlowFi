import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Info, Loader2 } from 'lucide-react';
import { validateAzureConfiguration } from '../config/azure-config';
import { CredentialManager } from '../services/security-service';

interface SecurityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

interface SecurityConfigValidatorProps {
  onConfigurationValid?: () => void;
  showDetails?: boolean;
}

export const SecurityConfigValidator: React.FC<SecurityConfigValidatorProps> = ({ 
  onConfigurationValid,
  showDetails = true 
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);

  const credentialManager = CredentialManager.getInstance();

  const validateConfiguration = async () => {
    setIsValidating(true);
    
    try {
      // Validate Azure configuration
      const azureValidation = validateAzureConfiguration();
      
      // Check for additional security issues
      const issues: SecurityIssue[] = [];
      const warnings: string[] = [];

      // Check environment
      if (import.meta.env.DEV) {
        warnings.push('Application is running in development mode');
        issues.push({
          type: 'warning',
          message: 'Development mode detected',
          recommendation: 'Ensure production deployment uses production environment settings'
        });
      }

      // Check for default credentials
      const azureCreds = credentialManager.getAzureCredentials();
      if (azureCreds.apiKey.includes('your_') || azureCreds.apiKey.includes('dummy')) {
        issues.push({
          type: 'error',
          message: 'Default Azure credentials detected',
          recommendation: 'Replace default credentials with actual Azure service credentials'
        });
      }

      // Check for HTTPS
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
        warnings.push('Application is not using HTTPS');
        issues.push({
          type: 'warning',
          message: 'Insecure protocol detected',
          recommendation: 'Use HTTPS for production deployments to ensure data encryption'
        });
      }

      // Check for encryption key
      if (!import.meta.env.VITE_ENCRYPTION_KEY) {
        issues.push({
          type: 'error',
          message: 'Encryption key not configured',
          recommendation: 'Set VITE_ENCRYPTION_KEY environment variable for secure data handling'
        });
      }

      // Check rate limiting
      if (!import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS) {
        warnings.push('Rate limiting not configured');
        issues.push({
          type: 'info',
          message: 'Rate limiting not configured',
          recommendation: 'Consider implementing rate limiting to prevent abuse'
        });
      }

      // Check CORS configuration
      if (!import.meta.env.VITE_CORS_ORIGIN) {
        warnings.push('CORS configuration not set');
        issues.push({
          type: 'info',
          message: 'CORS origin not configured',
          recommendation: 'Configure VITE_CORS_ORIGIN to restrict cross-origin requests'
        });
      }

      setValidationResult({
        valid: azureValidation.valid && issues.filter(i => i.type === 'error').length === 0,
        errors: [...azureValidation.errors, ...issues.filter(i => i.type === 'error').map(i => i.message)],
        warnings: [...warnings, ...issues.filter(i => i.type === 'warning').map(i => i.message)]
      });

      setSecurityIssues(issues);

      if (azureValidation.valid && issues.filter(i => i.type === 'error').length === 0) {
        onConfigurationValid?.();
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ['Failed to validate security configuration'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateConfiguration();
  }, []);

  const getStatusIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (valid: boolean) => {
    if (valid) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Secure</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Issues Found</Badge>;
  };

  if (!showDetails && validationResult) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium">Security Status</span>
        </div>
        {getStatusBadge(validationResult.valid)}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Configuration Validator</span>
        </CardTitle>
        <CardDescription>
          Validate your security configuration and identify potential security issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationResult && (
          <>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {validationResult.valid ? 'Configuration Valid' : 'Issues Found'}
                </span>
              </div>
              {getStatusBadge(validationResult.valid)}
            </div>

            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {securityIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Security Recommendations</h4>
                {securityIssues.map((issue, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(issue.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{issue.message}</p>
                      <p className="text-xs text-gray-600">{issue.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end">
          <Button
            onClick={validateConfiguration}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-validate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};