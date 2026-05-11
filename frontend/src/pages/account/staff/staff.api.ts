import api from '../../../api/axios';
import type { StaffMember } from './staff.types';

export const fetchStaff = async () => {
  const { data } = await api.get<StaffMember[]>('/users/staff');
  return data;
};

export const createStaff = async (formData: any) => {
  const { data } = await api.post('/users/staff', formData);
  return data;
};

export const updateStaff = async (id: string, formData: any) => {
  const { data } = await api.put(`/users/staff/${id}`, formData);
  return data;
};

export const deleteStaff = async (id: string) => {
  const { data } = await api.delete(`/users/staff/${id}`);
  return data;
};
