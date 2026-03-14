import { Router } from 'express';
import { GroupController } from '../controllers/GroupController';
import { CreateGroupUseCase } from '../../../core/application/use-cases/group/CreateGroupusecase';
import { GetGroupUseCase, ListMyGroupsUseCase } from '../../../core/application/use-cases/group/GetGroupUseCase';
import { UpdateGroupUseCase, DeleteGroupUseCase } from '../../../core/application/use-cases/group/UpdateGroupUseCase';
import { RequestJoinGroupUseCase, HandleJoinRequestUseCase } from '../../../core/application/use-cases/group/GroupMembershipUseCase';
import { RemoveMemberUseCase, PromoteMemberUseCase } from '../../../core/application/use-cases/group/GroupMemberManagementUseCase';
import { GroupRepository } from '../../../infra/mongoose/repositories/GroupRepository';
import { GroupRequestRepository } from '../../../infra/mongoose/repositories/GroupRequestRepository';
import { AuditLogRepository } from '../../../infra/mongoose/repositories/AuditLogRepository';
import { authenticate } from '../middlewares/auth';

const router = Router();

const groupRepo        = new GroupRepository();
const groupRequestRepo = new GroupRequestRepository();
const auditLogRepo     = new AuditLogRepository();

const controller = new GroupController(
  new CreateGroupUseCase(groupRepo, auditLogRepo),
  new GetGroupUseCase(groupRepo),
  new ListMyGroupsUseCase(groupRepo),
  new UpdateGroupUseCase(groupRepo, auditLogRepo),
  new DeleteGroupUseCase(groupRepo, auditLogRepo),
  new RequestJoinGroupUseCase(groupRepo, groupRequestRepo, auditLogRepo),
  new HandleJoinRequestUseCase(groupRepo, groupRequestRepo, auditLogRepo),
  new RemoveMemberUseCase(groupRepo, auditLogRepo),
  new PromoteMemberUseCase(groupRepo, auditLogRepo),
);

router.use(authenticate);

router.post('/',                               (req, res, next) => controller.createGroup(req, res, next));
router.get('/me',                              (req, res, next) => controller.listMyGroups(req, res, next));
router.get('/:id',                             (req, res, next) => controller.getGroup(req, res, next));
router.put('/:id',                             (req, res, next) => controller.updateGroup(req, res, next));
router.delete('/:id',                          (req, res, next) => controller.deleteGroup(req, res, next));
router.post('/:id/requests',                   (req, res, next) => controller.requestJoin(req, res, next));
router.patch('/:id/requests/:requestId',       (req, res, next) => controller.handleJoinRequest(req, res, next));
router.delete('/:id/members/:memberEmail',     (req, res, next) => controller.removeMember(req, res, next));
router.patch('/:id/members/:memberEmail/role', (req, res, next) => controller.promoteMember(req, res, next));

export default router;