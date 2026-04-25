import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  priority: string;
  is_public: boolean;
  requires_access_code: boolean;
  public_code: string;
  public_url: string;
  applicant_count: number;
  created_at: string;
}

export interface JobsState {
  list: Job[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: JobsState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async () => {
  const response = await api.get('/jobs');
  return response.data.data.jobs;
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch jobs';
      });
  },
});

export default jobsSlice.reducer;
