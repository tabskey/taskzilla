import { Request, Response, NextFunction } from 'express';
import { CreateGroupUseCase } from '../../../core/application/use-cases/group/CreateGroupusecase';
import { GetGroupUseCase, ListMyGroupsUseCase } from '../../../core/application/use-cases/group/GetGroupUseCase';
import { UpdateGroupUseCase, DeleteGroupUseCase } from '../../../core/application/use-cases/group/UpdateGroupUseCase';
import { RequestJoinGroupUseCase, HandleJoinRequestUseCase } from '../../../core/application/use-cases/group/GroupMembershipUseCase';
import { RemoveMemberUseCase, PromoteMemberUseCase } from '../../../core/application/use-cases/group/GroupMemberManagementUseCase';
import { GroupErrors } from '../../../core/domain/errors/GroupErrors';
import { HttpResponse } from '../helpers/HttpResponse';

export class GroupController {

  constructor(
    private readonly createGroupUseCase:       CreateGroupUseCase,
    private readonly getGroupUseCase:          GetGroupUseCase,
    private readonly listMyGroupsUseCase:      ListMyGroupsUseCase,
    private readonly updateGroupUseCase:       UpdateGroupUseCase,
    private readonly deleteGroupUseCase:       DeleteGroupUseCase,
    private readonly requestJoinUseCase:       RequestJoinGroupUseCase,
    private readonly handleJoinRequestUseCase: HandleJoinRequestUseCase,
    private readonly removeMemberUseCase:      RemoveMemberUseCase,
    private readonly promoteMemberUseCase:     PromoteMemberUseCase,
  ) {}

  async createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, isPublic } = req.body;
      const ownerEmail = req.user!.email;

      if (!name) { HttpResponse.badRequest(res, 'INVALID_NAME'); return; }

      const result = await this.createGroupUseCase.execute({ name, description, isPublic: isPublic ?? true, ownerEmail });

      if (result.isFailure) { HttpResponse.badRequest(res, result.error!); return; }

      HttpResponse.created(res, result.getValue());
    } catch (err) { next(err); }
  }

  async getGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = String(req.params.id);
        if (!id) { HttpResponse.badRequest(res, 'MISSING_ID'); return; }
      const result = await this.getGroupUseCase.execute(id, req.user!.email);

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND) { HttpResponse.notFound(res, result.error); return; }
        if (result.error === GroupErrors.NOT_MEMBER)      { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, result.getValue());
    } catch (err) { next(err); }
  }

  async listMyGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.listMyGroupsUseCase.execute(req.user!.email);
      HttpResponse.ok(res, result.getValue());
    } catch (err) { next(err); }
  }

  async updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, isPublic } = req.body;
      const groupId = String(req.params.requestId);
     if (!groupId) { HttpResponse.badRequest(res, 'MISSING_REQUEST_ID'); return; }
      const result = await this.updateGroupUseCase.execute({
        groupId:        groupId,
        requesterEmail: req.user!.email,
        name,
        description,
        isPublic,
      });

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND) { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.NOT_ADMIN)       { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, { message: 'Grupo atualizado com sucesso' });
    } catch (err) { next(err); }
  }

  async deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = String(req.params.id);
        if (!id) { HttpResponse.badRequest(res, 'MISSING_ID'); return; }
      const result = await this.deleteGroupUseCase.execute(id, req.user!.email);

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND) { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.NOT_OWNER)       { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, { message: 'Grupo deletado com sucesso' });
    } catch (err) { next(err); }
  }

  async requestJoin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = String(req.params.id);
        if (!id) { HttpResponse.badRequest(res, 'MISSING_ID'); return; }
      const result = await this.requestJoinUseCase.execute(id, req.user!.email);

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND)      { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.ALREADY_MEMBER)       { HttpResponse.conflict(res, result.error);  return; }
        if (result.error === GroupErrors.REQUEST_ALREADY_SENT) { HttpResponse.conflict(res, result.error);  return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.created(res, { message: 'Solicitação enviada com sucesso' });
    } catch (err) { next(err); }
  }

  async handleJoinRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, role } = req.body;

      if (!['approved', 'rejected'].includes(action)) {
        HttpResponse.badRequest(res, 'INVALID_ACTION');
        return;
      }
      const requestId = String(req.params.requestId);
     if (!requestId) { HttpResponse.badRequest(res, 'MISSING_REQUEST_ID'); return; }
      const result = await this.handleJoinRequestUseCase.execute({
        requestId:      requestId,
        requesterEmail: req.user!.email,
        action,
        role,
      });

      if (result.isFailure) {
        if (result.error === GroupErrors.REQUEST_NOT_FOUND) { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.GROUP_NOT_FOUND)   { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.NOT_ADMIN)         { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, { message: `Solicitação ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso` });
    } catch (err) { next(err); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = String(req.params.id);
        if (!id) { HttpResponse.badRequest(res, 'MISSING_ID'); return; }
        const memberEmail = String(req.params.memberEmail);
        if (!memberEmail) { HttpResponse.badRequest(res, 'MISSING_MEMBER_EMAIL'); return; }
      const result = await this.removeMemberUseCase.execute(
        id,
        memberEmail,
        req.user!.email,
      );

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND)    { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.NOT_MEMBER)         { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.CANNOT_REMOVE_OWNER){ HttpResponse.forbidden(res, result.error); return; }
        if (result.error === GroupErrors.NOT_ADMIN)          { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, { message: 'Membro removido com sucesso' });
    } catch (err) { next(err); }
  }

  async promoteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;

      if (!['admin', 'member'].includes(role)) {
        HttpResponse.badRequest(res, 'INVALID_ROLE');
        return;
      }
      const id = String(req.params.id);
      if (!id) { HttpResponse.badRequest(res, 'MISSING_ID'); return; }
      const memberEmail = String(req.params.memberEmail);
     if (!memberEmail) { HttpResponse.badRequest(res, 'MISSING_MEMBER_EMAIL'); return; }
      const result = await this.promoteMemberUseCase.execute(
        id,
        memberEmail,
        role,
        req.user!.email,
      );

      if (result.isFailure) {
        if (result.error === GroupErrors.GROUP_NOT_FOUND)     { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.NOT_MEMBER)          { HttpResponse.notFound(res, result.error);  return; }
        if (result.error === GroupErrors.CANNOT_PROMOTE_OWNER){ HttpResponse.forbidden(res, result.error); return; }
        if (result.error === GroupErrors.NOT_OWNER)           { HttpResponse.forbidden(res, result.error); return; }
        HttpResponse.badRequest(res, result.error!);
        return;
      }

      HttpResponse.ok(res, { message: 'Membro atualizado com sucesso' });
    } catch (err) { next(err); }
  }
}