import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Task name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed'],
    default: 'Planned'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  assignedTo: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one developer must be assigned to the task'
    }
  },
  dateExtensionReason: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Completed', 'Delayed'],
      message: 'Status must be one of: Active, Inactive, Completed, Delayed'
    },
    default: 'Inactive'
  },
  assignedTo: [{
    type: String,
    trim: true
  }],
  details: {
    type: String,
    trim: true
  },
  dateExtensionReason: {
    type: String,
    trim: true
  },
  delayReason: {
    type: String,
    trim: true
  },
  tasksList: [taskSchema],
  tasks: {
    type: Number,
    default: 0
  },
  completed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  validateBeforeSave: true
});

// Add validation for findOneAndUpdate
sprintSchema.pre('findOneAndUpdate', function(next) {
  try {
    const update = this.getUpdate();
    if (!update || !update.$set) {
      return next();
    }

    const { $set } = update;

    // Validate dates if both are being updated
    if ($set.endDate && $set.startDate) {
      const endDate = new Date($set.endDate);
      const startDate = new Date($set.startDate);
      if (endDate <= startDate) {
        return next(new Error('End date must be after start date'));
      }
    }

    // Update task counts if tasksList is being updated
    if ($set.tasksList) {
      $set.tasks = $set.tasksList.length;
      $set.completed = $set.tasksList.filter(task => task.status === 'Completed').length;
    }

    // Validate status if it's being updated
    if ($set.status && !['Active', 'Inactive', 'Completed', 'Delayed'].includes($set.status)) {
      return next(new Error('Invalid sprint status'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Add validation for save
sprintSchema.pre('save', function(next) {
  try {
    // Validate dates
    if (this.endDate <= this.startDate) {
      return next(new Error('End date must be after start date'));
    }

    // Update task counts
    this.tasks = this.tasksList.length;
    this.completed = this.tasksList.filter(task => task.status === 'Completed').length;

    next();
  } catch (error) {
    next(error);
  }
});

const Sprint = mongoose.model('Sprint', sprintSchema);

export default Sprint; 