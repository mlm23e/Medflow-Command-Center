import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
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
  { field: 'serial_number', headerName: 'Serial Number', flex: 1.3, minWidth: 150 },
  { field: 'model', headerName: 'Model', flex: 1, minWidth: 150 },
  { field: 'charge_level', headerName: 'Charge %', width: 110, type: 'number' },
  {
    field: 'status',
    headerName: 'Status',
    width: 140,
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{
          color:
            params.value === 'Available'
              ? 'success.main'
              : params.value === 'Offline'
                ? 'warning.main'
                : 'error.main',
          fontWeight: 600,
        }}
      >
        {params.value}
      </Typography>
    ),
  },
  { field: 'facility_id', headerName: 'Facility ID', width: 120, type: 'number' },
];

const STATUS_OPTIONS = ['Available', 'Maintenance', 'Offline'];

function EquipmentDataGrid({ onSuccess }) {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formValues, setFormValues] = useState({
    serial_number: '',
    model: '',
    charge_level: '',
    facility_id: '',
    status: 'Available',
  });

  async function fetchEquipment() {
    setLoading(true);
    try {
      const response = await apiClient.get('/equipment');
      setEquipment(response.data);
      setError(null);
    } catch {
      setError('Could not load Equipment data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filteredEquipment = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return equipment.filter((equipment) => {
      const matchesSearch =
        !term ||
        equipment.serial_number?.toLowerCase().includes(term) ||
        equipment.model?.toLowerCase().includes(term) ||
        String(equipment.facility_id).includes(term);

      const matchesStatus = statusFilter === 'All' || 
      equipment.status?.toLowerCase() === statusFilter.toLowerCase();
;
      return matchesSearch && matchesStatus;
    });
  }, [equipment, searchTerm, statusFilter]);

  const canManage = user?.role === 'Administrator';

  const handleDelete = async (equipment) => {
    if (!window.confirm(`Delete Equipment ${equipment.serial_number}? This cannot be undone.`)) return;

    try {
      await apiClient.delete(`/equipment/${equipment.id}`);
      if (onSuccess) onSuccess(`Equipment ${equipment.serial_number} deleted.`);
      await fetchEquipment();
    } catch (deleteError) {
      const detail = deleteError.response?.data?.detail || 'Could not delete Equipment.';
      setError(detail);
    }
  };

  const resetForm = () => {
    setSelectedEquipment(null);
    setFormValues({
      serial_number: '',
      model: '',
      charge_level: '',
      facility_id: '',
      status: 'Available',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (equipment) => {
    setSelectedEquipment(equipment);
    setFormValues({
      serial_number: equipment.serial_number,
      model: equipment.model,
      charge_level: equipment.charge_level,
      facility_id: equipment.facility_id,
      status: equipment.status,
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
        charge_level: Number(formValues.charge_level),
        facility_id: Number(formValues.facility_id),
      };

      if (selectedEquipment) {
        await apiClient.patch(`/equipment/${selectedEquipment.id}`, payload);
        if (onSuccess) {
          onSuccess(`Equipment ${payload.serial_number} updated.`);
        }
      } else {
        await apiClient.post('/equipment', payload);
        if (onSuccess) {
          onSuccess(`Equipment ${payload.serial_number} created.`);
        }
      }

      setDialogOpen(false);
      resetForm();

      await fetchEquipment();
    } catch (submitError) {
      const detail = submitError.response?.data?.detail || 'Could not save Equipment.';
      setError(detail);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Search Equipment"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="All">All</MenuItem>
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        {canManage && (
          <Button variant="contained" onClick={openCreateDialog} sx={{ ml: 'auto' }}>
            Add Equipment
          </Button>
        )}
      </Stack>

      <Box sx={{ height: 440, width: '100%' }}>
        <DataGrid
          rows={filteredEquipment}
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
                      <IconButton aria-label={`Edit Equipment ${params.row.id}`} size="small" onClick={() => openEditDialog(params.row)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label={`Delete Equipment ${params.row.id}`} size="small" color="error" onClick={() => handleDelete(params.row)}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <TextField
              label="Serial Number"
              value={formValues.serial_number}
              onChange={handleFieldChange('serial_number')}
            />
            <TextField label="Model" value={formValues.model} onChange={handleFieldChange('model')} />
            <TextField
              label="Charge Level"
              type="number"
              value={formValues.charge_level}
              onChange={handleFieldChange('charge_level')}
            />
            <TextField
              label="Facility ID"
              type="number"
              value={formValues.facility_id}
              onChange={handleFieldChange('facility_id')}
            />
            <TextField
              select
              label="Status"
              value={formValues.status}
              onChange={handleFieldChange('status')}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{selectedEquipment ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EquipmentDataGrid;