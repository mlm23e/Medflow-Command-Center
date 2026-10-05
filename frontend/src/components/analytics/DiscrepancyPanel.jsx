import { useEffect, useState } from 'react';
import apiClient from '../../api/client.js';
import AnalyticsDataGrid from './AnalyticsDataGrid.jsx';

const columns = [
  { field: 'work_order_id', headerName: 'Work Order ID', type: 'number', width: 140 },
  { field: 'title', headerName: 'Work Order', flex: 1, minWidth: 180 },
  { field: 'equipment_id', headerName: 'Equipment ID', type: 'number', width: 130 },
  { field: 'equipment_facility_id', headerName: 'Equipment Facility', type: 'number', width: 160 },
  { field: 'technician_id', headerName: 'Technician ID', type: 'number', width: 140 },
  { field: 'technician_facility_id', headerName: 'Technician Facility', type: 'number', width: 170 },
];

export default function DiscrepancyPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiClient.get('/work_orders/discrepancies');
        setRows(response.data);
      } catch {
        setError('Could not load work order discrepancies.');
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
      getRowId={(row) => row.work_order_id}
      emptyMessage="No equipment and technician facility mismatches found."
    />
  );
}
