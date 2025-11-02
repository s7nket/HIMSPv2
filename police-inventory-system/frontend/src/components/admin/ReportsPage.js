import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component was previously unstyled.
  The AdminDashboard.css file now includes new styles for:
  - .reports-page
  - .reports-header (a themed card for filters)
  - .date-filters, .form-group, .form-label
  - .reports-content (a grid for report sections)
  - .report-section (themed cards for each report)
  - .summary-grid and .summary-card
  - .officers-table (applies standard table styling)
*/

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports(dateRange);

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container from CSS */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {/* UI/UX Enhancement: This header is now a styled card */}
      <div className="reports-header">
        <div className="date-filters">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="form-control"
            />
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="btn btn-primary"
        >
          Generate Report
        </button>
      </div>

      {reportData && (
        /* UI/UX Enhancement: Report sections are now styled cards */
        <div className="reports-content">
          <div className="report-section">
            <h3>Requests Summary</h3>
            <div className="summary-grid">
              {reportData.requestsSummary.map((item) => (
                <div key={item._id} className="summary-card">
                  <div className="summary-label">{item._id}</div>
                  <div className="summary-value">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Equipment Status</h3>
            <div className="summary-grid">
              {reportData.equipmentSummary.map((item) => (
                <div key={item._id} className="summary-card">
                  <div className="summary-label">{item._id}</div>
                  <div className="summary-value">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Top Active Officers</h3>
            {/* UI/UX Enhancement: This table now uses the main .table styles */}
            <div className="officers-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Badge Number</th>
                    <th>Total Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.userActivity.map((officer) => (
                    <tr key={officer._id}>
                      <td>{officer.firstName} {officer.lastName}</td>
                      <td>{officer.badgeNumber}</td>
                      <td>{officer.requestCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-section">
            <p>
              From: <strong>{new Date(reportData.dateRange.startDate).toLocaleDateString()}</strong>
              {' '} to <strong>{new Date(reportData.dateRange.endDate).toLocaleDateString()}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;