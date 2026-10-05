import { AppBar, Toolbar, Typography, Box, Button, IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
{/* Every React component must return a single element. In this case, 
we are returning an AppBar component from Material-UI, which is a
top-level navigation bar that typically contains the application
title and other navigation elements. The AppBar is wrapped in a
Toolbar component, which provides padding and alignment for the
child elements. Inside the Toolbar, we have a MedicalServicesIcon
component, which is an icon from Material-UI's icon library, 
and a Typography component, which is used to display the application title as a heading. */}

function AppHeader({ username, role, onLogout, themeMode = 'dark', onToggleTheme }) {
  return (
    <AppBar 
      position="static"
    >
      <Toolbar 
        sx={{ gap: 0, px: { xs: 2, sm: 3 }, backgroundColor: themeMode === 'dark' ? 'primary.main' : 'secondary.main'}}
      >
        
        <MedicalServicesIcon sx={{ mr: 2}} />
        
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ flexGrow: 0, minWidth: 0 }} 
          noWrap
        >
          MedFlow Clinical Equipment Command Center
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto',minWidth: 0 }}>
          {/** Theme Toggle Button */}
          <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}>
            <IconButton
              color="inherit"
              aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} theme`}
              onClick={onToggleTheme}
            >
              {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          {/** END Theme Toggle */}

          {/** User Info and Logout button */}
          {username && (
            <>
              <Typography 
                variant="body2" 
                noWrap 
                sx={{ minWidth: 0, maxWidth: { xs: 80, sm: 180, md: 260 }, flexShrink: 1 }}
              >
                  {username} ({role})
              </Typography>

              <Button 
                color="inherit" 
                onClick={onLogout} 
                sx={{ flexShrink: 0, px: 2, py: 0.5, border: 1, borderRadius: 1, borderColor: 'inherit' }}>
                Log Out
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;