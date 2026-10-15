import fs from 'fs';
import path from 'path';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User';
import { Diagnosis } from '../models/Diagnosis';
import { SavedDiagnosis } from '../models/SavedDiagnosis';
import { Consultation } from '../models/Consultation';
import { CareTask } from '../models/CareTask';
import { UserPreference } from '../models/UserPreference';
import { SavedAnalyticsView } from '../models/SavedAnalyticsView';
import { ImageDraft } from '../models/ImageDraft';

export const seedDatabase = async () => {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    ImageDraft.deleteMany({}),
    Diagnosis.deleteMany({}),
    SavedDiagnosis.deleteMany({}),
    Consultation.deleteMany({}),
    CareTask.deleteMany({}),
    UserPreference.deleteMany({}),
    SavedAnalyticsView.deleteMany({}),
  ]);

  // Ensure an illustrative sample plant leaf image exists in uploads directory
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create a lightweight fallback SVG/image file if not present
  const sampleImagePath = path.join(uploadsDir, 'sample-tomato-leaf.jpg');
  if (!fs.existsSync(sampleImagePath)) {
    // Generate a minimal valid 1x1 JPEG or placeholder buffer
    const minimalJpgBase64 =
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    fs.writeFileSync(sampleImagePath, Buffer.from(minimalJpgBase64, 'base64'));
  }

  console.log('[Seed] Creating demo accounts...');
  // 1. Farmer Account
  const farmer = new User({
    username: 'farmer_kamal',
    password: 'Farmer123!',
    fullName: 'Kamal Gunaratne',
    role: 'farmer',
    district: 'Kandy',
    phone: '0771234567',
  });
  await farmer.save();

  // 2. Officer Account
  const officer = new User({
    username: 'officer_perera',
    password: 'Officer123!',
    fullName: 'Dr. Anura Perera',
    role: 'officer',
    district: 'Kandy',
    phone: '0719876543',
  });
  await officer.save();

  console.log(`[Seed] Farmer created: username="${farmer.username}", password="Farmer123!"`);
  console.log(`[Seed] Officer created: username="${officer.username}", password="Officer123!"`);

  // 3. User Preferences
  const pref = new UserPreference({
    userId: farmer._id,
    language: 'en',
    notificationsEnabled: true,
  });
  await pref.save();

  // 4. Sample Diagnoses
  const diag1 = new Diagnosis({
    userId: farmer._id,
    imageUrl: '/uploads/sample-tomato-leaf.jpg',
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 88,
    severity: 'Moderate',
    symptoms: [
      'Concentric dark brown circular spots (target-board appearance) on older leaves',
      'Yellow chlorotic halos surrounding lesions',
      'Lower leaves drying up and dropping prematurely',
    ],
    causes: [
      'Fungal pathogen Alternaria solani',
      'High humidity (over 80%) with temperatures between 24-29°C',
    ],
    organicTreatment: [
      'Prune and destroy infected lower leaves immediately',
      'Apply copper hydroxide or potassium bicarbonate spray every 7-10 days',
      'Spray neem oil extract (5ml/L)',
    ],
    chemicalTreatment: [
      'Mancozeb 75% WP at 2-2.5g per litre of water',
      'Chlorothalonil broad-spectrum fungicide',
    ],
    prevention: [
      'Implement 3-year crop rotation',
      'Mulch soil to prevent rain splash',
      'Use drip irrigation rather than overhead sprinkling',
    ],
    isMock: true,
    provider: 'Mock Diagnosis Engine (Demo Model)',
    status: 'completed',
    farmerNotes: 'Observed yellowing spots on lower tomato leaves following 3 days of rain.',
  });
  await diag1.save();

  const diag2 = new Diagnosis({
    userId: farmer._id,
    imageUrl: '/uploads/sample-tomato-leaf.jpg',
    crop: 'Paddy / Rice',
    disease: 'Blast (Magnaporthe oryzae)',
    confidence: 85,
    severity: 'Severe',
    symptoms: ['Spindle-shaped lesions with gray centers', 'Collapsing leaf tips'],
    causes: ['Fungus Magnaporthe oryzae', 'Excessive nitrogen fertilizer'],
    organicTreatment: ['Spray pseudomonas fluorescens liquid formulation'],
    chemicalTreatment: ['Tricyclazole 75% WP at 0.6g/L'],
    prevention: ['Use certified resistant seed varieties', 'Avoid excessive urea application'],
    isMock: true,
    provider: 'Mock Diagnosis Engine (Demo Model)',
    status: 'completed',
    farmerNotes: 'Diamond-shaped spots noticed across paddy field plot B.',
  });
  await diag2.save();

  // 5. Saved Diagnoses
  const saved1 = new SavedDiagnosis({
    userId: farmer._id,
    diagnosisId: diag1._id,
    crop: diag1.crop,
    disease: diag1.disease,
    confidence: diag1.confidence,
    severity: diag1.severity,
    imageUrl: diag1.imageUrl,
    personalObservations: 'Applied organic neem spray on Monday. Checking for improvement.',
    savedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  });
  await saved1.save();

  // 6. Care Tasks
  const task1 = new CareTask({
    userId: farmer._id,
    diagnosisId: diag1._id,
    task: 'Prune affected lower tomato leaves and dispose away from plot',
    category: 'immediate',
    isCompleted: true,
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });
  const task2 = new CareTask({
    userId: farmer._id,
    diagnosisId: diag1._id,
    task: 'Apply copper hydroxide spray before rain',
    category: 'organic',
    isCompleted: false,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  });
  const task3 = new CareTask({
    userId: farmer._id,
    diagnosisId: diag1._id,
    task: 'Inspect adjacent chili plot for fungal transmission',
    category: 'prevention',
    isCompleted: false,
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  });
  await Promise.all([task1.save(), task2.save(), task3.save()]);

  // 7. Consultations across statuses
  // Case A: Submitted (waiting for review)
  const caseA = new Consultation({
    farmerId: farmer._id,
    farmerName: farmer.fullName,
    farmerPhone: farmer.phone,
    diagnosisId: diag1._id,
    imageUrl: diag1.imageUrl,
    crop: diag1.crop,
    aiSuggestedDisease: diag1.disease,
    aiConfidence: diag1.confidence,
    farmerNotes: 'Spots began spreading quickly across 2 rows of greenhouse tomatoes.',
    location: 'Peradeniya, Kandy',
    district: 'Kandy',
    office: 'Kandy Agricultural Office',
    status: 'Submitted',
    priority: 'High',
    auditTrail: [
      {
        action: 'SUBMITTED',
        by: { id: farmer._id.toString(), name: farmer.fullName, role: 'farmer' },
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
        note: 'Consultation submitted by farmer.',
        newStatus: 'Submitted',
      },
    ],
    version: 1,
  });
  await caseA.save();

  // Case B: In Review with private draft
  const caseB = new Consultation({
    farmerId: farmer._id,
    farmerName: farmer.fullName,
    farmerPhone: farmer.phone,
    diagnosisId: diag2._id,
    imageUrl: diag2.imageUrl,
    crop: diag2.crop,
    aiSuggestedDisease: diag2.disease,
    aiConfidence: diag2.confidence,
    farmerNotes: 'Paddy blast suspected in Yala season nursery.',
    location: 'Gampaha North',
    district: 'Gampaha',
    office: 'Gampaha Agricultural Office',
    status: 'In Review',
    priority: 'High',
    assignedOfficerId: officer._id,
    assignedOfficerName: officer.fullName,
    privateDraft: {
      confirmedDisease: 'Paddy Blast (Magnaporthe oryzae)',
      severity: 'Severe',
      treatment: 'Apply Tricyclazole 75% WP at 0.6g/L immediately. Drain standing water if stagnant.',
      instructions: 'Do not add urea until disease halts. Inspect adjacent plots for neck blast.',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      officerId: officer._id,
    },
    auditTrail: [
      {
        action: 'SUBMITTED',
        by: { id: farmer._id.toString(), name: farmer.fullName, role: 'farmer' },
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        note: 'Submitted by farmer.',
        newStatus: 'Submitted',
      },
      {
        action: 'DRAFT_SAVED',
        by: { id: officer._id.toString(), name: officer.fullName, role: 'officer' },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        note: 'Officer created private working draft.',
        previousStatus: 'Submitted',
        newStatus: 'In Review',
      },
    ],
    version: 2,
  });
  await caseB.save();

  // Case C: Resolved with published response
  const caseC = new Consultation({
    farmerId: farmer._id,
    farmerName: farmer.fullName,
    farmerPhone: farmer.phone,
    diagnosisId: diag1._id,
    imageUrl: diag1.imageUrl,
    crop: 'Chilli',
    aiSuggestedDisease: 'Anthracnose (Colletotrichum)',
    aiConfidence: 92,
    farmerNotes: 'Sunken circular spots on chili fruit pods.',
    location: 'Galle Coastal Belt',
    district: 'Galle',
    office: 'Galle Agricultural Office',
    status: 'Resolved',
    priority: 'Medium',
    assignedOfficerId: officer._id,
    assignedOfficerName: officer.fullName,
    publishedResponse: {
      confirmedDisease: 'Anthracnose (Colletotrichum capsici)',
      severity: 'Moderate',
      treatment: 'Spray Azoxystrobin 23% SC at 1ml per litre of water. Pick and burn all damaged fruit.',
      instructions: 'Ensure proper staking to lift plants above wet soil. Re-check in 10 days.',
      followUpDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      officerId: officer._id,
      officerName: officer.fullName,
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isWithdrawn: false,
    },
    auditTrail: [
      {
        action: 'SUBMITTED',
        by: { id: farmer._id.toString(), name: farmer.fullName, role: 'farmer' },
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
        note: 'Consultation submitted by farmer.',
        newStatus: 'Submitted',
      },
      {
        action: 'RESPONSE_PUBLISHED',
        by: { id: officer._id.toString(), name: officer.fullName, role: 'officer' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        note: 'Published expert diagnosis: "Anthracnose (Colletotrichum capsici)". Case marked Resolved.',
        previousStatus: 'In Review',
        newStatus: 'Resolved',
      },
    ],
    version: 3,
  });
  await caseC.save();

  // 8. Saved Analytics Views for Officer
  const view1 = new SavedAnalyticsView({
    officerId: officer._id,
    name: 'Kandy High-Priority Outbreaks',
    filters: {
      district: 'Kandy',
      crop: 'All',
      status: 'All',
      priority: 'High',
      dateRange: '30d',
    },
  });
  const view2 = new SavedAnalyticsView({
    officerId: officer._id,
    name: 'Tomato Blight Overview',
    filters: {
      district: 'All',
      crop: 'Tomato',
      status: 'All',
      priority: 'All',
      dateRange: 'All',
    },
  });
  await Promise.all([view1.save(), view2.save()]);

  console.log('[Seed] Database seeding completed successfully.');
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Error during seeding:', err);
      await disconnectDB();
      process.exit(1);
    });
}
