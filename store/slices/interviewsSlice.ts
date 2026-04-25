import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface Interview {
  id: string;
  applicant_id: string;
  interview_type_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meet_url?: string;
  scheduled_by: 'AI' | 'USER';
  created_by?: string;
  applicants: {
    name: string;
    email: string;
    jobs: { title: string; organization_id: string };
  };
  interview_types: {
    name: string;
    duration_minutes: number;
  };
  // UI-specific extended properties
  avatar?: string;
  candidate?: string;
  role?: string;
  time?: string;
  displayDate?: string;
  isoDate?: string;
  type?: string;
}

interface InterviewsState {
  list: Interview[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: InterviewsState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchInterviews = createAsyncThunk('interviews/fetchInterviews', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/interviews');
    return response.data.data.interviews;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch interviews');
  }
});

export const updateInterviewThunk = createAsyncThunk('interviews/updateInterview', async ({ id, data }: { id: string, data: any }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/interviews/${id}`, data);
    return response.data.data.interview;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update interview');
  }
});

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterviews.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(updateInterviewThunk.fulfilled, (state, action) => {
        const index = state.list.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });
  },
});

export default interviewsSlice.reducer;
