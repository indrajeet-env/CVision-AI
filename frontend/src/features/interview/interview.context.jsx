import { createContext, useContext, useState, useEffect } from "react";

export const InterviewContext = createContext();

const REPORT_STORAGE_KEY = 'interview_current_report';
const REPORTS_STORAGE_KEY = 'interview_user_reports';

export const InterviewProvider = ({ children }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Rehydration logic - runs on mount
  useEffect(() => {
    try {
      // Restore current report from localStorage
      const savedReport = localStorage.getItem(REPORT_STORAGE_KEY);
      if (savedReport) {
        setReport(JSON.parse(savedReport));
      }

      // Restore reports list from localStorage
      const savedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
    } catch (error) {
      console.error('Error hydrating data from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist current report to localStorage
  useEffect(() => {
    if (isHydrated && report) {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    }
  }, [report, isHydrated]);

  // Persist reports list to localStorage
  useEffect(() => {
    if (isHydrated && reports.length > 0) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    }
  }, [reports, isHydrated]);

  return (
    <InterviewContext.Provider
      value={{
        report,
        setReport,
        loading,
        setLoading,
        reports,
        setReports,
        isHydrated,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

