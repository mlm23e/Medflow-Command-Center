import { useEffect, useState } from 'react';
import apiClient from '../../api/client.js';
import AnalyticsDataGrid from './AnalyticsDataGrid.jsx';

const columns = [
  { field: 'serial_number', headerName: 'Serial Number', flex: 1, minWidth: 150 },
  { field: 'model', headerName: 'Model', flex: 1, minWidth: 150 },
  { field: 'charge_level', headerName: 'Charge %', type: 'number', width: 120 },
  { field: 'facility_id', headerName: 'Facility ID', type: 'number', width: 120 },
];

export default function LowCashPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const low_charge = 20;
        const response = await apiClient.get(`/equipment/?max_charge=${low_charge.toString()}`);
        setRows(response.data);
      } catch {
        setError('Could not load Equipment with charge level < 20%.');
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
      emptyMessage="No equipment below 20% charge."
    />
  );
}
