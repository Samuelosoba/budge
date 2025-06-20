const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Type is required']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }
}, {
  timestamps: true
});

// Ensure unique category names per user and type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);