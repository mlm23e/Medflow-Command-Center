import { useEffect, useState } from 'react';
import apiClient from '../../api/client.js';
import AnalyticsDataGrid from './AnalyticsDataGrid.jsx';

const columns = [
  { field: 'model', headerName: 'Equipment Model', flex: 1, minWidth: 180 },
  { field: 'total_calls', headerName: 'Work Orders', type: 'number', width: 120 },
  { field: 'completed_calls', headerName: 'Completed', type: 'number', width: 120 },
  { field: 'failed_calls', headerName: 'Failed', type: 'number', width: 100 },
  {
    field: 'completion_rate',
    headerName: 'Completion Rate',
    type: 'number',
    width: 150,
    valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
  },
  {
    field: 'failure_rate',
    headerName: 'Failure Rate',
    type: 'number',
    width: 135,
    valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
  },
];

export default function ReliabilityPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiClient.get('/work_orders/reliability');
        setRows(response.data);
      } catch {
        setError('Could not load work order reliability metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AnalyticsDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      error={error}
      getRowId={(row) => row.model}
      emptyMessage="No reliability data reported yet."
    />
  );
}
