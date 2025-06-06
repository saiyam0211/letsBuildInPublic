import request from 'supertest';
import app from '../server';
import {
  connectTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from './helpers/db';
import { createTestUser } from './helpers/auth';
import { ProjectMember } from '../models/ProjectMember';
import { Invitation } from '../models/Invitation';
import { ActivityLog } from '../models/ActivityLog';

describe('Collaboration API', () => {
  let userToken: string;
  let adminToken: string;
  let viewerToken: string;
  let userId: string;
  let adminId: string;
  let editorId: string;
  let viewerId: string;
  let projectId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create test users
    const userResult = await createTestUser({
      email: 'owner@example.com',
      password: 'password123',
      name: 'Project Owner',
    });
    const adminResult = await createTestUser({
      email: 'admin@example.com',
      password: 'password123',
      name: 'Project Admin',
    });
    const editorResult = await createTestUser({
      email: 'editor@example.com',
      password: 'password123',
      name: 'Project Editor',
    });
    const viewerResult = await createTestUser({
      email: 'viewer@example.com',
      password: 'password123',
      name: 'Project Viewer',
    });

    userToken = userResult.token;
    adminToken = adminResult.token;
    viewerToken = viewerResult.token;
    userId = userResult.user._id.toString();
    adminId = adminResult.user._id.toString();
    editorId = editorResult.user._id.toString();
    viewerId = viewerResult.user._id.toString();

    // Create a test project
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Collaboration Project',
        description: 'A project for testing collaboration features',
      });

    expect(response.status).toBe(201);
    projectId = response.body.data.project.projectId;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Project Members', () => {
    describe('GET /api/projects/:id/members', () => {
      beforeEach(async () => {
        // Clean up any existing non-owner members
        await ProjectMember.deleteMany({
          projectId,
          role: { $ne: 'owner' },
        });

        // Add test members to the project (excluding duplicates)
        await ProjectMember.create([
          { projectId, userId: adminId, role: 'admin', status: 'active' },
          { projectId, userId: editorId, role: 'editor', status: 'active' },
          { projectId, userId: viewerId, role: 'viewer', status: 'active' },
        ]);
      });

      afterEach(async () => {
        // Clean up test members (keep only owner)
        await ProjectMember.deleteMany({
          projectId,
          role: { $ne: 'owner' },
        });
      });

      it('should get project members for project owner', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/members`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.members).toHaveLength(4); // Owner + 3 added members
      });

      it('should get project members for project admin', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/members`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.members).toHaveLength(4);
      });

      it('should filter members by role', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/members?role=admin`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.members).toHaveLength(1);
        expect(response.body.data.members[0].role).toBe('admin');
      });

      it('should filter members by status', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/members?status=active`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.members.length).toBeGreaterThan(0);
        response.body.data.members.forEach((member: { status: string }) => {
          expect(member.status).toBe('active');
        });
      });

      it('should deny access to non-members', async () => {
        const nonMemberResult = await createTestUser({
          email: 'nonmember@example.com',
          password: 'password123',
          name: 'Non Member',
        });

        const response = await request(app)
          .get(`/api/projects/${projectId}/members`)
          .set('Authorization', `Bearer ${nonMemberResult.token}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should validate project ID format', async () => {
        const response = await request(app)
          .get('/api/projects/invalid-id/members')
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Project Invitations', () => {
    describe('POST /api/projects/:id/invite', () => {
      it('should send invitation as project owner', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            email: 'newuser@example.com',
            role: 'editor',
            message: 'Welcome to our project!',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.invitation.email).toBe('newuser@example.com');
        expect(response.body.data.invitation.role).toBe('editor');
      });

      it('should send invitation as project admin', async () => {
        // Add admin member
        await ProjectMember.create({
          projectId,
          userId: adminId,
          role: 'admin',
          status: 'active',
        });

        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: 'newuser2@example.com',
            role: 'viewer',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should deny invitation for users without permission', async () => {
        // Add viewer member (no invite permission)
        await ProjectMember.create({
          projectId,
          userId: viewerId,
          role: 'viewer',
          status: 'active',
        });

        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({
            email: 'newuser3@example.com',
            role: 'editor',
          });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            email: 'invalid-email',
            role: 'editor',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should validate role value', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            email: 'newuser@example.com',
            role: 'invalid-role',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should prevent duplicate invitations', async () => {
        const email = 'duplicate@example.com';

        // Send first invitation
        await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ email, role: 'editor' });

        // Try to send duplicate invitation
        const response = await request(app)
          .post(`/api/projects/${projectId}/invite`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ email, role: 'editor' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already sent');
      });
    });

    describe('GET /api/projects/:id/invitations', () => {
      beforeEach(async () => {
        // Create test invitations
        await Invitation.create([
          {
            projectId,
            invitedBy: userId,
            email: 'pending@example.com',
            role: 'editor',
            status: 'pending',
          },
          {
            projectId,
            invitedBy: userId,
            email: 'accepted@example.com',
            role: 'viewer',
            status: 'accepted',
          },
          {
            projectId,
            invitedBy: userId,
            email: 'declined@example.com',
            role: 'admin',
            status: 'declined',
          },
        ]);
      });

      it('should get project invitations for owner', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/invitations`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.invitations).toHaveLength(3);
      });

      it('should filter invitations by status', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/invitations?status=pending`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.invitations).toHaveLength(1);
        expect(response.body.data.invitations[0].status).toBe('pending');
      });

      it('should search invitations by email', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/invitations?search=pending`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.invitations).toHaveLength(1);
        expect(response.body.data.invitations[0].email).toContain('pending');
      });
    });

    describe('POST /api/invitations/:token/accept', () => {
      let invitationToken: string;

      beforeEach(async () => {
        const invitation = await Invitation.create({
          projectId,
          invitedBy: userId,
          email: 'newmember@example.com',
          role: 'editor',
          status: 'pending',
        });
        invitationToken = invitation.token;
      });

      it('should accept valid invitation', async () => {
        const newUserResult = await createTestUser({
          email: 'newmember@example.com',
          password: 'password123',
          name: 'New Member',
        });

        const response = await request(app)
          .post(`/api/invitations/${invitationToken}/accept`)
          .set('Authorization', `Bearer ${newUserResult.token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify member was created
        const member = await ProjectMember.findOne({
          projectId,
          userId: newUserResult.user._id,
        });
        expect(member).toBeTruthy();
        expect(member?.role).toBe('editor');
      });

      it('should reject invitation with wrong email', async () => {
        const wrongUserResult = await createTestUser({
          email: 'wrong@example.com',
          password: 'password123',
          name: 'Wrong User',
        });

        const response = await request(app)
          .post(`/api/invitations/${invitationToken}/accept`)
          .set('Authorization', `Bearer ${wrongUserResult.token}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should reject invalid token', async () => {
        const newUserResult = await createTestUser({
          email: 'newmember@example.com',
          password: 'password123',
          name: 'New Member',
        });

        const response = await request(app)
          .post('/api/invitations/invalid-token/accept')
          .set('Authorization', `Bearer ${newUserResult.token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/invitations/:token/decline', () => {
      let invitationToken: string;

      beforeEach(async () => {
        const invitation = await Invitation.create({
          projectId,
          invitedBy: userId,
          email: 'decline@example.com',
          role: 'editor',
          status: 'pending',
        });
        invitationToken = invitation.token;
      });

      it('should decline invitation', async () => {
        const response = await request(app).post(
          `/api/invitations/${invitationToken}/decline`
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify invitation status changed
        const invitation = await Invitation.findOne({ token: invitationToken });
        expect(invitation?.status).toBe('declined');
      });

      it('should reject invalid token', async () => {
        const response = await request(app).post(
          '/api/invitations/invalid-token/decline'
        );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Member Management', () => {
    let editorMemberId: string;

    beforeEach(async () => {
      // Add members to the project
      await ProjectMember.create({
        projectId,
        userId: adminId,
        role: 'admin',
        status: 'active',
      });

      const editorMember = await ProjectMember.create({
        projectId,
        userId: editorId,
        role: 'editor',
        status: 'active',
      });

      editorMemberId = editorMember._id.toString();
    });

    describe('PUT /api/projects/:id/members/:memberId', () => {
      it('should update member role as owner', async () => {
        const response = await request(app)
          .put(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'admin' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.member.role).toBe('admin');
      });

      it('should update member role as admin', async () => {
        const response = await request(app)
          .put(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'viewer' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.member.role).toBe('viewer');
      });

      it('should deny role update for users without permission', async () => {
        await ProjectMember.create({
          projectId,
          userId: viewerId,
          role: 'viewer',
          status: 'active',
        });

        const response = await request(app)
          .put(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${viewerToken}`)
          .send({ role: 'admin' });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should validate role value', async () => {
        const response = await request(app)
          .put(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ role: 'invalid-role' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/projects/:id/members/:memberId', () => {
      it('should remove member as owner', async () => {
        const response = await request(app)
          .delete(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify member was removed
        const member = await ProjectMember.findById(editorMemberId);
        expect(member).toBeNull();
      });

      it('should remove member as admin', async () => {
        const response = await request(app)
          .delete(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should deny member removal for users without permission', async () => {
        await ProjectMember.create({
          projectId,
          userId: viewerId,
          role: 'viewer',
          status: 'active',
        });

        const response = await request(app)
          .delete(`/api/projects/${projectId}/members/${editorMemberId}`)
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should prevent removing owner', async () => {
        // Get owner member ID
        const ownerMember = await ProjectMember.findOne({
          projectId,
          userId,
          role: 'owner',
        });

        const response = await request(app)
          .delete(`/api/projects/${projectId}/members/${ownerMember!._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('owner');
      });
    });
  });

  describe('Activity Logging', () => {
    beforeEach(async () => {
      // Add member to access activity feed
      await ProjectMember.create({
        projectId,
        userId: adminId,
        role: 'admin',
        status: 'active',
      });

      // Clear existing activity logs to have a clean state
      await ActivityLog.deleteMany({ projectId });

      // Create some test activity logs
      await ActivityLog.create([
        {
          projectId,
          userId,
          action: 'project.created',
          entityType: 'project',
          entityId: projectId,
          details: { description: 'Project was created' },
          severity: 'medium',
        },
        {
          projectId,
          userId,
          action: 'member.joined',
          entityType: 'member',
          details: { description: 'Owner joined the project' },
          severity: 'low',
        },
        {
          projectId,
          userId: adminId,
          action: 'invitation.sent',
          entityType: 'invitation',
          details: { description: 'Invitation sent to user' },
          severity: 'low',
        },
      ]);
    });

    describe('GET /api/projects/:id/activity', () => {
      it('should get activity feed for project member', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.logs).toHaveLength(3);
      });

      it('should filter activity by actions', async () => {
        const response = await request(app)
          .get(
            `/api/projects/${projectId}/activity?actions=project.created,member.joined`
          )
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.logs).toHaveLength(2);
      });

      it('should filter activity by severity', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity?severity=medium`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.logs).toHaveLength(1);
        expect(response.body.data.logs[0].severity).toBe('medium');
      });

      it('should filter activity by user', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity?userId=${adminId}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.logs).toHaveLength(1);
        // The userId field is populated and User model transforms _id to userId
        const logUser = response.body.data.logs[0].userId;
        const actualUserId = logUser.userId || logUser._id;
        expect(actualUserId.toString()).toBe(adminId);
      });

      it('should deny access to non-members', async () => {
        const nonMemberResult = await createTestUser({
          email: 'nonmember2@example.com',
          password: 'password123',
          name: 'Non Member 2',
        });

        const response = await request(app)
          .get(`/api/projects/${projectId}/activity`)
          .set('Authorization', `Bearer ${nonMemberResult.token}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/projects/:id/activity/analytics', () => {
      it('should get activity analytics for admin', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity/analytics`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalActivity');
        expect(response.body.data).toHaveProperty('activeUsers');
        expect(response.body.data).toHaveProperty('actionBreakdown');
        expect(response.body.data).toHaveProperty('severityBreakdown');
      });

      it('should get activity analytics for owner', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity/analytics`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should deny analytics access for users without permission', async () => {
        await ProjectMember.create({
          projectId,
          userId: viewerId,
          role: 'viewer',
          status: 'active',
        });

        const response = await request(app)
          .get(`/api/projects/${projectId}/activity/analytics`)
          .set('Authorization', `Bearer ${viewerToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });

      it('should support different time periods', async () => {
        const response = await request(app)
          .get(`/api/projects/${projectId}/activity/analytics?period=day`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.period).toBe('day');
      });
    });
  });
});
