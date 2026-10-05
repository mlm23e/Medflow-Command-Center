import { Card, CardContent, Typography, Chip, Stack } from '@mui/material';

const LOW_CHARGE_THRESHOLD = 20;

function EquipmentCard({ equipment }) {
  const isLowCharge = equipment.charge_level < LOW_CHARGE_THRESHOLD;

  return (
    <Card variant="outlined" sx={{ minWidth: 240 }}>
      <CardContent>
        {/* The Typography component lets us display text with different styles.*/}
        <Typography variant="h6" component="div">
          {equipment.serial_number}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {equipment.model}
        </Typography>
        {/* The Stack component is a layout component that arranges its children in a row or column.*/}
        <Stack direction="row" spacing={1} alignItems="center">
        {/* The Chip component is a small, interactive element that can display information or trigger actions.*/}
          <Chip
            label={`${equipment.charge_level}% cash`}
            color={isLowCharge ? 'error' : 'success'}
            size="small"
          />
          <Chip label={equipment.status} variant="outlined" size="small" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default EquipmentCard;