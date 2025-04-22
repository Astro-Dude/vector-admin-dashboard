import React, { useState, useEffect, useMemo } from 'react';
import { fetchTestResults, fetchTestCategoryPerformance } from '../services/firebaseService';
import { format, subDays } from 'date-fns';
import { 
  FiDownload, 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiPrinter
} from 'react-icons/fi';
import { XMarkIcon } from '@heroicons/react/24/solid';

// Import chart components from Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TestAnalytics = () => {
  // State for test results data
  const [testResults, setTestResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  
  // State for selected test
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await fetchTestResults();
        const categoryData = await fetchTestCategoryPerformance();
        
        setTestResults(results);
        setFilteredResults(results);
        setCategoryPerformance(categoryData);
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Failed to load test data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply timeframe filter whenever it changes
  useEffect(() => {
    if (timeframe === 'all') {
      setFilteredResults(testResults);
      return;
    }
    
    const now = new Date();
    const daysAgo = parseInt(timeframe);
    const cutoffDate = subDays(now, daysAgo);
    
    const filtered = testResults.filter(result => {
      if (!result.timestamp) return false;
      const testDate = new Date(result.timestamp);
      return testDate >= cutoffDate;
    });
    
    setFilteredResults(filtered);
  }, [timeframe, testResults]);
  
  // Prepare data for category performance bar chart
  const categoryPerformanceData = useMemo(() => {
    return {
      labels: categoryPerformance.map(category => category.testName),
      datasets: [
        {
          label: 'Average Score (%)',
          data: categoryPerformance.map(category => category.avgScore.toFixed(2)),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    };
  }, [categoryPerformance]);
  
  // Chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance by Test Category'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Average Score (%)'
        }
      }
    }
  };
  
  // Handle export CSV
  const handleExportCSV = () => {
    const headers = [
      'Test Name',
      'Student',
      'Email',
      'Mobile',
      'Test ID',
      'Score (%)',
      'Questions Total',
      'Questions Attempted',
      'Time Spent (seconds)',
      'Status',
      'Date',
      'Time'
    ];
    
    const csvData = filteredResults.map(result => {
      // Extract user information with fallbacks
      const userName = result.userDetails?.name || result.userName || result.studentName || 'Unknown';
      const userEmail = result.userDetails?.email || result.userEmail || result.email || 'N/A';
      const userPhone = result.userDetails?.phone || result.userPhone || result.phone || 'N/A';
      
      return [
        result.testName || 'Unknown Test',
        userName,
        userEmail,
        userPhone,
        result.testId || 'N/A',
        result.percentage ? result.percentage.toFixed(2) : 'N/A',
        result.questionsTotal || 0,
        result.questionsAttempted || 0,
        result.timeSpent || 0,
        result.resultStatus || 'N/A',
        result.timestamp ? format(result.timestamp, 'yyyy-MM-dd') : 'N/A',
        result.timestamp ? format(result.timestamp, 'HH:mm:ss') : 'N/A'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `test-results-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle print test results
  const handlePrintResults = () => {
    if (!selectedTest) return;
    
    console.log("Printing results for test:", selectedTest);
    
    // Extract user information with fallbacks
    const userName = selectedTest.userDetails?.name || selectedTest.userName || selectedTest.studentName || 'Unknown';
    const userEmail = selectedTest.userDetails?.email || selectedTest.userEmail || selectedTest.email || 'N/A';
    const userPhone = selectedTest.userDetails?.phone || selectedTest.userPhone || selectedTest.phone || 'N/A';
    
    console.log("User info for print:", { userName, userEmail, userPhone });
    
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Result - ${selectedTest.testName || 'Unnamed Test'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .test-info { margin-bottom: 30px; }
          .test-info h2 { color: #4338ca; margin-bottom: 15px; }
          .info-row { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
          .question { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .question.correct { background-color: #f0fdf4; }
          .question.incorrect { background-color: #fef2f2; }
          .question-header { font-weight: bold; margin-bottom: 10px; }
          .result-status { font-weight: bold; }
          .correct-status { color: #047857; }
          .incorrect-status { color: #b91c1c; }
          .question-text { margin-bottom: 10px; }
          .answer-section { margin-top: 5px; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Test Result Report</h1>
          <p>${new Date().toLocaleString()}</p>
        </div>
        
        <div class="test-info">
          <h2>${selectedTest.testName || 'Unnamed Test'}</h2>
          <div class="info-row">
            <span class="label">Student:</span>
            <span>${userName}</span>
          </div>
          <div class="info-row">
            <span class="label">Date Taken:</span>
            <span>${selectedTest.timestamp ? new Date(selectedTest.timestamp).toLocaleString() : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Score:</span>
            <span>${selectedTest.percentage !== undefined ? `${selectedTest.percentage.toFixed(2)}%` : 'N/A'} 
            (${selectedTest.questionsCorrect || 0}/${selectedTest.questionsTotal || 0} correct)</span>
          </div>
          <div class="info-row">
            <span class="label">Status:</span>
            <span className="${selectedTest.resultStatus === 'pass' || selectedTest.resultStatus === 'passed' ? 'correct-status' : 'incorrect-status'}">${selectedTest.resultStatus === 'pass' || selectedTest.resultStatus === 'passed' ? 'PASSED' : 'FAILED'}</span>
          </div>
          <div class="info-row">
            <span class="label">Duration:</span>
            <span>${selectedTest.timeSpent ? `${Math.floor(selectedTest.timeSpent / 60)}m ${selectedTest.timeSpent % 60}s` : 'N/A'}</span>
          </div>
        </div>
        
        ${selectedTest.answers ? `
        <h3>Question Analysis</h3>
        ${Object.entries(selectedTest.answers).map(([questionId, answer], index) => `
          <div class="question ${answer.correct ? 'correct' : 'incorrect'}">
            <div class="question-header">
              Question ${index + 1}: 
              <span class="${answer.correct ? 'correct-status' : 'incorrect-status'}">
                ${answer.correct ? 'CORRECT' : 'INCORRECT'}
              </span>
            </div>
            ${answer.questionText ? `<div class="question-text">${answer.questionText}</div>` : ''}
            ${answer.userAnswer ? `<div class="answer-section">Your answer: ${answer.userAnswer}</div>` : ''}
            ${!answer.correct && answer.correctAnswer ? `<div class="answer-section correct-status">Correct answer: ${answer.correctAnswer}</div>` : ''}
          </div>
        `).join('')}
        ` : '<p>No detailed question data available</p>'}
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print(); window.close();" style="padding: 10px 20px; background: #4338ca; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Report
          </button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Generate test summary stats
  const testSummary = useMemo(() => {
    if (filteredResults.length === 0) {
      return {
        totalTests: 0,
        avgScore: 0,
        highestScore: 0,
        passRate: 0,
        avgDuration: 0
      };
    }
    
    const totalTests = filteredResults.length;
    const totalScore = filteredResults.reduce((sum, result) => sum + (result.percentage || 0), 0);
    const avgScore = totalScore / totalTests;
    const highestScore = Math.max(...filteredResults.map(result => result.percentage || 0));
    const passCount = filteredResults.filter(result => result.resultStatus === 'pass').length;
    const passRate = (passCount / totalTests) * 100;
    const totalDuration = filteredResults.reduce((sum, result) => sum + (result.timeSpent || 0), 0);
    const avgDuration = totalDuration / totalTests;
    
    return {
      totalTests,
      avgScore,
      highestScore,
      passRate,
      avgDuration
    };
  }, [filteredResults]);

  // Render the test detail modal if a test is selected
  const renderTestDetailModal = () => {
    if (!selectedTest) return null;

    console.log("Rendering detail modal for test:", selectedTest);
    
    // Extract user information with fallbacks
    const userName = selectedTest.userDetails?.name || selectedTest.userName || selectedTest.studentName || 'Unknown';
    const userEmail = selectedTest.userDetails?.email || selectedTest.userEmail || selectedTest.email || 'N/A';
    const userPhone = selectedTest.userDetails?.phone || selectedTest.userPhone || selectedTest.phone || 'N/A';
    
    console.log("User info for detail modal:", { userName, userEmail, userPhone });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{selectedTest.testName} - Details</h2>
            <button
              className="p-1 rounded-full hover:bg-gray-200 transition"
              onClick={() => setSelectedTest(null)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Test Information</h3>
              <p className="text-gray-800">{selectedTest.testName}</p>
              <p className="text-sm text-gray-600">{format(new Date(selectedTest.timestamp), 'PPP')}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Student Information</h3>
              <p className="text-gray-800">{userName}</p>
              <p className="text-sm text-gray-600">{userEmail}</p>
              <p className="text-sm text-gray-600">{userPhone}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Score</h3>
              <p className="text-2xl font-bold text-blue-600">{selectedTest.percentage ? `${selectedTest.percentage.toFixed(2)}%` : 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className={`text-lg font-semibold ${selectedTest.resultStatus === 'pass' || selectedTest.resultStatus === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                {selectedTest.resultStatus === 'pass' || selectedTest.resultStatus === 'passed' ? 'Passed' : 'Failed'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="text-gray-800">{selectedTest.timeSpent ? `${Math.floor(selectedTest.timeSpent / 60)}m ${selectedTest.timeSpent % 60}s` : 'N/A'}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Question Analysis</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {selectedTest.answers && selectedTest.answers.length > 0 ? (
                selectedTest.answers.map((answer, index) => (
                  <div key={index} className={`mb-4 p-3 rounded-md ${answer.isCorrect ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
                    <div className="flex justify-between">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{answer.question || 'Question text unavailable'}</p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Your answer: <span className="font-medium">{answer.userAnswer || 'No answer'}</span></p>
                      {!answer.isCorrect && (
                        <p className="text-sm text-gray-600">Correct answer: <span className="font-medium">{answer.correctAnswer}</span></p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No question details available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Test Analytics Dashboard</h2>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Time Period:</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last 365 days</option>
                </select>
              </div>
            </div>
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <FiBarChart2 className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Tests Taken</p>
                    <p className="text-2xl font-bold text-gray-800">{testSummary.totalTests}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-100 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-3">
                    <FiTrendingUp className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Score</p>
                    <p className="text-2xl font-bold text-gray-800">{testSummary.avgScore.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-full mr-3">
                    <FiCheckCircle className="text-indigo-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Highest Score</p>
                    <p className="text-2xl font-bold text-gray-800">{testSummary.highestScore.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-3">
                    <FiPieChart className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-800">{testSummary.passRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100 shadow-sm">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full mr-3">
                    <FiClock className="text-yellow-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
                    <p className="text-2xl font-bold text-gray-800">{Math.round(testSummary.avgDuration / 60)} min</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visualization section */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Performance Visualization</h3>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
                <h4 className="text-md font-medium text-gray-700 mb-3">Category Performance</h4>
                <div className="h-64">
                  <Bar options={barChartOptions} data={categoryPerformanceData} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Test Results Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-700">Test Results</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Found:</span>
                  <span className="font-medium">{filteredResults.length}</span>
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
                  disabled={filteredResults.length === 0}
                >
                  <FiDownload className="mr-2" /> Export CSV
                </button>
              </div>
            </div>
            
            {/* Results Table */}
            <div className="mt-8 px-4 sm:px-6 lg:px-8">
              <div className="mt-2 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Test Name
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Student
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Email
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Mobile
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Score
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Duration
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredResults.length > 0 ? (
                            filteredResults.map((result, index) => {
                              console.log(`Rendering result ${index}:`, result);
                              // Extract user information with fallbacks
                              const userName = result.userDetails?.name || result.userName || result.studentName || 'Unknown';
                              const userEmail = result.userDetails?.email || result.userEmail || result.email || 'N/A';
                              const userPhone = result.userDetails?.phone || result.userPhone || result.phone || 'N/A';
                              
                              console.log(`User info for result ${index}:`, { userName, userEmail, userPhone });
                              
                              return (
                                <tr 
                                  key={index} 
                                  className={`${index % 2 === 0 ? undefined : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer`}
                                  onClick={() => setSelectedTest(result)}
                                >
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {result.testName || 'Unnamed Test'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {userName}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {userEmail}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {userPhone}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {result.timestamp ? new Date(result.timestamp).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {result.percentage ? `${result.percentage.toFixed(2)}%` : 'N/A'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {result.timeSpent ? `${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s` : 'N/A'}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    <span
                                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                        result.resultStatus === 'pass' || result.resultStatus === 'passed'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {result.resultStatus === 'pass' || result.resultStatus === 'passed' ? 'Passed' : 'Failed'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="8" className="px-3 py-4 text-sm text-gray-500 text-center">
                                No test results found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Test detail modal */}
      {renderTestDetailModal()}
    </div>
  );
};

export default TestAnalytics; 