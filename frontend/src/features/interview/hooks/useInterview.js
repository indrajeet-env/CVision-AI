/**
 * HOOKS LAYER - useInterview
 * Custom hook for managing interview state and data fetching
 * Bridges between UI layer and API layer
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getAllInterviewReports,
  getInterviewReportById,
  generateInterviewReport,
  downloadResumePdf,
} from '../services/interview.api.js';

import { useContext } from 'react';

import { InterviewContext } from '../interview.context.jsx';

export const useInterview = () => {
  const context = useContext(InterviewContext);

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { report, setReport, loading, setLoading, reports, setReports, isHydrated } = context;

  /**
   * Generate a new interview report
   */
  const generateReport = useCallback(
    async ({ resumeFile, jobDescription, selfDescription }) => {
      let response = null;
      setLoading(true);
      try {
        response = await generateInterviewReport({ resumeFile, jobDescription, selfDescription });
        // Handle different API response formats
        const reportData = response.data || response.interviewReport || response;
        setReport(reportData);
        // Add to reports list
        setReports(prev => [reportData, ...prev]);
        return reportData;
      } catch (error) {
        console.error("Error generating interview report:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setReport, setReports, setLoading]
  );

  /**
   * Fetch a specific report by ID
   */
  const getReportById = useCallback(
    async (interviewId) => {
      let response = null;
      setLoading(true);
      try {
        response = await getInterviewReportById(interviewId);
        const reportData = response.data || response.interviewReport || response;
        setReport(reportData);
        return reportData;
      } catch (error) {
        console.error("Error fetching interview report by ID:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setReport, setLoading]
  );

  /**
   * Fetch all user reports
   */
  const getReports = useCallback(async () => {
    let response = null;
    setLoading(true);
    try {
      response = await getAllInterviewReports();
      const reportsData = response.data || response.interviewReports || response;
      setReports(reportsData);
      return reportsData;
    } catch (error) {
      console.error("Error fetching user interview reports:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setReports, setLoading]);

  /**
   * Download resume PDF
   */
  const getResumePdf = useCallback(
    async (reportId) => {
      try {
        await downloadResumePdf(reportId);
      } catch (error) {
        console.error("Error downloading resume:", error);
        throw error;
      }
    },
    []
  );

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    isHydrated,
  };
};