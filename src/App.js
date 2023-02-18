import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, TextField, Select, MenuItem, Button, ThemeProvider, createTheme, FormControl, InputLabel, LinearProgress, CircularProgressProps, CircularProgress, Snackbar, Alert, IconButton } from '@mui/material';
import { Close, DownloadDoneOutlined, DownloadForOfflineOutlined, DownloadOutlined, VideoFileOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { orange, pink, purple } from '@mui/material/colors';
import logo from "./logo.png";
import { openFile } from './chrome-utils';

const theme = createTheme(
  //violet
  {
    palette: {
      primary: {
        main: '#9c27b0',
      },
      secondary: {
        main: '#f50057',
      },
      text: {
        // violet degrees
        primary: '#7209b7',
        secondary: '#560bad',
        disabled: '#b5179e',
        mute: '#916dd5'
      }
    },
  }

);

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 , ml:3 }}>
     
      <CircularProgress  variant="determinate" value={100}  size={250} sx={{
        color: pink[100],
        position:'relative',
  
      }} />
      <CircularProgress  variant="determinate" {...props} size={250} sx={{
        color: purple[500],
        position:'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }} />

      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Typography variant="caption" component="div" color="text.primary" sx={{
          fontSize: 50,
          fontWeight: 'bold'
        }}>
          {`${Math.round(props.value)}%`}
        </Typography>
        <Typography variant="caption" component="div" color="text.disabled" sx={{
          fontSize: 14,
          fontWeight: 'semibold'
        }}>
          {`${Math.round(props.speed)} KB/s`}
        </Typography>

        <Typography variant="caption" component="div" color="text.disabled" sx={{
          fontSize: 14,
          fontWeight: 'italic'
        }}>
          {`${Math.round(props.time)} s`}
        </Typography>

      </Box>
    </Box>
  );
}


function LinearIndeterminate() {
  return (
    <Box sx={{ width: '100%', my: '4' }}>
      <LinearProgress />
    </Box>
  );
}

function SnackBar({ message, type, handleClose, open }) {

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      action={
        <React.Fragment>
          <Button color="secondary" size="small" onClick={
            handleClose
          }>
            CLOSE
          </Button>
        </React.Fragment>
      }
    >
      <Alert onClose={handleClose} severity={type} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}



function Message({ path , handleClose }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%" mt={5}>
      <Box display="flex" alignItems="center" bgcolor="#F5F5F5" p={2}>
        {/* Icon */}
      
        {/* Text */}
        <Box textAlign="center">
          <Typography sx={{
            fontSize: 15,
          }} >
            File Downloaded
          </Typography>
          <Button variant="outlined" color="primary" component="label"  sx={{
            fontSize: 12,
            fontWeight: 'bold',
            color: pink[700] ,
            mt: 2
          }}

          >
             <input hidden type="file" accept={
              "video/mp4,video/x-m4v,video/*"
             } />
               <VideoFileOutlined sx={{ fontSize: 35 ,color: pink[700] }} />
            Go To File
          </Button>
          <InputLabel
            htmlFor="contained-button-file"
            sx={{
              fontSize: 13,
              fontWeight: 'bold',
              color: orange[700],
              mt: 3
            }}
          >
            *Open file with right click
          </InputLabel>
        </Box>
        {/* Close button */}
        <Box ml="auto">
          <IconButton onClick={handleClose} sx={{ fontSize: 14}} >
            <Close />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}


function App() {



  const [url, seturl] = useState("");
  const [quality, setquality] = useState("");
  const [format, setformat] = useState("");




  const [socket, setsocket] = useState(null);
  const [loading, setloading] = useState(false);
  const [progressBar, setprogressBar] = useState({
    progress: 0,
    total: 0,
    downloadSpeed:
    {
      percentage: 0,
      speed: 0,
      timeLeft: 0
    }
  })
  const [message, setmessage] = useState("");
  const [data, setdata] = useState(null);
  const [open, setOpen] = useState(false);



  useEffect(() => {
    const socket = io("http://localhost:4500");
    setsocket(socket);

    return () => {
      socket.close();
    };
  }, []);


  useEffect(() => {

    if (socket) {
      connect();
      disconnect();
      download_progress();
      end();
    }

  }, [socket]);

  const connect = () => {
    socket.on("connect", () => {
      console.log("Connected to server");
      console.log("clientId", socket.id);
    });
  }

  const disconnect = () => {
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }

  const download_progress = () => {
    socket.on("downloadProgress", (data) => {
      setprogressBar(data)
      console.log(data);
    });
  }

  const resetData = () => {
    setdata(null)
  }

  const end = () => {
    socket.on("end", (data) => {
      setmessage(data)
      setOpen(true)
      console.log(data);
    });
  }



  const base_url = "http://localhost:4500/"


  const handleSubmit = async (e) => {
    e.preventDefault();

    setmessage("")
    //reset progressbar 
    setprogressBar({
      progress: 0,
      total: 0,
      downloadSpeed:
      {
        percentage: 0,
        speed: 0,
        timeLeft: 0
      }
    })

    if (
      url === "" ||
      quality === "" ||
      format === ""
    ) {
      return;
    }

    setloading(true);
    localStorage.setItem("loading", true);

    const res = await axios.get(base_url + "download", {
      params: {
        url: url,
        q: quality,
        t: format,
      }

    });

    console.log(res.data);
    setdata(res.data)
    setloading(false);
    localStorage.removeItem("loading");




    // const link = document.createElement("a");
    // link.href = base_url + "download?url=" + url.current.value + "&q=" + quality.current.value + "&t=" + format.current.value + "&id=" + clientId;
    // link.setAttribute("download", "video.mp4");
    // document.body.appendChild(link);

    // link.addEventListener("click", (event) => {
    //   event.preventDefault(); // prevent the default link behavior
    //   link.style.display = "none"; // hide the link
    //   document.body.removeChild(link); // remove the link from the document

    //   // download without reloading the page
    //   window.open(link.href, "_blank");
    //   //stay in the same page

    // });
    // link.click();



  }

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box
          sx={{
            pt: 5,
            pb: 6,
            mb: 4,
            mt:2
          }}

        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p:2
            }}
          >
            <img
              src={logo}
              alt="logo"
              style={{
                width: "100px",
                height: "100px",
                display: "block",
                margin: "auto"
              }}
            />
          </Box>

          {/* <Typography
            component="h3"
            variant="h4"
            align="center"
            color="text.secondary"
            gutterBottom
          >
            Youtube Downloader
          </Typography> */}

          <Typography
            variant="h6"
            align="center"
            color="text.mute"
            paragraph
          >
            Download Youtube Videos
          </Typography>

          {data?.path &&
            <Message
              path={data.path}
              handleClose={resetData}
            />
          }
          {
            message !== "" &&
            <SnackBar
              type="success"
              message={message}
              handleClose={handleClose}
              open={open}
            />
          }
          {(loading && progressBar.downloadSpeed?.percentage < 1) &&
            <LinearIndeterminate />
          }
          {
            loading ? (
              progressBar.downloadSpeed?.percentage > 0 && <CircularProgressWithLabel
                value={progressBar.downloadSpeed.percentage}
                time={
                  progressBar.downloadSpeed.timeLeft
                }
                speed={
                  progressBar.downloadSpeed.speed
                }
              />
            ) : ( !data &&
              <form onSubmit={handleSubmit} >
                <FormControl fullWidth sx={{ mt: 4 , mb:1}}>
                  <TextField
                    fullWidth
                    id="url"
                    label="Youtube Video ID"
                    variant="outlined"
                    required
                    onChange={
                      (e) => {
                        seturl(e.target.value)
                      }
                    }

                  />
                </FormControl>
                <FormControl fullWidth sx={{ my: 1 }}>
                  <InputLabel id="demo-simple-select-label">Quality</InputLabel>

                  <Select
                    fullWidth
                    id="quality"
                    label="Quality"
                    variant="outlined"
                    required
                    value={quality}
                    onChange={
                      (e) => {
                        setquality(e.target.value)
                      }
                    }
                  >

                    <MenuItem value="highestvideo">Highest Video</MenuItem>
                    <MenuItem value="highest">Highest</MenuItem>
                    <MenuItem value="lowest">Lowest</MenuItem>
                    <MenuItem value="highestaudio">Highest Audio</MenuItem>
                    <MenuItem value="lowestaudio">Lowest Audio</MenuItem>
                


                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ my: 1 }}>
                  <InputLabel id="demo-simple-select-label">Type</InputLabel>
                  <Select
                    fullWidth
                    id="format"
                    label="Format"
                    variant="outlined"
                    required
                    value={format}
                    onChange={(e) => {
                      setformat(e.target.value)
                    }}

                  >

                    <MenuItem value="videoandaudio">Video/Audio</MenuItem>
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="audio">Audio</MenuItem>
                    <MenuItem value="audioonly">Audio only</MenuItem>
                    <MenuItem value="videoonly">Video only</MenuItem>

                  </Select>
                </FormControl>
               
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 3 , fontWeight : "bold"}}
                >
                  <DownloadOutlined
                    sx={{ fontSize: 35 , color: 'white' }}
                  />Download
                </Button>
              </form>)
          }

        </Box>
      </Container>





    </ThemeProvider>
  );
}


export default App;
