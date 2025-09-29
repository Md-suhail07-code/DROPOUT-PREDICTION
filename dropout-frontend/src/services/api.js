import axios from 'axios';
const port = process.env.PORT || 5000;
const API_BASE_URL = 'https://stepup-ews.vercel.app/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API service functions
export const studentAPI = {
  // Auth
  signup: async (payload) => {
    const res = await api.post('/auth/signup', payload);
    return res.data;
  },
  login: async (payload) => {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  // Get all students
  getAllStudents: async () => {
    try {
      const response = await api.get('/students');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch students');
    }
  },

  // Role-based
  getAdminStudents: async () => {
    const res = await api.get('/admin/students');
    return res.data;
  },
  getMentorStudents: async () => {
    try {
      const res = await api.get('/mentor/students');
      return res.data;
    } catch (error) {
      // Provide clearer message for UI
      const msg = error.response?.data?.message || `Failed to fetch mentor students (status ${error.response?.status || 'unknown'})`;
      throw new Error(msg);
    }
  },
  getStudentMe: async () => {
    const res = await api.get('/student/me');
    return res.data;
  },

  importCSV: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/admin/students/import', form, { headers: { 'Content-Type': 'multipart/form-data' }});
    return res.data;
  },
  exportExcel: async () => {
    const res = await api.get('/admin/students/export', { responseType: 'blob' });
    return res;
  },
  exportCSV: async () => {
    const res = await api.get('/admin/students/export-csv', { responseType: 'blob' });
    return res;
  },

  // Get high-risk students
  getHighRiskStudents: async () => {
    try {
      const response = await api.get('/students/high-risk');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch high-risk students');
    }
  },

  getMediumRiskStudents: async () => {
    try {
      const response = await api.get('/students/medium-risk');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch medium-risk students');
    }
  },

  getLowRiskStudents: async () => {
    try {
      const response = await api.get('/students/low-risk');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch low-risk students');
    }
  },

  // Add a new student
  addStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add student');
    }
  },

  // Update student risk level
  updateRiskLevel: async (studentId, riskLevel) => {
    try {
      const response = await api.put(`/students/${studentId}/risk-level`, {
        risk_level: riskLevel
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update risk level');
    }
  },

  // Get a specific student
  getStudent: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch student');
    }
  }
};

export const mentorAPI = {
  importCSV: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/admin/mentors/import', form, { headers: { 'Content-Type': 'multipart/form-data' }});
    return res.data;
  },
}

export const adminAPI = {
  getStudentById: async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch student');
    }
  },
  getPredictionForStudent: async (studentId) => {
    try {
      const res = await api.get(`/admin/students/${studentId}/predict`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to get prediction');
    }
  },

  // Fetch whether data has been added (returns { isdataadded: true/false })
  getDataAddedStatus: async () => {
    try {
      const response = await api.get('/admin/isdataadded');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch data added status');
    }
  },

  // Set data added status. Backend should accept a POST or PUT to update the admin user's isdataadded flag.
  // We'll try PUT to /admin/isdataadded with { isdataadded: true/false }
  setDataAddedStatus: async (value) => {
    try {
      const response = await api.put('/admin/toggle-data-added', { isdataadded: !!value });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to set data added status');
    }
  }
};

export default api;
