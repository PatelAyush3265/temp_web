const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		username: { type: String, required: true, unique: true, trim: true },
		passwordHash: { type: String, required: true }
	},
	{ timestamps: true, collection: 'users' }
);

UserSchema.methods.setPassword = async function setPassword(plainPassword) {
	const saltRounds = 12;
	this.passwordHash = await bcrypt.hash(plainPassword, saltRounds);
};

UserSchema.methods.verifyPassword = async function verifyPassword(plainPassword) {
	return bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema, 'users');
