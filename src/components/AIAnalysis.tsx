import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Lightbulb,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface AIAnalysisProps {
  data: any;
  onDataChange: (data: any) => void;
  showHelp: string | null;
  setShowHelp: (help: string | null) => void;
}

interface CashFlowPattern {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  trend: 'up' | 'down' | 'stable';
}

interface SpendingTrend {
  category: string;
  currentAmount: number;
  previousAmount: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface FinancialHealthIndicator {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendations: string[];
}

interface BudgetPrediction {
  category: string;
  predictedAmount: number;
  currentSpent: number;
  remaining: number;
  confidence: number;
  trend: 'over' | 'under' | 'on-track';
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({
  data,
  onDataChange,
  showHelp,
  setShowHelp
}) => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'trends' | 'health' | 'budgeting'>('cashflow');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Mock data for demonstration - in real app, this would come from AI analysis
  const [cashFlowPatterns] = useState<CashFlowPattern[]>([
    { month: 'Jan', income: 25000, expenses: 18500, netFlow: 6500, trend: 'up' },
    { month: 'Feb', income: 28000, expenses: 19200, netFlow: 8800, trend: 'up' },
    { month: 'Mar', income: 26500, expenses: 21000, netFlow: 5500, trend: 'down' },
    { month: 'Apr', income: 32000, expenses: 22800, netFlow: 9200, trend: 'up' },
    { month: 'May', income: 29500, expenses: 20100, netFlow: 9400, trend: 'stable' },
    { month: 'Jun', income: 31000, expenses: 21800, netFlow: 9200, trend: 'stable' }
  ]);

  const [spendingTrends] = useState<SpendingTrend[]>([
    { category: 'Office Supplies', currentAmount: 2500, previousAmount: 1800, change: 38.9, trend: 'increasing' },
    { category: 'Technology', currentAmount: 4200, previousAmount: 5100, change: -17.6, trend: 'decreasing' },
    { category: 'Marketing', currentAmount: 6800, previousAmount: 6200, change: 9.7, trend: 'increasing' },
    { category: 'Travel', currentAmount: 3100, previousAmount: 2900, change: 6.9, trend: 'stable' },
    { category: 'Utilities', currentAmount: 1800, previousAmount: 1750, change: 2.9, trend: 'stable' }
  ]);

  const [financialHealth] = useState<FinancialHealthIndicator[]>([
    {
      name: 'Cash Flow Health',
      score: 85,
      status: 'excellent',
      description: 'Consistent positive cash flow with healthy margins',
      recommendations: ['Maintain current expense management', 'Consider investment opportunities']
    },
    {
      name: 'Expense Ratio',
      score: 72,
      status: 'good',
      description: 'Expenses are well-controlled relative to income',
      recommendations: ['Monitor discretionary spending', 'Look for cost optimization opportunities']
    },
    {
      name: 'Revenue Stability',
      score: 68,
      status: 'fair',
      description: 'Some volatility in monthly revenue',
      recommendations: ['Diversify revenue streams', 'Build emergency fund']
    },
    {
      name: 'Profit Margin',
      score: 78,
      status: 'good',
      description: 'Healthy profit margins indicate efficient operations',
      recommendations: ['Continue cost optimization', 'Explore pricing strategies']
    }
  ]);

  const [budgetPredictions] = useState<BudgetPrediction[]>([
    { category: 'Office Supplies', predictedAmount: 3000, currentSpent: 2500, remaining: 500, confidence: 0.85, trend: 'on-track' },
    { category: 'Technology', predictedAmount: 5000, currentSpent: 4200, remaining: 800, confidence: 0.78, trend: 'on-track' },
    { category: 'Marketing', predictedAmount: 8000, currentSpent: 6800, remaining: 1200, confidence: 0.82, trend: 'on-track' },
    { category: 'Travel', predictedAmount: 4000, currentSpent: 3100, remaining: 900, confidence: 0.73, trend: 'under' },
    { category: 'Utilities', predictedAmount: 2000, currentSpent: 1800, remaining: 200, confidence: 0.91, trend: 'on-track' }
  ]);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      // Store analysis results
      onDataChange({
        ...data,
        aiAnalysis: {
          cashFlowPatterns,
          spendingTrends,
          financialHealth,
          budgetPredictions,
          lastAnalyzed: new Date().toISOString()
        }
      });
    }, 3000);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-5 h-5 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-5 h-5 text-red-500" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBudgetStatus = (trend: 'over' | 'under' | 'on-track') => {
    switch (trend) {
      case 'over':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Over Budget' };
      case 'under':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'Under Budget' };
      case 'on-track':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'On Track' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Financial Analysis
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Advanced analytics powered by machine learning to provide insights into your business finances
        </p>
      </div>

      {/* Analysis Control */}
      <div className="flex justify-center">
        <button
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <Activity className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Data...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 mr-2" />
              Run AI Analysis
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg p-1 shadow-sm border">
          {[
            { id: 'cashflow', label: 'Cash Flow', icon: Activity },
            { id: 'trends', label: 'Spending Trends', icon: TrendingUp },
            { id: 'health', label: 'Financial Health', icon: Target },
            { id: 'budgeting', label: 'Predictive Budgeting', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Cash Flow Patterns</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                Last 6 months
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {cashFlowPatterns.map((pattern, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{pattern.month}</h4>
                    {getTrendIcon(pattern.trend)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income:</span>
                      <span className="font-medium text-green-600">${pattern.income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expenses:</span>
                      <span className="font-medium text-red-600">${pattern.expenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-900 font-medium">Net Flow:</span>
                      <span className={`font-bold ${
                        pattern.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${pattern.netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-900">AI Insights</h4>
              </div>
              <p className="text-blue-800 text-sm">
                Your cash flow shows consistent positive trends. Consider investing excess cash flow or building a larger emergency fund.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Spending Trends Analysis</h3>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                vs. previous period
              </div>
            </div>

            <div className="space-y-4">
              {spendingTrends.map((trend, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{trend.category}</h4>
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      trend.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                      trend.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trend.trend === 'increasing' ? <ArrowUpRight className="w-4 h-4 mr-1" /> :
                       trend.trend === 'decreasing' ? <ArrowDownRight className="w-4 h-4 mr-1" /> :
                       <Minus className="w-4 h-4 mr-1" />}
                      {Math.abs(trend.change)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium ml-2">${trend.currentAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Previous:</span>
                      <span className="font-medium ml-2">${trend.previousAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Financial Health Indicators</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-1" />
                Overall Score: {Math.round(financialHealth.reduce((acc, item) => acc + item.score, 0) / financialHealth.length)}/100
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {financialHealth.map((indicator, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{indicator.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(indicator.status)}`}>
                      {indicator.status}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className="font-bold text-gray-900">{indicator.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          indicator.score >= 80 ? 'bg-green-500' :
                          indicator.score >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${indicator.score}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{indicator.description}</p>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Recommendations:</h5>
                    <ul className="space-y-1">
                      {indicator.recommendations.map((rec, recIndex) => (
                        <li key={recIndex} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budgeting' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Predictive Budgeting</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Brain className="w-4 h-4 mr-1" />
                AI Confidence: {Math.round(budgetPredictions.reduce((acc, item) => acc + item.confidence, 0) / budgetPredictions.length * 100)}%
              </div>
            </div>

            <div className="space-y-4">
              {budgetPredictions.map((prediction, index) => {
                const status = getBudgetStatus(prediction.trend);
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{prediction.category}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Predicted:</span>
                        <div className="font-medium">${prediction.predictedAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Spent:</span>
                        <div className="font-medium">${prediction.currentSpent.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <div className="font-medium">${prediction.remaining.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <div className="font-medium">{Math.round(prediction.confidence * 100)}%</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            prediction.trend === 'over' ? 'bg-red-500' :
                            prediction.trend === 'under' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${(prediction.currentSpent / prediction.predictedAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Lightbulb className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-900">AI Budgeting Recommendations</h4>
              </div>
              <ul className="space-y-2 text-purple-800 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  Consider increasing your Travel budget by 15% based on historical patterns
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  Your Technology spending is trending lower - good opportunity to invest in upgrades
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                  Set up automatic alerts when spending reaches 80% of predicted amounts
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <Brain className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">How Our AI Analysis Works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Pattern Recognition
            </h4>
            <p>Our AI analyzes your transaction history to identify spending patterns, seasonal trends, and cash flow cycles specific to your business.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Predictive Modeling
            </h4>
            <p>Machine learning algorithms predict future spending, identify potential budget overruns, and recommend optimal financial strategies.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Anomaly Detection
            </h4>
            <p>The system flags unusual transactions, identifies potential fraud, and alerts you to spending deviations from normal patterns.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Smart Recommendations
            </h4>
            <p>Get personalized suggestions for cost optimization, investment timing, and financial planning based on your business data.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIAnalysis;