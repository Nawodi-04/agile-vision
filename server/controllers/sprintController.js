import Sprint from '../models/Sprint.js';
import { sendSprintAssignmentEmail } from '../services/emailService.js';

// Get all sprints
export const getAllSprints = async (req, res) => {
  try {
    console.log('Getting all sprints');
    const sprints = await Sprint.find().sort({ createdAt: -1 });
    console.log('Found sprints:', sprints);
    res.json(sprints);
  } catch (error) {
    console.error('Error getting sprints:', error);
    res.status(500).json({ message: 'Error fetching sprints', error: error.message });
  }
};

// Create a new sprint
export const createSprint = async (req, res) => {
  try {
    console.log('Creating new sprint with data:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.startDate || !req.body.endDate) {
      console.log('Missing required fields:', {
        name: !req.body.name,
        startDate: !req.body.startDate,
        endDate: !req.body.endDate
      });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          name: !req.body.name,
          startDate: !req.body.startDate,
          endDate: !req.body.endDate
        }
      });
    }

    const sprint = new Sprint({
      name: req.body.name,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      status: req.body.status || 'Planned',
      assignedTo: req.body.assignedTo || [],
      details: req.body.details || '',
      dateExtensionReason: req.body.dateExtensionReason || '',
      delayReason: req.body.delayReason || '',
      tasksList: req.body.tasksList || []
    });

    console.log('Creating sprint with data:', sprint);
    const newSprint = await sprint.save();
    console.log('Sprint created successfully:', newSprint);
    
    // Send assignment emails to all assigned users
    const emailPromises = newSprint.assignedTo.map(email => 
      sendSprintAssignmentEmail(email, newSprint)
    );

    try {
      await Promise.all(emailPromises);
      console.log('Assignment emails sent successfully');
    } catch (emailError) {
      console.error('Error sending assignment emails:', emailError);
      // Don't fail the request if email sending fails
    }

    res.status(201).json(newSprint);
  } catch (error) {
    console.error('Error creating sprint:', error);
    res.status(500).json({ message: 'Error creating sprint', error: error.message });
  }
};

// Update a sprint
export const updateSprint = async (req, res) => {
  try {
    console.log('Updating sprint:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Basic validation
    if (!req.body) {
      return res.status(400).json({ message: 'No data provided for update' });
    }

    // Find the sprint first
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Update fields manually
    if (req.body.name) sprint.name = req.body.name;
    if (req.body.startDate) sprint.startDate = new Date(req.body.startDate);
    if (req.body.endDate) sprint.endDate = new Date(req.body.endDate);
    if (req.body.status) sprint.status = req.body.status;
    if (req.body.assignedTo) sprint.assignedTo = req.body.assignedTo;
    if (req.body.details) sprint.details = req.body.details;
    if (req.body.dateExtensionReason) sprint.dateExtensionReason = req.body.dateExtensionReason;
    if (req.body.delayReason) sprint.delayReason = req.body.delayReason;
    if (req.body.tasksList) sprint.tasksList = req.body.tasksList;

    // Update task counts
    sprint.tasks = sprint.tasksList.length;
    sprint.completed = sprint.tasksList.filter(task => task.status === 'Completed').length;

    // Validate status
    if (sprint.status && !['Active', 'Inactive', 'Completed', 'Delayed'].includes(sprint.status)) {
      return res.status(400).json({ 
        message: 'Invalid sprint status',
        details: { status: 'Status must be one of: Active, Inactive, Completed, Delayed' }
      });
    }

    // Validate dates
    if (sprint.endDate <= sprint.startDate) {
      return res.status(400).json({ 
        message: 'Invalid dates',
        details: { dates: 'End date must be after start date' }
      });
    }

    try {
      // Save the updated sprint
      const updatedSprint = await sprint.save();
      console.log('Sprint updated successfully:', JSON.stringify(updatedSprint, null, 2));

      // Handle email notifications
      const newAssignedTo = req.body.assignedTo || [];
      const oldAssignedTo = sprint.assignedTo || [];
      const newlyAssigned = newAssignedTo.filter(email => !oldAssignedTo.includes(email));

      if (newlyAssigned.length > 0) {
        try {
          await Promise.all(newlyAssigned.map(email => 
            sendSprintAssignmentEmail(email, updatedSprint)
          ));
          console.log('Assignment emails sent successfully');
        } catch (emailError) {
          console.error('Error sending emails:', emailError);
        }
      }

      return res.json(updatedSprint);
    } catch (saveError) {
      console.error('Error saving sprint:', saveError);
      return res.status(500).json({
        message: 'Error saving sprint',
        error: saveError.message,
        details: saveError.errors || saveError.stack
      });
    }
  } catch (error) {
    console.error('Error in updateSprint:', error);
    return res.status(500).json({
      message: 'Error updating sprint',
      error: error.message,
      details: error.errors || error.stack
    });
  }
};

// Delete a sprint
export const deleteSprint = async (req, res) => {
  try {
    console.log('Deleting sprint:', req.params.id);
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log('Sprint not found:', req.params.id);
      return res.status(404).json({ message: 'Sprint not found' });
    }

    await sprint.deleteOne();
    console.log('Sprint deleted successfully:', req.params.id);
    res.json({ message: 'Sprint deleted' });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    res.status(500).json({ message: 'Error deleting sprint', error: error.message });
  }
};

// Add a task to a sprint
export const addTask = async (req, res) => {
  try {
    console.log('Adding task to sprint:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const missingFields = {};
    if (!req.body.name?.trim()) missingFields.name = 'Task name is required';
    if (!req.body.startDate) missingFields.startDate = 'Start date is required';
    if (!req.body.endDate) missingFields.endDate = 'End date is required';
    
    if (Object.keys(missingFields).length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: missingFields
      });
    }

    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log('Sprint not found:', req.params.id);
      return res.status(404).json({ message: 'Sprint not found' });
    }

    console.log('Found sprint:', {
      id: sprint._id,
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate
    });

    // Create new task object with proper date handling
    const newTask = {
      name: req.body.name.trim(),
      description: (req.body.description || '').trim(),
      status: req.body.status || 'Planned',
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      assignedTo: Array.isArray(req.body.assignedTo) ? req.body.assignedTo : [req.body.assignedTo],
      dateExtensionReason: (req.body.dateExtensionReason || '').trim()
    };

    // Validate assignedTo is not empty
    if (!newTask.assignedTo || newTask.assignedTo.length === 0) {
      console.log('No developers assigned to task');
      return res.status(400).json({
        message: 'At least one developer must be assigned to the task',
        details: { assignedTo: 'No developers assigned' }
      });
    }

    // Ensure assignedTo is an array of strings
    newTask.assignedTo = newTask.assignedTo.map(email => email.trim());

    // Validate dates
    const taskStartDate = new Date(newTask.startDate);
    const taskEndDate = new Date(newTask.endDate);
    const sprintStartDate = new Date(sprint.startDate);
    const sprintEndDate = new Date(sprint.endDate);

    console.log('Date validation:', {
      taskStartDate: taskStartDate.toISOString(),
      taskEndDate: taskEndDate.toISOString(),
      sprintStartDate: sprintStartDate.toISOString(),
      sprintEndDate: sprintEndDate.toISOString()
    });

    // Validate task dates
    if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format',
        details: {
          startDate: req.body.startDate,
          endDate: req.body.endDate
        }
      });
    }

    if (taskEndDate < taskStartDate) {
      return res.status(400).json({ 
        message: 'Task end date cannot be before start date',
        details: {
          startDate: taskStartDate.toISOString(),
          endDate: taskEndDate.toISOString()
        }
      });
    }

    if (taskStartDate < sprintStartDate || taskEndDate > sprintEndDate) {
      return res.status(400).json({ 
        message: 'Task dates must be within the sprint date range',
        details: {
          taskStartDate: taskStartDate.toISOString(),
          taskEndDate: taskEndDate.toISOString(),
          sprintStartDate: sprintStartDate.toISOString(),
          sprintEndDate: sprintEndDate.toISOString()
        }
      });
    }

    console.log('All validations passed, adding task to sprint');
    console.log('New task object:', newTask);
    
    // Add the task to the sprint's tasksList
    sprint.tasksList.push(newTask);
    sprint.tasks = sprint.tasksList.length;
    sprint.completed = sprint.tasksList.filter(task => task.status === 'Completed').length;
    
    const updatedSprint = await sprint.save();
    console.log('Task added successfully:', updatedSprint);
    res.json(updatedSprint);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Error adding task', error: error.message });
  }
};

// Update a task in a sprint
export const updateTask = async (req, res) => {
  try {
    console.log('Updating task:', req.params.taskId, 'in sprint:', req.params.id);
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log('Sprint not found:', req.params.id);
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const taskIndex = sprint.tasksList.findIndex(task => task._id.toString() === req.params.taskId);
    if (taskIndex === -1) {
      console.log('Task not found:', req.params.taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    sprint.tasksList[taskIndex] = {
      ...sprint.tasksList[taskIndex].toObject(),
      ...req.body
    };

    sprint.completed = sprint.tasksList.filter(task => task.status === 'Completed').length;
    const updatedSprint = await sprint.save();
    console.log('Task updated successfully:', updatedSprint);
    res.json(updatedSprint);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// Delete a task from a sprint
export const deleteTask = async (req, res) => {
  try {
    console.log('Deleting task:', req.params.taskId, 'from sprint:', req.params.id);
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      console.log('Sprint not found:', req.params.id);
      return res.status(404).json({ message: 'Sprint not found' });
    }

    sprint.tasksList = sprint.tasksList.filter(task => task._id.toString() !== req.params.taskId);
    sprint.tasks = sprint.tasksList.length;
    sprint.completed = sprint.tasksList.filter(task => task.status === 'Completed').length;
    
    const updatedSprint = await sprint.save();
    console.log('Task deleted successfully:', updatedSprint);
    res.json(updatedSprint);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
}; 