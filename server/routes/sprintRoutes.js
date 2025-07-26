import express from 'express';
import {
  getAllSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  addTask,
  updateTask,
  deleteTask
} from '../controllers/sprintController.js';

const router = express.Router();

// Logging middleware for sprint routes
router.use((req, res, next) => {
  console.log(`Sprint Route: ${req.method} ${req.path}`);
  console.log('Request Body:', req.body);
  next();
});

// Test route
router.get('/test', (req, res) => {
  console.log('Sprint routes test hit');
  res.json({ message: 'Sprint routes are working' });
});

// Sprint routes
router.get('/', getAllSprints);
router.post('/', createSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);

// Task routes
router.post('/:id/tasks', addTask);
router.put('/:id/tasks/:taskId', updateTask);
router.delete('/:id/tasks/:taskId', deleteTask);

// Error handling for sprint routes
router.use((err, req, res, next) => {
  console.error('Sprint Route Error:', err);
  res.status(500).json({ 
    message: 'Error in sprint route',
    error: err.message 
  });
});

export default router; 