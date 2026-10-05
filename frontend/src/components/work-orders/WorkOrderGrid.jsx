import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import apiClient from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

const columns = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'title', headerName: 'Title', flex: 1.8, minWidth: 200 },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 130,
    renderCell: (params) => {
      const color =
        params.value === 'Critical'
          ? 'error'
          : params.value === 'Medium'
            ? 'warning'
            : 'success';

      return <Chip label={params.value} color={color} size="small" />;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 160,
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{
          color:
            params.value === 'Completed'
              ? 'success.main'
              : params.value === 'Failed'
                ? 'error.main'
                : params.value === 'In-Progress'
                  ? 'info.main'
                  : 'text.primary',
          fontWeight: 600,
        }}
      >
        {params.value}
      </Typography>
    ),
  },
  { field: 'equipment_id', headerName: 'Equipment', width: 100, type: 'number' },
  { field: 'technician_id', headerName: 'Technician', width: 130, type: 'number' },
];

export default function WorkOrderGrid() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [formValues, setFormValues] = useState({
    title: '',
    priority: 'Medium',
    status: 'Pending',
    equipment_id: '',
    technician_id: '',
  });

  const canManage = user?.role === 'Administrator' || user?.role === 'Technician';

  const resetForm = () => {
    setSelectedCall(null);
    setFormValues({
      title: '',
      priority: 'Medium',
      status: 'Pending',
      equipment_id_id: '',
      technician_id: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setSelectedCall(row);
    setFormValues({
      title: row.title,
      priority: row.priority,
      status: row.status,
      equipment_id: row.equipment_id,
      technician_id: row.technician_id ?? '',
    });
    setDialogOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formValues,
        equipment_id: Number(formValues.equipment_id),
        technician_id: formValues.technician_id === '' ? null : Number(formValues.technician_id),
      };

      if (selectedCall) {
        await apiClient.patch(`/work_orders/${selectedCall.id}`, payload);
      } else {
        await apiClient.post('/work_orders', payload);
      }

      setDialogOpen(false);
      resetForm();
      await loadCalls();
    } catch (submitError) {
      const detail = submitError.response?.data?.detail || 'Could not save work order.';
      setError(detail);
    }
  };

  const handleDelete = async (workOrder) => {
    if (!window.confirm(`Delete work order #${workOrder.id}? This cannot be undone.`)) return;

    const workOrderId = Number(workOrder?.id);
    if (!Number.isInteger(workOrderId) || workOrderId < 1) {
      setError('Cannot delete work order: its ID is missing or invalid.');
      return;
    }

    try {
      await apiClient.delete(`/work_orders/${workOrderId}`);
      await loadCalls();
    } catch (deleteError) {
      const detail = deleteError.response?.data?.detail || 'Could not delete work order.';
      setError(detail);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    try {
      const response = await apiClient.get('/work_orders');
      setRows(response.data);
    } catch {
      setError('Could not load work orders.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {canManage && (
        <Button variant="contained" onClick={openCreateDialog} sx={{ justifySelf: 'flex-end' }}>
          Add Work Order
        </Button>
      )}

      <Box sx={{ height: 420, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
            ...columns,
            ...(canManage
              ? [{
                  field: 'actions',
                  headerName: 'Actions',
                  width: 110,
                  sortable: false,
                  filterable: false,
                  renderCell: (params) => (
                    <Stack direction="row">
                      <IconButton aria-label={`Edit Work Order ${params.row.id}`} size="small" onClick={() => openEditDialog(params.row)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label={`Delete Work Order ${params.row.id}`} size="small" color="error" onClick={() => handleDelete(params.row)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ),
                }]
              : []),
          ]}
          getRowId={(row) => row.id}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          onRowDoubleClick={(params) => canManage && openEditDialog(params.row)}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedCall ? 'Edit Work Order' : 'Add Work Order'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={formValues.title} onChange={handleFieldChange('title')} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Priority" value={formValues.priority} onChange={handleFieldChange('priority')} fullWidth>
                {['Low', 'Medium', 'Critical'].map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Status" value={formValues.status} onChange={handleFieldChange('status')} fullWidth>
                {['Pending', 'In-Progress', 'Completed', 'Failed'].map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField label="Equipment ID" type="number" value={formValues.equipment_id} onChange={handleFieldChange('equipment_id')} />
            <TextField label="Technician ID" type="number" value={formValues.technician_id} onChange={handleFieldChange('technician_id')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{selectedCall ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
