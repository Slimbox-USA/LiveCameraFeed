import React, { useEffect, useState, } from 'react';
import {
  AppBar, Toolbar, Container, Stack, Box, Typography,
  Paper, Chip, Grid,
  Button, ButtonGroup, Divider
} from '@mui/material';
import {ThemeProvider, createTheme,useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Person } from '@mui/icons-material';
import { Gauge, gaugeClasses } from '@mui/x-charts';
import axios from "axios";
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#31b14fbd',
      second: '#eaeaeaff',
      third: '#0fe04a74',
    },
  },
});

function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [temp, setTemp] = useState([]);
  const [cpuData, setcpuData] = useState([]);
  const [viewCount, setviewCount] = useState([]);

  const theme2 = useTheme();
  const isSmallScreen = useMediaQuery(theme2.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://192.168.192.107:5000/AllData');
        const data = response.data;
        setcpuData(data.cpuPercent);
        setTemp(data.temp);
        setviewCount(data.view);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static"  sx={{ borderRadius: 5, p: 1 }}>
        <Toolbar sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
            <Box
              component="img"
              src="/slim.png"
              alt="Logo"
              sx={{ height: 40, mr: 2, borderRadius: 3 }}
            />
            <Typography
              variant="h5"
              fontFamily="monospace"
              sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', lg: '2rem' } }}
            >
              Live View
            </Typography>
          </Box>

          {/* ✅ Responsive Divider */}
          <Divider
            orientation={isSmallScreen ? 'horizontal' : 'vertical'}
            flexItem
            sx={{ mx: isSmallScreen ? 5: 10, my: isSmallScreen ? 5 : 0 }}
          />

          <ButtonGroup variant="contained" color="primary.main" disableElevation >
            <Button onClick={() => axios.post("http://192.168.168.192:5000/stopAutomatic")}>Stop Automatic</Button>
            <Button onClick={() => axios.post("http://192.168.192.107:5000/dropTable")}>Manual Drop</Button>
            <Button onClick={() => axios.post("http://192.168.192.107:5000/startAutomatic")}>Start Automatic</Button>
          </ButtonGroup>
        </Toolbar>
    </AppBar>

      <Divider orientation="horizontal" flexItem sx={{ mx: 5 }} />

      <Container sx={{ pt: 4, pb: 4 }}>
        <Grid container spacing={4} alignItems="stretch" justifyContent="center">
          {/* Video Feed */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '90%',
                position: 'relative',
                borderRadius: 2,
                p: 1,
                backgroundColor: 'primary.main',
              }}
            >
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{`REC • ${time}`}</span>
                    <Person fontSize="small" />
                    <span>{viewCount}</span>
                  </Box>
                }
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  fontWeight: 'bold',
                  backgroundColor: '#96d780ff',
                  color: '#fff',
                  zIndex: 2,
                  animation: 'fadeInOut 5s infinite ease-in-out',
                  '@keyframes fadeInOut': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.8 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
              <Box
                component="img"
                src="http://192.168.192.107:5000/video_feed"
                alt="Live Camera"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                }}
              />
            </Box>
          </Grid>

          {/* Gauges */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2} alignItems="center">
              {/* CPU Usage */}
              <Paper
                sx={{
                  p: 2,
                  width: 'clamp(300px, 90%, 500px)',
                  backgroundColor: 'primary.second',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.03)' },
                }}
              >
                <Typography variant="h6" fontFamily="monospace" color="inherit">
                  CPU % Utilization
                </Typography>
                <Divider flexItem sx={{ my: 1 }} />
                <Gauge
                  value={cpuData}
                  startAngle={0}
                  endAngle={360}
                  innerRadius="60%"
                  outerRadius="90%"
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: { fontSize: 30 },
                    [`& .${gaugeClasses.valueArc}`]: { fill: '#022dabff' },
                    [`& .${gaugeClasses.track}`]: { fill: '#d3d3d3' },
                  }}
                />
              </Paper>

              {/* CPU Temp */}
              <Paper
                sx={{
                  p: 2,
                  width: 'clamp(300px, 90%, 500px)',
                  backgroundColor: 'primary.second',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.03)' },
                }}
              >
                <Typography variant="h6" fontFamily="monospace" color="inherit">
                  CPU Temp °C
                </Typography>
                <Divider flexItem sx={{ my: 1 }} />
                <Gauge
                  value={temp}
                  startAngle={0}
                  endAngle={360}
                  innerRadius="60%"
                  outerRadius="80%"
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: { fontSize: 30 },
                    [`& .${gaugeClasses.valueArc}`]: { fill: '#022dabff' },
                    [`& .${gaugeClasses.track}`]: { fill: '#d3d3d3' },
                  }}
                />
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, backgroundColor: 'primary.main', borderRadius: 2 }}>
              <Typography variant="h4" fontFamily="monospace" gutterBottom>
                Our Mission
              </Typography>
              <Divider orientation="horizontal" flexItem sx={{ my: 2 }} />
              <Typography variant="body1" fontFamily="monospace">
                Slimbox helps companies reduce their waste production and CO₂ emissions costs by — literally — delivering the best fit solution. This is our story.
              </Typography>
               

              <Box
                component="img"
                src="/IMG_9575.png"
                alt="Logo"
                sx={{
                  height: isSmallScreen ? 300:700,
                  mr: 2,
                  borderRadius: 3,
                  width: '100%',
                  objectFit: 'cover',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                }}
              />
               <Divider orientation="horizontal" flexItem sx={{ my: 2 }} />
              <Typography variant="body1" fontFamily="monospace">
                Our automation solutions allow for continuous use, lowering costs and providing a clean alternative to traditional box manufacturing.
              </Typography>

            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
