import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import AppHeader from '../components/layout/AppHeader.jsx';
import EquipmentDataGrid from '../components/equipment/EquipmentDataGrid.jsx'
import WorkOrderGrid from '../components/work-orders/WorkOrderGrid.jsx';
import HospitalHealthPanel from '../components/analytics/HospitalHealthPanel.jsx';
import ReliabilityPanel from '../components/analytics/ReliabilityPanel.jsx';
import DiscrepancyPanel from '../components/analytics/DiscrepancyPanel.jsx';
import TechnicianLoadPanel from '../components/analytics/TechnicianLoadPanel.jsx';
import LowChargePanel from '../components/analytics/LowChargePanel.jsx';
import MetricCard from '../components/dashboard/MetricCard.jsx';
import HospitalDetailsPanel from '../components/hospitals/HospitalDetailsPanel.jsx';
import UserManagementPanel from '../components/users/UserManagementPanel.jsx';
import DiagnosticReportPanel from '../components/diagnostics/DiagnosticReportPanel.jsx';
import apiClient from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage({ themeMode, onToggleTheme }) {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState({
    lowCharge: 0,
    totalEquipment: 0,
    maintenance: 0,
    workOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [secondaryTab, setSecondaryTab] = useState(0);

  async function loadDashboardMetrics() {
      try {
        const [allEquipmentRes, lowChargeRes, workOrdersRes] = await Promise.all([
          apiClient.get('/equipment'),
          apiClient.get('/equipment?max_charge=20'),
          apiClient.get('/work_orders'),
        ]);

        const allEquipment = allEquipmentRes.data;
        setMetrics({
          lowCharge: lowChargeRes.data.length,
          totalEquipment: allEquipment.length,
          maintenance: allEquipment.filter((equipment) => equipment.status === 'Maintenance').length,
          workOrders: workOrdersRes.data.filter((workOrder)=> workOrder.status === 'Pending' || workOrder.status === 'In-Progress').length,
        });
      } catch {
        setError('Could not load MedFlow dashboard metrics.');
      } finally {
        setLoading(false);
      }
  }
  
  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const handleUpdate = (message) => {
    loadDashboardMetrics();
    console.log(message);
  }

  const roleLabel = user?.role || 'Administrator';
  const canManage = roleLabel === 'Administrator';

  return (
    <>
      <AppHeader
        username={user?.username || 'MedFlow Operator'}
        role={roleLabel}
        onLogout={logout}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Hospital Operations Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {roleLabel} View
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box display="flex" justifycontent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Low Charge Equipment" value={metrics.lowCharge} tone="warning" subtitle="Below 20% charge threshold" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Total Equipment" value={metrics.totalEquipment} tone="primary" subtitle="Active inventory" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Maintenance" value={metrics.maintenance} tone="error" subtitle="Equipment flagged for service" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <MetricCard title="Work Orders" value={metrics.workOrders} tone="info" subtitle="Across the network" />
              </Grid>
            </Grid>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
              <Tab label="Equipment" />
              <Tab label="Work Orders" />
              <Tab label="Hospitals" />
              <Tab label="Users" />
              <Tab label="Reports" />
            </Tabs>
          </Box>

          {tab === 0 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Equipment Inventory
              </Typography>
              <EquipmentDataGrid onSuccess={canManage ? handleUpdate : undefined} />
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Work Order Queue
              </Typography>
              <WorkOrderGrid />
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Hospital Details
              </Typography>
              <HospitalDetailsPanel />
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                User Management
              </Typography>
              <UserManagementPanel />
            </Box>
          )}

          {tab === 4 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Work Order Reports
              </Typography>
              <DiagnosticReportPanel />
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Operations Overview
            </Typography>
            <Tabs
              value={secondaryTab}
              onChange={(_, newValue) => setSecondaryTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Operations analytics"
            >
              <Tab label="Low Charge" id="operations-tab-0" aria-controls="operations-panel" />
              <Tab label="Hospital Maintenance" id="operations-tab-1" aria-controls="operations-panel" />
              <Tab label="Reliability" id="operations-tab-2" aria-controls="operations-panel" />
              <Tab label="Discrepancies" id="operations-tab-3" aria-controls="operations-panel" />
              <Tab label="Technician Load" id="operations-tab-4" aria-controls="operations-panel" />
            </Tabs>
            <Box
              role="tabpanel"
              id="operations-panel"
              aria-labelledby={`operations-tab-${secondaryTab}`}
              sx={{ pt: 2 }}
            >
              {secondaryTab === 0 && <LowChargePanel />}
              {secondaryTab === 1 && <HospitalHealthPanel />}
              {secondaryTab === 2 && <ReliabilityPanel />}
              {secondaryTab === 3 && <DiscrepancyPanel />}
              {secondaryTab === 4 && <TechnicianLoadPanel technicianId={1} />}
            </Box>
          </Box>
        </Stack>
      </Container>
    </>
  );
}
