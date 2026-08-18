import mongoose, { Schema } from 'mongoose';

const arenaProgressSchema = new Schema({
    arenaId: { type: Schema.Types.ObjectId, ref: 'Project' },
    arenaName: { type: String, default: '' },
    arenaKey: { type: String, default: '' },
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    problems: [{
        taskId: String,
        taskName: String,
        status: String,
        isCompleted: Boolean
    }]
}, { _id: false });

const userPatternProgressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalAssigned: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    matchedArenas: [arenaProgressSchema],
    lastSyncedAt: { type: Date, default: Date.now }
}, { _id: false });

const dsaPamphletSchema = new Schema({
    topic: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    patternKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    patternName: {
        type: String,
        required: true,
        trim: true
    },
    faangWeightage: {
        type: String,
        required: true,
        default: '30% Weightage · High FAANG Frequency'
    },
    weightageNum: {
        type: Number,
        default: 30
    },
    importanceTier: {
        type: String,
        enum: ['Crucial', 'High', 'Medium'],
        default: 'High'
    },
    summary: {
        type: String,
        default: ''
    },
    aliases: [{
        type: String
    }],
    order: {
        type: Number,
        default: 1
    },
    userProgress: [userPatternProgressSchema]
}, {
    timestamps: true
});

dsaPamphletSchema.index({ topic: 1, order: 1 });

const DsaPamphlet = mongoose.models.DsaPamphlet || mongoose.model('DsaPamphlet', dsaPamphletSchema);
export default DsaPamphlet;
