// 
// Day 6 - React and Material UI theme

// the createTheme function is used to create custom themes for materialUI components
//in this case, we are creating a 'light' mode theme with specific primary and secondary
// colors, as well as custom border radius for components.
import { createTheme } from '@mui/material/styles';

export default function getTheme(mode) {
    return createTheme({
    palette: {
            mode,
            primary: {
                main: '#bb06cb',
            },
            secondary: {
                main: '#006eff',
            },
    },
    shape: {
            borderRadius: 8,
        },
    });
}