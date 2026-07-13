const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    animalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    visitType: {
      type: String,
      enum: ['Routine Checkup', 'Emergency', 'Follow-up', 'Vaccination', 'Surgery', 'Diagnosis Only'],
      required: true,
    },

    diagnosis: { type: String, trim: true },
    treatment: { type: String, trim: true },
    doctorNotes: { type: String, trim: true },

    prescriptions: [
      {
        medicineName: { type: String, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        durationDays: { type: Number },
      },
    ],

    // Surgery-specific fields — left blank for non-surgery visits
    surgeryPerformed: { type: Boolean, default: false },
    operationNotes: { type: String, trim: true },
    dischargeSummary: { type: String, trim: true },

    vitals: {
      weightKg: { type: Number },
      temperatureC: { type: Number },
      heartRate: { type: Number },
    },

    recoveryStatus: {
      type: String,
      enum: ['Not Applicable', 'Recovering', 'Fully Recovered', 'Ongoing Treatment', 'Critical'],
      default: 'Not Applicable',
    },

    nextCheckupDate: { type: Date },
    attachmentUrls: [{ type: String }], // for future lab reports / scanned documents
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);