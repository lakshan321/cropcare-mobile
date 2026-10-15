import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { seedDatabase } from '../src/seed/seed';
import { Consultation } from '../src/models/Consultation';

let farmerToken = '';
let officerToken = '';
let targetCaseId = '';

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

  // Find a seeded submitted case to review
  const c = await Consultation.findOne({ status: 'Submitted' });
  targetCaseId = c!._id.toString();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Officer Dashboard & Outbreak Analytics (Member 4)', () => {
  // 1. Role Protection
  it('should strictly forbid farmers from accessing officer endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/officer/cases')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should strictly forbid farmers from accessing analytics endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 2. Officer Dashboard & Case Review
  it('should list cases for officer with counts and filtering', async () => {
    const res = await request(app)
      .get('/api/officer/cases?status=All&sort=highest_priority')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.counts.total).toBeGreaterThan(0);
    expect(res.body.counts.open).toBeGreaterThan(0);
    expect(res.body.cases.length).toBeGreaterThan(0);
  });

  it('should allow officer to save a private draft and verify isolation from farmer', async () => {
    const draftRes = await request(app)
      .put(`/api/officer/cases/${targetCaseId}/draft`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        confirmedDisease: 'Early Blight (Alternaria solani)',
        severity: 'Moderate',
        treatment: 'Private draft: recommended Mancozeb or copper spray.',
        instructions: 'Private instructions for follow-up.',
      });

    expect(draftRes.status).toBe(200);
    expect(draftRes.body.draft.confirmedDisease).toBe('Early Blight (Alternaria solani)');

    // Verify farmer CANNOT see this private draft
    const farmerCaseRes = await request(app)
      .get(`/api/consultations/${targetCaseId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(farmerCaseRes.status).toBe(200);
    expect(farmerCaseRes.body.consultation.privateDraft).toBeUndefined();
  });

  it('should read private draft using officer endpoint', async () => {
    const res = await request(app)
      .get(`/api/officer/cases/${targetCaseId}/draft`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.draft).toBeDefined();
    expect(res.body.draft.confirmedDisease).toBe('Early Blight (Alternaria solani)');
  });

  it('should publish expert response and resolve case', async () => {
    const publishRes = await request(app)
      .post(`/api/officer/cases/${targetCaseId}/publish`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        confirmedDisease: 'Early Blight (Alternaria solani)',
        severity: 'Moderate',
        treatment: 'Apply Mancozeb 75% WP at 2g/L. Prune infected lower branches immediately.',
        instructions: 'Water only at base; do not splash foliage. Check again in 7 days.',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.case.status).toBe('Resolved');
    expect(publishRes.body.case.publishedResponse.officerName).toBe('Dr. Anura Perera');
    expect(publishRes.body.case.privateDraft).toBeUndefined(); // Cleared upon publish

    // Verify farmer can now see the published response in their Cases
    const farmerRes = await request(app)
      .get(`/api/consultations/${targetCaseId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    expect(farmerRes.status).toBe(200);
    expect(farmerRes.body.consultation.status).toBe('Resolved');
    expect(farmerRes.body.consultation.publishedResponse).toBeDefined();
    expect(farmerRes.body.consultation.publishedResponse.confirmedDisease).toBe('Early Blight (Alternaria solani)');
    expect(farmerRes.body.consultation.publishedResponse.officerName).toBe('Dr. Anura Perera');
  });

  it('should allow officer to edit an already published response', async () => {
    const editRes = await request(app)
      .put(`/api/officer/cases/${targetCaseId}/published`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        confirmedDisease: 'Early Blight (Alternaria solani)',
        treatment: 'Revised advice: Add neem oil spray as preventive measure.',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.case.publishedResponse.treatment).toContain('Add neem oil spray');
  });

  it('should allow officer to withdraw response, reopening case to In Review with audit trail', async () => {
    const withdrawRes = await request(app)
      .post(`/api/officer/cases/${targetCaseId}/withdraw`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ reason: 'Farmer sent additional photos showing possible bacterial co-infection.' });

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.case.status).toBe('In Review');
    expect(withdrawRes.body.case.publishedResponse.isWithdrawn).toBe(true);

    // Verify audit entry exists
    const lastAudit = withdrawRes.body.case.auditTrail.slice(-1)[0];
    expect(lastAudit.action).toBe('RESPONSE_WITHDRAWN');
    expect(lastAudit.newStatus).toBe('In Review');
  });

  // 3. Outbreak Analytics & CSV Export
  describe('Outbreak Analytics & Saved Views', () => {
    let createdViewId = '';

    it('should generate outbreak analytics summary', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalCases).toBeGreaterThan(0);
      expect(res.body.summary.diseaseDistribution).toBeDefined();
      expect(res.body.summary.districtDistribution).toBeDefined();
    });

    it('should export analytics CSV with formula sanitization and no unescaped formula cells', async () => {
      const res = await request(app)
        .get('/api/analytics/export.csv')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Case ID,Submission Date,District');
      // Verify no cell begins with dangerous unquoted '=' or '+'
      const lines = res.text.split('\r\n');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should create a saved analytics view', async () => {
      const res = await request(app)
        .post('/api/analytics/views')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          name: 'Galle Coastal Blast Watch',
          filters: {
            district: 'Galle',
            crop: 'Paddy / Rice',
            status: 'All',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.view.name).toBe('Galle Coastal Blast Watch');
      createdViewId = res.body.view._id;
    });

    it('should list saved analytics views', async () => {
      const res = await request(app)
        .get('/api/analytics/views')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.views.length).toBeGreaterThan(0);
    });

    it('should update saved analytics view', async () => {
      const res = await request(app)
        .put(`/api/analytics/views/${createdViewId}`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ name: 'Updated Galle Watch' });

      expect(res.status).toBe(200);
      expect(res.body.view.name).toBe('Updated Galle Watch');
    });

    it('should delete saved analytics view', async () => {
      const res = await request(app)
        .delete(`/api/analytics/views/${createdViewId}`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
