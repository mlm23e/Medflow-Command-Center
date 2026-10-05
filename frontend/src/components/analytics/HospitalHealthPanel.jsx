import { useEffect, useState } from 'react';
import apiClient from '../../api/client.js';
import AnalyticsDataGrid from './AnalyticsDataGrid.jsx';

const columns = [
  { field: 'name', headerName: 'Hospital', flex: 1, minWidth: 180 },
  { field: 'equipment_total', headerName: 'Equipment', type: 'number', width: 120 },
  { field: 'maintenance_total', headerName: 'In Maintenance', type: 'number', width: 145 },
  {
    field: 'maintenance_rate',
    headerName: 'Maintenance Rate',
    type: 'number',
    width: 160,
    valueFormatter: (value) => `${Number(value).toFixed(1)}%`,
  },
];

export default function BranchHealthPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiClient.get('/hospitals/maintenance-flags');
        setRows(response.data);
      } catch {
        setError('Could not load hospital maintenance flags.');
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
      emptyMessage="No hospitals exceed the 30% maintenance threshold."
    />
  );
}
