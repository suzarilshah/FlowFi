const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const rdsDataService = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
    console.log('Report Generator triggered:', JSON.stringify(event, null, 2));
    
    try {
        let reportType = 'monthly';
        let startDate = new Date();
        let endDate = new Date();
        
        // Handle different event sources
        if (event.httpMethod) {
            // API Gateway event
            const body = JSON.parse(event.body || '{}');
            reportType = body.reportType || 'monthly';
            startDate = body.startDate ? new Date(body.startDate) : new Date();
            endDate = body.endDate ? new Date(body.endDate) : new Date();
        } else if (event.reportType) {
            // Direct invocation
            reportType = event.reportType;
            startDate = event.startDate ? new Date(event.startDate) : new Date();
            endDate = event.endDate ? new Date(event.endDate) : new Date();
        }
        
        // Set default date ranges based on report type
        if (reportType === 'monthly') {
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        } else if (reportType === 'quarterly') {
            const quarter = Math.floor(startDate.getMonth() / 3);
            startDate = new Date(startDate.getFullYear(), quarter * 3, 1);
            endDate = new Date(startDate.getFullYear(), quarter * 3 + 3, 0);
        } else if (reportType === 'yearly') {
            startDate = new Date(startDate.getFullYear(), 0, 1);
            endDate = new Date(startDate.getFullYear(), 11, 31);
        }
        
        console.log(`Generating ${reportType} report from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // Mock data for demonstration (in real implementation, this would query RDS)
        const mockExpenseData = [
            {
                id: 1,
                category: 'Office Supplies',
                amount: 245.67,
                date: '2024-01-15',
                description: 'Office supplies purchase',
                vendor: 'Office Depot'
            },
            {
                id: 2,
                category: 'Travel',
                amount: 1250.00,
                date: '2024-01-20',
                description: 'Business trip to client',
                vendor: 'Delta Airlines'
            },
            {
                id: 3,
                category: 'Meals & Entertainment',
                amount: 89.45,
                date: '2024-01-22',
                description: 'Client dinner',
                vendor: 'Restaurant ABC'
            },
            {
                id: 4,
                category: 'Software',
                amount: 299.99,
                date: '2024-01-25',
                description: 'Software license renewal',
                vendor: 'Adobe'
            },
            {
                id: 5,
                category: 'Professional Services',
                amount: 500.00,
                date: '2024-01-28',
                description: 'Legal consultation',
                vendor: 'Law Firm XYZ'
            }
        ];
        
        // Filter data by date range
        const filteredData = mockExpenseData.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
        
        // Generate report summary
        const categoryTotals = {};
        let totalAmount = 0;
        
        filteredData.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
            totalAmount += expense.amount;
        });
        
        const report = {
            reportType,
            period: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            },
            summary: {
                totalExpenses: totalAmount,
                totalTransactions: filteredData.length,
                averageTransaction: filteredData.length > 0 ? totalAmount / filteredData.length : 0,
                categoryBreakdown: categoryTotals
            },
            expenses: filteredData,
            generatedAt: new Date().toISOString(),
            metadata: {
                currency: 'MYR',
                reportId: `report-${Date.now()}`,
                version: '1.0'
            }
        };
        
        // Generate CSV format for download
        const csvHeader = 'Date,Category,Amount,Description,Vendor\n';
        const csvRows = filteredData.map(expense => 
            `${expense.date},"${expense.category}",${expense.amount},"${expense.description}","${expense.vendor}"`
        ).join('\n');
        const csvContent = csvHeader + csvRows;
        
        // Store report in S3
        const reportKey = `reports/${reportType}/${report.metadata.reportId}.json`;
        const csvKey = `reports/${reportType}/${report.metadata.reportId}.csv`;
        
        if (process.env.BACKUPS_BUCKET) {
            await Promise.all([
                s3.putObject({
                    Bucket: process.env.BACKUPS_BUCKET,
                    Key: reportKey,
                    Body: JSON.stringify(report, null, 2),
                    ContentType: 'application/json'
                }).promise(),
                s3.putObject({
                    Bucket: process.env.BACKUPS_BUCKET,
                    Key: csvKey,
                    Body: csvContent,
                    ContentType: 'text/csv'
                }).promise()
            ]);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                message: 'Report generated successfully',
                data: {
                    report,
                    downloadUrls: {
                        json: reportKey,
                        csv: csvKey
                    }
                }
            })
        };
        
    } catch (error) {
        console.error('Error generating report:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                message: 'Error generating report',
                error: error.message
            })
        };
    }
};