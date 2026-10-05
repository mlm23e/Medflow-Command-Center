import { useEffect, useState } from 'react';
import apiClient from '../../api/client.js';
import AnalyticsDataGrid from './AnalyticsDataGrid.jsx';

const columns = [
  { field: 'technician_id', headerName: 'Technician ID', type: 'number', width: 140 },
  { field: 'first_name', headerName: 'First Name', flex: 1, minWidth: 140 },
  { field: 'last_name', headerName: 'Last Name', flex: 1, minWidth: 140 },
  { field: 'active_call_count', headerName: 'Active Calls', type: 'number', width: 140 },
];

export default function SupervisorLoadPanel({ technicianId = 1 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiClient.get(`/users/active-calls/${technicianId}`);
        setRows(response.data);
      } catch {
        setError('Could not load active technician assignments.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [technicianId]);

  return (
    <AnalyticsDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      error={error}
      getRowId={(row) => row.technician_id}
      emptyMessage="No active assignments for this technician."
    />
  );
}
