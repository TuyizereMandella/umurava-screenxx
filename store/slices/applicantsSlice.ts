import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface Applicant {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  location?: string;
  resume_url?: string;
  answers?: Record<string, string>;
  status: string;
  match_score: number | null;
  applied_at: string;
  jobs?: { title: string; organization_id?: string };
  ai_analysis?: any[];
}

export interface ApplicantsState {
  list: Applicant[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ApplicantsState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchApplicants = createAsyncThunk('applicants/fetchApplicants', async () => {
  const response = await api.get('/applicants');
  return response.data.data.applicants;
});

export const deleteApplicant = createAsyncThunk('applicants/deleteApplicant', async (id: string) => {
  await api.delete(`/applicants/${id}`);
  return id;
});

const applicantsSlice = createSlice({
  name: 'applicants',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchApplicants.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchApplicants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch applicants';
      })
      .addCase(deleteApplicant.fulfilled, (state, action) => {
        state.list = state.list.filter((app) => app.id !== action.payload);
      });
  },
});

export default applicantsSlice.reducer;
