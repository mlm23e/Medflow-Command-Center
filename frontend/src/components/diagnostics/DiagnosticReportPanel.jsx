import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import apiClient from '../../api/client.js';

export default function DiagnosticReportPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState({
    work_order_id: '',
    file_url: '',
    notes: '',
  });

  async function fetchReports() {
    try {
      const response = await apiClient.get('/reports');
      setReports(response.data);
      setError('');
    } catch {
      setError('Could not load work order reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      await apiClient.post('/reports', {
        ...formValues,
        work_order_id: Number(formValues.work_order_id),
      });

      setFormValues({
        work_order_id: '',
        file_url: '',
        notes: '',
      });
      await fetchReports();
    } catch (submitError) {
      const message = submitError.response?.data?.detail || 'Could not upload work order report.';
      setError(message);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Upload work order report</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Work Order ID"
              type="number"
              value={formValues.work_order_id}
              onChange={handleFieldChange('work_order_id')}
            />
            <TextField
              label="File URL"
              value={formValues.file_url}
              onChange={handleFieldChange('file_url')}
            />
            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={formValues.notes}
              onChange={handleFieldChange('notes')}
            />
            <Button variant="contained" onClick={handleSubmit}>Save report</Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography variant="h6">Recent attachments</Typography>
        {reports.length === 0 ? (
          <Alert severity="info">No Work Order reports have been uploaded yet.</Alert>
        ) : (
          reports.map((report) => (
            <Card key={report.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle2">Work Order #{report.work_order_id}</Typography>
                <Typography variant="body2" color="text.secondary">{report.file_url}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{report.notes || 'No notes provided.'}</Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}
