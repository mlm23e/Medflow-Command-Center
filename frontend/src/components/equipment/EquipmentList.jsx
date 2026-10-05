import {Grid} from '@mui/material';
import EquipmentCard from './EquipmentCard.jsx'

function EquipmentList({equipment}) {
    return (
        <Grid container spacing = {2}>
            {/**
             * The map function is used to iterate over the 'equipment' array and render
             * a EquipmentCard component for each Equipment object
             */}
             {equipment.map((equip)=> (
            <Grid size="auto" key={equip.id}>
                <EquipmentCard equipment={equip} />
            </Grid>
        ))}
        </Grid>
    );
}

export default EquipmentList;