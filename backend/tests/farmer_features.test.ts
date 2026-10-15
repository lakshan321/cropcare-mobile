import request from 'supertest';
import path from 'path';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { seedDatabase } from '../src/seed/seed';

let farmerToken = '';
let officerToken = '';

beforeAll(async () => {
  await connectDB();
  await seedDatabase();

  const farmerLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'farmer_kamal', password: 'Farmer123!' });
  farmerToken = farmerLogin.body.token;

  const officerLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'officer_perera', password: 'Officer123!' });
  officerToken = officerLogin.body.token;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Farmer Features & CRUD Workflows (Members 1, 2, 3)', () => {
  let createdDraftId = '';
  let createdDiagnosisId = '';
  let createdSavedId = '';
  let createdTaskId = '';
  let createdCaseId = '';

  // Member 1 Workload: Capture, Preview, Drafts, Analysis
  describe('Member 1: Image Drafts & Analysis Lifecycle', () => {
    it('should create an image draft via upload', async () => {
      const samplePath = path.resolve(__dirname, '../uploads/sample-tomato-leaf.jpg');

      const res = await request(app)
        .post('/api/drafts')
        .set('Authorization', `Bearer ${farmerToken}`)
        .attach('image', samplePath)
        .field('cropNote', 'Greenhouse tomato test');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.draft._id).toBeDefined();
      createdDraftId = res.body.draft._id;
    });

    it('should read current active draft', async () => {
      const res = await request(app)
        .get('/api/drafts/current')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.draft._id).toBe(createdDraftId);
    });

    it('should update draft crop note', async () => {
      const res = await request(app)
        .put(`/api/drafts/${createdDraftId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ cropNote: 'Updated tomato notes before analysis' });

      expect(res.status).toBe(200);
      expect(res.body.draft.cropNote).toBe('Updated tomato notes before analysis');
    });

    it('should run analysis and return botanical prediction with isMock explicitly labelled', async () => {
      const res = await request(app)
        .post('/api/diagnosis/analyze')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ draftId: createdDraftId, cropHint: 'Tomato' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.diagnosis.isMock).toBe(true);
      expect(res.body.diagnosis.crop).toBe('Tomato');
      expect(res.body.diagnosis.disease).toContain('Blight');
      expect(res.body.diagnosis.confidence).toBeGreaterThan(0);
      expect(res.body.diagnosis.symptoms.length).toBeGreaterThan(0);
      expect(res.body.diagnosis.organicTreatment.length).toBeGreaterThan(0);
      createdDiagnosisId = res.body.diagnosis._id;
    });

    it('should update farmer observations on the diagnosis', async () => {
      const res = await request(app)
        .patch(`/api/diagnosis/${createdDiagnosisId}/notes`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ farmerNotes: 'Noticed lesions developing on lower 3 leaf nodes.' });

      expect(res.status).toBe(200);
      expect(res.body.diagnosis.farmerNotes).toContain('lower 3 leaf nodes');
    });
  });

  // Member 2 Workload: Care Tasks & Language Preferences
  describe('Member 2: Care Tasks & Preferences', () => {
    it('should create a care task', async () => {
      const res = await request(app)
        .post('/api/care-tasks')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          task: 'Spray organic copper hydroxide',
          category: 'organic',
          diagnosisId: createdDiagnosisId,
        });

      expect(res.status).toBe(201);
      expect(res.body.task.task).toBe('Spray organic copper hydroxide');
      createdTaskId = res.body.task._id;
    });

    it('should read care tasks list', async () => {
      const res = await request(app)
        .get('/api/care-tasks')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it('should toggle care task completion status', async () => {
      const res = await request(app)
        .patch(`/api/care-tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ isCompleted: true });

      expect(res.status).toBe(200);
      expect(res.body.task.isCompleted).toBe(true);
    });

    it('should update and retrieve language preferences (Sinhala / Tamil / English)', async () => {
      const updateRes = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ language: 'si' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.preferences.language).toBe('si');

      const getRes = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.preferences.language).toBe('si');
    });

    it('should delete a care task', async () => {
      const res = await request(app)
        .delete(`/api/care-tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // Member 3 Workload: Saved Diagnoses History & Expert Consultation
  describe('Member 3: Saved Diagnoses & Consultations', () => {
    it('should save a diagnosis to history with personal observations', async () => {
      const res = await request(app)
        .post('/api/saved-diagnoses')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          diagnosisId: createdDiagnosisId,
          personalObservations: 'Test field plot A observations',
        });

      expect(res.status).toBe(201);
      expect(res.body.savedDiagnosis.crop).toBe('Tomato');
      createdSavedId = res.body.savedDiagnosis._id;
    });

    it('should read and search saved diagnoses', async () => {
      const res = await request(app)
        .get('/api/saved-diagnoses?search=Tomato')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.records.length).toBeGreaterThan(0);
    });

    it('should update personal observations on saved diagnosis', async () => {
      const res = await request(app)
        .patch(`/api/saved-diagnoses/${createdSavedId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ personalObservations: 'Updated observations after rainfall' });

      expect(res.status).toBe(200);
      expect(res.body.record.personalObservations).toBe('Updated observations after rainfall');
    });

    it('should submit an expert consultation linked to diagnosis and image', async () => {
      const res = await request(app)
        .post('/api/consultations')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          diagnosisId: createdDiagnosisId,
          farmerNotes: 'Need second opinion on tomato blight treatment schedule.',
          location: 'Peradeniya East',
          district: 'Kandy',
          office: 'Kandy Agricultural Office',
        });

      expect(res.status).toBe(201);
      expect(res.body.consultation.status).toBe('Submitted');
      expect(res.body.consultation.crop).toBe('Tomato');
      expect(res.body.consultation.privateDraft).toBeUndefined(); // NEVER exposed
      createdCaseId = res.body.consultation._id;
    });

    it('should read farmer consultation cases and ensure private drafts are NEVER exposed to farmers', async () => {
      const res = await request(app)
        .get('/api/consultations/my')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cases.length).toBeGreaterThan(0);

      // Verify no case exposes privateDraft
      res.body.cases.forEach((c: any) => {
        expect(c.privateDraft).toBeUndefined();
      });
    });

    it('should allow editing farmer notes while case is in Submitted status', async () => {
      const res = await request(app)
        .patch(`/api/consultations/${createdCaseId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ farmerNotes: 'Updated notes: spreading slightly to row 2.' });

      expect(res.status).toBe(200);
      expect(res.body.consultation.farmerNotes).toContain('spreading slightly to row 2');
    });

    it('should delete saved diagnosis record with confirmation', async () => {
      const res = await request(app)
        .delete(`/api/saved-diagnoses/${createdSavedId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
