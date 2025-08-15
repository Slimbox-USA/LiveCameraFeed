import React, { useEffect, useState, } from 'react';
import {
  AppBar, Toolbar, Container, Stack, Box, Typography,
  Paper, Chip, Grid,
  Button, ButtonGroup, Divider, TextField,List, ListItem, ListItemText,  ListItemSecondaryAction, IconButton, Modal,
  
} from '@mui/material';
import {ThemeProvider, createTheme,useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Person, AddBox, Delete,Speed } from '@mui/icons-material';
import { Gauge, gaugeClasses } from '@mui/x-charts';
import axios from "axios";
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#d6d6d6ff',
      borderColor: '#31b14fbd',
      second: '#d6d6d6ff',
      third: '#0fe04a74',
    },
  },
});

function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [temp, setTemp] = useState([]);
  const [cpuData, setcpuData] = useState([]);
  const [viewCount, setviewCount] = useState([]);
  const [quickNotes, setQuickNotes] = useState([]);
  const [newQuickNote, setNewQuickNote] = useState([]);
  const [openInfo, setOpenInfo] = useState(false);



  const theme2 = useTheme();
  const isSmallScreen = useMediaQuery(theme2.breakpoints.down('sm'));

  useEffect(() => {
    //Only fetch raspberry pi data if user selects.
    if (!openInfo) return; 

    let intervalId;
    // fetchData funciton.
    const fetchData = async () => {
      try {
        const response = await axios.get("http://192.168.192.147:5000/AllData");
        const data = response.data;
        setcpuData(data.cpuPercent);
        setTemp(data.temp);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  

    fetchData(); // fetch immediately when modal opens
    intervalId = setInterval(fetchData, 500); // then fetch repeatedly

    return () => {
      clearInterval(intervalId); // cleanup when modal closes or component unmounts
    };
  }, [openInfo]); // triggers whenever openInfo changes
  // fetchViewer gathers viewer count every 5 seconds. 
  useEffect(() => {
     const fetchViewer = async () => {
      try{
        const response = await axios.get("http://192.168.192.147:5000/ViewerCount")
        const data = response.data;
        setviewCount(data.viewCount);
      } catch (error) {
        console.error("Error fetching viewer count:", error);
      }
    };

    fetchViewer();
    const interval = setInterval(fetchViewer, 5000); //fetchViewer request time 
    return () => { clearInterval(interval);
    };
  },[]);


  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addQuickNote = () => {
    if (newQuickNote.trim()) {
      setQuickNotes([
        ...quickNotes,
        { id: Date.now(), text: newQuickNote, date: new Date() },
      ]);
      setNewQuickNote("");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static"  sx={{ border: 5, borderColor: 'primary.main',backgroundColor: 'primary.borderColor',borderRadius: 5, p: 1 }}>
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

          {/* ✅ Responsive Divider
          <Divider
            orientation={isSmallScreen ? 'horizontal' : 'vertical'}
            flexItem
            sx={{ mx: isSmallScreen ? 5: 10, my: isSmallScreen ? 5 : 0 }}
          /> */}
        </Toolbar>
    </AppBar>

      <Divider orientation="horizontal" flexItem sx={{ mx: 5 }} />

      <Container sx={{ pt: 4, pb: 4 }}>
        <Grid container spacing={4} alignItems="stretch" justifyContent="center">
          {/* Video Feed */}
          <Grid pr={1}>
            <Box sx={{ position: "relative", width: "100%" }}>
              <Chip
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{`REC • ${time}`}</span>
                    <Person fontSize="small" />
                    <span>{viewCount}</span>
                  </Box>
                }
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  fontWeight: "bold",
                  backgroundColor: "primary.borderColor",
                  zIndex: 2,
                  animation: "fadeInOut 5s infinite ease-in-out",
                  "@keyframes fadeInOut": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.8 },
                    "100%": { opacity: 1 },
                  },
                }}
              />

              <Box
                component="img"
                src="http://192.168.192.147:5000/video_feed"
                alt="Live Camera"
                sx={{
                  border: 4,
                  borderColor: "primary.main",
                  borderRadius: 4,
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </Box>
          </Grid>
          {/* Quick Notes */}
          <Grid>
            <Paper
              elevation={3}
              sx={{
                border: 5,
                borderColor: "primary.main",
                backgroundColor: "primary.borderColor",
                p: { xs: 2, sm: 3 },
                pl: {xs: 5},
                "&:hover": { transform: "scale(1.02)" },
                transition: "transform 0.2s",
                minHeight: 300,
                minWidth: 700,
              }}
            >
              <Stack direction='row' alignItems='center' justifyContent='space-between' p={2}>
                <Typography
                align="center"
                variant="h5"
                sx={{fontFamily: "inherit" }}
              >
                Quick Notes
              </Typography>
              <Button
                onClick={() => setOpenInfo(true)}
                startIcon={<Speed />}
              />

              </Stack>
              
              <Divider sx={{ width: "100%", my: 2 }} />
              <Stack spacing={2}>
                <TextField
                  label="Add a quick note"
                  value={newQuickNote}
                  onChange={(e) => setNewQuickNote(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={addQuickNote}
                  startIcon={<AddBox />}
                >
                  Add Note
                </Button>
              </Stack>
              <Box sx = {{maxHeight: 200, overflowY: "auto"}}>
              <List>
                  {quickNotes.map((note) => (
                    <ListItem key={note.id}>
                      <ListItemText
                        primary={note.text}
                        secondary={note.date.toLocaleTimeString()}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() =>
                            setQuickNotes(
                              quickNotes.filter((n) => n.id !== note.id)
                            )
                          }
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
        
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, border: 5, borderColor: "primary.main",backgroundColor: 'primary.borderColor', borderRadius: 2 }}>
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

      {/* Modal */}
      <Modal open={openInfo} onClose={() => setOpenInfo(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%", 
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 4,
            width: 300,
          }}
        >
          {/* Gauges */}
          <Grid>
            <Stack spacing={2} alignItems="center" direction="row">
              {/* CPU Usage */}
              <Paper
                sx={{
                  p: 2,
                  width: 'clamp(100px, 60%, 300px)',
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
                  innerRadius="70%"
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
                  width: 'clamp(100px, 40%, 300px)',
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
                  innerRadius="90%"
                  outerRadius="75%"
                  sx={{
                    [`& .${gaugeClasses.valueText}`]: { fontSize: 30 },
                    [`& .${gaugeClasses.valueArc}`]: { fill: '#022dabff' },
                    [`& .${gaugeClasses.track}`]: { fill: '#d3d3d3' },
                  }}
                />
              </Paper>
            </Stack>
          </Grid>
          
            
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default App;
