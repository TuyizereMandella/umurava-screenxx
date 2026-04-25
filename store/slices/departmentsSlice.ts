import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export interface Department {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
}

export interface DepartmentsState {
  list: Department[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: DepartmentsState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchDepartments = createAsyncThunk('departments/fetchDepartments', async () => {
  const response = await api.get('/departments');
  return response.data.data.departments;
});

export const createDepartment = createAsyncThunk('departments/createDepartment', async (name: string) => {
  const response = await api.post('/departments', { name });
  return response.data.data.department;
});

export const deleteDepartment = createAsyncThunk('departments/deleteDepartment', async (id: string) => {
  await api.delete(`/departments/${id}`);
  return id;
});

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch departments';
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.list.push(action.payload);
        // Sort by name after adding
        state.list.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.list = state.list.filter((dept) => dept.id !== action.payload);
      });
  },
});

export default departmentsSlice.reducer;
