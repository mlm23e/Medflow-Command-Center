import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import apiClient from '../../api/client.js';

export default function HospitalDetailsPanel() {
  const [hospitals, setHospitals] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHospitalData() {
      try {
        const [hospitalsRes, equipmentRes] = await Promise.all([
          apiClient.get('/hospitals'),
          apiClient.get('/equipment'),
        ]);

        const fetchedHospitals = hospitalsRes.data;
        setHospitals(fetchedHospitals);
        setEquipment(equipmentRes.data);

        if (fetchedHospitals.length > 0) {
          setSelectedHospitalId(String(fetchedHospitals[0].id));
        }
      } catch {
        setError('Could not load hospital details.');
      } finally {
        setLoading(false);
      }
    }

    loadHospitalData();
  }, []);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => String(hospital.id) === selectedHospitalId) || hospitals[0],
    [hospitals, selectedHospitalId],
  );

  const hospitalEquipment = useMemo(
    () => equipment.filter((equipment) => equipment.facility_id === Number(selectedHospital?.id)),
    [equipment, selectedHospital],
  );

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <TextField
        select
        label="Hospital"
        value={selectedHospitalId}
        onChange={(event) => setSelectedHospitalId(event.target.value)}
        fullWidth
      >
        {hospitals.map((hospital) => (
          <MenuItem key={hospital.id} value={String(hospital.id)}>
            {hospital.name}
          </MenuItem>
        ))}
      </TextField>

      {selectedHospital ? (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">{selectedHospital.name}</Typography>
              <Divider />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Hospital ID</Typography>
                      <Typography variant="h5">{selectedHospital.id}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Supervisor ID</Typography>
                      <Typography variant="h6">{selectedHospital.supervisor_id ?? 'N/A'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Total Equipment</Typography>
                      <Typography variant="h5">{hospitalEquipment.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Equipment Capacity</Typography>
                      <Typography variant="h5">{selectedHospital.capacity}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                       <Typography variant="caption" color="text.secondary">Location</Typography>
                       <Typography variant="h5">{selectedHospital.location_region}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Equipment in Maintenance</Typography>
                      <Typography variant="h5">
                        {hospitalEquipment.filter((equipment) => equipment.status === 'Maintenance').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
              </Grid>

              <Typography variant="subtitle1" fontWeight={700}>Tracked Equipment inventory</Typography>
              <List dense>
                {hospitalEquipment.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No Equipment assigned to this hospital yet." />
                  </ListItem>
                ) : (
                  hospitalEquipment.map((equipment) => (
                    <ListItem key={equipment.id} divider>
                      <ListItemText
                        primary={`${equipment.serial_number} · ${equipment.model}`}
                        secondary={`Charge ${equipment.charge_level}% · ${equipment.status}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
