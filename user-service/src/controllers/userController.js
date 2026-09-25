const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to find user by custom userId or MongoDB _id
const findUserByIdOrCustomId = async (id) => {
  let user = await User.findOne({ userId: id });
  if (!user && mongoose.Types.ObjectId.isValid(id)) {
    user = await User.findById(id);
  }
  return user;
};

// GET /users - Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      service: 'user-service',
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'user-service',
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
};

// GET /users/:id - Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserByIdOrCustomId(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        service: 'user-service',
        message: `User with ID '${id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      service: 'user-service',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'user-service',
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// POST /users - Create new user
exports.createUser = async (req, res) => {
  try {
    let { userId, name, email, role, department, status } = req.body;

    if (!userId) {
      userId = 'u_' + Math.floor(100 + Math.random() * 900);
    }

    const existingUser = await User.findOne({
      $or: [{ userId }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        service: 'user-service',
        message: 'User with this ID or email already exists'
      });
    }

    const user = new User({
      userId,
      name,
      email,
      role: role || 'student',
      department: department || 'Computer Science & Engineering',
      status: status || 'active'
    });

    const savedUser = await user.save();

    res.status(201).json({
      success: true,
      service: 'user-service',
      message: 'User created successfully',
      data: savedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      service: 'user-service',
      message: 'Validation failed',
      error: error.message
    });
  }
};

// PUT /users/:id - Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let user = await findUserByIdOrCustomId(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        service: 'user-service',
        message: `User with ID '${id}' not found`
      });
    }

    Object.assign(user, updates);
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      service: 'user-service',
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      service: 'user-service',
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// DELETE /users/:id - Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserByIdOrCustomId(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        service: 'user-service',
        message: `User with ID '${id}' not found`
      });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      service: 'user-service',
      message: `User '${id}' deleted successfully`,
      data: { userId: user.userId, name: user.name }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'user-service',
      message: 'Failed to delete user',
      error: error.message
    });
  }
};
