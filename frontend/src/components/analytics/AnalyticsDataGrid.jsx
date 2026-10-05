import { Alert, Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function AnalyticsDataGrid({
  rows,
  columns,
  loading,
  error,
  getRowId,
  emptyMessage,
}) {
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ height: 420, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        localeText={{ noRowsLabel: emptyMessage }}
      />
    </Box>
  );
}