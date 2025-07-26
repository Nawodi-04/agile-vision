import { User } from "../models/User.js";

export const register = async (req, res) => {
  try {
    console.log('=== Registration Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    const { name, email, password, role } = req.body;

    // Log each field
    console.log('Parsed fields:', {
      name: name ? 'present' : 'missing',
      email: email ? 'present' : 'missing',
      password: password ? 'present' : 'missing',
      role: role ? 'present' : 'missing'
    });

    // Basic validation
    if (!name || !email || !password || !role) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ 
        message: 'All fields are required',
        received: {
          name: !!name,
          email: !!email,
          password: !!password,
          role: !!role
        }
      });
    }

    // Validate role
    if (!['Developer', 'Project Manager'].includes(role)) {
      console.log('Validation failed - invalid role:', role);
      return res.status(400).json({ 
        message: 'Invalid role. Must be either "Developer" or "Project Manager"'
      });
    }

    // Check if user exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    console.log('Hashing password...');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create new user
    console.log('Creating new user...');
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Save user
    console.log('Saving user to database...');
    const savedUser = await newUser.save();
    console.log('User saved successfully:', {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role
    });

    // Return success
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error('=== Registration Error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({
        message: 'Email already registered'
      });
    }

    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return success
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
