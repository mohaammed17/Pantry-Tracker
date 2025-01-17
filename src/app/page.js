'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  AppBar,
  Toolbar,
  Container,
  Menu,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Snackbar,
} from '@mui/material';
import { Add, Remove, Delete, Edit, Visibility, GetApp, Menu as MenuIcon, CameraAlt } from '@mui/icons-material';
import { firestore, auth } from './firebase'; // Adjust the path if necessary
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import axios from 'axios';
import CameraCapture from './CameraCapture';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#d32f2f',
    },
    background: {
      default: '#f7f7f7',
      paper: '#ffffff',
    },
  },
  typography: {
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.1rem',
    },
    button: {
      fontSize: '1rem',
    },
  },
});

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const ITEMS_PER_PAGE = 10;

export default function Home() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setIsClient(true);
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        updateInventory(currentUser.uid);
      } else {
        setInventory([]);
      }
    });
  }, []);

  const updateInventory = async (userId) => {
    try {
      const snapshot = await getDocs(collection(firestore, 'inventory', userId, 'items'));
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });
      setTotalItems(inventoryList.length);
      setInventory(inventoryList);
      console.log('Inventory updated:', inventoryList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addItem = async (item) => {
    console.log('addItem function called with item:', item);
    if (!user) {
      console.log('No user logged in');
      return;
    }
    try {
      console.log('Adding item:', item);
      const docRef = doc(collection(firestore, 'inventory', user.uid, 'items'), item.name);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingItem = docSnap.data();
        console.log('Existing item found:', existingItem);
        const updatedItem = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
        };
        await setDoc(docRef, updatedItem, { merge: true });
        console.log('Item updated:', updatedItem);
      } else {
        const newItem = {
          ...item,
          quantity: 1,
        };
        await setDoc(docRef, newItem);
        console.log('New item added:', newItem);
      }
      setError('');
      setSnackbarMessage('Item added successfully');
      setSnackbarOpen(true);
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error adding item:', error);
      setError('Error adding item.');
    }
  };

  const removeItem = async (item) => {
    if (!user) return;
    try {
      console.log('Removing item:', item);
      const docRef = doc(collection(firestore, 'inventory', user.uid, 'items'), item.name);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { ...item, quantity: quantity - 1 });
        }
      }
      setSnackbarMessage('Item removed successfully');
      setSnackbarOpen(true);
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const deleteItem = async (item) => {
    if (!user) return;
    try {
      console.log('Deleting item:', item);
      const docRef = doc(collection(firestore, 'inventory', user.uid, 'items'), item.name);
      await deleteDoc(docRef);
      setSnackbarMessage('Item deleted successfully');
      setSnackbarOpen(true);
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError('');
    setItemName('');
    setCategory('');
    setDescription('');
    setPrice('');
    setSupplier('');
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditOpen(true);
    setItemName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setPrice(item.price);
    setSupplier(item.supplier);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditItem(null);
    setItemName('');
    setCategory('');
    setDescription('');
    setPrice('');
    setSupplier('');
  };

  const handleEditSave = async () => {
    if (!user) return;
    try {
      const docRef = doc(collection(firestore, 'inventory', user.uid, 'items'), editItem.name);
      await setDoc(docRef, {
        name: itemName,
        category,
        description,
        price,
        supplier,
        quantity: editItem.quantity,
      });
      handleEditClose();
      setSnackbarMessage('Item updated successfully');
      setSnackbarOpen(true);
      await updateInventory(user.uid);
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Error updating item.');
    }
  };

  const handleViewOpen = (item) => {
    setViewItem(item);
    setViewOpen(true);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setViewItem(null);
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('User signed up successfully');
      setSnackbarMessage('Signed up successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully');
      setSnackbarMessage('Signed in successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully');
      setSnackbarMessage('Signed out successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleCameraOpen = () => {
    setCameraOpen(true);
  };

  const handleCameraClose = () => {
    setCameraOpen(false);
  };

  const handleCapture = async (image) => {
    console.log('Captured image:', image);
    setCameraOpen(false);

    try {
      const formData = new FormData();
      formData.append('image', image, 'image.png');

      const response = await axios.post('/api/classifyImage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.labels) {
        const labels = response.data.labels;

        // Extract item details from labels or set default values
        const itemName = labels[0] || 'Unknown Item';
        const category = labels[1] || 'Uncategorized';
        const description = 'Detected via image capture';
        const price = '';

        const item = { name: itemName, category, description, price, supplier: '' };

        await addItem(item);
      } else {
        console.error('No labels received from the server.');
      }
    } catch (error) {
      console.error('Error processing captured image:', error);
    }
  };

  const filteredInventory = inventory
    .filter(item => {
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterCategory === '' || item.category === filterCategory)
      );
    })
    .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Category', 'Description', 'Price', 'Supplier', 'Quantity'],
      ...inventory.map(item => [
        item.name,
        item.category,
        item.description,
        item.price,
        item.supplier,
        item.quantity,
      ]),
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isClient) {
    return null; // Render nothing on the server
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box width="100vw" minHeight="100vh" display="flex" flexDirection="column" bgcolor="background.default">
        <AppBar position="static">
          <Toolbar>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={toggleDrawer} aria-label="menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Pantry Management
            </Typography>
            {!isMobile && user && (
              <>
                <Button color="inherit" onClick={handleMenuOpen}>
                  Account
                </Button>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                  <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                </Menu>
              </>
            )}
            {!isMobile && !user && (
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: 'background.paper' }}
                    aria-label="email"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    id="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: 'background.paper' }}
                    aria-label="password"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button color="inherit" onClick={handleSignIn} fullWidth>
                    Sign In
                  </Button>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button color="inherit" onClick={handleSignUp} fullWidth>
                    Sign Up
                  </Button>
                </Grid>
              </Grid>
            )}
          </Toolbar>
        </AppBar>
        {isMobile && (
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
            <Box sx={{ width: 250 }}>
              <List>
                {user ? (
                  <>
                    <ListItem button onClick={handleSignOut}>
                      <ListItemText primary="Sign Out" />
                    </ListItem>
                  </>
                ) : (
                  <>
                    <ListItem>
                      <TextField
                        id="email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ bgcolor: 'background.paper' }}
                        aria-label="email"
                      />
                    </ListItem>
                    <ListItem>
                      <TextField
                        id="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ bgcolor: 'background.paper' }}
                        aria-label="password"
                      />
                    </ListItem>
                    <ListItem button onClick={handleSignIn}>
                      <ListItemText primary="Sign In" />
                    </ListItem>
                    <ListItem button onClick={handleSignUp}>
                      <ListItemText primary="Sign Up" />
                    </ListItem>
                  </>
                )}
              </List>
            </Box>
          </Drawer>
        )}
        <Container sx={{ mt: 4, mb: 4 }}>
          {user ? (
            <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%" justifyContent="center" alignItems="center">
                <TextField
                  id="search"
                  label="Search Items"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ bgcolor: 'background.paper', width: { xs: '100%', sm: '50%' } }}
                  aria-label="search items"
                />
                <FormControl variant="outlined" sx={{ minWidth: 200, bgcolor: 'background.paper' }}>
                  <InputLabel id="filter-category-label">Filter by Category</InputLabel>
                  <Select
                    labelId="filter-category-label"
                    id="filter-category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    label="Filter by Category"
                    aria-label="filter by category"
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    <MenuItem value="Food">Food</MenuItem>
                    <MenuItem value="Beverage">Beverage</MenuItem>
                    <MenuItem value="Household">Household</MenuItem>
                    <MenuItem value="Personal Care">Personal Care</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} width="100%" justifyContent="center" alignItems="center">
                <Button variant="contained" onClick={handleOpen} startIcon={<Add />} sx={{ minWidth: 150 }}>
                  Add New Item
                </Button>
                <Button variant="contained" onClick={exportToCSV} startIcon={<GetApp />} sx={{ minWidth: 150 }}>
                  Export to CSV
                </Button>
                <Button variant="contained" onClick={handleCameraOpen} startIcon={<CameraAlt />} sx={{ minWidth: 150 }}>
                  Capture Image
                </Button>
              </Stack>
              <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 3, width: '100%' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        <Typography variant="h6">Item</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6">Category</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6">Quantity</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6">Actions</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.name} hover>
                        <TableCell align="center">
                          <Typography variant="body1">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1">{item.category}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1">{item.quantity}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" justifyContent="center" spacing={1}>
                            <IconButton color="primary" onClick={() => {
                              console.log('Add button clicked for item:', item);
                              addItem(item);
                            }} aria-label="increase quantity">
                              <Add />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => removeItem(item)} aria-label="decrease quantity">
                              <Remove />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteItem(item)} aria-label="delete item">
                              <Delete />
                            </IconButton>
                            <IconButton color="default" onClick={() => handleEditOpen(item)} aria-label="edit item">
                              <Edit />
                            </IconButton>
                            <IconButton color="default" onClick={() => handleViewOpen(item)} aria-label="view item">
                              <Visibility />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Pagination
                count={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                page={page}
                onChange={handlePageChange}
                sx={{ mt: 2 }}
              />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>Please sign in to manage your pantry.</Typography>
            </Box>
          )}
        </Container>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack width="100%" direction="column" spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                aria-label="item name"
              />
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                  aria-label="category"
                >
                  <MenuItem value="Food">Food</MenuItem>
                  <MenuItem value="Beverage">Beverage</MenuItem>
                  <MenuItem value="Household">Household</MenuItem>
                  <MenuItem value="Personal Care">Personal Care</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                id="outlined-description"
                label="Description"
                variant="outlined"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="description"
              />
              <TextField
                id="outlined-price"
                label="Price"
                variant="outlined"
                fullWidth
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label="price"
              />
              <TextField
                id="outlined-supplier"
                label="Supplier"
                variant="outlined"
                fullWidth
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                aria-label="supplier"
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (itemName.trim() && category) {
                    addItem({
                      name: itemName,
                      category,
                      description,
                      price,
                      supplier,
                    });
                    setItemName('');
                    setCategory('');
                    setDescription('');
                    setPrice('');
                    setSupplier('');
                    handleClose();
                  } else {
                    setError('Please provide both item name and category.');
                  }
                }}
                sx={{ minWidth: 150 }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Dialog open={editOpen} onClose={handleEditClose} aria-labelledby="edit-item-title">
          <DialogTitle id="edit-item-title">Edit Item</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack width="100%" direction="column" spacing={2}>
              <TextField
                id="edit-item-name"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                aria-label="edit item name"
              />
              <FormControl fullWidth>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select
                  labelId="edit-category-label"
                  id="edit-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                  aria-label="edit category"
                >
                  <MenuItem value="Food">Food</MenuItem>
                  <MenuItem value="Beverage">Beverage</MenuItem>
                  <MenuItem value="Household">Household</MenuItem>
                  <MenuItem value="Personal Care">Personal Care</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                id="edit-description"
                label="Description"
                variant="outlined"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="edit description"
              />
              <TextField
                id="edit-price"
                label="Price"
                variant="outlined"
                fullWidth
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label="edit price"
              />
              <TextField
                id="edit-supplier"
                label="Supplier"
                variant="outlined"
                fullWidth
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                aria-label="edit supplier"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose} color="secondary">Cancel</Button>
            <Button onClick={handleEditSave} color="primary">Save</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={viewOpen} onClose={handleViewClose} aria-labelledby="view-item-title">
          <DialogTitle id="view-item-title">View Item Details</DialogTitle>
          <DialogContent>
            {viewItem && (
              <Stack width="100%" direction="column" spacing={2}>
                <Typography variant="body1"><strong>Item:</strong> {viewItem.name}</Typography>
                <Typography variant="body1"><strong>Category:</strong> {viewItem.category}</Typography>
                <Typography variant="body1"><strong>Description:</strong> {viewItem.description}</Typography>
                <Typography variant="body1"><strong>Price:</strong> {viewItem.price}</Typography>
                <Typography variant="body1"><strong>Supplier:</strong> {viewItem.supplier}</Typography>
                <Typography variant="body1"><strong>Quantity:</strong> {viewItem.quantity}</Typography>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleViewClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
        <Modal
          open={cameraOpen}
          onClose={handleCameraClose}
          aria-labelledby="camera-modal-title"
          aria-describedby="camera-modal-description"
        >
          <Box sx={style}>
            <Typography id="camera-modal-title" variant="h6" component="h2">
              Capture Image
            </Typography>
            <CameraCapture onCapture={handleCapture} />
          </Box>
        </Modal>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  );
}
