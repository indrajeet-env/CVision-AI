/**
 * API LAYER - Interview Service
 * Handles all backend communication for interview-related operations
 */

import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3069';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: normalizedApiUrl,
  withCredentials: true, // Include cookies for authentication
});

/**
 * Generate interview report from job description and profile
 * @param {Object} data - { jobDescription, selfDescription, resumeFile }
 * @returns {Promise<Object>} Interview report data
 */
export const generateInterviewReport = async ({ resumeFile, jobDescription, selfDescription }) => {
  const formData = new FormData();
  // MUST match multer ke
  if (resumeFile) {
    formData.append("resume", resumeFile);
  }
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  return api.post('/api/interview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(response => response.data);
};

/**
 * Get interview report by ID
 * @param {String} reportId - Interview report ID
 * @returns {Promise<Object>} Interview report data
 */
export const getInterviewReportById = (reportId) => {
  return api.get(`/api/interview/report/${reportId}`)
    .then(response => response.data);
};

/**
 * Get user's interview reports
 * @returns {Promise<Array>} Array of interview reports
 */
export const getAllInterviewReports = () => {
  return api.get('/api/interview')
    .then(response => response.data);
};

/**
 * Download resume PDF for a report
 * @param {String} reportId - Interview report ID
 */
export const downloadResumePdf = async (reportId) => {
  try {
    const response = await api.get(`/api/interview/resume/pdf/${reportId}`, {
      responseType: 'blob',
    });

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading resume:', error);
    throw error;
  }
};
