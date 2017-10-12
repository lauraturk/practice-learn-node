const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates',
      },
    ],
    address: {
      type: String,
      required: 'You must supply an address!',
    },
  },
  photo: String,
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next();
    return;
  }
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  //using a proper function to have access to this functions are bound to model
  return this.aggregate([
    //first unwind (makes an instance of each store per tags)
    { $unwind: '$tags' },
    //second group unwound stores by tags and add a field of count +1 w/ each instance
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    //sort grouped descending
    { $sort: { count: -1 } },
  ]);
};

//main thing that is being exported (export default vs export)
module.exports = mongoose.model('Store', storeSchema);
